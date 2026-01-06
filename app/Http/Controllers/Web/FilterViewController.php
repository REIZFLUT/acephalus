<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\FilterView;
use App\Services\ContentFilterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FilterViewController extends Controller
{
    public function __construct(
        private readonly ContentFilterService $filterService,
    ) {}

    /**
     * Display a listing of all filter views (settings page).
     */
    public function index(): Response
    {
        $filterViews = FilterView::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings/FilterViews/Index', [
            'filterViews' => $filterViews,
        ]);
    }

    /**
     * Get global filter views as JSON.
     */
    public function globalList(): JsonResponse
    {
        $filterViews = FilterView::global()
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json($filterViews);
    }

    /**
     * Get filter views available for a specific collection (global + collection-specific).
     */
    public function forCollection(Collection $collection): JsonResponse
    {
        $filterViews = FilterView::availableFor((string) $collection->_id)
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        // Also return available fields for the collection
        $availableFields = $this->filterService->getAvailableFields($collection);

        return response()->json([
            'filter_views' => $filterViews,
            'available_fields' => $availableFields,
        ]);
    }

    /**
     * Show form for creating a new filter view.
     */
    public function create(Request $request): Response
    {
        $collectionId = $request->query('collection');
        $collection = $collectionId ? Collection::find($collectionId) : null;

        $collections = Collection::orderBy('name')->get(['_id', 'name', 'slug']);
        $availableFields = $collection
            ? $this->filterService->getAvailableFields($collection)
            : [];

        return Inertia::render('Settings/FilterViews/Create', [
            'collections' => $collections,
            'selectedCollection' => $collection,
            'availableFields' => $availableFields,
        ]);
    }

    /**
     * Store a newly created filter view.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'collection_id' => ['nullable', 'string'],
            'conditions' => ['nullable', 'array'],
            'sort' => ['nullable', 'array'],
            'raw_query' => ['nullable', 'array'],
        ]);

        // Validate raw query if provided
        if (! empty($validated['raw_query'])) {
            try {
                $this->filterService->validateRawQuery($validated['raw_query']);
            } catch (\InvalidArgumentException $e) {
                return redirect()->back()
                    ->withInput()
                    ->withErrors(['raw_query' => $e->getMessage()]);
            }
        }

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        FilterView::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'collection_id' => $validated['collection_id'] ?? null,
            'is_system' => false,
            'conditions' => $this->filterService->buildFilterViewData($validated)['conditions'],
            'sort' => $this->filterService->buildFilterViewData($validated)['sort'],
            'raw_query' => $validated['raw_query'] ?? null,
        ]);

        // Redirect based on context
        if (! empty($validated['collection_id'])) {
            $collection = Collection::find($validated['collection_id']);
            if ($collection) {
                return redirect()
                    ->route('collections.show', $collection->slug)
                    ->with('success', 'Filter view created successfully.');
            }
        }

        return redirect()
            ->route('settings.filter-views.index')
            ->with('success', 'Filter view created successfully.');
    }

    /**
     * Store a filter view via AJAX (returns JSON).
     */
    public function storeJson(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'collection_id' => ['nullable', 'string'],
            'conditions' => ['nullable', 'array'],
            'sort' => ['nullable', 'array'],
            'raw_query' => ['nullable', 'array'],
        ]);

        // Validate raw query if provided
        if (! empty($validated['raw_query'])) {
            try {
                $this->filterService->validateRawQuery($validated['raw_query']);
            } catch (\InvalidArgumentException $e) {
                return response()->json([
                    'message' => 'Invalid raw query',
                    'errors' => ['raw_query' => [$e->getMessage()]],
                ], 422);
            }
        }

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        $filterView = FilterView::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'collection_id' => $validated['collection_id'] ?? null,
            'is_system' => false,
            'conditions' => $this->filterService->buildFilterViewData($validated)['conditions'],
            'sort' => $this->filterService->buildFilterViewData($validated)['sort'],
            'raw_query' => $validated['raw_query'] ?? null,
        ]);

        return response()->json([
            'message' => 'Filter view created successfully',
            'filter_view' => $filterView,
        ], 201);
    }

    /**
     * Show form for editing a filter view.
     */
    public function edit(FilterView $filterView): Response
    {
        $collections = Collection::orderBy('name')->get(['_id', 'name', 'slug']);

        $collection = $filterView->collection_id
            ? Collection::find($filterView->collection_id)
            : null;

        $availableFields = $collection
            ? $this->filterService->getAvailableFields($collection)
            : [];

        return Inertia::render('Settings/FilterViews/Edit', [
            'filterView' => $filterView,
            'collections' => $collections,
            'selectedCollection' => $collection,
            'availableFields' => $availableFields,
        ]);
    }

    /**
     * Update the specified filter view.
     */
    public function update(Request $request, FilterView $filterView): RedirectResponse
    {
        if ($filterView->is_system) {
            return redirect()
                ->route('settings.filter-views.index')
                ->with('error', 'System filter views cannot be modified.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'collection_id' => ['nullable', 'string'],
            'conditions' => ['nullable', 'array'],
            'sort' => ['nullable', 'array'],
            'raw_query' => ['nullable', 'array'],
        ]);

        // Validate raw query if provided
        if (! empty($validated['raw_query'])) {
            try {
                $this->filterService->validateRawQuery($validated['raw_query']);
            } catch (\InvalidArgumentException $e) {
                return redirect()->back()
                    ->withInput()
                    ->withErrors(['raw_query' => $e->getMessage()]);
            }
        }

        $filterView->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? $filterView->slug,
            'description' => $validated['description'] ?? null,
            'collection_id' => $validated['collection_id'] ?? null,
            'conditions' => $this->filterService->buildFilterViewData($validated)['conditions'],
            'sort' => $this->filterService->buildFilterViewData($validated)['sort'],
            'raw_query' => $validated['raw_query'] ?? null,
        ]);

        return redirect()
            ->route('settings.filter-views.index')
            ->with('success', 'Filter view updated successfully.');
    }

    /**
     * Update a filter view via AJAX (returns JSON).
     */
    public function updateJson(Request $request, FilterView $filterView): JsonResponse
    {
        if ($filterView->is_system) {
            return response()->json([
                'message' => 'System filter views cannot be modified.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'collection_id' => ['nullable', 'string'],
            'conditions' => ['nullable', 'array'],
            'sort' => ['nullable', 'array'],
            'raw_query' => ['nullable', 'array'],
        ]);

        // Validate raw query if provided
        if (! empty($validated['raw_query'])) {
            try {
                $this->filterService->validateRawQuery($validated['raw_query']);
            } catch (\InvalidArgumentException $e) {
                return response()->json([
                    'message' => 'Invalid raw query',
                    'errors' => ['raw_query' => [$e->getMessage()]],
                ], 422);
            }
        }

        $filterView->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? $filterView->slug,
            'description' => $validated['description'] ?? null,
            'collection_id' => $validated['collection_id'] ?? null,
            'conditions' => $this->filterService->buildFilterViewData($validated)['conditions'],
            'sort' => $this->filterService->buildFilterViewData($validated)['sort'],
            'raw_query' => $validated['raw_query'] ?? null,
        ]);

        return response()->json([
            'message' => 'Filter view updated successfully',
            'filter_view' => $filterView->fresh(),
        ]);
    }

    /**
     * Remove the specified filter view.
     */
    public function destroy(FilterView $filterView): RedirectResponse
    {
        if ($filterView->is_system) {
            return redirect()
                ->route('settings.filter-views.index')
                ->with('error', 'System filter views cannot be deleted.');
        }

        $filterView->delete();

        return redirect()
            ->route('settings.filter-views.index')
            ->with('success', 'Filter view deleted successfully.');
    }

    /**
     * Delete a filter view via AJAX (returns JSON).
     */
    public function destroyJson(FilterView $filterView): JsonResponse
    {
        if ($filterView->is_system) {
            return response()->json([
                'message' => 'System filter views cannot be deleted.',
            ], 403);
        }

        $filterView->delete();

        return response()->json([
            'message' => 'Filter view deleted successfully',
        ]);
    }

    /**
     * Get available operators for a field type.
     */
    public function operators(Request $request): JsonResponse
    {
        $type = $request->query('type', 'text');
        $operators = $this->filterService->getOperatorsForType($type);

        return response()->json($operators);
    }

    /**
     * Get available fields for a collection.
     */
    public function fields(Collection $collection): JsonResponse
    {
        $fields = $this->filterService->getAvailableFields($collection);

        return response()->json($fields);
    }
}
