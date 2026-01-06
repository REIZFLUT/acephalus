<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Development/Testing Database Seeder
 *
 * This seeder is intended for development and testing environments.
 * It creates test users with various roles for local development.
 *
 * For production setup, use the browser-based setup wizard at /setup
 * or run: php artisan db:seed --class=SystemSetupSeeder
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create system data (roles, permissions, wrapper purposes, etc.)
        $this->call(SystemSetupSeeder::class);

        // Create test admin user (for development only)
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);
        $admin->assignRole('super-admin');

        // Create additional test users with different roles
        $editor = User::factory()->create([
            'name' => 'Editor User',
            'email' => 'editor@example.com',
        ]);
        $editor->assignRole('editor');

        $author = User::factory()->create([
            'name' => 'Author User',
            'email' => 'author@example.com',
        ]);
        $author->assignRole('author');

        $this->command->info('Development users created:');
        $this->command->line('  Super Admin: admin@example.com / password');
        $this->command->line('  Editor:      editor@example.com / password');
        $this->command->line('  Author:      author@example.com / password');
    }
}
