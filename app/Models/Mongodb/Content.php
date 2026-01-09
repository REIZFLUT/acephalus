<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Enums\ContentStatus;
use App\Models\Mongodb\Concerns\HasMongoArrays;
use App\Models\Mongodb\Concerns\Lockable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use MongoDB\Laravel\Eloquent\Model;

class Content extends Model
{
    use HasFactory;
    use HasMongoArrays;
    use Lockable;

    protected $connection = 'mongodb';

    protected $collection = 'contents';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = '_id';

    /**
     * The attributes that should be stored as native MongoDB arrays.
     *
     * @var array<string>
     */
    protected array $mongoArrayAttributes = ['elements', 'metadata', 'editions'];

    protected $fillable = [
        'collection_id',
        'title',
        'slug',
        'status',
        'current_version',
        'published_version_id',
        'elements',
        'metadata',
        'editions',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ContentStatus::class,
            'current_version' => 'integer',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
            // Note: 'elements' and 'metadata' are handled by HasMongoArrays trait
            // to preserve native MongoDB array/object storage
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Content $content) {
            if ($content->current_version === null) {
                $content->current_version = 1;
            }
            if ($content->status === null) {
                $content->status = ContentStatus::DRAFT;
            }
        });
    }

    /**
     * Get the collection that owns this content.
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class, 'collection_id');
    }

    /**
     * Get all versions of this content.
     */
    public function versions(): HasMany
    {
        return $this->hasMany(ContentVersion::class, 'content_id');
    }

    /**
     * Get the published version.
     */
    public function publishedVersion(): BelongsTo
    {
        return $this->belongsTo(ContentVersion::class, 'published_version_id');
    }

    /**
     * Check if the content is published.
     */
    public function isPublished(): bool
    {
        return $this->status === ContentStatus::PUBLISHED;
    }

    /**
     * Check if the content is a draft.
     */
    public function isDraft(): bool
    {
        return $this->status === ContentStatus::DRAFT;
    }

    /**
     * Scope a query to only include published content.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopePublished($query): mixed
    {
        return $query->where('status', ContentStatus::PUBLISHED->value);
    }

    /**
     * Scope a query to only include drafts.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeDraft($query): mixed
    {
        return $query->where('status', ContentStatus::DRAFT->value);
    }

    /**
     * Check if this content is visible for a given edition.
     * Empty editions array means "all editions" (always visible).
     */
    public function isVisibleForEdition(?string $edition): bool
    {
        // No edition filter = always visible
        if ($edition === null) {
            return true;
        }

        // No editions set on content = all editions (visible)
        $contentEditions = $this->editions ?? [];
        if (empty($contentEditions)) {
            return true;
        }

        // Check if the edition is in the content's editions
        return in_array($edition, $contentEditions, true);
    }

    /**
     * Scope a query to filter by edition.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeForEdition($query, ?string $edition): mixed
    {
        if ($edition === null) {
            return $query;
        }

        // Include content where editions is empty/null (all editions) or contains the specified edition
        return $query->where(function ($q) use ($edition) {
            $q->whereNull('editions')
                ->orWhere('editions', [])
                ->orWhere('editions', $edition);
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return '_id';
    }

    /**
     * Convert the model to an array.
     * Ensures _id is included as a string for JSON serialization.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        // Ensure _id is a string
        if (isset($this->_id)) {
            $array['_id'] = (string) $this->_id;
        }

        return $array;
    }

    /**
     * Get the parent collection model (ensuring we get the model, not the ID).
     */
    public function getParentCollection(): ?Collection
    {
        // If collection is already loaded as a model, use it
        if ($this->relationLoaded('collection')) {
            return $this->getRelation('collection');
        }

        // Otherwise, load the collection by ID
        if ($this->collection_id) {
            return Collection::find($this->collection_id);
        }

        return null;
    }

    /**
     * Check if this content is effectively locked.
     * Content is effectively locked if:
     * - The content itself is locked, OR
     * - The parent collection is locked
     */
    public function isEffectivelyLocked(): bool
    {
        // Check own lock first
        if ($this->isDirectlyLocked()) {
            return true;
        }

        // Check parent collection lock
        $collection = $this->getParentCollection();
        if ($collection && $collection->isDirectlyLocked()) {
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

        // Check parent collection lock
        $collection = $this->getParentCollection();
        if ($collection) {
            $collectionLockInfo = $collection->getLockInfo();
            if ($collectionLockInfo) {
                return array_merge($collectionLockInfo, ['source' => 'collection']);
            }
        }

        return null;
    }
}
