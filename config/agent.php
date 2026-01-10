<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Default Provider
    |--------------------------------------------------------------------------
    |
    | The default LLM provider for AI agents. Can be overridden per agent.
    |
    */

    'default_provider' => env('AGENT_PROVIDER', 'openai'),

    /*
    |--------------------------------------------------------------------------
    | Provider Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for each supported LLM provider.
    |
    */

    'providers' => [
        'openai' => [
            'model' => env('AGENT_OPENAI_MODEL', 'gpt-5.2'),
        ],
        'anthropic' => [
            'model' => env('AGENT_ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Prompts
    |--------------------------------------------------------------------------
    |
    | Prompts are defined as Blade templates in resources/views/prompts/
    | This allows for dynamic content and better maintainability.
    |
    | Available templates:
    | - prompts.system - Main system prompt with element types
    | - prompts.content-creation - Content creation guidance
    | - prompts.tool-explanation - Tool action explanations
    | - prompts.search-assistance - Search help
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Model Settings
    |--------------------------------------------------------------------------
    |
    | Default settings for LLM interactions.
    |
    */

    'max_tokens' => (int) env('AGENT_MAX_TOKENS', 4096),
    'temperature' => (float) env('AGENT_TEMPERATURE', 0.7),

    /*
    |--------------------------------------------------------------------------
    | Default Tool Approvals
    |--------------------------------------------------------------------------
    |
    | Default approval modes for agent tools. These can be overridden per agent.
    |
    | Modes:
    | - 'auto': Tool executes automatically without user confirmation
    | - 'ask': Tool requires user confirmation before execution
    | - 'deny': Tool is completely blocked
    |
    */

    'default_tool_approvals' => [
        // Reading operations - auto by default
        'content.list' => 'auto',
        'content.show' => 'auto',
        'collection.list' => 'auto',
        'collection.show' => 'auto',
        'media.list' => 'auto',
        'media.show' => 'auto',
        'search' => 'auto',

        // Creating operations - ask by default
        'content.create' => 'ask',
        'media.upload' => 'ask',

        // Updating operations - ask by default
        'content.update' => 'ask',
        'content.publish' => 'ask',
        'content.unpublish' => 'ask',
        'media.update' => 'ask',

        // Deleting operations - deny by default
        'content.delete' => 'deny',
        'media.delete' => 'deny',
        'collection.delete' => 'deny',
    ],

    /*
    |--------------------------------------------------------------------------
    | Activity Log Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for the agent activity audit log.
    |
    */

    'activity_log' => [
        // Enable or disable activity logging
        'enabled' => (bool) env('AGENT_ACTIVITY_LOG_ENABLED', true),

        // Number of days to retain activity logs (0 = keep forever)
        'retention_days' => (int) env('AGENT_ACTIVITY_LOG_RETENTION_DAYS', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | Chat Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for agent chat sessions.
    |
    */

    'chat' => [
        // Maximum number of messages to keep in context
        'max_context_messages' => (int) env('AGENT_MAX_CONTEXT_MESSAGES', 50),

        // Auto-delete old chats after X days (0 = keep forever)
        'retention_days' => (int) env('AGENT_CHAT_RETENTION_DAYS', 30),
    ],

];
