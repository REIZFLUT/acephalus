<?php

declare(strict_types=1);

namespace App\Models\Mongodb;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class CustomElement extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'custom_elements';

    /**
     * Available categories for custom elements.
     */
    public const CATEGORIES = [
        'content',
        'data',
        'layout',
        'interactive',
        'media',
    ];

    /**
     * Available input types for fields.
     */
    public const INPUT_TYPES = [
        'text',
        'textarea',
        'number',
        'email',
        'url',
        'tel',
        'password',
        'color',
        'date',
        'datetime',
        'time',
        'checkbox',
        'switch',
        'toggle',
        'radio',
        'select',
        'combobox',
        'multi_select',
        'tags',
        'slider',
        'range',
        'editor',
        'code',
        'markdown',
        'json',
        'media',
        'reference',
        'hidden',
    ];

    /**
     * Available grid sizes for fields.
     */
    public const GRID_SIZES = [
        'full',
        'half',
        'third',
        'quarter',
    ];

    protected $fillable = [
        'type',
        'label',
        'description',
        'icon',
        'category',
        'can_have_children',
        'fields',
        'default_data',
        'preview_template',
        'css_class',
        'is_system',
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
            'can_have_children' => 'boolean',
            'is_system' => 'boolean',
            'fields' => 'array',
            'default_data' => 'array',
            'order' => 'integer',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        // Prevent deletion of system elements
        static::deleting(function (CustomElement $element) {
            if ($element->is_system) {
                return false;
            }
        });

        // Set default order on creation
        static::creating(function (CustomElement $element) {
            if ($element->order === null) {
                $maxOrder = static::max('order') ?? -1;
                $element->order = $maxOrder + 1;
            }
        });
    }

    /**
     * Check if this element can be deleted.
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
        return 'type';
    }

    /**
     * Scope to get only non-system elements.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeCustom($query): mixed
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope to get system elements.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeSystem($query): mixed
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to get elements by category.
     *
     * @param  \MongoDB\Laravel\Eloquent\Builder  $query
     */
    public function scopeByCategory($query, string $category): mixed
    {
        return $query->where('category', $category);
    }

    /**
     * Get default data for this element, merging explicit defaults with field defaults.
     *
     * @return array<string, mixed>
     */
    public function getComputedDefaultData(): array
    {
        $defaults = $this->default_data ?? [];

        foreach ($this->fields ?? [] as $field) {
            $fieldName = $field['name'] ?? null;
            if ($fieldName && ! isset($defaults[$fieldName]) && isset($field['defaultValue'])) {
                $defaults[$fieldName] = $field['defaultValue'];
            }
        }

        return $defaults;
    }

    /**
     * Validate the type format.
     */
    public static function isValidType(string $type): bool
    {
        return (bool) preg_match('/^custom_[a-z][a-z0-9_]*$/', $type);
    }

    /**
     * Generate a type from a label.
     */
    public static function generateType(string $label): string
    {
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', $label));
        $slug = trim($slug, '_');

        return 'custom_' . $slug;
    }

    /**
     * Convert the model to the legacy array format for API compatibility.
     *
     * @return array<string, mixed>
     */
    public function toLegacyFormat(): array
    {
        return [
            'type' => $this->type,
            'label' => $this->label,
            'description' => $this->description,
            'icon' => $this->icon,
            'category' => $this->category,
            'canHaveChildren' => $this->can_have_children,
            'fields' => $this->fields ?? [],
            'defaultData' => $this->default_data ?? [],
            'previewTemplate' => $this->preview_template,
            'cssClass' => $this->css_class,
        ];
    }

    /**
     * Create a model from legacy JSON format.
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromLegacyFormat(array $data, bool $isSystem = false): self
    {
        return new self([
            'type' => $data['type'],
            'label' => $data['label'] ?? null,
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'category' => $data['category'] ?? 'content',
            'can_have_children' => $data['canHaveChildren'] ?? false,
            'fields' => $data['fields'] ?? [],
            'default_data' => $data['defaultData'] ?? [],
            'preview_template' => $data['previewTemplate'] ?? null,
            'css_class' => $data['cssClass'] ?? null,
            'is_system' => $isSystem,
        ]);
    }
}
