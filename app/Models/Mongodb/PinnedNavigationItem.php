<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

/**
 * Represents a pinned navigation item in the sidebar.
 *
 * Pinned navigation items are displayed above the main navigation groups
 * and link to specific collections, optionally with a filter view applied.
 */
class PinnedNavigationItem extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'pinned_navigation_items';

    protected $fillable = [
        'name',
        'collection_id',
        'filter_view_id',
        'icon',
        'order',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        // Set default order to the next available position
        static::creating(function (PinnedNavigationItem $item) {
            if ($item->order === null) {
                $maxOrder = static::max('order') ?? 0;
                $item->order = $maxOrder + 1;
            }

            // Default to active if not specified
            if ($item->is_active === null) {
                $item->is_active = true;
            }
        });
    }

    /**
     * Get the collection this item links to.
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class, 'collection_id');
    }

    /**
     * Get the filter view this item uses (optional).
     */
    public function filterView(): BelongsTo
    {
        return $this->belongsTo(FilterView::class, 'filter_view_id');
    }

    /**
     * Check if this item has a filter view configured.
     */
    public function hasFilterView(): bool
    {
        return ! empty($this->filter_view_id);
    }

    /**
     * Get the URL for this navigation item.
     */
    public function getUrl(): string
    {
        $collection = $this->collection;

        if (! $collection) {
            return '#';
        }

        $url = "/collections/{$collection->slug}/contents";

        if ($this->hasFilterView()) {
            $url .= "?filter_view={$this->filter_view_id}";
        }

        return $url;
    }

    /**
     * Scope to get only active items.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeActive($query): mixed
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by position.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeOrdered($query): mixed
    {
        return $query->orderBy('order', 'asc');
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

        // Ensure filter_view_id is a string if set
        if (isset($array['filter_view_id'])) {
            $array['filter_view_id'] = (string) $array['filter_view_id'];
        }

        return $array;
    }
}
