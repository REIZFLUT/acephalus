<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Edition;
use App\Models\Mongodb\MediaMetaField;
use App\Models\Mongodb\WrapperPurpose;
use Database\Seeders\RolesAndPermissionsSeeder;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $purposes = WrapperPurpose::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $editions = Edition::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $mediaMetaFields = MediaMetaField::ordered()->get();

        // Load roles if user has permission
        $roles = [];
        $permissionCategories = [];

        /** @var \App\Models\User|null $user */
        $user = auth()->user();

        if ($user && ($user->hasRole('super-admin') || $user->can('roles.view'))) {
            $roles = Role::where('guard_name', 'web')
                ->withCount('permissions', 'users')
                ->orderBy('name')
                ->get();

            $permissionCategories = RolesAndPermissionsSeeder::getPermissionsByCategory();
        }

        return Inertia::render('Settings/Index', [
            'purposes' => $purposes,
            'editions' => $editions,
            'mediaMetaFields' => $mediaMetaFields,
            'roles' => $roles,
            'permissionCategories' => $permissionCategories,
            'activeTab' => 'wrapper-purposes',
        ]);
    }
}
