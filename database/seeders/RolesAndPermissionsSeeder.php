<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Collection permissions
            'collections.view',
            'collections.create',
            'collections.update',
            'collections.delete',

            // Content permissions
            'contents.view',
            'contents.create',
            'contents.update',
            'contents.delete',
            'contents.publish',

            // Media permissions
            'media.view',
            'media.create',
            'media.delete',

            // User permissions
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        $editorRole = Role::firstOrCreate(['name' => 'editor']);
        $editorRole->givePermissionTo([
            'collections.view',
            'contents.view',
            'contents.create',
            'contents.update',
            'contents.publish',
            'media.view',
            'media.create',
        ]);

        $authorRole = Role::firstOrCreate(['name' => 'author']);
        $authorRole->givePermissionTo([
            'collections.view',
            'contents.view',
            'contents.create',
            'contents.update',
            'media.view',
            'media.create',
        ]);

        $viewerRole = Role::firstOrCreate(['name' => 'viewer']);
        $viewerRole->givePermissionTo([
            'collections.view',
            'contents.view',
            'media.view',
        ]);
    }
}


