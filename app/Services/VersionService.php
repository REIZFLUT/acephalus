<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Mongodb\Content;
use App\Models\Mongodb\ContentVersion;
use App\Models\Mongodb\Element;
use App\Models\User;

class VersionService
{
    /**
     * Create a new version for a content.
     */
    public function createVersion(Content $content, ?User $user = null, ?string $changeNote = null): ContentVersion
    {
        $elements = $this->getElementsSnapshot($content);

        // Get the edition from the parent collection
        $collection = $content->collection;
        $edition = $collection?->current_edition ?? EditionService::DEFAULT_EDITION;

        return ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => $content->current_version,
            'elements' => $elements,
            'created_by' => $user?->id,
            'change_note' => $changeNote,
            'edition' => $edition,
            'is_edition_end' => false,
            'snapshot' => [
                'title' => $content->title,
                'slug' => $content->slug,
                'status' => $content->status->value,
                'metadata' => $content->metadata,
            ],
        ]);
    }

    /**
     * Restore a content to a specific version.
     */
    public function restoreVersion(Content $content, int $versionNumber, ?User $user = null): Content
    {
        $version = $content->versions()->version($versionNumber)->firstOrFail();

        // Restore the content's elements
        $this->restoreElementsFromVersion($content, $version);

        // Restore snapshot data
        if ($version->snapshot) {
            $content->update([
                'title' => $version->snapshot['title'] ?? $content->title,
                'slug' => $version->snapshot['slug'] ?? $content->slug,
                'metadata' => $version->snapshot['metadata'] ?? $content->metadata,
            ]);
        }

        // Increment version and create new version record
        $content->increment('current_version');

        $this->createVersion(
            $content,
            $user,
            "Restored to version {$versionNumber}"
        );

        return $content->fresh();
    }

    /**
     * Get the version history for a content.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, ContentVersion>
     */
    public function getVersionHistory(Content $content): \Illuminate\Database\Eloquent\Collection
    {
        return $content->versions()
            ->latestVersion()
            ->with('creator')
            ->get();
    }

    /**
     * Get a specific version of a content.
     */
    public function getVersion(Content $content, int $versionNumber): ?ContentVersion
    {
        return $content->versions()->version($versionNumber)->first();
    }

    /**
     * Compare two versions of a content.
     *
     * @return array<string, mixed>
     */
    public function compareVersions(Content $content, int $fromVersion, int $toVersion): array
    {
        $from = $this->getVersion($content, $fromVersion);
        $to = $this->getVersion($content, $toVersion);

        if (! $from || ! $to) {
            return [];
        }

        return [
            'from' => [
                'version' => $fromVersion,
                'elements' => $from->elements,
                'snapshot' => $from->snapshot,
                'created_at' => $from->created_at,
            ],
            'to' => [
                'version' => $toVersion,
                'elements' => $to->elements,
                'snapshot' => $to->snapshot,
                'created_at' => $to->created_at,
            ],
            'changes' => $this->calculateChanges($from, $to),
        ];
    }

    /**
     * Get a snapshot of all elements for a content.
     *
     * @return array<mixed>
     */
    protected function getElementsSnapshot(Content $content): array
    {
        return Element::where('content_id', $content->_id)
            ->orderBy('order')
            ->get()
            ->map(fn (Element $element) => [
                '_id' => (string) $element->_id,
                'parent_id' => $element->parent_id,
                'type' => $element->type->value,
                'data' => $element->data,
                'order' => $element->order,
            ])
            ->toArray();
    }

    /**
     * Restore elements from a version.
     */
    protected function restoreElementsFromVersion(Content $content, ContentVersion $version): void
    {
        // Delete current elements
        Element::where('content_id', $content->_id)->delete();

        // Recreate elements from version
        foreach ($version->elements as $elementData) {
            Element::create([
                'content_id' => $content->_id,
                'parent_id' => $elementData['parent_id'] ?? null,
                'type' => $elementData['type'],
                'data' => $elementData['data'],
                'order' => $elementData['order'],
            ]);
        }

        // Sync content elements array
        $content->update(['elements' => $content->fresh()->elements]);
    }

    /**
     * Calculate changes between two versions.
     *
     * @return array<string, mixed>
     */
    protected function calculateChanges(ContentVersion $from, ContentVersion $to): array
    {
        $fromElements = collect($from->elements)->keyBy('_id');
        $toElements = collect($to->elements)->keyBy('_id');

        $added = $toElements->diffKeys($fromElements)->values()->toArray();
        $removed = $fromElements->diffKeys($toElements)->values()->toArray();

        $modified = [];
        foreach ($toElements as $id => $element) {
            if ($fromElements->has($id)) {
                $fromElement = $fromElements[$id];
                if ($element !== $fromElement) {
                    $modified[] = [
                        '_id' => $id,
                        'from' => $fromElement,
                        'to' => $element,
                    ];
                }
            }
        }

        return [
            'added' => $added,
            'removed' => $removed,
            'modified' => $modified,
        ];
    }
}
