<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Media;
use App\Models\Mongodb\MediaFolder;
use App\Models\Mongodb\MediaMetaField;
use App\Services\GridFsMediaService;
use App\Services\ThumbnailService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaController extends Controller
{
    public function __construct(private readonly GridFsMediaService $mediaService) {}

    public function index(Request $request): Response|\Illuminate\Http\JsonResponse
    {
        $query = Media::query();
        $search = $request->input('search');
        $folderId = $request->input('folder');

        // Global search - searches across ALL folders, ignoring folder filter
        // Searches in: filename, alt, caption, and tags
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('original_filename', 'like', "%{$search}%")
                    ->orWhere('alt', 'like', "%{$search}%")
                    ->orWhere('caption', 'like', "%{$search}%")
                    ->orWhere('tags', 'like', "%{$search}%");
            });
            // When searching globally, we don't filter by folder
            $folderId = null;
        } elseif ($folderId) {
            // Only filter by folder when not doing a global search
            $query->where('folder_id', $folderId);
        }

        if ($type = $request->input('type')) {
            $query->where('mime_type', 'like', "{$type}/%");
        }

        // Allow configurable items per page (default 24 for Grid view)
        $perPage = (int) $request->input('per_page', 24);
        $perPage = in_array($perPage, [12, 24, 48, 96, 100]) ? $perPage : 24;

        $media = $query
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Add URLs and folder info to media items for the web interface
        $media->getCollection()->transform(function ($item) {
            $item->url = route('media.file', ['media' => $item->_id]);

            // Add thumbnail URLs for images (all sizes for context-appropriate usage)
            if (str_starts_with($item->mime_type, 'image/') && $item->mime_type !== 'image/svg+xml') {
                $item->thumbnail_urls = [
                    'small' => route('media.thumbnail', ['media' => $item->_id, 'size' => 'small']),
                    'medium' => route('media.thumbnail', ['media' => $item->_id, 'size' => 'medium']),
                    'large' => route('media.thumbnail', ['media' => $item->_id, 'size' => 'large']),
                ];
                // Keep backward compatibility
                $item->thumbnail_url = $item->thumbnail_urls['small'];
            }

            $item->_id = (string) $item->_id;

            // Add folder path information if media is in a folder
            if ($item->folder_id) {
                $folder = MediaFolder::find($item->folder_id);
                if ($folder) {
                    $item->folder_path = $this->buildFolderDisplayPath($folder);
                    $item->folder_name = $folder->name;
                }
            }

            return $item;
        });

        // Return JSON for AJAX requests (media picker), but not for Inertia requests
        // Inertia sends X-Inertia header, so we exclude those
        if (($request->wantsJson() || $request->ajax()) && ! $request->header('X-Inertia')) {
            return response()->json([
                'data' => $media->items(),
                'meta' => [
                    'current_page' => $media->currentPage(),
                    'last_page' => $media->lastPage(),
                    'per_page' => $media->perPage(),
                    'total' => $media->total(),
                ],
            ]);
        }

        // Get all meta fields for the edit form
        $metaFields = MediaMetaField::ordered()->get();

        // Get subfolders of the current folder for explorer-like display
        // Only show when not in global search mode
        $subfolders = [];
        $originalFolderId = $request->input('folder');
        $isGlobalSearch = (bool) $search;

        if ($originalFolderId && ! $isGlobalSearch) {
            $subfolders = MediaFolder::where('parent_id', $originalFolderId)
                ->orderBy('name')
                ->get()
                ->map(fn ($folder) => [
                    'id' => (string) $folder->_id,
                    'name' => $folder->name,
                    'type' => $folder->type,
                    'is_system' => $folder->is_system,
                    'children_count' => MediaFolder::where('parent_id', (string) $folder->_id)->count(),
                    'media_count' => Media::where('folder_id', (string) $folder->_id)->count(),
                ]);
        }

        // Get current folder info (even during search to maintain context)
        $currentFolder = $originalFolderId ? MediaFolder::find($originalFolderId) : null;

        return Inertia::render('Media/Index', [
            'media' => $media,
            'metaFields' => $metaFields,
            'subfolders' => $subfolders,
            'currentFolder' => $currentFolder ? [
                'id' => (string) $currentFolder->_id,
                'name' => $currentFolder->name,
                'type' => $currentFolder->type,
                'parent_id' => $currentFolder->parent_id,
                'can_create_subfolders' => $currentFolder->canCreateSubfolders(),
            ] : null,
            'isGlobalSearch' => $isGlobalSearch,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'folder' => $originalFolderId,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function file(Media $media): StreamedResponse
    {
        $stream = $this->mediaService->download($media);

        if ($stream === null) {
            abort(404);
        }

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $media->mime_type,
            'Content-Length' => $media->size,
            'Content-Disposition' => 'inline; filename="'.$media->original_filename.'"',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * Serve a thumbnail for a media file.
     */
    public function thumbnail(Media $media, string $size): StreamedResponse
    {
        // Validate size parameter
        $validSizes = array_keys(ThumbnailService::SIZES);
        if (! in_array($size, $validSizes)) {
            abort(400, 'Invalid thumbnail size. Valid sizes: '.implode(', ', $validSizes));
        }

        // Check if thumbnail exists
        if (! $media->hasThumbnail($size)) {
            // For images without thumbnails, try to generate them on-the-fly
            // (for existing images that were uploaded before thumbnail support)
            if ($this->mediaService->thumbnailService->isSupported($media->mime_type)) {
                $this->mediaService->generateThumbnailsForMedia($media);
                $media->refresh();
            }

            // If still no thumbnail, fallback to original file
            if (! $media->hasThumbnail($size)) {
                return $this->file($media);
            }
        }

        $stream = $this->mediaService->downloadThumbnail($media, $size);

        if ($stream === null) {
            // Fallback to original file
            return $this->file($media);
        }

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => 'image/webp',
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'public, max-age=31536000, immutable', // 1 year cache for thumbnails
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Media/Create');
    }

    public function store(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:51200'], // 50MB max
            'collection_id' => ['nullable', 'string'],
            'content_id' => ['nullable', 'string'],
            'folder_id' => ['nullable', 'string'],
        ]);

        $file = $request->file('file');
        $folderId = $request->input('folder_id');

        // If collection and content are provided, auto-create/find the content folder
        if ($request->input('collection_id') && $request->input('content_id')) {
            $folderId = $this->getOrCreateContentFolder(
                $request->input('collection_id'),
                $request->input('content_id')
            );
        }

        $media = $this->mediaService->upload($file, $request->user(), [], $folderId);

        // Return JSON for AJAX requests (media picker), but not for Inertia requests
        if (($request->wantsJson() || $request->ajax()) && ! $request->header('X-Inertia')) {
            // Build response data manually to ensure all fields are included
            $mediaData = $media->toArray();
            $mediaData['_id'] = (string) $media->_id;
            $mediaData['url'] = route('media.file', ['media' => $media->_id]);

            // Add thumbnail URLs for images (all sizes for context-appropriate usage)
            if (str_starts_with($media->mime_type, 'image/') && $media->mime_type !== 'image/svg+xml') {
                $mediaData['thumbnail_urls'] = [
                    'small' => route('media.thumbnail', ['media' => $media->_id, 'size' => 'small']),
                    'medium' => route('media.thumbnail', ['media' => $media->_id, 'size' => 'medium']),
                    'large' => route('media.thumbnail', ['media' => $media->_id, 'size' => 'large']),
                ];
                // Keep backward compatibility
                $mediaData['thumbnail_url'] = $mediaData['thumbnail_urls']['small'];
            }

            return response()->json([
                'data' => $mediaData,
                'message' => "File '{$media->original_filename}' uploaded successfully.",
            ]);
        }

        return redirect()
            ->route('media.index', ['folder' => $folderId])
            ->with('success', "File '{$media->original_filename}' uploaded successfully.");
    }

    /**
     * Get or create the content folder for uploaded media.
     */
    protected function getOrCreateContentFolder(string $collectionId, string $contentId): ?string
    {
        $collection = Collection::find($collectionId);
        $content = Content::find($contentId);

        if (! $collection || ! $content) {
            return null;
        }

        // Find the collection folder
        $collectionFolder = MediaFolder::where('collection_id', $collectionId)
            ->where('type', MediaFolder::TYPE_COLLECTION)
            ->first();

        if (! $collectionFolder) {
            return null;
        }

        // Check if content folder exists
        $contentFolder = MediaFolder::where('content_id', $contentId)
            ->where('type', MediaFolder::TYPE_CONTENT)
            ->first();

        if ($contentFolder) {
            return (string) $contentFolder->_id;
        }

        // Create the content folder
        $contentFolder = MediaFolder::create([
            'name' => $content->title ?? $content->slug,
            'slug' => $content->slug,
            'path' => $collectionFolder->path.'/'.$content->slug,
            'type' => MediaFolder::TYPE_CONTENT,
            'is_system' => false,
            'parent_id' => (string) $collectionFolder->_id,
            'collection_id' => $collectionId,
            'content_id' => $contentId,
        ]);

        return (string) $contentFolder->_id;
    }

    public function show(Media $media): Response
    {
        $media->url = route('media.file', ['media' => $media->_id]);

        return Inertia::render('Media/Show', [
            'media' => $media,
        ]);
    }

    public function update(Request $request, Media $media): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'alt' => ['nullable', 'string', 'max:500'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'folder_id' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
            'metadata.focus_area' => ['nullable', 'array'],
            'metadata.focus_area.x' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'metadata.focus_area.y' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'metadata.focus_area.width' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'metadata.focus_area.height' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        // Get metadata directly from request to preserve custom fields
        // Laravel validation strips fields not explicitly in rules
        $newMetadata = $request->input('metadata', []);
        if (! is_array($newMetadata)) {
            $newMetadata = [];
        }

        // Merge metadata with existing metadata
        // Convert BSON types to PHP arrays if needed
        $existingMetadata = $media->metadata;
        if ($existingMetadata instanceof \MongoDB\Model\BSONDocument || $existingMetadata instanceof \MongoDB\Model\BSONArray) {
            $existingMetadata = $existingMetadata->getArrayCopy();
        }
        $existingMetadata = is_array($existingMetadata) ? $existingMetadata : [];

        $mergedMetadata = array_merge($existingMetadata, $newMetadata);

        $updateData = [
            'alt' => $validated['alt'] ?? $media->alt,
            'caption' => $validated['caption'] ?? $media->caption,
            'tags' => $validated['tags'] ?? $media->tags,
            'metadata' => $mergedMetadata,
        ];

        // Only update folder_id if it was explicitly provided in the request
        if ($request->has('folder_id')) {
            $updateData['folder_id'] = $validated['folder_id'];
        }

        $media->update($updateData);

        // Return JSON for AJAX requests
        if (($request->wantsJson() || $request->ajax()) && ! $request->header('X-Inertia')) {
            $mediaData = $media->fresh()->toArray();
            $mediaData['_id'] = (string) $media->_id;
            $mediaData['url'] = route('media.file', ['media' => $media->_id]);

            return response()->json([
                'data' => $mediaData,
                'message' => 'Media updated successfully.',
            ]);
        }

        return redirect()
            ->route('media.index')
            ->with('success', 'Media updated successfully.');
    }

    public function destroy(Media $media): RedirectResponse
    {
        $filename = $media->original_filename;

        $this->mediaService->delete($media);

        return redirect()
            ->route('media.index')
            ->with('success', "File '{$filename}' deleted successfully.");
    }

    /**
     * Build a human-readable display path for a folder.
     */
    protected function buildFolderDisplayPath(MediaFolder $folder): string
    {
        $breadcrumbs = $folder->getBreadcrumbs();
        $names = array_map(fn ($crumb) => $crumb['name'], $breadcrumbs);

        return implode(' / ', $names);
    }
}
