<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Element;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class LockService
{
    /**
     * Lock a collection.
     */
    public function lockCollection(Collection $collection, User $user, ?string $reason = null): void
    {
        $collection->lock($user, $reason);
    }

    /**
     * Unlock a collection.
     */
    public function unlockCollection(Collection $collection): void
    {
        $collection->unlock();
    }

    /**
     * Lock a content.
     */
    public function lockContent(Content $content, User $user, ?string $reason = null): void
    {
        $content->lock($user, $reason);
    }

    /**
     * Unlock a content.
     */
    public function unlockContent(Content $content): void
    {
        $content->unlock();
    }

    /**
     * Lock an element.
     */
    public function lockElement(Element $element, User $user, ?string $reason = null): void
    {
        $element->lock($user, $reason);
    }

    /**
     * Unlock an element.
     */
    public function unlockElement(Element $element): void
    {
        $element->unlock();
    }

    /**
     * Check if a model can be modified (not locked).
     */
    public function canModify(Model $model): bool
    {
        if (method_exists($model, 'canBeModified')) {
            return $model->canBeModified();
        }

        return true;
    }

    /**
     * Check if a collection can be modified.
     */
    public function canModifyCollection(Collection $collection): bool
    {
        return $collection->canBeModified();
    }

    /**
     * Check if a content can be modified.
     * This checks both the content's own lock and its parent collection's lock.
     */
    public function canModifyContent(Content $content): bool
    {
        return $content->canBeModified();
    }

    /**
     * Check if an element can be modified.
     * This checks the element's own lock, its parent content's lock, and the collection's lock.
     */
    public function canModifyElement(Element $element): bool
    {
        return $element->canBeModified();
    }

    /**
     * Get lock information for any lockable model.
     *
     * @return array{is_locked: bool, locked_by: int|null, locked_at: string|null, lock_reason: string|null, locked_by_name: string|null, source: string}|null
     */
    public function getLockInfo(Model $model): ?array
    {
        if (method_exists($model, 'getEffectiveLockInfo')) {
            return $model->getEffectiveLockInfo();
        }

        return null;
    }

    /**
     * Ensure a collection can be modified, throw exception if locked.
     *
     * @throws \App\Exceptions\ResourceLockedException
     */
    public function ensureCollectionCanBeModified(Collection $collection): void
    {
        if (! $this->canModifyCollection($collection)) {
            throw new \App\Exceptions\ResourceLockedException(
                'Collection is locked and cannot be modified.',
                $collection->getEffectiveLockInfo()
            );
        }
    }

    /**
     * Ensure a content can be modified, throw exception if locked.
     *
     * @throws \App\Exceptions\ResourceLockedException
     */
    public function ensureContentCanBeModified(Content $content): void
    {
        if (! $this->canModifyContent($content)) {
            $lockInfo = $content->getEffectiveLockInfo();
            $source = $lockInfo['source'] ?? 'self';
            $message = $source === 'collection'
                ? 'Content cannot be modified because its collection is locked.'
                : 'Content is locked and cannot be modified.';

            throw new \App\Exceptions\ResourceLockedException($message, $lockInfo);
        }
    }

    /**
     * Ensure an element can be modified, throw exception if locked.
     *
     * @throws \App\Exceptions\ResourceLockedException
     */
    public function ensureElementCanBeModified(Element $element): void
    {
        if (! $this->canModifyElement($element)) {
            $lockInfo = $element->getEffectiveLockInfo();
            $source = $lockInfo['source'] ?? 'self';

            $message = match ($source) {
                'collection' => 'Element cannot be modified because its collection is locked.',
                'content' => 'Element cannot be modified because its content is locked.',
                default => 'Element is locked and cannot be modified.',
            };

            throw new \App\Exceptions\ResourceLockedException($message, $lockInfo);
        }
    }
}
