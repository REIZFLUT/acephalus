<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Services\EditionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CollectionEditionController extends Controller
{
    public function __construct(
        protected EditionService $editionService
    ) {}

    /**
     * Create a new edition for the collection.
     */
    public function store(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        // Check if edition name already exists
        $existingEditions = collect($collection->editions ?? []);
        if ($existingEditions->contains('name', $validated['name'])) {
            return redirect()
                ->back()
                ->withErrors(['name' => 'An edition with this name already exists.']);
        }

        $this->editionService->createEdition(
            $collection,
            $validated['name'],
            $request->user()
        );

        return redirect()
            ->back()
            ->with('success', "Edition '{$validated['name']}' created successfully.");
    }

    /**
     * Purge old versions for all contents in the collection.
     */
    public function purge(Collection $collection): RedirectResponse
    {
        $deletedCount = $this->editionService->purgeCollectionVersions($collection);

        return redirect()
            ->back()
            ->with('success', "Successfully deleted {$deletedCount} old versions.");
    }

    /**
     * Get preview count of versions that would be deleted.
     */
    public function purgePreview(Collection $collection): \Illuminate\Http\JsonResponse
    {
        $count = $this->editionService->getPurgePreviewCount($collection);

        return response()->json([
            'count' => $count,
        ]);
    }
}
