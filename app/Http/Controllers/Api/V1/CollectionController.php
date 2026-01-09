<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCollectionRequest;
use App\Http\Requests\Api\V1\UpdateCollectionRequest;
use App\Http\Resources\CollectionResource;
use App\Models\Mongodb\Collection;
use App\Services\LockService;
use App\Services\SchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CollectionController extends Controller
{
    public function __construct(
        protected SchemaService $schemaService,
        protected LockService $lockService,
    ) {}

    /**
     * Display a listing of collections.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);

        $collections = Collection::query()
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', '%'.$request->input('search').'%');
            })
            ->orderBy('name')
            ->paginate($perPage);

        return CollectionResource::collection($collections);
    }

    /**
     * Store a newly created collection.
     */
    public function store(StoreCollectionRequest $request): JsonResponse
    {
        $data = $request->validated();

        $collection = Collection::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? null,
            'schema' => $data['schema'] ?? $this->schemaService->createDefaultSchema(),
            'settings' => $data['settings'] ?? [],
        ]);

        return response()->json([
            'message' => 'Collection created successfully',
            'data' => new CollectionResource($collection),
        ], 201);
    }

    /**
     * Display the specified collection.
     */
    public function show(Collection $collection): JsonResponse
    {
        return response()->json([
            'data' => new CollectionResource($collection->load('contents')),
        ]);
    }

    /**
     * Update the specified collection.
     */
    public function update(UpdateCollectionRequest $request, Collection $collection): JsonResponse
    {
        // Check if collection is locked
        $this->lockService->ensureCollectionCanBeModified($collection);

        $data = $request->validated();

        $collection->update(array_filter([
            'name' => $data['name'] ?? null,
            'slug' => $data['slug'] ?? null,
            'description' => $data['description'] ?? null,
            'schema' => $data['schema'] ?? null,
            'settings' => $data['settings'] ?? null,
        ], fn ($value) => $value !== null));

        return response()->json([
            'message' => 'Collection updated successfully',
            'data' => new CollectionResource($collection->fresh()),
        ]);
    }

    /**
     * Remove the specified collection.
     */
    public function destroy(Collection $collection): JsonResponse
    {
        // Check if collection is locked
        $this->lockService->ensureCollectionCanBeModified($collection);

        // Check if collection has contents
        if ($collection->contents()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete collection with existing contents. Delete all contents first.',
            ], 422);
        }

        $collection->delete();

        return response()->json([
            'message' => 'Collection deleted successfully',
        ]);
    }

    /**
     * Lock a collection.
     */
    public function lock(Request $request, Collection $collection): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $this->lockService->lockCollection(
            $collection,
            $request->user(),
            $validated['reason'] ?? null
        );

        return response()->json([
            'message' => 'Collection locked successfully',
            'data' => new CollectionResource($collection->fresh()),
        ]);
    }

    /**
     * Unlock a collection.
     */
    public function unlock(Collection $collection): JsonResponse
    {
        $this->lockService->unlockCollection($collection);

        return response()->json([
            'message' => 'Collection unlocked successfully',
            'data' => new CollectionResource($collection->fresh()),
        ]);
    }
}
