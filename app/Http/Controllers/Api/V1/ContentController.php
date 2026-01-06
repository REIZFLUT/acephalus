<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreContentRequest;
use App\Http\Requests\Api\V1\UpdateContentRequest;
use App\Http\Resources\ContentResource;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\FilterView;
use App\Services\ContentFilterService;
use App\Services\ContentService;
use App\Services\SchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ContentController extends Controller
{
    public function __construct(
        protected ContentService $contentService,
        protected SchemaService $schemaService,
        protected ContentFilterService $filterService,
    ) {}

    /**
     * Display a listing of contents for a collection.
     *
     * Supports filtering by:
     * - edition: ?edition=web - Filter by edition visibility
     * - filter_view: ?filter_view={id} - Apply a saved filter view
     * - status: ?status=published - Filter by content status
     * - search: ?search=term - Search in title
     * - Custom filters: ?metadata.category=news - Filter by metadata fields
     * - sort: ?sort=created_at&direction=desc - Custom sorting
     */
    public function index(Request $request, Collection $collection): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);
        $edition = $request->input('edition');
        $filterViewId = $request->input('filter_view');

        $query = $collection->contents();

        // Apply filter view if specified
        if ($filterViewId) {
            $filterView = FilterView::find($filterViewId);
            if ($filterView) {
                // Ensure filter view is available for this collection
                if ($filterView->isGlobal() || (string) $filterView->collection_id === (string) $collection->_id) {
                    $query = $this->filterService->applyFilterView($query, $filterView, $collection);
                }
            }
        }

        // Apply basic filters
        $query->when($request->filled('status'), function ($query) use ($request) {
            $query->where('status', $request->input('status'));
        })
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('title', 'like', '%'.$request->input('search').'%');
            });

        // Apply edition filter to query
        if ($edition) {
            $query->where(function ($q) use ($edition) {
                // Include content where editions is empty/null (all editions) or contains the specified edition
                $q->whereNull('editions')
                    ->orWhere('editions', [])
                    ->orWhere('editions', 'elemMatch', ['$eq' => $edition]);
            });
        }

        // Apply custom metadata filters
        $metadataFilters = $request->except(['per_page', 'page', 'edition', 'filter_view', 'status', 'search', 'sort', 'direction']);
        if (! empty($metadataFilters)) {
            $query = $this->filterService->applyFilters($query, $metadataFilters, $collection);
        }

        // Apply custom sorting (if not already applied by filter view)
        if ($request->filled('sort') && ! $filterViewId) {
            $sortField = $request->input('sort');
            $sortDirection = $request->input('direction', 'desc');
            $query->orderBy($sortField, $sortDirection);
        } elseif (! $filterViewId) {
            $query->orderBy('created_at', 'desc');
        }

        $contents = $query->paginate($perPage);

        // If edition filtering is active, filter elements within each content
        if ($edition) {
            $contents->getCollection()->transform(function ($content) use ($edition) {
                $content->elements = $this->filterElementsForEdition($content->elements ?? [], $edition, $content->editions ?? []);

                return $content;
            });
        }

        return ContentResource::collection($contents);
    }

    /**
     * Store a newly created content.
     */
    public function store(StoreContentRequest $request, Collection $collection): JsonResponse
    {
        $data = $request->validated();

        $content = $this->contentService->create(
            $collection,
            $data,
            $request->user()
        );

        return response()->json([
            'message' => 'Content created successfully',
            'data' => new ContentResource($content),
        ], 201);
    }

    /**
     * Display the specified content.
     *
     * Supports edition filter: ?edition=web
     * When filtering by edition, returns 404 if content is not visible for that edition,
     * and filters elements according to edition rules.
     */
    public function show(Request $request, Content $content): JsonResponse
    {
        $edition = $request->input('edition');

        // Check edition visibility
        if ($edition && ! $this->isContentVisibleForEdition($content, $edition)) {
            return response()->json([
                'message' => 'Content not available for this edition.',
                'edition' => $edition,
            ], 404);
        }

        $content->load(['collection', 'versions' => function ($query) {
            $query->latest()->limit(5);
        }]);

        // Filter elements if edition is specified
        if ($edition) {
            $content->elements = $this->filterElementsForEdition($content->elements ?? [], $edition, $content->editions ?? []);
        }

        return response()->json([
            'data' => new ContentResource($content),
        ]);
    }

    /**
     * Update the specified content.
     */
    public function update(UpdateContentRequest $request, Content $content): JsonResponse
    {
        $data = $request->validated();

        $content = $this->contentService->update(
            $content,
            $data,
            $request->user(),
            $data['change_note'] ?? null
        );

        // Validate against schema if collection has one
        try {
            $this->schemaService->validateContent($content->collection, $content);
        } catch (ValidationException $exception) {
            // Return validation warnings but don't block the update
            return response()->json([
                'message' => 'Content updated with schema warnings',
                'data' => new ContentResource($content),
                'warnings' => $exception->errors(),
            ]);
        }

        return response()->json([
            'message' => 'Content updated successfully',
            'data' => new ContentResource($content),
        ]);
    }

    /**
     * Remove the specified content.
     */
    public function destroy(Content $content): JsonResponse
    {
        $this->contentService->delete($content);

        return response()->json([
            'message' => 'Content deleted successfully',
        ]);
    }

    /**
     * Publish the content.
     */
    public function publish(Request $request, Content $content): JsonResponse
    {
        // Validate against schema before publishing
        try {
            $this->schemaService->validateContent($content->collection, $content);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Content cannot be published due to schema validation errors',
                'errors' => $exception->errors(),
            ], 422);
        }

        $content = $this->contentService->publish($content, $request->user());

        return response()->json([
            'message' => 'Content published successfully',
            'data' => new ContentResource($content),
        ]);
    }

    /**
     * Unpublish the content.
     */
    public function unpublish(Request $request, Content $content): JsonResponse
    {
        $content = $this->contentService->unpublish($content, $request->user());

        return response()->json([
            'message' => 'Content unpublished successfully',
            'data' => new ContentResource($content),
        ]);
    }

    /**
     * Archive the content.
     */
    public function archive(Request $request, Content $content): JsonResponse
    {
        $content = $this->contentService->archive($content, $request->user());

        return response()->json([
            'message' => 'Content archived successfully',
            'data' => new ContentResource($content),
        ]);
    }

    /**
     * Check if content is visible for a given edition.
     * Empty editions array means "all editions" (always visible).
     */
    protected function isContentVisibleForEdition(Content $content, string $edition): bool
    {
        $contentEditions = $content->editions ?? [];

        // No editions set on content - all editions (visible)
        if (empty($contentEditions)) {
            return true;
        }

        return in_array($edition, $contentEditions, true);
    }

    /**
     * Check if an element is visible for a given edition.
     * Content visibility takes precedence.
     *
     * @param  array<string>  $elementEditions
     * @param  array<string>  $contentEditions
     */
    protected function isElementVisibleForEdition(array $elementEditions, string $edition, array $contentEditions): bool
    {
        // First check if content is visible (this should already be checked at content level)
        if (! empty($contentEditions) && ! in_array($edition, $contentEditions, true)) {
            return false;
        }

        // No editions set on element - follows content (visible)
        if (empty($elementEditions)) {
            return true;
        }

        return in_array($edition, $elementEditions, true);
    }

    /**
     * Filter elements based on edition visibility rules.
     *
     * @param  array<array<string, mixed>>  $elements
     * @param  array<string>  $contentEditions
     * @return array<array<string, mixed>>
     */
    protected function filterElementsForEdition(array $elements, string $edition, array $contentEditions): array
    {
        return array_values(array_filter(
            array_map(function ($element) use ($edition, $contentEditions) {
                $elementEditions = $element['editions'] ?? [];

                // Check if element is visible
                if (! $this->isElementVisibleForEdition($elementEditions, $edition, $contentEditions)) {
                    return null;
                }

                // Recursively filter children
                if (isset($element['children']) && is_array($element['children'])) {
                    $element['children'] = $this->filterElementsForEdition($element['children'], $edition, $contentEditions);
                }

                return $element;
            }, $elements),
            fn ($element) => $element !== null
        ));
    }
}
