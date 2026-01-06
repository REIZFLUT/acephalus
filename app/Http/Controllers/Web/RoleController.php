<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(): Response
    {
        $roles = Role::where('guard_name', 'web')
            ->withCount('permissions', 'users')
            ->orderBy('name')
            ->get();

        $permissionsByCategory = RolesAndPermissionsSeeder::getPermissionsByCategory();

        return Inertia::render('Settings/Roles/Index', [
            'roles' => $roles,
            'permissionCategories' => $permissionsByCategory,
        ]);
    }

    /**
     * Return roles as JSON for API-style requests.
     */
    public function list(): JsonResponse
    {
        $roles = Role::where('guard_name', 'web')
            ->withCount('permissions', 'users')
            ->orderBy('name')
            ->get();

        return response()->json($roles);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        $permissions = Permission::where('guard_name', 'web')
            ->orderBy('name')
            ->get();

        $permissionsByCategory = RolesAndPermissionsSeeder::getPermissionsByCategory();

        return Inertia::render('Settings/Roles/Create', [
            'permissions' => $permissions,
            'permissionCategories' => $permissionsByCategory,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        // Reset cached permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create role for both guards
        foreach (['web', 'api'] as $guard) {
            $role = Role::create([
                'name' => $validated['name'],
                'guard_name' => $guard,
            ]);

            if (! empty($validated['permissions'])) {
                $guardPermissions = Permission::where('guard_name', $guard)
                    ->whereIn('name', $validated['permissions'])
                    ->get();

                $role->syncPermissions($guardPermissions);
            }
        }

        return redirect()
            ->route('settings.roles.index')
            ->with('success', 'Role created successfully.');
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
        $role->load('permissions', 'users');

        return Inertia::render('Settings/Roles/Show', [
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        // Prevent editing super-admin role
        if ($role->name === 'super-admin') {
            return Inertia::render('Settings/Roles/Edit', [
                'role' => $role->load('permissions'),
                'permissions' => collect(),
                'permissionCategories' => [],
                'isProtected' => true,
            ]);
        }

        $role->load('permissions');
        $permissions = Permission::where('guard_name', 'web')
            ->orderBy('name')
            ->get();

        $permissionsByCategory = RolesAndPermissionsSeeder::getPermissionsByCategory();

        return Inertia::render('Settings/Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
            'permissionCategories' => $permissionsByCategory,
            'isProtected' => false,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        // Prevent updating super-admin role
        if ($role->name === 'super-admin') {
            return redirect()
                ->route('settings.roles.index')
                ->with('error', 'The super-admin role cannot be modified.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        // Reset cached permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Update role for both guards
        foreach (['web', 'api'] as $guard) {
            $guardRole = Role::where('name', $role->name)
                ->where('guard_name', $guard)
                ->first();

            if ($guardRole) {
                $guardRole->update(['name' => $validated['name']]);

                if (isset($validated['permissions'])) {
                    $guardPermissions = Permission::where('guard_name', $guard)
                        ->whereIn('name', $validated['permissions'])
                        ->get();

                    $guardRole->syncPermissions($guardPermissions);
                }
            }
        }

        return redirect()
            ->route('settings.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        // Prevent deleting protected roles
        $protectedRoles = ['super-admin', 'admin', 'editor', 'author', 'viewer'];

        if (in_array($role->name, $protectedRoles)) {
            return redirect()
                ->route('settings.roles.index')
                ->with('error', 'This role is protected and cannot be deleted.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()
                ->route('settings.roles.index')
                ->with('error', 'Cannot delete a role that is assigned to users.');
        }

        // Reset cached permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Delete role for both guards
        foreach (['web', 'api'] as $guard) {
            Role::where('name', $role->name)
                ->where('guard_name', $guard)
                ->delete();
        }

        return redirect()
            ->route('settings.roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
