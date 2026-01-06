<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class MediaMetaField extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'media_meta_fields';

    /**
     * System field slugs.
     */
    public const SYSTEM_FIELDS = ['alt', 'caption'];

    /**
     * Available field types.
     * These should match MetaFieldType enum for consistency.
     */
    public const FIELD_TYPES = [
        'text',
        'textarea',
        'number',
        'boolean',
        'date',
        'datetime',
        'time',
        'select',
        'multi_select',
        'url',
        'email',
        'color',
        'json',
    ];

    protected $fillable = [
        'slug',
        'name',
        'description',
        'field_type',
        'options',
        'is_system',
        'required',
        'placeholder',
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
            'is_system' => 'boolean',
            'required' => 'boolean',
            'options' => 'array',
            'order' => 'integer',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        // Prevent deletion of system fields
        static::deleting(function (MediaMetaField $field) {
            if ($field->is_system) {
                return false;
            }
        });

        // Set default order on creation
        static::creating(function (MediaMetaField $field) {
            if ($field->order === null) {
                $maxOrder = static::max('order') ?? 0;
                $field->order = $maxOrder + 1;
            }
        });
    }

    /**
     * Check if this field is a system field.
     */
    public function isSystemField(): bool
    {
        return in_array($this->slug, self::SYSTEM_FIELDS, true) || $this->is_system;
    }

    /**
     * Check if this field can be deleted.
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
     * Scope to get only non-system fields.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeCustom($query): mixed
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope to get system fields.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeSystem($query): mixed
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to order by the order field.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeOrdered($query): mixed
    {
        return $query->orderBy('order');
    }

    /**
     * Get options formatted for frontend select/multi-select.
     *
     * @return array<array{value: string, label: string}>
     */
    public function getFormattedOptions(): array
    {
        if (! is_array($this->options)) {
            return [];
        }

        return array_map(function ($option) {
            if (is_array($option) && isset($option['value'], $option['label'])) {
                return $option;
            }

            // Handle simple string arrays
            return [
                'value' => $option,
                'label' => $option,
            ];
        }, $this->options);
    }

    /**
     * Convert to frontend-compatible format.
     *
     * @return array<string, mixed>
     */
    public function toMetaFieldDefinition(): array
    {
        return [
            'name' => $this->slug,
            'label' => $this->name,
            'type' => $this->field_type,
            'required' => $this->required ?? false,
            'placeholder' => $this->placeholder,
            'help_text' => $this->description,
            'options' => $this->getFormattedOptions(),
        ];
    }
}
