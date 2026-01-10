<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use MongoDB\Laravel\Eloquent\Model;

class Agent extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'agents';

    protected $fillable = [
        'name',
        'description',
        'user_id',
        'provider',
        'model',
        'is_active',
        'tool_approvals',
        'settings',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'user_id' => 'integer',
        ];
    }

    /**
     * Get the default attributes.
     *
     * @return array<string, mixed>
     */
    protected $attributes = [
        'is_active' => true,
        'tool_approvals' => [],
        'settings' => [],
    ];

    /**
     * Get the user associated with this agent.
     * Note: This relationship won't work for eager loading since MongoDB and SQLite
     * can't do cross-database relationships. Use getLinkedUser() instead.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the linked user directly from the database.
     * Use this instead of the user() relationship for cross-database compatibility.
     */
    public function getLinkedUser(): ?User
    {
        if (! $this->user_id) {
            return null;
        }

        return User::find($this->user_id);
    }

    /**
     * Get all chats for this agent.
     */
    public function chats(): HasMany
    {
        return $this->hasMany(AgentChat::class, 'agent_id');
    }

    /**
     * Get all activity logs for this agent.
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(AgentActivityLog::class, 'agent_id');
    }

    /**
     * Get the approval mode for a specific tool.
     * Falls back to config defaults if not set on agent.
     */
    public function getToolApprovalMode(string $tool): string
    {
        // Check agent-specific override first
        if (isset($this->tool_approvals[$tool])) {
            return $this->tool_approvals[$tool];
        }

        // Fall back to config defaults
        $defaults = config('agent.default_tool_approvals', []);

        return $defaults[$tool] ?? 'ask';
    }

    /**
     * Check if a tool is allowed (not denied).
     */
    public function isToolAllowed(string $tool): bool
    {
        return $this->getToolApprovalMode($tool) !== 'deny';
    }

    /**
     * Check if a tool requires approval.
     */
    public function toolRequiresApproval(string $tool): bool
    {
        return $this->getToolApprovalMode($tool) === 'ask';
    }

    /**
     * Get the configured provider.
     */
    public function getProvider(): string
    {
        return $this->provider ?? config('agent.default_provider', 'anthropic');
    }

    /**
     * Get the configured model for the provider.
     */
    public function getModel(): string
    {
        if ($this->model) {
            return $this->model;
        }

        $provider = $this->getProvider();

        return config("agent.providers.{$provider}.model", 'claude-sonnet-4-20250514');
    }

    /**
     * Scope to get only active agents.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeActive($query): mixed
    {
        return $query->where('is_active', true);
    }
}
