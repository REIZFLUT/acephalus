<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Mongodb\Agent;
use App\Models\Mongodb\AgentActivityLog;
use App\Models\Mongodb\AgentChat;
use App\Services\Agent\ApprovalService;
use App\Services\Agent\Tools\AgentToolInterface;
use App\Services\Agent\Tools\CollectionTool;
use App\Services\Agent\Tools\ContentTool;
use App\Services\Agent\Tools\MediaTool;
use App\Services\Agent\Tools\SearchTool;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Tool;
use Prism\Prism\ValueObjects\Messages\AssistantMessage;
use Prism\Prism\ValueObjects\Messages\ToolResultMessage;
use Prism\Prism\ValueObjects\Messages\UserMessage;
use Prism\Prism\ValueObjects\ToolCall;
use Prism\Prism\ValueObjects\ToolResult;

class AgentService
{
    /**
     * @var array<string, AgentToolInterface>
     */
    private array $tools = [];

    public function __construct(
        private ApprovalService $approvalService
    ) {
    }

    /**
     * Process a user message and return the response.
     *
     * @return array{response: string, pending_tool_call: array<string, mixed>|null, tool_results: array<array<string, mixed>>}
     */
    public function processMessage(Agent $agent, AgentChat $chat, string $userMessage, int $userId): array
    {
        // Handle any pending tool call that wasn't approved/denied
        // OpenAI requires a tool result for every tool call in the history
        if ($chat->hasPendingToolCall()) {
            $pendingToolCall = $chat->pending_tool_call;
            $toolCallId = $pendingToolCall['id'] ?? '';

            // Add a tool result indicating the action was cancelled
            $chat->addToolMessage(
                $toolCallId,
                $pendingToolCall['tool'] ?? 'unknown',
                json_encode([
                    'cancelled' => true,
                    'message' => 'Aktion wurde abgebrochen, da der Benutzer eine neue Nachricht gesendet hat.',
                ], JSON_UNESCAPED_UNICODE)
            );

            // Clear the pending tool call
            $chat->clearPendingToolCall();
        }

        // Add user message to chat
        $chat->addUserMessage($userMessage);

        // Build the tools for this agent
        $this->registerToolsForAgent($agent);

        // Get available Prism tools
        $prismTools = $this->getPrismTools($agent);

        $allToolResults = [];
        $pendingToolCall = null;
        $maxIterations = 10; // Prevent infinite loops
        $iteration = 0;

        // Agentic loop - keep calling LLM until no more tool calls
        while ($iteration < $maxIterations) {
            $iteration++;

            // Build message history for context (including any tool results from previous iterations)
            $messages = $this->buildPrismMessages($chat);

            // Create the Prism request
            $pendingRequest = Prism::text()
                ->using($this->getProvider($agent), $agent->getModel())
                ->withSystemPrompt($this->getSystemPrompt($agent))
                ->withMessages($messages)
                ->withMaxTokens(config('agent.max_tokens', 4096))
                ->withTools($prismTools);

            // Generate response
            $response = $pendingRequest->generate();

            $assistantContent = $response->text;
            $toolCalls = $response->toolCalls;

            // No tool calls - we have a final response
            if (empty($toolCalls)) {
                // Add final assistant message to chat
                $chat->addAssistantMessage($assistantContent, []);
                $chat->generateTitle();
                $chat->save();

                return [
                    'response' => $assistantContent,
                    'pending_tool_call' => null,
                    'tool_results' => $allToolResults,
                ];
            }

            // First, add assistant message with tool calls to chat (before processing results)
            $chat->addAssistantMessage($assistantContent, $this->formatToolCallsForStorage($toolCalls));

            // Process tool calls and add results
            foreach ($toolCalls as $toolCall) {
                $result = $this->handleToolCall($agent, $chat, $userId, $toolCall);

                if ($result['status'] === 'pending') {
                    // Tool requires approval - save current state and stop
                    $pendingToolCall = $result['pending_tool_call'];
                    $chat->setPendingToolCall($pendingToolCall);
                    $chat->generateTitle();
                    $chat->save();

                    return [
                        'response' => $result['message'],
                        'pending_tool_call' => $pendingToolCall,
                        'tool_results' => $allToolResults,
                    ];
                }

                // Use resultId for tool output (OpenAI's call_id)
                $toolCallResultId = $toolCall->resultId ?? $toolCall->id;
                
                if ($result['status'] === 'blocked') {
                    // Tool is blocked - add as tool result with error
                    $toolResultContent = json_encode(['error' => $result['message']], JSON_UNESCAPED_UNICODE);
                    $chat->addToolMessage($toolCallResultId, $this->mapPrismToolName($toolCall->name), $toolResultContent);
                } else {
                    // Tool executed successfully - add result to chat for next iteration
                    $toolResultContent = json_encode($result['result'] ?? [], JSON_UNESCAPED_UNICODE);
                    $chat->addToolMessage($toolCallResultId, $this->mapPrismToolName($toolCall->name), $toolResultContent);
                }

                $allToolResults[] = $result;
            }

            // Continue loop to get LLM's next response based on tool results
        }

        // Max iterations reached - return what we have
        $chat->generateTitle();
        $chat->save();

        return [
            'response' => 'Maximale Iterationen erreicht. Bitte versuche es mit einer einfacheren Anfrage.',
            'pending_tool_call' => null,
            'tool_results' => $allToolResults,
        ];
    }

