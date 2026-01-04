<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\ContentVersion;
use App\Models\User;
use Carbon\Carbon;

class ReleaseService
{
    public const DEFAULT_RELEASE = 'Basis';

    /**
     * Create a new release for a collection.
     * This finalizes the current release and starts a new one.
     *
     * @param  bool  $copyContents  If true, creates a copy of each content's latest version in the new release
     */
    public function createRelease(
        Collection $collection,
        string $name,
        ?User $user = null,
        bool $copyContents = false
    ): Collection {
        // First, finalize the current release by marking the latest version of each content
        $this->finalizeCurrentRelease($collection);

        // Create the new release entry
        $releases = $collection->releases ?? [];
        $releases[] = [
            'name' => $name,
            'created_at' => Carbon::now()->toISOString(),
            'created_by' => $user?->id,
        ];

        // Update the collection with the new release
        $collection->update([
            'current_release' => $name,
            'releases' => $releases,
        ]);

        // If copyContents is true, create initial versions in the new release
        if ($copyContents) {
            $this->copyContentsToNewRelease($collection, $name, $user);
        }

        return $collection->fresh();
    }

    /**
     * Copy all contents from the previous release to the new release.
     * This creates a new version for each content with the new release name.
     */
    protected function copyContentsToNewRelease(Collection $collection, string $newRelease, ?User $user = null): void
    {
        $collection->contents()->each(function (Content $content) use ($newRelease, $user) {
            // Get the latest version (which should be the release_end of the previous release)
            $latestVersion = $content->versions()->latestVersion()->first();

            if (! $latestVersion) {
                return;
            }

            // Increment content version
            $content->increment('current_version');

            // Create a new version in the new release (copy of the previous one)
            ContentVersion::create([
                'content_id' => $content->_id,
                'version_number' => $content->current_version,
                'elements' => $latestVersion->elements,
                'created_by' => $user?->id,
                'change_note' => "Copied to release: {$newRelease}",
                'release' => $newRelease,
                'is_release_end' => false,
                'snapshot' => $latestVersion->snapshot,
            ]);
        });
    }

    /**
     * Finalize the current release by marking the latest version of each content as release_end.
     */
    public function finalizeCurrentRelease(Collection $collection): void
    {
        $currentRelease = $collection->current_release ?? self::DEFAULT_RELEASE;

        // For each content in the collection, mark the latest version as release_end
        $collection->contents()->each(function (Content $content) use ($currentRelease) {
            $latestVersion = $content->versions()
                ->where('release', $currentRelease)
                ->latestVersion()
                ->first();

            if ($latestVersion && ! $latestVersion->is_release_end) {
                $latestVersion->update(['is_release_end' => true]);
            }
        });
    }

    /**
     * Get all contents for a specific release with their release-end state.
     *
     * @return \Illuminate\Support\Collection<int, array{content: Content, version: ContentVersion|null}>
     */
    public function getContentsForRelease(Collection $collection, string $release): \Illuminate\Support\Collection
    {
        $results = collect();

        $collection->contents()->each(function (Content $content) use ($release, &$results) {
            // Find the release_end version for this release
            $releaseVersion = $content->versions()
                ->where('release', $release)
                ->where('is_release_end', true)
                ->first();

            // If no release_end, try to find any version in this release
            if (! $releaseVersion) {
                $releaseVersion = $content->versions()
                    ->where('release', $release)
                    ->latestVersion()
                    ->first();
            }

            // Only include if there's a version in this release
            if ($releaseVersion) {
                $results->push([
                    'content' => $content,
                    'version' => $releaseVersion,
                ]);
            }
        });

        return $results;
    }

    /**
     * Get a single content's state for a specific release.
     */
    public function getContentForRelease(Content $content, string $release): ?ContentVersion
    {
        // Find the release_end version for this release
        $releaseVersion = $content->versions()
            ->where('release', $release)
            ->where('is_release_end', true)
            ->first();

        // If no release_end, try to find any version in this release
        if (! $releaseVersion) {
            $releaseVersion = $content->versions()
                ->where('release', $release)
                ->latestVersion()
                ->first();
        }

        return $releaseVersion;
    }

    /**
     * Check if a release exists in a collection.
     */
    public function releaseExists(Collection $collection, string $release): bool
    {
        $releases = $collection->releases ?? [];

        return collect($releases)->contains('name', $release);
    }

    /**
     * Purge old versions for a single content.
     * Keeps only release_end versions and the current (latest) version.
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
        // - NOT marked as release_end
        $deletedCount = $content->versions()
            ->where('_id', '!=', $latestVersion->_id)
            ->where(function ($query) {
                $query->where('is_release_end', '!=', true)
                    ->orWhereNull('is_release_end');
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
                    $query->where('is_release_end', '!=', true)
                        ->orWhereNull('is_release_end');
                })
                ->count();
        });

        return $count;
    }

    /**
     * Initialize release for a new collection.
     */
    public function initializeCollectionRelease(Collection $collection, ?User $user = null): void
    {
        if ($collection->current_release) {
            return; // Already initialized
        }

        $collection->update([
            'current_release' => self::DEFAULT_RELEASE,
            'releases' => [
                [
                    'name' => self::DEFAULT_RELEASE,
                    'created_at' => Carbon::now()->toISOString(),
                    'created_by' => $user?->id,
                ],
            ],
        ]);
    }
}
