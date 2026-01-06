<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Enums\MediaType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class Media extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'media';

    protected $fillable = [
        'filename',
        'original_filename',
        'mime_type',
        'media_type',
        'size',
        'gridfs_id',
        'thumbnails',
        'alt',
        'caption',
        'tags',
        'metadata',
        'uploaded_by',
        'folder_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'media_type' => MediaType::class,
            'size' => 'integer',
            // Note: Don't cast tags/metadata to 'array' for MongoDB
            // MongoDB natively stores arrays and objects as BSON types
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Media $media) {
            if ($media->media_type === null && $media->mime_type !== null) {
                $media->media_type = MediaType::fromMimeType($media->mime_type);
            }
        });
    }

    /**
     * Get the user who uploaded this media.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the folder this media belongs to.
     */
    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    /**
     * Scope a query to filter by media type.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeOfType($query, MediaType $type): mixed
    {
        return $query->where('media_type', $type->value);
    }

    /**
     * Scope a query to filter images.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeImages($query): mixed
    {
        return $query->where('media_type', MediaType::IMAGE->value);
    }

    /**
     * Scope a query to filter videos.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeVideos($query): mixed
    {
        return $query->where('media_type', MediaType::VIDEO->value);
    }

    /**
     * Scope a query to filter by folder.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeInFolder($query, ?string $folderId): mixed
    {
        if ($folderId === null) {
            return $query->whereNull('folder_id');
        }

        return $query->where('folder_id', $folderId);
    }

    /**
     * Get the file size in a human-readable format.
     */
    public function getHumanReadableSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return '_id';
    }

    /**
     * Check if thumbnails have been generated for this media.
     */
    public function hasThumbnails(): bool
    {
        return ! empty($this->thumbnails);
    }

    /**
     * Check if a specific thumbnail size exists.
     */
    public function hasThumbnail(string $size): bool
    {
        $thumbnails = $this->thumbnails;
        if ($thumbnails instanceof \MongoDB\Model\BSONDocument || $thumbnails instanceof \MongoDB\Model\BSONArray) {
            $thumbnails = $thumbnails->getArrayCopy();
        }

        return is_array($thumbnails) && isset($thumbnails[$size]);
    }

    /**
     * Get the GridFS ID for a specific thumbnail size.
     */
    public function getThumbnailGridFsId(string $size): ?string
    {
        $thumbnails = $this->thumbnails;
        if ($thumbnails instanceof \MongoDB\Model\BSONDocument || $thumbnails instanceof \MongoDB\Model\BSONArray) {
            $thumbnails = $thumbnails->getArrayCopy();
        }

        return is_array($thumbnails) ? ($thumbnails[$size] ?? null) : null;
    }
}