    /**
     * Execute an approved tool call.
     *
     * @return array{success: bool, response: string, result: array<string, mixed>|null}
     */
    public function executeApprovedToolCall(Agent $agent, AgentChat $chat, int $userId): array
    {
        $pendingToolCall = $chat->pending_tool_call;
        if (! $pendingToolCall) {
            return [
                'success' => false,
                'response' => 'Kein ausstehender Tool-Call gefunden.',
                'result' => null,
            ];
        }

        // Register tools
        $this->registerToolsForAgent($agent);

        $toolName = $pendingToolCall['tool'];
        $parameters = $pendingToolCall['parameters'];
        $logId = $pendingToolCall['log_id'] ?? null;

        // Execute the tool
        $startTime = microtime(true);
        $result = $this->executeToolAction($agent, $toolName, $parameters);
        $executionTime = (int) ((microtime(true) - $startTime) * 1000);

        // Update the activity log
        if ($logId) {
            /** @var AgentActivityLog|null $log */
            $log = AgentActivityLog::find($logId);
            if ($log instanceof AgentActivityLog) {
                $this->approvalService->markApproved($log, $userId, $result, $executionTime);
            }
        }

        // Clear pending tool call
        $chat->clearPendingToolCall();

        // Add tool result message
        $chat->addToolMessage(
            $pendingToolCall['id'],
            $toolName,
            $result
        );

        // Generate follow-up response
        $followUpResponse = $this->generateFollowUpResponse($agent, $chat, [
            [
                'tool' => $toolName,
                'result' => $result,
            ],
        ]);

        $chat->addAssistantMessage($followUpResponse ?? 'Aktion ausgeführt.');
        $chat->save();

        return [
            'success' => $result['success'] ?? false,
            'response' => $followUpResponse ?? 'Aktion ausgeführt.',
            'result' => $result,
        ];
    }

    /**
     * Deny a pending tool call.
     *
     * @return array{success: bool, response: string}
     */
    public function denyToolCall(Agent $agent, AgentChat $chat, int $userId): array
    {
        $pendingToolCall = $chat->pending_tool_call;
        if (! $pendingToolCall) {
            return [
                'success' => false,
                'response' => 'Kein ausstehender Tool-Call gefunden.',
            ];
        }

        $logId = $pendingToolCall['log_id'] ?? null;

        // Update the activity log
        if ($logId) {
            /** @var AgentActivityLog|null $log */
            $log = AgentActivityLog::find($logId);
            if ($log instanceof AgentActivityLog) {
                $this->approvalService->markDenied($log, $userId);
            }
        }

        // Clear pending tool call
        $chat->clearPendingToolCall();

        // Add denial message
        $chat->addAssistantMessage('Die Aktion wurde vom Benutzer abgelehnt. Wie kann ich dir anders helfen?');
        $chat->save();

        return [
            'success' => true,
            'response' => 'Die Aktion wurde abgelehnt.',
        ];
    }

    /**
     * Register all available tools for an agent.
     */
    private function registerToolsForAgent(Agent $agent): void
    {
        $this->tools = [];

        // Content tools
        foreach (['list', 'show', 'create', 'update', 'delete', 'publish', 'unpublish'] as $action) {
            $tool = new ContentTool($action);
            if ($tool->hasPermission($agent)) {
                $this->tools[$tool->getName()] = $tool;
            }
        }

        // Collection tools
        foreach (['list', 'show'] as $action) {
            $tool = new CollectionTool($action);
            if ($tool->hasPermission($agent)) {
                $this->tools[$tool->getName()] = $tool;
            }
        }

        // Media tools
        foreach (['list', 'show', 'update', 'delete'] as $action) {
            $tool = new MediaTool($action);
            if ($tool->hasPermission($agent)) {
                $this->tools[$tool->getName()] = $tool;
            }
        }

        // Search tool
        $searchTool = new SearchTool;
        if ($searchTool->hasPermission($agent)) {
            $this->tools[$searchTool->getName()] = $searchTool;
        }
    }

