<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;

class ScopeService
{
    /**
     * All available API scopes with their descriptions.
     *
     * @var array<string, string>
     */
    public const SCOPES = [
        'contents:read' => 'View contents',
        'contents:write' => 'Create and update contents',
        'contents:delete' => 'Delete contents',
        'contents:publish' => 'Publish and unpublish contents',
        'contents:lock' => 'Lock contents',
        'contents:unlock' => 'Unlock contents',
        'collections:read' => 'View collections',
        'collections:write' => 'Create and update collections',
        'collections:delete' => 'Delete collections',
        'collections:schema' => 'Manage collection schemas',
        'collections:lock' => 'Lock collections',
        'collections:unlock' => 'Unlock collections',
        'elements:lock' => 'Lock elements',
        'elements:unlock' => 'Unlock elements',
        'media:read' => 'View media',
        'media:write' => 'Upload and update media',
        'media:delete' => 'Delete media',
        'users:read' => 'View users',
        'users:write' => 'Create and update users',
        'users:delete' => 'Delete users',
        'roles:read' => 'View roles',
        'roles:write' => 'Manage roles',
        'settings:read' => 'View settings',
        'settings:write' => 'Manage settings',
        '*' => 'Full access (super-admin)',
    ];

    /**
     * Mapping from Spatie permissions to API scopes.
     *
     * @var array<string, string>
     */
    public const PERMISSION_TO_SCOPE_MAP = [
        // Contents
        'contents.view' => 'contents:read',
        'contents.create' => 'contents:write',
        'contents.update' => 'contents:write',
        'contents.delete' => 'contents:delete',
        'contents.publish' => 'contents:publish',
        'contents.lock' => 'contents:lock',
        'contents.unlock' => 'contents:unlock',

        // Collections
        'collections.view' => 'collections:read',
        'collections.create' => 'collections:write',
        'collections.update' => 'collections:write',
        'collections.delete' => 'collections:delete',
        'collections.schema.view' => 'collections:schema',
        'collections.schema.update' => 'collections:schema',
        'collections.lock' => 'collections:lock',
        'collections.unlock' => 'collections:unlock',

        // Elements
        'elements.lock' => 'elements:lock',
        'elements.unlock' => 'elements:unlock',

        // Media
        'media.view' => 'media:read',
        'media.create' => 'media:write',
        'media.update' => 'media:write',
        'media.delete' => 'media:delete',

        // Media Meta Fields (Settings)
        'media-meta-fields.view' => 'settings:read',
        'media-meta-fields.create' => 'settings:write',
        'media-meta-fields.update' => 'settings:write',
        'media-meta-fields.delete' => 'settings:write',

        // Editions (Settings)
        'editions.view' => 'settings:read',
        'editions.create' => 'settings:write',
        'editions.update' => 'settings:write',
        'editions.delete' => 'settings:write',

        // Wrapper Purposes (Settings)
        'wrapper-purposes.view' => 'settings:read',
        'wrapper-purposes.create' => 'settings:write',
        'wrapper-purposes.update' => 'settings:write',
        'wrapper-purposes.delete' => 'settings:write',

        // Users
        'users.view' => 'users:read',
        'users.create' => 'users:write',
        'users.update' => 'users:write',
        'users.delete' => 'users:delete',

        // Roles
        'roles.view' => 'roles:read',
        'roles.create' => 'roles:write',
        'roles.update' => 'roles:write',
        'roles.delete' => 'roles:write',

        // Settings
        'settings.view' => 'settings:read',
    ];

    /**
     * Get scopes for a user based on their permissions.
     *
     * @return array<string>
     */
    public function getScopesForUser(User $user): array
    {
        // Super-admin gets full access
        if ($user->hasRole('super-admin')) {
            return ['*'];
        }

        // Map user permissions to scopes
        return $user->getAllPermissions()
            ->pluck('name')
            ->map(fn (string $permission): ?string => self::PERMISSION_TO_SCOPE_MAP[$permission] ?? null)
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Get all available scopes.
     *
     * @return array<string, string>
     */
    public function getAllScopes(): array
    {
        return self::SCOPES;
    }

    /**
     * Check if a scope is valid.
     */
    public function isValidScope(string $scope): bool
    {
        return isset(self::SCOPES[$scope]) || $scope === '*';
    }

    /**
     * Get the scope for a specific permission.
     */
    public function getScopeForPermission(string $permission): ?string
    {
        return self::PERMISSION_TO_SCOPE_MAP[$permission] ?? null;
    }

    /**
     * Get all permissions that map to a specific scope.
     *
     * @return array<string>
     */
    public function getPermissionsForScope(string $scope): array
    {
        if ($scope === '*') {
            return array_keys(self::PERMISSION_TO_SCOPE_MAP);
        }

        return array_keys(array_filter(
            self::PERMISSION_TO_SCOPE_MAP,
            fn (string $mappedScope): bool => $mappedScope === $scope
        ));
    }
}
