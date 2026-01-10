<?php

declare(strict_types=1);

namespace App\Services\Agent\Tools;

use App\Models\Mongodb\Agent;
use Prism\Prism\Tool as PrismTool;

interface AgentToolInterface
{
    /**
     * Get the Prism Tool definition.
     */
    public function getTool(): PrismTool;

    /**
     * Get the tool name (e.g., 'content.create').
     */
    public function getName(): string;

    /**
     * Execute the tool with the given parameters.
     *
     * @param  array<string, mixed>  $parameters
     * @return array<string, mixed>
     */
    public function execute(Agent $agent, array $parameters): array;

    /**
     * Check if the agent has permission to use this tool.
     */
    public function hasPermission(Agent $agent): bool;
}
