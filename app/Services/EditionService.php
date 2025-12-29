<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\User;
use Carbon\Carbon;

class EditionService
{
    public const DEFAULT_EDITION = 'Basis';

    /**
     * Create a new edition for a collection.
     * This finalizes the current edition and starts a new one.
     */
    public function createEdition(Collection $collection, string $name, ?User $user = null): Collection
    {
        // First, finalize the current edition by marking the latest version of each content
        $this->finalizeCurrentEdition($collection);

        // Create the new edition entry
        $editions = $collection->editions ?? [];
        $editions[] = [
            'name' => $name,
            'created_at' => Carbon::now()->toISOString(),
            'created_by' => $user?->id,
        ];

        // Update the collection with the new edition
        $collection->update([
            'current_edition' => $name,
            'editions' => $editions,
        ]);

        return $collection->fresh();
    }

    /**
     * Finalize the current edition by marking the latest version of each content as edition_end.
     */
    public function finalizeCurrentEdition(Collection $collection): void
    {
        $currentEdition = $collection->current_edition ?? self::DEFAULT_EDITION;

        // For each content in the collection, mark the latest version as edition_end
        $collection->contents()->each(function (Content $content) use ($currentEdition) {
            $latestVersion = $content->versions()
                ->where('edition', $currentEdition)
                ->latestVersion()
                ->first();

            if ($latestVersion && ! $latestVersion->is_edition_end) {
                $latestVersion->update(['is_edition_end' => true]);
            }
        });
    }

    /**
     * Purge old versions for a single content.
     * Keeps only edition_end versions and the current (latest) version.
     *
     * @return int Number of versions deleted
     */
    public function purgeOldVersions(Content $content): int
    {
        // Get the latest version (always keep this one)
        $latestVersion = $content->versions()->latestVersion()->first();

        if (! $latestVersion) {
            return 0;
        }

        // Delete all versions that are:
        // - NOT the latest version
        // - NOT marked as edition_end
        $deletedCount = $content->versions()
            ->where('_id', '!=', $latestVersion->_id)
            ->where(function ($query) {
                $query->where('is_edition_end', '!=', true)
                    ->orWhereNull('is_edition_end');
            })
            ->delete();

        return $deletedCount;
    }

    /**
     * Purge old versions for all contents in a collection.
     *
     * @return int Total number of versions deleted
     */
    public function purgeCollectionVersions(Collection $collection): int
    {
        $totalDeleted = 0;

        $collection->contents()->each(function (Content $content) use (&$totalDeleted) {
            $totalDeleted += $this->purgeOldVersions($content);
        });

        return $totalDeleted;
    }

    /**
     * Get the count of versions that would be deleted if purge is called.
     */
    public function getPurgePreviewCount(Collection $collection): int
    {
        $count = 0;

        $collection->contents()->each(function (Content $content) use (&$count) {
            $latestVersion = $content->versions()->latestVersion()->first();

            if (! $latestVersion) {
                return;
            }

            $count += $content->versions()
                ->where('_id', '!=', $latestVersion->_id)
                ->where(function ($query) {
                    $query->where('is_edition_end', '!=', true)
                        ->orWhereNull('is_edition_end');
                })
                ->count();
        });

        return $count;
    }

    /**
     * Initialize edition for a new collection.
     */
    public function initializeCollectionEdition(Collection $collection, ?User $user = null): void
    {
        if ($collection->current_edition) {
            return; // Already initialized
        }

        $collection->update([
            'current_edition' => self::DEFAULT_EDITION,
            'editions' => [
                [
                    'name' => self::DEFAULT_EDITION,
                    'created_at' => Carbon::now()->toISOString(),
                    'created_by' => $user?->id,
                ],
            ],
        ]);
    }
}
