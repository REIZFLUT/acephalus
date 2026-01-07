<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use MongoDB\Laravel\Eloquent\Model;

class MediaFolder extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'media_folders';

    /**
     * Folder types.
     */
    public const TYPE_ROOT_COLLECTIONS = 'root_collections';

    public const TYPE_ROOT_GLOBAL = 'root_global';

    public const TYPE_COLLECTION = 'collection';

    public const TYPE_CONTENT = 'content';

    public const TYPE_CUSTOM = 'custom';

    protected $fillable = [
        'name',
        'slug',
        'parent_id',
        'path',
        'type',
        'is_system',
        'collection_id',
        'content_id',
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

        // Prevent deletion of system folders
        static::deleting(function (MediaFolder $folder) {
            if ($folder->is_system) {
                return false;
            }

            // Prevent deletion of collection folders if collection still exists
            if ($folder->type === self::TYPE_COLLECTION && $folder->collection_id) {
                $collection = Collection::find($folder->collection_id);
                if ($collection) {
                    return false;
                }
            }
        });

        // Auto-generate path on creation
        static::creating(function (MediaFolder $folder) {
            if (! $folder->path) {
                $folder->path = $folder->generatePath();
            }
        });
    }

    /**
     * Generate the full path for this folder.
     */
    public function generatePath(): string
    {
        if (! $this->parent_id) {
            return $this->slug;
        }

        $parent = static::find($this->parent_id);
        if ($parent) {
            return $parent->path.'/'.$this->slug;
        }

        return $this->slug;
    }

    /**
     * Get the parent folder.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'parent_id');
    }

    /**
     * Get the child folders.
     */
    public function children(): HasMany
    {
        return $this->hasMany(MediaFolder::class, 'parent_id');
    }

    /**
     * Get the media files in this folder.
     */
    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'folder_id');
    }

    /**
     * Get the associated collection (for collection folders).
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class, 'collection_id');
    }

    /**
     * Get the associated content (for content folders).
     */
    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class, 'content_id');
    }

    /**
     * Check if this folder can be deleted.
     */
    public function canBeDeleted(): bool
    {
        if ($this->is_system) {
            return false;
        }

        // Collection folders can't be deleted while collection exists
        if ($this->type === self::TYPE_COLLECTION && $this->collection_id) {
            return ! Collection::where('_id', $this->collection_id)->exists();
        }

        return true;
    }

    /**
     * Check if user can create subfolders in this folder.
     */
    public function canCreateSubfolders(): bool
    {
        // Allow custom subfolders in:
        // 1. Global root and its children (custom folders)
        // 2. Content folders (for organizing content-specific media)
        // 3. Custom folders anywhere
        return in_array($this->type, [
            self::TYPE_ROOT_GLOBAL,
            self::TYPE_CUSTOM,
            self::TYPE_CONTENT,
        ], true);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return '_id';
    }

    /**
     * Scope to get root folders.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeRoots($query): mixed
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope to get folders by type.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeOfType($query, string $type): mixed
    {
        return $query->where('type', $type);
    }

    /**
     * Get all descendants of this folder.
     *
     * @return \Illuminate\Support\Collection<int, MediaFolder>
     */
    public function getDescendants(): \Illuminate\Support\Collection
    {
        $descendants = collect();
        $children = $this->children;

        foreach ($children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getDescendants());
        }

        return $descendants;
    }

    /**
     * Get the breadcrumb path for this folder.
     *
     * @return array<array{id: string, name: string, slug: string}>
     */
    public function getBreadcrumbs(): array
    {
        $breadcrumbs = [];
        $current = $this;

        while ($current) {
            array_unshift($breadcrumbs, [
                'id' => (string) $current->_id,
                'name' => $current->name,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }

        return $breadcrumbs;
    }
}
