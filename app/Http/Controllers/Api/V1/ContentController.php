<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreContentRequest;
use App\Http\Requests\Api\V1\UpdateContentRequest;
use App\Http\Resources\ContentResource;
use App\Http\Resources\ReleaseContentResource;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Services\ContentService;
use App\Services\ReleaseService;
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
        protected ReleaseService $releaseService
    ) {}

    /**
     * Display a listing of contents for a collection.
     *
     * Supports filtering by release: ?release=2024-01
     * When filtering by release, only contents that have a version in that release are returned,
     * with the content state as it was at the release endpoint.
     *
     * Supports filtering by edition: ?edition=web
     * When filtering by edition, only contents visible for that edition are returned,
     * and elements within content are filtered according to edition rules.
     */
    public function index(Request $request, Collection $collection): AnonymousResourceCollection|JsonResponse
    {
        $perPage = $request->integer('per_page', 15);
        $edition = $request->input('edition');

        // If filtering by release, return release-specific content states
        if ($request->filled('release')) {
            return $this->indexByRelease($request, $collection);
        }

        $query = $collection->contents()
            ->when($request->filled('status'), function ($query) use ($request) {
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

        $contents = $query->orderBy('created_at', 'desc')->paginate($perPage);

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
     * Get contents filtered by a specific release.
     * Returns content states as they were at the release endpoint.
     */
    protected function indexByRelease(Request $request, Collection $collection): JsonResponse
    {
        $release = $request->input('release');

        // Validate release exists
        if (! $this->releaseService->releaseExists($collection, $release)) {
            return response()->json([
                'message' => "Release '{$release}' not found in this collection.",
                'available_releases' => collect($collection->releases ?? [])->pluck('name'),
            ], 404);
        }

        // Get contents for this release
        $releaseContents = $this->releaseService->getContentsForRelease($collection, $release);

        // Apply filters
        if ($request->filled('search')) {
            $search = strtolower($request->input('search'));
            $releaseContents = $releaseContents->filter(function ($item) use ($search) {
                $title = $item['version']?->snapshot['title'] ?? $item['content']->title;

                return str_contains(strtolower($title), $search);
            });
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            $releaseContents = $releaseContents->filter(function ($item) use ($status) {
                $contentStatus = $item['version']?->snapshot['status'] ?? $item['content']->status->value;

                return $contentStatus === $status;
            });
        }

        // Manual pagination
        $perPage = $request->integer('per_page', 15);
        $page = $request->integer('page', 1);
        $total = $releaseContents->count();
        $items = $releaseContents->slice(($page - 1) * $perPage, $perPage)->values();

        $data = $items->map(function ($item) use ($release) {
            return new ReleaseContentResource($item['content'], $release, $item['version']);
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'release' => $release,
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ]);
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
     * Supports release filter: ?release=2024-01
     * When filtering by release, returns the content state as it was at that release endpoint.
     *
     * Supports edition filter: ?edition=web
     * When filtering by edition, returns 404 if content is not visible for that edition,
     * and filters elements according to edition rules.
     */
    public function show(Request $request, Content $content): JsonResponse
    {
        $edition = $request->input('edition');

        // If filtering by release, return release-specific content state
        if ($request->filled('release')) {
            return $this->showByRelease($request, $content);
        }

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
     * Get a single content's state for a specific release.
     */
    protected function showByRelease(Request $request, Content $content): JsonResponse
    {
        $release = $request->input('release');
        $collection = $content->collection;

        // Validate release exists
        if (! $this->releaseService->releaseExists($collection, $release)) {
            return response()->json([
                'message' => "Release '{$release}' not found in this collection.",
                'available_releases' => collect($collection->releases ?? [])->pluck('name'),
            ], 404);
        }

        // Get the content version for this release
        $releaseVersion = $this->releaseService->getContentForRelease($content, $release);

        if (! $releaseVersion) {
            return response()->json([
                'message' => "Content not found in release '{$release}'.",
                'hint' => 'This content may not have been created or modified during this release.',
            ], 404);
        }

        return response()->json([
            'data' => new ReleaseContentResource($content, $release, $releaseVersion),
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
