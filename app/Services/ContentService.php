<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ContentStatus;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Element;
use App\Models\User;
use Illuminate\Support\Str;

class ContentService
{
    public function __construct(
        protected VersionService $versionService
    ) {}

    /**
     * Create a new content in a collection.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(Collection $collection, array $data, ?User $user = null): Content
    {
        $content = new Content([
            'collection_id' => $collection->_id,
            'title' => $data['title'],
            'slug' => $data['slug'] ?? Str::slug($data['title']),
            'status' => ContentStatus::DRAFT,
            'current_version' => 1,
            'elements' => [],
            'metadata' => $data['metadata'] ?? [],
        ]);

        $content->save();

        // Create initial version
        $this->versionService->createVersion($content, $user, 'Initial version');

        return $content->fresh();
    }

    /**
     * Update a content.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Content $content, array $data, ?User $user = null, ?string $changeNote = null): Content
    {
        $updateData = [];

        if (isset($data['title'])) {
            $updateData['title'] = $data['title'];
        }

        if (isset($data['slug'])) {
            $updateData['slug'] = $data['slug'];
        }

        if (isset($data['metadata'])) {
            $updateData['metadata'] = $data['metadata'];
        }

        if (isset($data['elements'])) {
            $updateData['elements'] = $data['elements'];
        }

        if (! empty($updateData)) {
            $content->update($updateData);
            $content->increment('current_version');

            // Create new version
            $this->versionService->createVersion(
                $content,
                $user,
                $changeNote ?? 'Content updated'
            );
        }

        return $content->fresh();
    }

    /**
     * Delete a content and all its versions.
     */
    public function delete(Content $content): bool
    {
        // Delete all elements
        Element::where('content_id', $content->_id)->delete();

        // Delete all versions
        $content->versions()->delete();

        // Delete the content
        return $content->delete();
    }

    /**
     * Publish a content.
     */
    public function publish(Content $content, ?User $user = null): Content
    {
        // Get the latest version
        $latestVersion = $content->versions()->latestVersion()->first();

        $content->update([
            'status' => ContentStatus::PUBLISHED,
            'published_version_id' => $latestVersion?->_id,
        ]);

        $content->increment('current_version');
        $this->versionService->createVersion($content, $user, 'Published');

        return $content->fresh();
    }

    /**
     * Unpublish a content.
     */
    public function unpublish(Content $content, ?User $user = null): Content
    {
        $content->update([
            'status' => ContentStatus::DRAFT,
            'published_version_id' => null,
        ]);

        $content->increment('current_version');
        $this->versionService->createVersion($content, $user, 'Unpublished');

        return $content->fresh();
    }

    /**
     * Archive a content.
     */
    public function archive(Content $content, ?User $user = null): Content
    {
        $content->update([
            'status' => ContentStatus::ARCHIVED,
        ]);

        $content->increment('current_version');
        $this->versionService->createVersion($content, $user, 'Archived');

        return $content->fresh();
    }

    /**
     * Add an element to a content.
     *
     * @param  array<string, mixed>  $elementData
     */
    public function addElement(Content $content, array $elementData, ?User $user = null): Element
    {
        // Get the highest order for the content or parent
        $parentId = $elementData['parent_id'] ?? null;
        $maxOrder = Element::where('content_id', $content->_id)
            ->where('parent_id', $parentId)
            ->max('order') ?? -1;

        $element = Element::create([
            'content_id' => $content->_id,
            'parent_id' => $parentId,
            'type' => $elementData['type'],
            'data' => $elementData['data'] ?? [],
            'order' => $elementData['order'] ?? ($maxOrder + 1),
        ]);

        // Update content elements array
        $this->syncContentElements($content);

        // Create version
        $content->increment('current_version');
        $this->versionService->createVersion($content, $user, 'Element added');

        return $element;
    }

    /**
     * Update an element.
     *
     * @param  array<string, mixed>  $elementData
     */
    public function updateElement(Element $element, array $elementData, ?User $user = null): Element
    {
        $element->update([
            'type' => $elementData['type'] ?? $element->type,
            'data' => $elementData['data'] ?? $element->data,
            'order' => $elementData['order'] ?? $element->order,
        ]);

        $content = $element->content;
        $this->syncContentElements($content);

        $content->increment('current_version');
        $this->versionService->createVersion($content, $user, 'Element updated');

        return $element->fresh();
    }

    /**
     * Delete an element.
     */
    public function deleteElement(Element $element, ?User $user = null): bool
    {
        $content = $element->content;

        // Recursively delete children if it's a wrapper
        if ($element->isWrapper()) {
            $this->deleteElementChildren($element);
        }

        $element->delete();

        $this->syncContentElements($content);

        $content->increment('current_version');
        $this->versionService->createVersion($content, $user, 'Element deleted');

        return true;
    }

    /**
     * Move an element to a new position or parent.
     */
    public function moveElement(Element $element, ?string $newParentId, int $newOrder, ?User $user = null): Element
    {
        $content = $element->content;
        $oldParentId = $element->parent_id;

        // Update the element's parent and order
        $element->update([
            'parent_id' => $newParentId,
            'order' => $newOrder,
        ]);

        // Reorder siblings in old parent
        if ($oldParentId !== $newParentId) {
            $this->reorderElements($content, $oldParentId);
        }

        // Reorder siblings in new parent
        $this->reorderElements($content, $newParentId, $element->_id, $newOrder);

        $this->syncContentElements($content);

        $content->increment('current_version');
        $this->versionService->createVersion($content, $user, 'Element moved');

        return $element->fresh();
    }

    /**
     * Sync the content's elements array with the database.
     */
    protected function syncContentElements(Content $content): void
    {
        $elements = $this->buildElementsTree($content);
        $content->update(['elements' => $elements]);
    }

    /**
     * Build a tree structure of elements for a content.
     *
     * @return array<mixed>
     */
    protected function buildElementsTree(Content $content, ?string $parentId = null): array
    {
        $elements = Element::where('content_id', $content->_id)
            ->where('parent_id', $parentId)
            ->orderBy('order')
            ->get();

        return $elements->map(function (Element $element) use ($content) {
            $data = [
                '_id' => (string) $element->_id,
                'type' => $element->type->value,
                'data' => $element->data,
                'order' => $element->order,
            ];

            if ($element->isWrapper()) {
                $data['children'] = $this->buildElementsTree($content, (string) $element->_id);
            }

            return $data;
        })->toArray();
    }

    /**
     * Delete all children of an element recursively.
     */
    protected function deleteElementChildren(Element $element): void
    {
        $children = Element::where('parent_id', $element->_id)->get();

        foreach ($children as $child) {
            if ($child->isWrapper()) {
                $this->deleteElementChildren($child);
            }
            $child->delete();
        }
    }

    /**
     * Reorder elements after a move operation.
     */
    protected function reorderElements(Content $content, ?string $parentId, ?string $excludeId = null, ?int $insertAt = null): void
    {
        $elements = Element::where('content_id', $content->_id)
            ->where('parent_id', $parentId)
            ->when($excludeId, fn ($q) => $q->where('_id', '!=', $excludeId))
            ->orderBy('order')
            ->get();

        $order = 0;
        foreach ($elements as $element) {
            if ($insertAt !== null && $order === $insertAt) {
                $order++;
            }
            $element->update(['order' => $order]);
            $order++;
        }
    }
}


