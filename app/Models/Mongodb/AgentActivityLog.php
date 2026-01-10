<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class AgentActivityLog extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'agent_activity_logs';

    /**
     * Disable updated_at timestamp since logs are immutable.
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'agent_id',
        'chat_id',
        'user_id',
        'tool',
        'parameters',
        'approval_mode',
        'approval_status',
        'approved_by',
        'approved_at',
        'result',
        'error',
        'execution_time_ms',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'approved_by' => 'integer',
            'approved_at' => 'datetime',
            'execution_time_ms' => 'integer',
        ];
    }

    /**
     * Get the agent this log belongs to.
     */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'agent_id', '_id');
    }

    /**
     * Get the chat this log belongs to.
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(AgentChat::class, 'chat_id', '_id');
    }

    /**
     * Get the user who initiated the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who approved the action (if any).
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check if the action was successful.
     */
    public function wasSuccessful(): bool
    {
        return $this->error === null && in_array($this->approval_status, ['approved', 'auto']);
    }

    /**
     * Check if the action was denied.
     */
    public function wasDenied(): bool
    {
        return $this->approval_status === 'denied';
    }

    /**
     * Check if the action was blocked (by deny mode).
     */
    public function wasBlocked(): bool
    {
        return $this->approval_mode === 'deny';
    }

    /**
     * Create a log entry for an auto-approved action.
     *
     * @param  array<string, mixed>  $parameters
     * @param  mixed  $result
     */
    public static function logAutoApproved(
        string $agentId,
        string $chatId,
        int $userId,
        string $tool,
        array $parameters,
        $result,
        int $executionTimeMs
    ): self {
        return self::create([
            'agent_id' => $agentId,
            'chat_id' => $chatId,
            'user_id' => $userId,
            'tool' => $tool,
            'parameters' => $parameters,
            'approval_mode' => 'auto',
            'approval_status' => 'auto',
            'result' => $result,
            'execution_time_ms' => $executionTimeMs,
        ]);
    }

    /**
     * Create a log entry for a pending approval.
     *
     * @param  array<string, mixed>  $parameters
     */
    public static function logPending(
        string $agentId,
        string $chatId,
        int $userId,
        string $tool,
        array $parameters
    ): self {
        return self::create([
            'agent_id' => $agentId,
            'chat_id' => $chatId,
            'user_id' => $userId,
            'tool' => $tool,
            'parameters' => $parameters,
            'approval_mode' => 'ask',
            'approval_status' => 'pending',
        ]);
    }

    /**
     * Create a log entry for a denied action.
     *
     * @param  array<string, mixed>  $parameters
     */
    public static function logDenied(
        string $agentId,
        string $chatId,
        int $userId,
        string $tool,
        array $parameters,
        ?int $deniedBy = null
    ): self {
        return self::create([
            'agent_id' => $agentId,
            'chat_id' => $chatId,
            'user_id' => $userId,
            'tool' => $tool,
            'parameters' => $parameters,
            'approval_mode' => 'ask',
            'approval_status' => 'denied',
            'approved_by' => $deniedBy,
            'approved_at' => now(),
        ]);
    }

    /**
     * Create a log entry for a blocked action (deny mode).
     *
     * @param  array<string, mixed>  $parameters
     */
    public static function logBlocked(
        string $agentId,
        string $chatId,
        int $userId,
        string $tool,
        array $parameters
    ): self {
        return self::create([
            'agent_id' => $agentId,
            'chat_id' => $chatId,
            'user_id' => $userId,
            'tool' => $tool,
            'parameters' => $parameters,
            'approval_mode' => 'deny',
            'approval_status' => 'denied',
        ]);
    }

    /**
     * Create a log entry for a failed action.
     *
     * @param  array<string, mixed>  $parameters
     */
    public static function logFailed(
        string $agentId,
        string $chatId,
        int $userId,
        string $tool,
        array $parameters,
        string $error,
        int $executionTimeMs
    ): self {
        return self::create([
            'agent_id' => $agentId,
            'chat_id' => $chatId,
            'user_id' => $userId,
            'tool' => $tool,
            'parameters' => $parameters,
            'approval_mode' => 'auto',
            'approval_status' => 'auto',
            'error' => $error,
            'execution_time_ms' => $executionTimeMs,
        ]);
    }

    /**
     * Scope to filter by agent.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeByAgent($query, string $agentId): mixed
    {
        return $query->where('agent_id', $agentId);
    }

    /**
     * Scope to filter by user.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeByUser($query, int $userId): mixed
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by tool.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeByTool($query, string $tool): mixed
    {
        return $query->where('tool', $tool);
    }

    /**
     * Scope to filter by approval status.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeByStatus($query, string $status): mixed
    {
        return $query->where('approval_status', $status);
    }

    /**
     * Scope to get only failed actions.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeFailed($query): mixed
    {
        return $query->whereNotNull('error');
    }

    /**
     * Scope to get logs older than retention period.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeOlderThan($query, int $days): mixed
    {
        return $query->where('created_at', '<', now()->subDays($days));
    }
}
