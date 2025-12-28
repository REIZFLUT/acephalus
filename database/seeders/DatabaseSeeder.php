<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create roles and permissions first
        $this->call(RolesAndPermissionsSeeder::class);

        // Create wrapper purposes
        $this->call(WrapperPurposeSeeder::class);

        // Create admin user
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);
        $admin->assignRole('admin');

        // Create test users with different roles
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
    }
}
