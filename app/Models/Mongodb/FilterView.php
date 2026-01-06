<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Models\Mongodb\Concerns\HasMongoArrays;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

/**
 * Represents a saved filter view for content filtering.
 *
 * Filter views are always collection-specific.
 * They support complex filter conditions with AND/OR groups.
 */
class FilterView extends Model
{
    use HasFactory;
    use HasMongoArrays;

    protected $connection = 'mongodb';

    protected $collection = 'filter_views';

    /**
     * The attributes that should be stored as native MongoDB arrays.
     *
     * @var array<string>
     */
    protected array $mongoArrayAttributes = ['conditions', 'sort', 'raw_query'];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'collection_id',
        'is_system',
        'conditions',
        'sort',
        'raw_query',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        // Prevent deletion of system filter views
        static::deleting(function (FilterView $filterView) {
            if ($filterView->is_system) {
                return false;
            }
        });
    }

    /**
     * Get the collection this filter view belongs to.
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class, 'collection_id');
    }

    /**
     * Check if this filter view belongs to a specific collection.
     */
    public function belongsToCollection(string $collectionId): bool
    {
        return (string) $this->collection_id === $collectionId;
    }

    /**
     * Check if this filter view can be deleted.
     */
    public function canBeDeleted(): bool
    {
        return ! $this->is_system;
    }

    /**
     * Check if this filter view has a raw MongoDB query.
     */
    public function hasRawQuery(): bool
    {
        return ! empty($this->raw_query);
    }

    /**
     * Check if this filter view has any conditions.
     */
    public function hasConditions(): bool
    {
        return ! empty($this->conditions);
    }

    /**
     * Check if this filter view has custom sorting.
     */
    public function hasSort(): bool
    {
        return ! empty($this->sort);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return '_id';
    }

    /**
     * Scope to get filter views for a specific collection.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeForCollection($query, string $collectionId): mixed
    {
        return $query->where('collection_id', $collectionId);
    }

    /**
     * Scope to get filter views available for a collection (collection-specific only).
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeAvailableFor($query, string $collectionId): mixed
    {
        return $query->where('collection_id', $collectionId);
    }

    /**
     * Scope to get only non-system filter views.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeCustom($query): mixed
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope to get system filter views.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeSystem($query): mixed
    {
        return $query->where('is_system', true);
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

        // Ensure collection_id is a string if set
        if (isset($array['collection_id'])) {
            $array['collection_id'] = (string) $array['collection_id'];
        }

        return $array;
    }
}
