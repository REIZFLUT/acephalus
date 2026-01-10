<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class AgentChat extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'agent_chats';

    protected $fillable = [
        'agent_id',
        'title',
        'messages',
        'pending_tool_call',
        'created_by',
        'is_archived',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_by' => 'integer',
            'is_archived' => 'boolean',
        ];
    }

    /**
     * Get the default attributes.
     *
     * @return array<string, mixed>
     */
    protected $attributes = [
        'messages' => [],
        'is_archived' => false,
    ];

    /**
     * Get the agent this chat belongs to.
     */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'agent_id', '_id');
    }

    /**
     * Get the user who created this chat.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Add a message to the chat.
     *
     * @param  array<string, mixed>  $message
     */
    public function addMessage(array $message): self
    {
        $messages = $this->messages ?? [];
        $message['id'] = uniqid('msg_');
        $message['created_at'] = now()->toISOString();
        $messages[] = $message;
        $this->messages = $messages;

        return $this;
    }

    /**
     * Add a user message.
     */
    public function addUserMessage(string $content): self
    {
        return $this->addMessage([
            'role' => 'user',
            'content' => $content,
        ]);
    }

    /**
     * Add an assistant message.
     *
     * @param  array<array<string, mixed>>|null  $toolCalls
     */
    public function addAssistantMessage(string $content, ?array $toolCalls = null): self
    {
        $message = [
            'role' => 'assistant',
            'content' => $content,
        ];

        if ($toolCalls !== null) {
            $message['tool_calls'] = $toolCalls;
        }

        return $this->addMessage($message);
    }

    /**
     * Add a tool result message.
     *
     * @param  mixed  $result
     */
    public function addToolMessage(string $toolCallId, string $toolName, $result): self
    {
        return $this->addMessage([
            'role' => 'tool',
            'tool_call_id' => $toolCallId,
            'tool_name' => $toolName,
            'content' => is_string($result) ? $result : json_encode($result),
        ]);
    }

    /**
     * Set a pending tool call that requires user approval.
     *
     * @param  array<string, mixed>  $toolCall
     */
    public function setPendingToolCall(array $toolCall): self
    {
        $this->pending_tool_call = $toolCall;

        return $this;
    }

    /**
     * Clear the pending tool call.
     */
    public function clearPendingToolCall(): self
    {
        $this->pending_tool_call = null;

        return $this;
    }

    /**
     * Check if there's a pending tool call.
     */
    public function hasPendingToolCall(): bool
    {
        return ! empty($this->pending_tool_call);
    }

    /**
     * Get the last N messages for context.
     *
     * @return array<array<string, mixed>>
     */
    public function getContextMessages(?int $limit = null): array
    {
        $limit = $limit ?? config('agent.chat.max_context_messages', 50);
        $messages = $this->messages ?? [];

        if (count($messages) <= $limit) {
            return $messages;
        }

        return array_slice($messages, -$limit);
    }

    /**
     * Generate a title from the first user message if not set.
     */
    public function generateTitle(): ?string
    {
        if ($this->title) {
            return $this->title;
        }

        $messages = $this->messages ?? [];
        foreach ($messages as $message) {
            if ($message['role'] === 'user' && ! empty($message['content'])) {
                // Take first 50 characters of first user message
                $title = mb_substr($message['content'], 0, 50);
                if (mb_strlen($message['content']) > 50) {
                    $title .= '...';
                }
                $this->title = $title;

                return $title;
            }
        }

        return null;
    }

    /**
     * Scope to get only active (non-archived) chats.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeActive($query): mixed
    {
        return $query->where('is_archived', false);
    }

    /**
     * Scope to get chats by user.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeByUser($query, int $userId): mixed
    {
        return $query->where('created_by', $userId);
    }
}
