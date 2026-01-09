<?php

declare(strict_types=1);

namespace App\Models\Mongodb\Concerns;

use App\Models\User;
use Carbon\Carbon;

/**
 * Trait for models that can be locked to prevent modifications.
 *
 * Adds lock fields and methods for checking/managing lock state.
 * Supports hierarchical locking where child models check parent lock state.
 *
 * @property bool $is_locked
 * @property int|null $locked_by
 * @property \Carbon\Carbon|null $locked_at
 * @property string|null $lock_reason
 */
trait Lockable
{
    /**
     * Initialize the lockable trait.
     * Called automatically by Eloquent.
     */
    public function initializeLockable(): void
    {
        // Add lock fields to fillable
        $this->fillable = array_merge($this->fillable, [
            'is_locked',
            'locked_by',
            'locked_at',
            'lock_reason',
        ]);
    }

    /**
     * Check if this model is directly locked (not considering parent hierarchy).
     */
    public function isDirectlyLocked(): bool
    {
        return (bool) ($this->is_locked ?? false);
    }

    /**
     * Check if this model is effectively locked (considering parent hierarchy).
     * Override in child classes to implement hierarchical checking.
     */
    public function isEffectivelyLocked(): bool
    {
        return $this->isDirectlyLocked();
    }

    /**
     * Alias for isEffectivelyLocked for convenience.
     */
    public function isLocked(): bool
    {
        return $this->isEffectivelyLocked();
    }

    /**
     * Check if this model can be modified (not locked).
     */
    public function canBeModified(): bool
    {
        return ! $this->isEffectivelyLocked();
    }

    /**
     * Lock this model.
     */
    public function lock(User $user, ?string $reason = null): void
    {
        $this->update([
            'is_locked' => true,
            'locked_by' => $user->id,
            'locked_at' => Carbon::now(),
            'lock_reason' => $reason,
        ]);
    }

    /**
     * Unlock this model.
     */
    public function unlock(): void
    {
        $this->update([
            'is_locked' => false,
            'locked_by' => null,
            'locked_at' => null,
            'lock_reason' => null,
        ]);
    }

    /**
     * Get the user who locked this model.
     */
    public function lockedByUser(): ?\Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by');
    }

    /**
     * Get lock information for this model.
     *
     * @return array{is_locked: bool, locked_by: int|null, locked_at: string|null, lock_reason: string|null, locked_by_name: string|null}|null
     */
    public function getLockInfo(): ?array
    {
        if (! $this->isDirectlyLocked()) {
            return null;
        }

        $lockedByUser = $this->locked_by ? User::find($this->locked_by) : null;

        return [
            'is_locked' => true,
            'locked_by' => $this->locked_by,
            'locked_at' => $this->locked_at?->toIso8601String(),
            'lock_reason' => $this->lock_reason,
            'locked_by_name' => $lockedByUser?->name,
        ];
    }

    /**
     * Get effective lock information (including parent hierarchy).
     * Override in child classes to check parent locks.
     *
     * @return array{is_locked: bool, locked_by: int|null, locked_at: string|null, lock_reason: string|null, locked_by_name: string|null, source: string}|null
     */
    public function getEffectiveLockInfo(): ?array
    {
        $lockInfo = $this->getLockInfo();

        if ($lockInfo) {
            return array_merge($lockInfo, ['source' => 'self']);
        }

        return null;
    }

    /**
     * Get the source of the effective lock.
     *
     * @return string|null 'self', 'collection', 'content', or null if not locked
     */
    public function getEffectiveLockSource(): ?string
    {
        $lockInfo = $this->getEffectiveLockInfo();

        return $lockInfo['source'] ?? null;
    }

    /**
     * Scope to filter only locked models.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeLocked($query)
    {
        return $query->where('is_locked', true);
    }

    /**
     * Scope to filter only unlocked models.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeUnlocked($query)
    {
        return $query->where(function ($q) {
            $q->where('is_locked', false)
                ->orWhereNull('is_locked');
        });
    }
}