    /**
     * Get Prism tools for the agent (filtered by permissions and approval mode).
     *
     * @return array<Tool>
     */
    private function getPrismTools(Agent $agent): array
    {
        $prismTools = [];

        foreach ($this->tools as $name => $tool) {
            // Don't include tools that are denied
            if ($agent->getToolApprovalMode($name) === 'deny') {
                continue;
            }

            $prismTools[] = $tool->getTool();
        }

        return $prismTools;
    }

    /**
     * Handle a tool call from the LLM.
     *
     * @return array<string, mixed>
     */
    private function handleToolCall(Agent $agent, AgentChat $chat, int $userId, ToolCall $toolCall): array
    {
        // Map Prism tool name to our tool name
        $toolName = $this->mapPrismToolName($toolCall->name);
        $parameters = $toolCall->arguments();

        // Check approval mode
        $approval = $this->approvalService->checkApproval($agent, $toolName);

        if (! $approval['allowed']) {
            // Tool is denied
            $this->approvalService->logBlocked($agent, $chat, $userId, $toolName, $parameters);

            return [
                'status' => 'blocked',
                'tool' => $toolName,
                'message' => "Die Aktion '{$toolName}' ist nicht erlaubt.",
            ];
        }

        if ($approval['mode'] === 'ask') {
            // Tool requires approval
            $log = $this->approvalService->logPending($agent, $chat, $userId, $toolName, $parameters);

            // Use resultId for OpenAI compatibility (call_id), fall back to id for other providers
            $toolCallId = $toolCall->resultId ?? $toolCall->id;

            return [
                'status' => 'pending',
                'tool' => $toolName,
                'message' => $this->generateApprovalMessage($toolName, $parameters),
                'pending_tool_call' => [
                    'id' => $toolCallId,
                    'tool' => $toolName,
                    'parameters' => $parameters,
                    'explanation' => $this->generateToolExplanation($toolName, $parameters),
                    'log_id' => (string) $log->_id,
                ],
            ];
        }

        // Auto-approve - execute immediately
        $startTime = microtime(true);
        $result = $this->executeToolAction($agent, $toolName, $parameters);
        $executionTime = (int) ((microtime(true) - $startTime) * 1000);

        if ($result['success'] ?? false) {
            $this->approvalService->logAutoApproved($agent, $chat, $userId, $toolName, $parameters, $result, $executionTime);
        } else {
            $this->approvalService->logFailed($agent, $chat, $userId, $toolName, $parameters, $result['error'] ?? 'Unbekannter Fehler', $executionTime);
        }

        return [
            'status' => 'executed',
            'tool' => $toolName,
            'result' => $result,
        ];
    }

