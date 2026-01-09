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
use Illuminate\Validation\Rule;
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
        // Generate slug from name if not provided (before validation)
        if ($request->filled('name') && ! $request->filled('slug')) {
            $request->merge(['slug' => Str::slug($request->input('name'))]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', 'unique:mongodb.collections,slug'],
            'description' => ['nullable', 'string'],
        ]);

        $collection = Collection::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
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

        $filterViewId = $request->query('filter_view');
        $schema = $collection->schema ?? [];

        // Get editions for filter field options (used in filter builder)
        $allEditions = Edition::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['_id', 'slug', 'name', 'description', 'icon', 'is_system']);

        // Filter by collection's allowed editions if specified
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
            // Ensure filter view belongs to this collection
            if ($selectedFilterView && ! $selectedFilterView->belongsToCollection((string) $collection->_id)) {
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

        // Get all collections for select field options
        $allCollections = Collection::orderBy('name')
            ->get(['_id', 'name', 'slug', 'description']);

        // Get all filter views for select field options
        $filterViews = FilterView::orderBy('name')
            ->get(['_id', 'name', 'slug', 'collection_id']);

        return Inertia::render('Collections/Edit', [
            'collection' => $collection,
            'wrapperPurposes' => $wrapperPurposes,
            'editions' => $editions,
            'allCollections' => $allCollections,
            'filterViews' => $filterViews,
        ]);
    }

    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('mongodb.collections', 'slug')->ignore($collection->_id, '_id'),
            ],
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

    /**
     * Get select options from a collection.
     * Returns contents as options with UUID as value and title as label.
     */
    public function selectOptions(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'collection_id' => ['required', 'string'],
            'filter_view_id' => ['nullable', 'string'],
        ]);

        $collection = Collection::find($validated['collection_id']);

        if (! $collection) {
            return response()->json([
                'error' => 'Collection not found',
                'options' => [],
            ], 404);
        }

        $query = $collection->contents();

        // Apply filter view if specified
        if (! empty($validated['filter_view_id'])) {
            $filterView = FilterView::find($validated['filter_view_id']);
            if ($filterView && $filterView->belongsToCollection((string) $collection->_id)) {
                $query = $this->filterService->applyFilterView($query, $filterView, $collection);
            }
        }

        // Order by title for better UX
        $query->orderBy('title');

        // Limit to reasonable number of options
        $contents = $query->limit(500)->get(['_id', 'title']);

        $options = $contents->map(function ($content) {
            return [
                'value' => (string) $content->_id,
                'label' => $content->title,
            ];
        })->values()->all();

        return response()->json([
            'options' => $options,
        ]);
    }
}
