<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Edition extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'editions';

    /**
     * The default edition that cannot be deleted.
     */
    public const DEFAULT_EDITION = 'all';

    protected $fillable = [
        'slug',
        'name',
        'description',
        'icon',
        'is_system',
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

        // Prevent deletion of system editions
        static::deleting(function (Edition $edition) {
            if ($edition->is_system) {
                return false;
            }
        });
    }

    /**
     * Check if this edition is the default one.
     */
    public function isDefault(): bool
    {
        return $this->slug === self::DEFAULT_EDITION;
    }

    /**
     * Check if this edition can be deleted.
     */
    public function canBeDeleted(): bool
    {
        return ! $this->is_system;
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Scope to get only non-system editions.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeCustom($query): mixed
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope to get system editions.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeSystem($query): mixed
    {
        return $query->where('is_system', true);
    }
}
