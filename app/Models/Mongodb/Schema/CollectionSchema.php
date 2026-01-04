<?php

declare(strict_types=1);

namespace App\Models\Mongodb\Schema;

/**
 * Represents the schema configuration for a Collection.
 *
 * This defines:
 * - Which element types are allowed
 * - Element-specific configurations (e.g., allowed formats for Text)
 * - Content-level metadata fields
 * - Element-level metadata fields per element type
 */
class CollectionSchema
{
    /**
     * Default element configurations.
     */
    public const DEFAULT_ELEMENT_CONFIGS = [
        'text' => [
            'enabled' => true,
            'formats' => ['plain', 'markdown', 'html'], // Allowed formats
        ],
        'media' => [
            'enabled' => true,
            'types' => ['image', 'video', 'audio', 'document'], // Allowed media types
            'max_size' => null, // Max file size in bytes (null = unlimited)
        ],
        'html' => [
            'enabled' => true,
        ],
        'json' => [
            'enabled' => true,
        ],
        'xml' => [
            'enabled' => true,
        ],
        'svg' => [
            'enabled' => true,
        ],
        'katex' => [
            'enabled' => true,
        ],
        'wrapper' => [
            'enabled' => true,
            // Wrapper always has 'purpose' - this is not configurable
        ],
        'reference' => [
            'enabled' => true,
            // Reference type selector and picker
        ],
    ];

    /**
     * Default list view settings.
     */
    public const DEFAULT_LIST_VIEW_SETTINGS = [
        'columns' => [
            ['id' => 'title', 'label' => 'Title', 'type' => 'base', 'visible' => true, 'toggleable' => false, 'sortable' => true],
            ['id' => 'status', 'label' => 'Status', 'type' => 'base', 'visible' => true, 'toggleable' => true, 'sortable' => true],
            ['id' => 'current_version', 'label' => 'Version', 'type' => 'base', 'visible' => true, 'toggleable' => true, 'sortable' => true],
            ['id' => 'updated_at', 'label' => 'Updated', 'type' => 'base', 'visible' => true, 'toggleable' => true, 'sortable' => true],
            ['id' => 'slug', 'label' => 'Slug', 'type' => 'base', 'visible' => false, 'toggleable' => true, 'sortable' => true],
            ['id' => 'created_at', 'label' => 'Created', 'type' => 'base', 'visible' => false, 'toggleable' => true, 'sortable' => true],
            ['id' => 'current_release', 'label' => 'Release', 'type' => 'base', 'visible' => false, 'toggleable' => true, 'sortable' => true],
            ['id' => 'editions', 'label' => 'Editions', 'type' => 'base', 'visible' => false, 'toggleable' => true, 'sortable' => false],
        ],
        'default_per_page' => 20,
        'per_page_options' => [10, 20, 50, 100],
        'default_sort_column' => 'updated_at',
        'default_sort_direction' => 'desc',
    ];

    /**
     * Create a new schema from array data.
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            allowedElements: $data['allowed_elements'] ?? array_keys(self::DEFAULT_ELEMENT_CONFIGS),
            elementConfigs: $data['element_configs'] ?? [],
            contentMetaFields: $data['content_meta_fields'] ?? [],
            elementMetaFields: $data['element_meta_fields'] ?? [],
            collectionMetaFields: $data['collection_meta_fields'] ?? [],
            allowedEditions: $data['allowed_editions'] ?? null,
            metaOnlyContent: $data['meta_only_content'] ?? false,
            listViewSettings: $data['list_view_settings'] ?? null,
        );
    }

    /**
     * Create a default schema with all elements enabled.
     */
    public static function default(): self
    {
        return new self(
            allowedElements: array_keys(self::DEFAULT_ELEMENT_CONFIGS),
            elementConfigs: self::DEFAULT_ELEMENT_CONFIGS,
            contentMetaFields: [],
            elementMetaFields: [],
            collectionMetaFields: [],
            allowedEditions: null,
            metaOnlyContent: false,
            listViewSettings: self::DEFAULT_LIST_VIEW_SETTINGS,
        );
    }

