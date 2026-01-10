<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mongodb';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Agents collection indexes
        Schema::connection('mongodb')->table('agents', function (Blueprint $collection) {
            $collection->index('user_id');
            $collection->index('is_active');
            $collection->index('created_at');
        });

        // Agent chats collection indexes
        Schema::connection('mongodb')->table('agent_chats', function (Blueprint $collection) {
            $collection->index('agent_id');
            $collection->index('created_by');
            $collection->index('is_archived');
            $collection->index('created_at');
            $collection->index(['agent_id', 'created_by']);
        });

        // Agent activity logs collection indexes
        Schema::connection('mongodb')->table('agent_activity_logs', function (Blueprint $collection) {
            $collection->index('agent_id');
            $collection->index('chat_id');
            $collection->index('user_id');
            $collection->index('tool');
            $collection->index('approval_status');
            $collection->index('created_at');
            // Compound indexes for common queries
            $collection->index(['agent_id', 'created_at']);
            $collection->index(['user_id', 'created_at']);
            $collection->index(['agent_id', 'tool']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->table('agents', function (Blueprint $collection) {
            $collection->dropIndex('user_id_1');
            $collection->dropIndex('is_active_1');
            $collection->dropIndex('created_at_1');
        });

        Schema::connection('mongodb')->table('agent_chats', function (Blueprint $collection) {
            $collection->dropIndex('agent_id_1');
            $collection->dropIndex('created_by_1');
            $collection->dropIndex('is_archived_1');
            $collection->dropIndex('created_at_1');
            $collection->dropIndex('agent_id_1_created_by_1');
        });

        Schema::connection('mongodb')->table('agent_activity_logs', function (Blueprint $collection) {
            $collection->dropIndex('agent_id_1');
            $collection->dropIndex('chat_id_1');
            $collection->dropIndex('user_id_1');
            $collection->dropIndex('tool_1');
            $collection->dropIndex('approval_status_1');
            $collection->dropIndex('created_at_1');
            $collection->dropIndex('agent_id_1_created_at_1');
            $collection->dropIndex('user_id_1_created_at_1');
            $collection->dropIndex('agent_id_1_tool_1');
        });
    }
};
