<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreContentRequest;
use App\Http\Requests\Api\V1\UpdateContentRequest;
use App\Http\Resources\ContentResource;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
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
        protected SchemaService $schemaService
    ) {}

    /**
     * Display a listing of contents for a collection.
     */
    public function index(Request $request, Collection $collection): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);

        $contents = $collection->contents()
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->input('status'));
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('title', 'like', '%'.$request->input('search').'%');
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

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
     */
    public function show(Content $content): JsonResponse
    {
        $content->load(['collection', 'versions' => function ($query) {
            $query->latest()->limit(5);
        }]);

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
}


