<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * All available permissions grouped by category.
     *
     * @var array<string, array<string>>
     */
    private array $permissionsByCategory = [
        'contents' => [
            'contents.view',
            'contents.create',
            'contents.update',
            'contents.delete',
            'contents.publish',
        ],
        'collections' => [
            'collections.view',
            'collections.create',
            'collections.update',
            'collections.delete',
        ],
        'collections_schema' => [
            'collections.schema.view',
            'collections.schema.update',
        ],
        'media' => [
            'media.view',
            'media.create',
            'media.update',
            'media.delete',
        ],
        'media_meta_fields' => [
            'media-meta-fields.view',
            'media-meta-fields.create',
            'media-meta-fields.update',
            'media-meta-fields.delete',
        ],
        'editions' => [
            'editions.view',
            'editions.create',
            'editions.update',
            'editions.delete',
        ],
        'wrapper_purposes' => [
            'wrapper-purposes.view',
            'wrapper-purposes.create',
            'wrapper-purposes.update',
            'wrapper-purposes.delete',
        ],
        'pinned_navigation' => [
            'pinned-navigation.view',
            'pinned-navigation.create',
            'pinned-navigation.update',
            'pinned-navigation.delete',
        ],
        'users' => [
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
        ],
        'roles' => [
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
        ],
        'settings' => [
            'settings.view',
        ],
    ];

    /**
     * Role definitions with their assigned permissions.
     *
     * @var array<string, array<string>>
     */
    private array $rolePermissions = [
        // Admin gets all permissions (except super-admin which bypasses checks)
        'admin' => [
            // Contents
            'contents.view',
            'contents.create',
            'contents.update',
            'contents.delete',
            'contents.publish',
            // Collections
            'collections.view',
            'collections.create',
            'collections.update',
            'collections.delete',
            'collections.schema.view',
            'collections.schema.update',
            // Media
            'media.view',
            'media.create',
            'media.update',
            'media.delete',
            'media-meta-fields.view',
            'media-meta-fields.create',
            'media-meta-fields.update',
            'media-meta-fields.delete',
            // Settings
            'settings.view',
            'editions.view',
            'editions.create',
            'editions.update',
            'editions.delete',
            'wrapper-purposes.view',
            'wrapper-purposes.create',
            'wrapper-purposes.update',
            'wrapper-purposes.delete',
            'pinned-navigation.view',
            'pinned-navigation.create',
            'pinned-navigation.update',
            'pinned-navigation.delete',
            // Users & Roles
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
        ],
        // Editor: Contents erstellen/bearbeiten/veröffentlichen, Media verwalten
        'editor' => [
            'contents.view',
            'contents.create',
            'contents.update',
            'contents.publish',
            'collections.view',
            'media.view',
            'media.create',
            'media.update',
        ],
        // Author: Contents erstellen/bearbeiten (nicht veröffentlichen), Media hochladen
        'author' => [
            'contents.view',
            'contents.create',
            'contents.update',
            'collections.view',
            'media.view',
            'media.create',
        ],
        // Viewer: Nur Lesezugriff
        'viewer' => [
            'contents.view',
            'collections.view',
            'media.view',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Flatten all permissions
        $allPermissions = collect($this->permissionsByCategory)->flatten()->toArray();

        // Create permissions and roles for both web and api guards
        $guards = ['web', 'api'];

        foreach ($guards as $guard) {
            // Create all permissions for this guard
            foreach ($allPermissions as $permission) {
                Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => $guard,
                ]);
            }

            // Create super-admin role (no permissions needed - bypasses all checks via Gate::before)
            Role::firstOrCreate([
                'name' => 'super-admin',
                'guard_name' => $guard,
            ]);

            // Create roles and assign permissions for this guard
            foreach ($this->rolePermissions as $roleName => $permissions) {
                $role = Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => $guard,
                ]);

                // Get permission models for this guard
                $guardPermissions = Permission::where('guard_name', $guard)
                    ->whereIn('name', $permissions)
                    ->get();

                $role->syncPermissions($guardPermissions);
            }
        }
    }

    /**
     * Get all permissions grouped by category.
     *
     * @return array<string, array<string>>
     */
    public static function getPermissionsByCategory(): array
    {
        return (new self)->permissionsByCategory;
    }

    /**
     * Get all permissions as a flat array.
     *
     * @return array<string>
     */
    public static function getAllPermissions(): array
    {
        return collect((new self)->permissionsByCategory)->flatten()->toArray();
    }
}
