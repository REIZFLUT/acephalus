<?php

declare(strict_types=1);

namespace App\Services\Agent\Tools;

use App\Models\Mongodb\Agent;
use App\Models\User;

abstract class AbstractAgentTool implements AgentToolInterface
{
    /**
     * The required permission for this tool.
     */
    protected string $requiredPermission = '';

    /**
     * Check if the agent has permission to use this tool.
     * Uses the linked user's permissions.
     */
    public function hasPermission(Agent $agent): bool
    {
        if (empty($this->requiredPermission)) {
            return true;
        }

        $user = $this->getAgentUser($agent);
        if (! $user instanceof User) {
            return false;
        }

        // Super-admins can do everything
        if ($user->hasRole('super-admin')) {
            return true;
        }

        return $user->hasPermissionTo($this->requiredPermission);
    }

    /**
     * Get the user associated with the agent.
     * Loads the user directly since MongoDB and SQLite can't use cross-database relations.
     */
    protected function getAgentUser(Agent $agent): ?User
    {
        if (! $agent->user_id) {
            return null;
        }

        return User::find($agent->user_id);
    }

    /**
     * Format a successful result.
     *
     * @param  mixed  $data
     * @return array<string, mixed>
     */
    protected function success(string $message, $data = null): array
    {
        $result = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $result['data'] = $data;
        }

        return $result;
    }

    /**
     * Format an error result.
     *
     * @return array<string, mixed>
     */
    protected function error(string $message, ?string $code = null): array
    {
        $result = [
            'success' => false,
            'error' => $message,
        ];

        if ($code !== null) {
            $result['code'] = $code;
        }

        return $result;
    }

    /**
     * Format a permission denied result.
     *
     * @return array<string, mixed>
     */
    protected function permissionDenied(): array
    {
        return $this->error('Keine Berechtigung für diese Aktion.', 'PERMISSION_DENIED');
    }

    /**
     * Format a not found result.
     *
     * @return array<string, mixed>
     */
    protected function notFound(string $resource): array
    {
        return $this->error("{$resource} nicht gefunden.", 'NOT_FOUND');
    }
}
