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

        // Define permissions
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

        // Define role permissions
        $rolePermissions = [
            'admin' => $permissions, // All permissions
            'editor' => [
                'collections.view',
                'contents.view',
                'contents.create',
                'contents.update',
                'contents.publish',
                'media.view',
                'media.create',
            ],
            'author' => [
                'collections.view',
                'contents.view',
                'contents.create',
                'contents.update',
                'media.view',
                'media.create',
            ],
            'viewer' => [
                'collections.view',
                'contents.view',
                'media.view',
            ],
        ];

        // Create permissions and roles for both web and api guards
        $guards = ['web', 'api'];

        foreach ($guards as $guard) {
            // Create permissions for this guard
            foreach ($permissions as $permission) {
                Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => $guard,
                ]);
            }

            // Create roles and assign permissions for this guard
            foreach ($rolePermissions as $roleName => $perms) {
                $role = Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => $guard,
                ]);

                // Get permission models for this guard
                $guardPermissions = Permission::where('guard_name', $guard)
                    ->whereIn('name', $perms)
                    ->get();

                $role->syncPermissions($guardPermissions);
            }
        }
    }
}
