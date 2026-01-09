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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class PinnedNavigationController extends Controller
{
    /**
     * Display pinned navigation items in settings.
     */
    public function index(): Response
    {
        // Load all data needed for the Settings page tabs
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
        $items = PinnedNavigationItem::ordered()->get();

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
        $pinnedNavigationItems = $items->map(function ($item) use ($collections, $filterViews) {
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

        return Inertia::render('Settings/Index', [
            'purposes' => $purposes,
            'editions' => $editions,
            'mediaMetaFields' => $mediaMetaFields,
            'roles' => $roles,
            'permissionCategories' => $permissionCategories,
            'pinnedNavigationItems' => $pinnedNavigationItems,
            'activeTab' => 'pinned-navigation',
        ]);
    }

    /**
     * Show the form for creating a new pinned navigation item.
     */
    public function create(): Response
    {
        $collections = Collection::orderBy('name')
            ->get(['_id', 'name', 'slug'])
            ->map(fn ($c) => [
                '_id' => (string) $c->_id,
                'name' => $c->name,
                'slug' => $c->slug,
            ]);

        return Inertia::render('Settings/PinnedNavigation/Create', [
            'collections' => $collections,
        ]);
    }

    /**
     * Store a newly created pinned navigation item.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'collection_id' => ['required', 'string'],
            'filter_view_id' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        // Verify collection exists
        $collection = Collection::find($validated['collection_id']);
        if (! $collection) {
            return redirect()
                ->back()
                ->withErrors(['collection_id' => 'The selected collection does not exist.']);
        }

        // Verify filter view exists and belongs to collection if provided
        if (! empty($validated['filter_view_id'])) {
            $filterView = FilterView::find($validated['filter_view_id']);
            if (! $filterView || (string) $filterView->collection_id !== $validated['collection_id']) {
                return redirect()
                    ->back()
                    ->withErrors(['filter_view_id' => 'The selected filter view is invalid.']);
            }
        }

        PinnedNavigationItem::create([
            'name' => $validated['name'],
            'collection_id' => $validated['collection_id'],
            'filter_view_id' => $validated['filter_view_id'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()
            ->route('settings.pinned-navigation.index')
            ->with('success', 'Pinned navigation item created successfully.');
    }

    /**
     * Show the form for editing the specified pinned navigation item.
     */
    public function edit(string $id): Response
    {
        $item = PinnedNavigationItem::findOrFail($id);
        $item->load(['collection:_id,name,slug', 'filterView:_id,name,slug']);

        $collections = Collection::orderBy('name')
            ->get(['_id', 'name', 'slug'])
            ->map(fn ($c) => [
                '_id' => (string) $c->_id,
                'name' => $c->name,
                'slug' => $c->slug,
            ]);

        // Load filter views for the selected collection
        $filterViews = [];
        if ($item->collection_id) {
            $filterViews = FilterView::forCollection((string) $item->collection_id)
                ->orderBy('name')
                ->get(['_id', 'name', 'slug'])
                ->map(fn ($v) => [
                    '_id' => (string) $v->_id,
                    'name' => $v->name,
                    'slug' => $v->slug,
                ]);
        }

        return Inertia::render('Settings/PinnedNavigation/Edit', [
            'item' => $item,
            'collections' => $collections,
            'filterViews' => $filterViews,
        ]);
    }

    /**
     * Update the specified pinned navigation item.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $item = PinnedNavigationItem::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'collection_id' => ['required', 'string'],
            'filter_view_id' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        // Verify collection exists
        $collection = Collection::find($validated['collection_id']);
        if (! $collection) {
            return redirect()
                ->back()
                ->withErrors(['collection_id' => 'The selected collection does not exist.']);
        }

        // Verify filter view exists and belongs to collection if provided
        if (! empty($validated['filter_view_id'])) {
            $filterView = FilterView::find($validated['filter_view_id']);
            if (! $filterView || (string) $filterView->collection_id !== $validated['collection_id']) {
                return redirect()
                    ->back()
                    ->withErrors(['filter_view_id' => 'The selected filter view is invalid.']);
            }
        }

        $item->update([
            'name' => $validated['name'],
            'collection_id' => $validated['collection_id'],
            'filter_view_id' => $validated['filter_view_id'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'is_active' => $validated['is_active'] ?? $item->is_active,
        ]);

        return redirect()
            ->route('settings.pinned-navigation.index')
            ->with('success', 'Pinned navigation item updated successfully.');
    }

    /**
     * Remove the specified pinned navigation item.
     */
    public function destroy(string $id): RedirectResponse
    {
        $item = PinnedNavigationItem::findOrFail($id);
        $item->delete();

        return redirect()
            ->route('settings.pinned-navigation.index')
            ->with('success', 'Pinned navigation item deleted successfully.');
    }

    /**
     * Update the order of pinned navigation items.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*' => ['required', 'string'],
        ]);

        foreach ($validated['items'] as $order => $id) {
            PinnedNavigationItem::where('_id', $id)->update(['order' => $order + 1]);
        }

        return redirect()
            ->back()
            ->with('success', 'Order updated successfully.');
    }

    /**
     * Get filter views for a collection (AJAX endpoint).
     */
    public function filterViews(string $collectionId): \Illuminate\Http\JsonResponse
    {
        $filterViews = FilterView::forCollection($collectionId)
            ->orderBy('name')
            ->get(['_id', 'name', 'slug'])
            ->map(fn ($v) => [
                '_id' => (string) $v->_id,
                'name' => $v->name,
                'slug' => $v->slug,
            ]);

        return response()->json($filterViews);
    }
}
