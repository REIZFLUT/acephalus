<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Agent;
use App\Models\Mongodb\AgentActivityLog;
use App\Models\Mongodb\AgentChat;
use App\Models\User;
use App\Services\AgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function __construct(
        private AgentService $agentService
    ) {
    }

    /**
     * Display a listing of agents.
     */
    public function index(): Response
    {
        $agents = Agent::orderBy('created_at', 'desc')->get();

        // Load users separately since MongoDB and SQLite can't be eager loaded together
        $userIds = $agents->pluck('user_id')->filter()->unique()->toArray();
        $users = User::whereIn('id', $userIds)->get(['id', 'name'])->keyBy('id');

        return Inertia::render('Agents/Index', [
            'agents' => $agents->map(fn (Agent $agent) => [
                '_id' => $agent->_id,
                'name' => $agent->name,
                'description' => $agent->description,
                'provider' => $agent->getProvider(),
                'model' => $agent->getModel(),
                'is_active' => $agent->is_active,
                'user' => $agent->user_id && isset($users[$agent->user_id]) ? [
                    'id' => $users[$agent->user_id]->id,
                    'name' => $users[$agent->user_id]->name,
                ] : null,
                'created_at' => $agent->created_at?->toISOString(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new agent.
     */
    public function create(): Response
    {
        $users = User::orderBy('name')
            ->get(['id', 'name', 'email']);

        $providers = [
            ['value' => 'openai', 'label' => 'OpenAI'],
            ['value' => 'anthropic', 'label' => 'Anthropic'],
        ];

        $defaultToolApprovals = config('agent.default_tool_approvals', []);

        return Inertia::render('Agents/Create', [
            'users' => $users,
            'providers' => $providers,
            'defaultToolApprovals' => $defaultToolApprovals,
        ]);
    }

    /**
     * Store a newly created agent.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'provider' => ['required', 'string', 'in:openai,anthropic'],
            'model' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'tool_approvals' => ['nullable', 'array'],
            'tool_approvals.*' => ['string', 'in:auto,ask,deny'],
        ]);

        Agent::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'user_id' => $validated['user_id'],
            'provider' => $validated['provider'],
            'model' => $validated['model'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'tool_approvals' => $validated['tool_approvals'] ?? [],
        ]);

        return redirect()
            ->route('agents.index')
            ->with('success', 'Agent erfolgreich erstellt.');
    }

    /**
     * Display the chat interface for an agent.
     */
    public function show(Agent $agent): Response
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        // Get or create a chat for this user with this agent
        $chat = AgentChat::where('agent_id', (string) $agent->_id)
            ->where('created_by', $user->id)
            ->where('is_archived', false)
            ->orderBy('updated_at', 'desc')
            ->first();

        if (! $chat) {
            $chat = AgentChat::create([
                'agent_id' => (string) $agent->_id,
                'created_by' => $user->id,
                'messages' => [],
            ]);
        }

        // Get all chats for this agent and user (for chat history sidebar)
        $chats = AgentChat::where('agent_id', (string) $agent->_id)
            ->where('created_by', $user->id)
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get(['_id', 'title', 'updated_at', 'is_archived']);

        return Inertia::render('Agents/Show', [
            'agent' => [
                '_id' => $agent->_id,
                'name' => $agent->name,
                'description' => $agent->description,
                'provider' => $agent->getProvider(),
                'model' => $agent->getModel(),
                'is_active' => $agent->is_active,
            ],
            'chat' => [
                '_id' => $chat->_id,
                'messages' => $chat->messages ?? [],
                'pending_tool_call' => $chat->pending_tool_call,
                'title' => $chat->title,
            ],
            'chats' => $chats->map(fn ($c) => [
                '_id' => $c->_id,
                'title' => $c->title ?? 'Neuer Chat',
                'updated_at' => $c->updated_at?->toISOString(),
            ]),
        ]);
    }

    /**
     * Show the form for editing an agent.
     */
    public function edit(Agent $agent): Response
    {
        $users = User::orderBy('name')
            ->get(['id', 'name', 'email']);

        $providers = [
            ['value' => 'openai', 'label' => 'OpenAI'],
            ['value' => 'anthropic', 'label' => 'Anthropic'],
        ];

        $defaultToolApprovals = config('agent.default_tool_approvals', []);

        return Inertia::render('Agents/Edit', [
            'agent' => [
                '_id' => $agent->_id,
                'name' => $agent->name,
                'description' => $agent->description,
                'user_id' => $agent->user_id,
                'provider' => $agent->provider ?? config('agent.default_provider'),
                'model' => $agent->model,
                'is_active' => $agent->is_active,
                'tool_approvals' => $agent->tool_approvals ?? [],
            ],
            'users' => $users,
            'providers' => $providers,
            'defaultToolApprovals' => $defaultToolApprovals,
        ]);
    }

    /**
     * Update the specified agent.
     */
    public function update(Request $request, Agent $agent): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'provider' => ['required', 'string', 'in:openai,anthropic'],
            'model' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'tool_approvals' => ['nullable', 'array'],
            'tool_approvals.*' => ['string', 'in:auto,ask,deny'],
        ]);

        $agent->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'user_id' => $validated['user_id'],
            'provider' => $validated['provider'],
            'model' => $validated['model'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'tool_approvals' => $validated['tool_approvals'] ?? [],
        ]);

        return redirect()
            ->route('agents.index')
            ->with('success', 'Agent erfolgreich aktualisiert.');
    }

    /**
     * Remove the specified agent.
     */
    public function destroy(Agent $agent): RedirectResponse
    {
        // Delete all chats and activity logs for this agent
        AgentChat::where('agent_id', (string) $agent->_id)->delete();
        AgentActivityLog::where('agent_id', (string) $agent->_id)->delete();

        $agent->delete();

        return redirect()
            ->route('agents.index')
            ->with('success', 'Agent erfolgreich gelöscht.');
    }

    /**
     * Process a chat message.
     */
    public function chat(Request $request, Agent $agent): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:10000'],
            'chat_id' => ['nullable', 'string'],
        ]);

        /** @var \App\Models\User $user */
        $user = auth()->user();

        // Get or create chat
        $chat = null;
        if ($validated['chat_id']) {
            $chat = AgentChat::where('_id', $validated['chat_id'])
                ->where('agent_id', (string) $agent->_id)
                ->where('created_by', $user->id)
                ->first();
        }

        if (! $chat) {
            $chat = AgentChat::create([
                'agent_id' => (string) $agent->_id,
                'created_by' => $user->id,
                'messages' => [],
            ]);
        }

        try {
            $result = $this->agentService->processMessage(
                $agent,
                $chat,
                $validated['message'],
                $user->id
            );

            return response()->json([
                'success' => true,
                'chat_id' => (string) $chat->_id,
                'response' => $result['response'],
                'pending_tool_call' => $result['pending_tool_call'],
                'messages' => $chat->fresh()->messages,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve a pending tool call.
     */
    public function approveToolCall(Request $request, Agent $agent): JsonResponse
    {
        $validated = $request->validate([
            'chat_id' => ['required', 'string'],
        ]);

        /** @var \App\Models\User $user */
        $user = auth()->user();

        $chat = AgentChat::where('_id', $validated['chat_id'])
            ->where('agent_id', (string) $agent->_id)
            ->where('created_by', $user->id)
            ->first();

        if (! $chat) {
            return response()->json([
                'success' => false,
                'error' => 'Chat nicht gefunden.',
            ], 404);
        }

        try {
            $result = $this->agentService->executeApprovedToolCall(
                $agent,
                $chat,
                $user->id
            );

            return response()->json([
                'success' => $result['success'],
                'response' => $result['response'],
                'result' => $result['result'],
                'messages' => $chat->fresh()->messages,
                'pending_tool_call' => null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Deny a pending tool call.
     */
    public function denyToolCall(Request $request, Agent $agent): JsonResponse
    {
        $validated = $request->validate([
            'chat_id' => ['required', 'string'],
        ]);

        /** @var \App\Models\User $user */
        $user = auth()->user();

        $chat = AgentChat::where('_id', $validated['chat_id'])
            ->where('agent_id', (string) $agent->_id)
            ->where('created_by', $user->id)
            ->first();

        if (! $chat) {
            return response()->json([
                'success' => false,
                'error' => 'Chat nicht gefunden.',
            ], 404);
        }

        try {
            $result = $this->agentService->denyToolCall(
                $agent,
                $chat,
                $user->id
            );

            return response()->json([
                'success' => $result['success'],
                'response' => $result['response'],
                'messages' => $chat->fresh()->messages,
                'pending_tool_call' => null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new chat session.
     */
    public function createChat(Agent $agent): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        $chat = AgentChat::create([
            'agent_id' => (string) $agent->_id,
            'created_by' => $user->id,
            'messages' => [],
        ]);

        return response()->json([
            'success' => true,
            'chat' => [
                '_id' => $chat->_id,
                'messages' => [],
                'title' => null,
            ],
        ]);
    }

    /**
     * Load a specific chat.
     */
    public function loadChat(Agent $agent, string $chatId): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        $chat = AgentChat::where('_id', $chatId)
            ->where('agent_id', (string) $agent->_id)
            ->where('created_by', $user->id)
            ->first();

        if (! $chat) {
            return response()->json([
                'success' => false,
                'error' => 'Chat nicht gefunden.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'chat' => [
                '_id' => $chat->_id,
                'messages' => $chat->messages ?? [],
                'pending_tool_call' => $chat->pending_tool_call,
                'title' => $chat->title,
            ],
        ]);
    }

    /**
     * Update a chat's title.
     */
    public function updateChatTitle(Request $request, Agent $agent, string $chatId): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:100'],
        ]);

        /** @var \App\Models\User $user */
        $user = auth()->user();

        $chat = AgentChat::where('_id', $chatId)
            ->where('agent_id', (string) $agent->_id)
            ->where('created_by', $user->id)
            ->first();

        if (! $chat) {
            return response()->json([
                'success' => false,
                'error' => 'Chat nicht gefunden.',
            ], 404);
        }

        $chat->update(['title' => $validated['title']]);

        return response()->json([
            'success' => true,
            'title' => $chat->title,
        ]);
    }

    /**
     * Delete a chat.
     */
    public function deleteChat(Agent $agent, string $chatId): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        $chat = AgentChat::where('_id', $chatId)
            ->where('agent_id', (string) $agent->_id)
            ->where('created_by', $user->id)
            ->first();

        if (! $chat) {
            return response()->json([
                'success' => false,
                'error' => 'Chat nicht gefunden.',
            ], 404);
        }

        $chat->delete();

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Display the activity log for an agent.
     */
    public function activityLog(Agent $agent): Response
    {
        $logs = AgentActivityLog::where('agent_id', (string) $agent->_id)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        // Enrich with user names
        $userIds = $logs->pluck('user_id')->merge($logs->pluck('approved_by'))->filter()->unique();
        $users = User::whereIn('id', $userIds)->pluck('name', 'id');

        return Inertia::render('Agents/ActivityLog', [
            'agent' => [
                '_id' => $agent->_id,
                'name' => $agent->name,
            ],
            'logs' => $logs->map(fn ($log) => [
                '_id' => $log->_id,
                'tool' => $log->tool,
                'parameters' => $log->parameters,
                'approval_mode' => $log->approval_mode,
                'approval_status' => $log->approval_status,
                'result' => $log->result,
                'error' => $log->error,
                'execution_time_ms' => $log->execution_time_ms,
                'created_at' => $log->created_at?->toISOString(),
                'user_name' => $users[$log->user_id] ?? null,
                'approved_by_name' => $log->approved_by ? ($users[$log->approved_by] ?? null) : null,
            ]),
        ]);
    }
}
