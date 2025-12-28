<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Models\Mongodb\Concerns\HasMongoArrays;
use App\Models\Mongodb\Schema\CollectionSchema;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use MongoDB\Laravel\Eloquent\Model;

class Collection extends Model
{
    use HasFactory;
    use HasMongoArrays;

    protected $connection = 'mongodb';

    protected $collection = 'collections';

    /**
     * The attributes that should be stored as native MongoDB arrays.
     *
     * @var array<string>
     */
    protected array $mongoArrayAttributes = ['schema', 'settings'];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'schema',
        'settings',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // Note: 'schema' and 'settings' are handled by HasMongoArrays trait
        ];
    }

    /**
     * Get the collection schema as a CollectionSchema object.
     */
    public function getSchemaObject(): CollectionSchema
    {
        $schemaData = $this->schema ?? [];
        return CollectionSchema::fromArray($schemaData);
    }

    /**
     * Set the schema from a CollectionSchema object.
     */
    public function setSchemaObject(CollectionSchema $schema): void
    {
        $this->schema = $schema->toArray();
    }

    /**
     * Get the contents that belong to this collection.
     */
    public function contents(): HasMany
    {
        return $this->hasMany(Content::class, 'collection_id');
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Scope a query to find by slug.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeBySlug($query, string $slug): mixed
    {
        return $query->where('slug', $slug);
    }
}