    public function __construct(
        /** @var array<string> List of allowed element type names */
        public array $allowedElements = [],
        /** @var array<string, array<string, mixed>> Configuration per element type */
        public array $elementConfigs = [],
        /** @var array<array{name: string, type: string, required: bool, options?: array}> Content-level metadata fields */
        public array $contentMetaFields = [],
        /** @var array<string, array<array{name: string, type: string, required: bool, options?: array}>> Element-level metadata fields per type */
        public array $elementMetaFields = [],
        /** @var array<array{name: string, type: string, required: bool, options?: array}> Collection-level metadata field definitions */
        public array $collectionMetaFields = [],
        /** @var array<string>|null List of allowed edition slugs (null = all editions) */
        public ?array $allowedEditions = null,
        /** @var bool When true, contents only display metadata fields without the block editor */
        public bool $metaOnlyContent = false,
        /** @var array<string, mixed>|null List view settings for content data table */
        public ?array $listViewSettings = null,
    ) {}

    /**
     * Check if an element type is allowed.
     */
    public function isElementAllowed(string $type): bool
    {
        return in_array($type, $this->allowedElements, true);
    }

    /**
     * Get configuration for an element type.
     *
     * @return array<string, mixed>
     */
    public function getElementConfig(string $type): array
    {
        $default = self::DEFAULT_ELEMENT_CONFIGS[$type] ?? [];
        $custom = $this->elementConfigs[$type] ?? [];

        return array_merge($default, $custom);
    }

    /**
     * Get allowed formats for text elements.
     *
     * @return array<string>
     */
    public function getTextFormats(): array
    {
        $config = $this->getElementConfig('text');

        return $config['formats'] ?? ['plain', 'markdown', 'html'];
    }

    /**
     * Get allowed media types.
     *
     * @return array<string>
     */
    public function getMediaTypes(): array
    {
        $config = $this->getElementConfig('media');

        return $config['types'] ?? ['image', 'video', 'audio', 'document'];
    }

    /**
     * Get content-level metadata fields.
     *
     * @return array<array{name: string, type: string, required: bool, options?: array}>
     */
    public function getContentMetaFields(): array
    {
        return $this->contentMetaFields;
    }

    /**
     * Get element-level metadata fields for a specific type.
     *
     * @return array<array{name: string, type: string, required: bool, options?: array}>
     */
    public function getElementMetaFields(string $type): array
    {
        return $this->elementMetaFields[$type] ?? [];
    }

    /**
     * Get collection-level metadata field definitions.
     *
     * @return array<array{name: string, type: string, required: bool, options?: array}>
     */
    public function getCollectionMetaFields(): array
    {
        return $this->collectionMetaFields;
    }

    /**
     * Convert to array for storage.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'allowed_elements' => $this->allowedElements,
            'element_configs' => $this->elementConfigs,
            'content_meta_fields' => $this->contentMetaFields,
            'element_meta_fields' => $this->elementMetaFields,
            'collection_meta_fields' => $this->collectionMetaFields,
            'allowed_editions' => $this->allowedEditions,
            'meta_only_content' => $this->metaOnlyContent,
            'list_view_settings' => $this->listViewSettings ?? self::DEFAULT_LIST_VIEW_SETTINGS,
        ];
    }

    /**
     * Get list view settings.
     *
     * @return array<string, mixed>
     */
    public function getListViewSettings(): array
    {
        return $this->listViewSettings ?? self::DEFAULT_LIST_VIEW_SETTINGS;
    }

    /**
     * Get allowed editions.
     *
     * @return array<string>|null
     */
    public function getAllowedEditions(): ?array
    {
        return $this->allowedEditions;
    }

    /**
     * Check if an edition is allowed.
     */
    public function isEditionAllowed(string $slug): bool
    {
        // If no editions are specified, all are allowed
        if ($this->allowedEditions === null) {
            return true;
        }

        return in_array($slug, $this->allowedEditions, true);
    }

    /**
     * Check if this collection uses meta-only content mode.
     *
     * When enabled, contents only display metadata fields without the block editor.
     */
    public function isMetaOnlyContent(): bool
    {
        return $this->metaOnlyContent;
    }
}
