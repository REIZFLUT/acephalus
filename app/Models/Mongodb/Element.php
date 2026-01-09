<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Enums\ElementType;
use App\Models\Mongodb\Concerns\Lockable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class Element extends Model
{
    use HasFactory;
    use Lockable;

    protected $connection = 'mongodb';

    protected $collection = 'elements';

    protected $fillable = [
        'content_id',
        'parent_id',
        'type',
        'data',
        'order',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => ElementType::class,
            'data' => 'array',
            'order' => 'integer',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Element $element) {
            if ($element->order === null) {
                $element->order = 0;
            }
        });
    }

    /**
     * Get the content that owns this element.
     */
    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class, 'content_id');
    }

    /**
     * Get the parent element (for nested elements in wrappers).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Get the child elements (for wrapper elements).
     *
     * @return \MongoDB\Laravel\Relations\HasMany
     */
    public function children()
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('order');
    }

    /**
     * Check if this element is a wrapper.
     */
    public function isWrapper(): bool
    {
        return $this->type === ElementType::WRAPPER;
    }

    /**
     * Check if this element can have children.
     */
    public function canHaveChildren(): bool
    {
        return $this->type->canHaveChildren();
    }

    /**
     * Scope a query to get root elements (no parent).
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeRoot($query): mixed
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope a query to order by position.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeOrdered($query): mixed
    {
        return $query->orderBy('order');
    }

    /**
     * Scope a query to filter by type.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeOfType($query, ElementType $type): mixed
    {
        return $query->where('type', $type->value);
    }

    /**
     * Get the parent content model (ensuring we get the model, not the ID).
     */
    protected function getParentContent(): ?Content
    {
        // If content is already loaded as a model, use it
        if ($this->relationLoaded('content')) {
            return $this->getRelation('content');
        }

        // Otherwise, load the content by ID
        if ($this->content_id) {
            return Content::find($this->content_id);
        }

        return null;
    }

    /**
     * Check if this element is effectively locked.
     * Element is effectively locked if:
     * - The element itself is locked, OR
     * - The parent content is locked, OR
     * - The grandparent collection is locked
     */
    public function isEffectivelyLocked(): bool
    {
        // Check own lock first
        if ($this->isDirectlyLocked()) {
            return true;
        }

        // Check parent content lock (this includes collection check via Content's isEffectivelyLocked)
        $content = $this->getParentContent();
        if ($content && $content->isEffectivelyLocked()) {
            return true;
        }

        return false;
    }

    /**
     * Get effective lock information including parent hierarchy.
     *
     * @return array{is_locked: bool, locked_by: int|null, locked_at: string|null, lock_reason: string|null, locked_by_name: string|null, source: string}|null
     */
    public function getEffectiveLockInfo(): ?array
    {
        // Check own lock first
        $ownLockInfo = $this->getLockInfo();
        if ($ownLockInfo) {
            return array_merge($ownLockInfo, ['source' => 'self']);
        }

        // Check parent content lock
        $content = $this->getParentContent();
        if ($content) {
            $contentLockInfo = $content->getLockInfo();
            if ($contentLockInfo) {
                return array_merge($contentLockInfo, ['source' => 'content']);
            }

            // Check grandparent collection lock
            $collection = $content->getParentCollection();
            if ($collection) {
                $collectionLockInfo = $collection->getLockInfo();
                if ($collectionLockInfo) {
                    return array_merge($collectionLockInfo, ['source' => 'collection']);
                }
            }
        }

        return null;
    }
}
