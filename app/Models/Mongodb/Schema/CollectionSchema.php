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
        ];
    }
}