    /**
     * Execute a tool action.
     *
     * @param  array<string, mixed>  $parameters
     * @return array<string, mixed>
     */
    private function executeToolAction(Agent $agent, string $toolName, array $parameters): array
    {
        if (! isset($this->tools[$toolName])) {
            return [
                'success' => false,
                'error' => "Tool '{$toolName}' nicht gefunden.",
            ];
        }

        try {
            return $this->tools[$toolName]->execute($agent, $parameters);
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Map Prism tool name to our internal tool name.
     */
    private function mapPrismToolName(string $prismName): string
    {
        $map = [
            'content_list' => 'content.list',
            'content_show' => 'content.show',
            'content_create' => 'content.create',
            'content_update' => 'content.update',
            'content_delete' => 'content.delete',
            'content_publish' => 'content.publish',
            'content_unpublish' => 'content.unpublish',
            'collection_list' => 'collection.list',
            'collection_show' => 'collection.show',
            'media_list' => 'media.list',
            'media_show' => 'media.show',
            'media_update' => 'media.update',
            'media_delete' => 'media.delete',
            'search' => 'search',
        ];

        return $map[$prismName] ?? $prismName;
    }

    /**
     * Generate a message explaining what tool needs approval.
     *
     * @param  array<string, mixed>  $parameters
     */
    private function generateApprovalMessage(string $toolName, array $parameters): string
    {
        $actionDescriptions = [
            'content.create' => 'einen neuen Content erstellen',
            'content.update' => 'einen Content aktualisieren',
            'content.delete' => 'einen Content löschen',
            'content.publish' => 'einen Content veröffentlichen',
            'content.unpublish' => 'die Veröffentlichung eines Contents zurückziehen',
            'media.update' => 'Mediendaten aktualisieren',
            'media.delete' => 'eine Mediendatei löschen',
        ];

        $description = $actionDescriptions[$toolName] ?? "die Aktion '{$toolName}' ausführen";

        return "Ich möchte {$description}. Bitte bestätige diese Aktion.";
    }

    /**
     * Generate a detailed explanation of what the tool will do.
     *
     * @param  array<string, mixed>  $parameters
     */
    private function generateToolExplanation(string $toolName, array $parameters): string
    {
        $parts = [];

        switch ($toolName) {
            case 'content.create':
                $parts[] = "Erstelle einen neuen Content";
                if (isset($parameters['title'])) {
                    $parts[] = "mit dem Titel '{$parameters['title']}'";
                }
                break;

            case 'content.update':
                $parts[] = "Aktualisiere Content";
                if (isset($parameters['content_id'])) {
                    $parts[] = "(ID: {$parameters['content_id']})";
                }
                break;

            case 'content.delete':
                $parts[] = "Lösche Content";
                if (isset($parameters['content_id'])) {
                    $parts[] = "(ID: {$parameters['content_id']})";
                }
                break;

            case 'content.publish':
                $parts[] = "Veröffentliche Content";
                if (isset($parameters['content_id'])) {
                    $parts[] = "(ID: {$parameters['content_id']})";
                }
                break;

            default:
                $parts[] = "Führe '{$toolName}' aus";
                break;
        }

        return implode(' ', $parts);
    }

    /**
     * Generate a follow-up response after tool execution.
     *
     * @param  array<array<string, mixed>>  $toolResults
     */
    private function generateFollowUpResponse(Agent $agent, AgentChat $chat, array $toolResults): ?string
    {
        // Build a simple summary of tool results
        $summaries = [];

        foreach ($toolResults as $result) {
            if (isset($result['result']['message'])) {
                $summaries[] = $result['result']['message'];
            } elseif (isset($result['message'])) {
                $summaries[] = $result['message'];
            }
        }

        return ! empty($summaries) ? implode("\n", $summaries) : null;
    }

    /**
     * Build Prism messages from chat history.
     *
     * @return array<UserMessage|AssistantMessage|ToolResultMessage>
     */
    private function buildPrismMessages(AgentChat $chat): array
    {
        $messages = [];
        $contextMessages = $chat->getContextMessages();

        foreach ($contextMessages as $msg) {
            switch ($msg['role']) {
                case 'user':
                    $messages[] = new UserMessage($msg['content']);
                    break;

                case 'assistant':
                    // Rebuild tool calls if they were stored with this message
                    $toolCalls = [];
                    if (! empty($msg['tool_calls'])) {
                        foreach ($msg['tool_calls'] as $tc) {
                            $toolCalls[] = new ToolCall(
                                id: $tc['id'] ?? '',
                                name: $tc['name'] ?? '',
                                arguments: $tc['arguments'] ?? [],
                                resultId: $tc['result_id'] ?? $tc['id'] ?? '', // OpenAI's call_id
                            );
                        }
                    }
                    $messages[] = new AssistantMessage($msg['content'] ?? '', $toolCalls);
                    break;

                case 'tool':
                    $toolCallId = $msg['tool_call_id'] ?? '';
                    $messages[] = new ToolResultMessage([
                        new ToolResult(
                            toolCallId: $toolCallId,
                            toolName: $msg['tool_name'] ?? '',
                            args: [],
                            result: $msg['content'],
                            toolCallResultId: $toolCallId, // OpenAI uses this for call_id
                        ),
                    ]);
                    break;
            }
        }

        return $messages;
    }

    /**
     * Format tool calls for storage in the chat.
     *
     * @param  array<ToolCall>  $toolCalls
     * @return array<array<string, mixed>>
     */
    private function formatToolCallsForStorage(array $toolCalls): array
    {
        return array_map(fn (ToolCall $tc) => [
            'id' => $tc->id,
            'result_id' => $tc->resultId, // OpenAI's call_id for tool results
            'name' => $tc->name,
            'arguments' => $tc->arguments(),
        ], $toolCalls);
    }

    /**
     * Get the system prompt for the agent.
     */
    private function getSystemPrompt(Agent $agent): string
    {
        return $this->renderPrompt('prompts.system', [
            'agent' => $agent,
            'customElements' => \App\Models\Mongodb\CustomElement::orderBy('order')->get(),
        ]);
    }
    
    /**
     * Render a prompt view to string.
     *
     * @param  array<string, mixed>  $data
     */
    private function renderPrompt(string $view, array $data = []): string
    {
        return trim(view($view, $data)->render());
    }

    /**
     * Get the Prism provider enum.
     */
    private function getProvider(Agent $agent): Provider
    {
        $provider = $agent->getProvider();

        return match ($provider) {
            'openai' => Provider::OpenAI,
            'anthropic' => Provider::Anthropic,
            default => Provider::Anthropic,
        };
    }
}
