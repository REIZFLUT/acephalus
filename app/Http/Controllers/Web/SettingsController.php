<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Edition;
use App\Models\Mongodb\FilterView;
use App\Models\Mongodb\MediaMetaField;
use App\Models\Mongodb\PinnedNavigationItem;
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

        // Load pinned navigation items
        $pinnedNavigationItems = $this->loadPinnedNavigationItems();

        return Inertia::render('Settings/Index', [
            'purposes' => $purposes,
            'editions' => $editions,
            'mediaMetaFields' => $mediaMetaFields,
            'roles' => $roles,
            'permissionCategories' => $permissionCategories,
            'pinnedNavigationItems' => $pinnedNavigationItems,
            'activeTab' => 'wrapper-purposes',
        ]);
    }

    /**
     * Load pinned navigation items with their relationships.
     *
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    protected function loadPinnedNavigationItems(): \Illuminate\Support\Collection
    {
        $items = PinnedNavigationItem::ordered()->get();

        if ($items->isEmpty()) {
            return collect();
        }

        // Pre-load collections and filter views
        $collectionIds = $items->pluck('collection_id')->filter()->unique()->toArray();
        $filterViewIds = $items->pluck('filter_view_id')->filter()->unique()->toArray();

        $collections = Collection::whereIn('_id', $collectionIds)
            ->get(['_id', 'name', 'slug'])
            ->keyBy(fn ($c) => (string) $c->_id);

        $filterViews = FilterView::whereIn('_id', $filterViewIds)
            ->get(['_id', 'name', 'slug'])
            ->keyBy(fn ($v) => (string) $v->_id);

        // Map items with their relationships
        return $items->map(function ($item) use ($collections, $filterViews) {
            $collectionId = (string) $item->collection_id;
            $filterViewId = $item->filter_view_id ? (string) $item->filter_view_id : null;

            $collection = $collections->get($collectionId);
            $filterView = $filterViewId ? $filterViews->get($filterViewId) : null;

            return [
                '_id' => (string) $item->_id,
                'name' => $item->name,
                'collection_id' => $collectionId,
                'filter_view_id' => $filterViewId,
                'icon' => $item->icon,
                'order' => $item->order,
                'is_active' => $item->is_active,
                'collection' => $collection ? [
                    '_id' => (string) $collection->_id,
                    'name' => $collection->name,
                    'slug' => $collection->slug,
                ] : null,
                'filter_view' => $filterView ? [
                    '_id' => (string) $filterView->_id,
                    'name' => $filterView->name,
                    'slug' => $filterView->slug,
                ] : null,
            ];
        });
    }
}
