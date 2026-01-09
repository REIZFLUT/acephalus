<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreMediaRequest;
use App\Http\Resources\MediaResource;
use App\Models\Mongodb\Media;
use App\Services\GridFsMediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaController extends Controller
{
    public function __construct(
        protected GridFsMediaService $mediaService
    ) {}

    /**
     * Display a listing of media files.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);

        $media = Media::query()
            ->when($request->filled('type'), function ($query) use ($request) {
                $query->where('media_type', $request->input('type'));
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('original_filename', 'like', '%'.$request->input('search').'%');
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return MediaResource::collection($media);
    }

    /**
     * Store a newly uploaded media file.
     */
    public function store(StoreMediaRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $metadata = $request->only(['alt', 'caption']);

        $media = $this->mediaService->upload(
            $file,
            $request->user(),
            $metadata
        );

        return response()->json([
            'message' => 'File uploaded successfully',
            'data' => new MediaResource($media),
        ], 201);
    }

    /**
     * Display/download the specified media file.
     */
    public function show(Request $request, Media $media): StreamedResponse|JsonResponse
    {
        // Check if client wants metadata only
        if ($request->boolean('metadata_only')) {
            return response()->json([
                'data' => new MediaResource($media),
            ]);
        }

        $stream = $this->mediaService->download($media);

        if ($stream === null) {
            return response()->json([
                'message' => 'File not found in storage',
            ], 404);
        }

        return response()->stream(
            function () use ($stream) {
                fpassthru($stream);
                fclose($stream);
            },
            200,
            [
                'Content-Type' => $media->mime_type,
                'Content-Disposition' => 'inline; filename="'.$media->original_filename.'"',
            ]
        );
    }

    /**
     * Remove the specified media file.
     */
    public function destroy(Media $media): JsonResponse
    {
        $this->mediaService->delete($media);

        return response()->json([
            'message' => 'File deleted successfully',
        ]);
    }
}
