<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Enums\ContentStatus;
use App\Models\Mongodb\Concerns\HasMongoArrays;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use MongoDB\Laravel\Eloquent\Model;

class Content extends Model
{
    use HasFactory;
    use HasMongoArrays;

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
    protected array $mongoArrayAttributes = ['elements', 'metadata'];

    protected $fillable = [
        'collection_id',
        'title',
        'slug',
        'status',
        'current_version',
        'published_version_id',
        'elements',
        'metadata',
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
}
