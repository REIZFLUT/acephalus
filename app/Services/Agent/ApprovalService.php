<?php

declare(strict_types=1);

namespace App\Services\Agent;

use App\Models\Mongodb\Agent;
use App\Models\Mongodb\AgentActivityLog;
use App\Models\Mongodb\AgentChat;

class ApprovalService
{
    /**
     * Check if a tool action requires approval.
     *
     * @return array{mode: string, allowed: bool}
     */
    public function checkApproval(Agent $agent, string $tool): array
    {
        $mode = $agent->getToolApprovalMode($tool);

        return [
            'mode' => $mode,
            'allowed' => $mode !== 'deny',
        ];
    }

    /**
     * Log an auto-approved action.
     *
     * @param  array<string, mixed>  $parameters
     * @param  mixed  $result
     */
    public function logAutoApproved(
        Agent $agent,
        AgentChat $chat,
        int $userId,
        string $tool,
        array $parameters,
        $result,
        int $executionTimeMs
    ): AgentActivityLog {
        return AgentActivityLog::logAutoApproved(
            (string) $agent->_id,
            (string) $chat->_id,
            $userId,
            $tool,
            $parameters,
            $result,
            $executionTimeMs
        );
    }

    /**
     * Log a pending approval request.
     *
     * @param  array<string, mixed>  $parameters
     */
    public function logPending(
        Agent $agent,
        AgentChat $chat,
        int $userId,
        string $tool,
        array $parameters
    ): AgentActivityLog {
        return AgentActivityLog::logPending(
            (string) $agent->_id,
            (string) $chat->_id,
            $userId,
            $tool,
            $parameters
        );
    }

    /**
     * Log a denied action.
     *
     * @param  array<string, mixed>  $parameters
     */
    public function logDenied(
        Agent $agent,
        AgentChat $chat,
        int $userId,
        string $tool,
        array $parameters,
        ?int $deniedBy = null
    ): AgentActivityLog {
        return AgentActivityLog::logDenied(
            (string) $agent->_id,
            (string) $chat->_id,
            $userId,
            $tool,
            $parameters,
            $deniedBy
        );
    }

    /**
     * Log a blocked action (deny mode).
     *
     * @param  array<string, mixed>  $parameters
     */
    public function logBlocked(
        Agent $agent,
        AgentChat $chat,
        int $userId,
        string $tool,
        array $parameters
    ): AgentActivityLog {
        return AgentActivityLog::logBlocked(
            (string) $agent->_id,
            (string) $chat->_id,
            $userId,
            $tool,
            $parameters
        );
    }

    /**
     * Log a failed action.
     *
     * @param  array<string, mixed>  $parameters
     */
    public function logFailed(
        Agent $agent,
        AgentChat $chat,
        int $userId,
        string $tool,
        array $parameters,
        string $error,
        int $executionTimeMs
    ): AgentActivityLog {
        return AgentActivityLog::logFailed(
            (string) $agent->_id,
            (string) $chat->_id,
            $userId,
            $tool,
            $parameters,
            $error,
            $executionTimeMs
        );
    }

    /**
     * Mark a pending log as approved and update with result.
     *
     * @param  mixed  $result
     */
    public function markApproved(
        AgentActivityLog $log,
        int $approvedBy,
        $result,
        int $executionTimeMs
    ): AgentActivityLog {
        $log->update([
            'approval_status' => 'approved',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
            'result' => $result,
            'execution_time_ms' => $executionTimeMs,
        ]);

        return $log;
    }

    /**
     * Mark a pending log as denied.
     */
    public function markDenied(AgentActivityLog $log, int $deniedBy): AgentActivityLog
    {
        $log->update([
            'approval_status' => 'denied',
            'approved_by' => $deniedBy,
            'approved_at' => now(),
        ]);

        return $log;
    }
}
