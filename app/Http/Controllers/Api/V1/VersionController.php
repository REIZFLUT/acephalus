<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentVersionResource;
use App\Models\Mongodb\Content;
use App\Services\VersionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VersionController extends Controller
{
    public function __construct(
        protected VersionService $versionService
    ) {}

    /**
     * Display a listing of versions for a content.
     */
    public function index(Content $content): AnonymousResourceCollection
    {
        $versions = $this->versionService->getVersionHistory($content);

        return ContentVersionResource::collection($versions);
    }

    /**
     * Display a specific version.
     */
    public function show(Content $content, int $version): JsonResponse
    {
        $contentVersion = $this->versionService->getVersion($content, $version);

        if (! $contentVersion) {
            return response()->json([
                'message' => 'Version not found',
            ], 404);
        }

        return response()->json([
            'data' => new ContentVersionResource($contentVersion),
        ]);
    }

    /**
     * Restore a content to a specific version.
     */
    public function restore(Request $request, Content $content, int $version): JsonResponse
    {
        $versionExists = $this->versionService->getVersion($content, $version);

        if (! $versionExists) {
            return response()->json([
                'message' => 'Version not found',
            ], 404);
        }

        $restoredContent = $this->versionService->restoreVersion(
            $content,
            $version,
            $request->user()
        );

        return response()->json([
            'message' => "Content restored to version {$version}",
            'data' => [
                'content' => $restoredContent,
                'current_version' => $restoredContent->current_version,
            ],
        ]);
    }

    /**
     * Compare two versions.
     */
    public function compare(Content $content, int $fromVersion, int $toVersion): JsonResponse
    {
        $comparison = $this->versionService->compareVersions($content, $fromVersion, $toVersion);

        if (empty($comparison)) {
            return response()->json([
                'message' => 'One or both versions not found',
            ], 404);
        }

        return response()->json([
            'data' => $comparison,
        ]);
    }
}


