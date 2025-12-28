<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Media;
use App\Services\GridFsMediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function __construct(private readonly GridFsMediaService $mediaService) {}

    public function index(Request $request): Response|\Illuminate\Http\JsonResponse
    {
        $query = Media::query();

        if ($search = $request->input('search')) {
            $query->where('original_filename', 'like', "%{$search}%");
        }

        if ($type = $request->input('type')) {
            $query->where('mime_type', 'like', "{$type}/%");
        }

        $media = $query
            ->orderBy('created_at', 'desc')
            ->paginate(24);

        // Add URLs to media items for the web interface
        $media->getCollection()->transform(function ($item) {
            $item->url = route('media.file', ['media' => $item->_id]);
            $item->_id = (string) $item->_id;

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

        return Inertia::render('Media/Index', [
            'media' => $media,
            'filters' => [
                'search' => $search,
                'type' => $type,
            ],
        ]);
    }

    public function file(Media $media): \Symfony\Component\HttpFoundation\StreamedResponse
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
            'Content-Disposition' => 'inline; filename="' . $media->original_filename . '"',
            'Cache-Control' => 'public, max-age=3600',
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
        ]);

        $file = $request->file('file');

        $media = $this->mediaService->upload($file, $request->user());

        // Return JSON for AJAX requests (media picker), but not for Inertia requests
        if (($request->wantsJson() || $request->ajax()) && ! $request->header('X-Inertia')) {
            $media->url = route('media.file', ['media' => $media->_id]);
            $media->_id = (string) $media->_id;

            return response()->json([
                'data' => $media,
                'message' => "File '{$media->original_filename}' uploaded successfully.",
            ]);
        }

        return redirect()
            ->route('media.index')
            ->with('success', "File '{$media->original_filename}' uploaded successfully.");
    }

    public function show(Media $media): Response
    {
        return Inertia::render('Media/Show', [
            'media' => $media,
        ]);
    }

    public function destroy(Media $media): RedirectResponse
    {
        $filename = $media->original_filename;

        $this->mediaService->delete($media);

        return redirect()
            ->route('media.index')
            ->with('success', "File '{$filename}' deleted successfully.");
    }
}
