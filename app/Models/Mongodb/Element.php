<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use App\Enums\ElementType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class Element extends Model
{
    use HasFactory;

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
}


