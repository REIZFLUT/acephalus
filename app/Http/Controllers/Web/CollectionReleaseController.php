<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Services\ReleaseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CollectionReleaseController extends Controller
{
    public function __construct(
        protected ReleaseService $releaseService
    ) {}

    /**
     * Create a new release for the collection.
     */
    public function store(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'copy_contents' => ['boolean'],
        ]);

        // Check if release name already exists
        $existingReleases = collect($collection->releases ?? []);
        if ($existingReleases->contains('name', $validated['name'])) {
            return redirect()
                ->back()
                ->withErrors(['name' => 'A release with this name already exists.']);
        }

        $copyContents = $validated['copy_contents'] ?? false;

        $this->releaseService->createRelease(
            $collection,
            $validated['name'],
            $request->user(),
            $copyContents
        );

        $message = "Release '{$validated['name']}' created successfully.";
        if ($copyContents) {
            $message .= ' All contents have been copied to the new release.';
        }

        return redirect()
            ->back()
            ->with('success', $message);
    }

    /**
     * Purge old versions for all contents in the collection.
     */
    public function purge(Collection $collection): RedirectResponse
    {
        $deletedCount = $this->releaseService->purgeCollectionVersions($collection);

        return redirect()
            ->back()
            ->with('success', "Successfully deleted {$deletedCount} old versions.");
    }

    /**
     * Get preview count of versions that would be deleted.
     */
    public function purgePreview(Collection $collection): \Illuminate\Http\JsonResponse
    {
        $count = $this->releaseService->getPurgePreviewCount($collection);

        return response()->json([
            'count' => $count,
        ]);
    }
}
