<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Edition;
use App\Models\Mongodb\FilterView;
use App\Models\Mongodb\WrapperPurpose;
use App\Services\ContentFilterService;
use App\Services\SchemaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function __construct(
        private readonly SchemaService $schemaService,
        private readonly ContentFilterService $filterService,
    ) {}

    public function index(): Response
    {
        $collections = Collection::all();

        // Sort manually if needed, or just return
        $collections = $collections->sortBy('name');

        // Manually count contents for each collection
        $collections = $collections->map(function ($collection) {
            $collection->contents_count = $collection->contents()->count();

            return $collection;
        });

        return Inertia::render('Collections/Index', [
            'collections' => $collections->values()->all(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Collections/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        $collection = Collection::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'schema' => $this->schemaService->createDefaultSchema(),
            'settings' => [],
        ]);

        return redirect()
            ->route('collections.show', $collection->slug)
            ->with('success', 'Collection created successfully.');
    }

    public function show(Request $request, Collection $collection): Response
    {
        $collection->load('contents');

        $selectedEdition = $request->query('edition');
        $filterViewId = $request->query('filter_view');

        // Get editions available for this collection
        // First, get all editions - we'll filter by allowed_editions if configured
        $allEditions = Edition::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['_id', 'slug', 'name', 'description', 'icon', 'is_system']);

        // Filter by collection's allowed editions if specified
        $schema = $collection->schema ?? [];
        $allowedEditions = $schema['allowed_editions'] ?? null;

        if (is_array($allowedEditions) && count($allowedEditions) > 0) {
            $editions = $allEditions->filter(fn ($edition) => in_array($edition->slug, $allowedEditions, true))->values();
        } else {
            $editions = $allEditions;
        }

        // Get filter views available for this collection
        $filterViews = FilterView::availableFor((string) $collection->_id)
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        // Get available fields for filtering
        $availableFilterFields = $this->filterService->getAvailableFields($collection);

        // Get the selected filter view
        $selectedFilterView = null;
        if ($filterViewId) {
            $selectedFilterView = FilterView::find($filterViewId);
            // Ensure filter view is available for this collection
            if ($selectedFilterView && ! $selectedFilterView->isGlobal() && (string) $selectedFilterView->collection_id !== (string) $collection->_id) {
                $selectedFilterView = null;
            }
        }

        // Get list view settings from schema
        $listViewSettings = $schema['list_view_settings'] ?? [];
        $defaultPerPage = (int) ($listViewSettings['default_per_page'] ?? 20);
        $defaultSortColumn = $listViewSettings['default_sort_column'] ?? 'updated_at';
        $defaultSortDirection = $listViewSettings['default_sort_direction'] ?? 'desc';

        // Get per_page from request or use default from list view settings
        $perPage = $request->integer('per_page', $defaultPerPage);
        // Validate per_page against allowed options if specified
        $perPageOptions = $listViewSettings['per_page_options'] ?? [10, 20, 50, 100];
        if (! empty($perPageOptions) && ! in_array($perPage, $perPageOptions, true)) {
            $perPage = $defaultPerPage;
        }

        // Build query for all contents
        $query = $collection->contents();

        // Apply filter view if selected
        if ($selectedFilterView) {
            $query = $this->filterService->applyFilterView($query, $selectedFilterView, $collection);
        }

        // Apply default sorting only if filter view doesn't have sorting
        if (! $selectedFilterView || ! $selectedFilterView->hasSort()) {
            $query->orderBy($defaultSortColumn, $defaultSortDirection);
        }

        // Filter by edition if specified
        if ($selectedEdition) {
            $query->where(function ($q) use ($selectedEdition) {
                $q->whereNull('editions')
                    ->orWhere('editions', [])
                    ->orWhere('editions', $selectedEdition);
            });
        }

        $contents = $query->paginate($perPage);

        // Manually add versions_count for each content (withCount not supported by MongoDB)
        $contents->getCollection()->transform(function ($content) {
            $content->versions_count = $content->versions()->count();

            return $content;
        });

        return Inertia::render('Collections/Show', [
            'collection' => $collection,
            'contents' => $contents,
            'editions' => $editions,
            'selectedEdition' => $selectedEdition,
            'filterViews' => $filterViews,
            'selectedFilterView' => $selectedFilterView,
            'availableFilterFields' => $availableFilterFields,
        ]);
    }

    public function edit(Collection $collection): Response
    {
        $wrapperPurposes = WrapperPurpose::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['_id', 'slug', 'name', 'description', 'icon', 'is_system']);

        $editions = Edition::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['_id', 'slug', 'name', 'description', 'icon', 'is_system']);

        return Inertia::render('Collections/Edit', [
            'collection' => $collection,
            'wrapperPurposes' => $wrapperPurposes,
            'editions' => $editions,
        ]);
    }

    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string'],
            'schema' => ['nullable', 'array'],
            'collection_meta' => ['nullable', 'array'],
        ]);

        $newSchema = $validated['schema'] ?? $collection->schema;
        $oldSchema = $collection->schema ?? [];

        // Detect removed content metadata fields
        $oldContentMetaFields = collect($oldSchema['content_meta_fields'] ?? [])
            ->pluck('name')
            ->toArray();
        $newContentMetaFields = collect($newSchema['content_meta_fields'] ?? [])
            ->pluck('name')
            ->toArray();
        $removedFields = array_diff($oldContentMetaFields, $newContentMetaFields);

        // If any content metadata fields were removed, clean up the data from all contents
        if (! empty($removedFields)) {
            $this->cleanupRemovedMetadataFields($collection, $removedFields);
        }

        $collection->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'schema' => $newSchema,
            'collection_meta' => $validated['collection_meta'] ?? $collection->collection_meta,
        ]);

        return redirect()
            ->route('collections.show', $collection->slug)
            ->with('success', 'Collection updated successfully.');
    }

    /**
     * Remove metadata values for deleted fields from all contents in the collection.
     *
     * @param  array<string>  $fieldNames
     */
    private function cleanupRemovedMetadataFields(Collection $collection, array $fieldNames): void
    {
        $contents = $collection->contents()->get();

        foreach ($contents as $content) {
            $metadata = $content->metadata ?? [];

            if (empty($metadata)) {
                continue;
            }

            $hasChanges = false;
            foreach ($fieldNames as $fieldName) {
                if (array_key_exists($fieldName, $metadata)) {
                    unset($metadata[$fieldName]);
                    $hasChanges = true;
                }
            }

            if ($hasChanges) {
                $content->metadata = $metadata;
                $content->save();
            }
        }
    }

    public function destroy(Collection $collection): RedirectResponse
    {
        $collection->delete();

        return redirect()
            ->route('collections.index')
            ->with('success', 'Collection deleted successfully.');
    }
}
