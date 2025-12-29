<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Models\Mongodb\Concerns\HasMongoArrays;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class ContentVersion extends Model
{
    use HasFactory;
    use HasMongoArrays;

    protected $connection = 'mongodb';

    protected $collection = 'content_versions';

    /**
     * The attributes that should be stored as native MongoDB arrays.
     *
     * @var array<string>
     */
    protected array $mongoArrayAttributes = ['elements', 'snapshot'];

    protected $fillable = [
        'content_id',
        'version_number',
        'elements',
        'created_by',
        'change_note',
        'snapshot',
        'edition',
        'is_edition_end',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'version_number' => 'integer',
            'is_edition_end' => 'boolean',
            // Note: 'elements' and 'snapshot' are handled by HasMongoArrays trait
        ];
    }

    /**
     * Get the content that owns this version.
     */
    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class, 'content_id');
    }

    /**
     * Get the user who created this version.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope a query to order by version number descending.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeLatestVersion($query): mixed
    {
        return $query->orderByDesc('version_number');
    }

    /**
     * Scope a query to find a specific version.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeVersion($query, int $versionNumber): mixed
    {
        return $query->where('version_number', $versionNumber);
    }

    /**
     * Scope a query to find edition end versions (protected from deletion).
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeEditionEnds($query): mixed
    {
        return $query->where('is_edition_end', true);
    }

    /**
     * Scope a query to find versions by edition.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeByEdition($query, string $edition): mixed
    {
        return $query->where('edition', $edition);
    }
}
