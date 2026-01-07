<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ElementType;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Schema\CollectionSchema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SchemaService
{
    /**
     * Validate content against a collection's schema.
     *
     * @throws ValidationException
     */
    public function validateContent(Collection $collection, Content $content): bool
    {
        $schema = $collection->getSchemaObject();
        $errors = [];

        // Validate required content metadata fields
        foreach ($schema->getContentMetaFields() as $field) {
            if ($field['required'] && empty($content->metadata[$field['name']] ?? null)) {
                $errors["metadata.{$field['name']}"] = ["The {$field['label']} field is required."];
            }
        }

        // Validate elements recursively
        $this->validateElements($content->elements ?? [], $schema, $errors);

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        return true;
    }

    /**
     * Validate elements against the schema.
     *
     * @param  array<int, array<string, mixed>>  $elements
     * @param  array<string, array<string>>  $errors
     */
    protected function validateElements(array $elements, CollectionSchema $schema, array &$errors, string $prefix = ''): void
    {
        foreach ($elements as $index => $element) {
            $elementPath = $prefix ? "{$prefix}.{$index}" : "elements.{$index}";
            $type = $element['type'] ?? null;

            if (! $type) {
                $errors[$elementPath][] = 'Element type is required.';

                continue;
            }

            // Check if element type is allowed
            if (! $schema->isElementAllowed($type)) {
                $errors[$elementPath][] = "Element type '{$type}' is not allowed in this collection.";

                continue;
            }

            // Validate element-specific configuration
            $this->validateElementConfig($element, $type, $schema, $errors, $elementPath);

            // Validate required element metadata fields
            foreach ($schema->getElementMetaFields($type) as $field) {
                if ($field['required'] && empty($element['data']['meta'][$field['name']] ?? null)) {
                    $errors["{$elementPath}.meta.{$field['name']}"][] = "The {$field['label']} field is required.";
                }
            }

            // Recursively validate wrapper children
            if ($type === 'wrapper' && isset($element['children'])) {
                $this->validateElements($element['children'], $schema, $errors, "{$elementPath}.children");
            }
        }
    }

    /**
     * Validate element-specific configuration based on schema.
     *
     * @param  array<string, mixed>  $element
     * @param  array<string, array<string>>  $errors
     */
    protected function validateElementConfig(
        array $element,
        string $type,
        CollectionSchema $schema,
        array &$errors,
        string $elementPath
    ): void {
        $config = $schema->getElementConfig($type);
        $data = $element['data'] ?? [];

        match ($type) {
            'text' => $this->validateTextElement($data, $config, $errors, $elementPath),
            'media' => $this->validateMediaElement($data, $config, $errors, $elementPath),
            default => null,
        };
    }

    /**
     * Validate text element against allowed formats.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $config
     * @param  array<string, array<string>>  $errors
     */
    protected function validateTextElement(array $data, array $config, array &$errors, string $path): void
    {
        $format = $data['format'] ?? 'plain';
        $allowedFormats = $config['formats'] ?? ['plain', 'markdown', 'html'];

        if (! in_array($format, $allowedFormats, true)) {
            $errors["{$path}.format"][] = "Text format '{$format}' is not allowed. Allowed: ".implode(', ', $allowedFormats);
        }
    }

    /**
     * Validate media element against allowed types.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $config
     * @param  array<string, array<string>>  $errors
     */
    protected function validateMediaElement(array $data, array $config, array &$errors, string $path): void
    {
        $mediaType = $data['media_type'] ?? null;
        $allowedTypes = $config['types'] ?? ['image', 'video', 'audio', 'document'];

        if ($mediaType && ! in_array($mediaType, $allowedTypes, true)) {
            $errors["{$path}.media_type"][] = "Media type '{$mediaType}' is not allowed. Allowed: ".implode(', ', $allowedTypes);
        }
    }

    /**
     * Validate an element's data against its type requirements.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function validateElement(ElementType $type, array $data): bool
    {
        $rules = $this->getValidationRulesForType($type);

        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return true;
    }

    /**
     * Get the validation rules for an element type.
     *
     * @return array<string, string|array<mixed>>
     */
    public function getValidationRulesForType(ElementType $type): array
    {
        return match ($type) {
            ElementType::TEXT => [
                'content' => 'required|string',
                'format' => 'nullable|string|in:plain,markdown,html',
            ],
            ElementType::MEDIA => [
                'file_id' => 'nullable|string',
                'media_type' => 'required|string|in:image,video,audio,document,canvas',
                'alt' => 'nullable|string|max:255',
                'caption' => 'nullable|string',
            ],
            ElementType::SVG => [
                'content' => 'required|string',
                'viewBox' => 'nullable|string',
                'title' => 'nullable|string|max:255',
            ],
            ElementType::KATEX => [
                'formula' => 'required|string',
                'display_mode' => 'nullable|boolean',
            ],
            ElementType::HTML => [
                'content' => 'required|string',
            ],
            ElementType::JSON => [
                'data' => 'required|array',
            ],
            ElementType::XML => [
                'content' => 'required|string',
                'schema' => 'nullable|string',
            ],
            ElementType::WRAPPER => [
                'purpose' => 'required|string',
                'custom_type' => 'nullable|string',
                'css_class' => 'nullable|string',
            ],
        };
    }

    /**
     * Create a default schema for a collection.
     *
     * @return array<string, mixed>
     */
    public function createDefaultSchema(): array
    {
        return CollectionSchema::default()->toArray();
    }

    /**
     * Update a collection's schema.
     *
     * @param  array<string, mixed>  $schema
     */
    public function updateSchema(Collection $collection, array $schema): Collection
    {
        $validatedSchema = $this->validateSchema($schema);

        $collection->update(['schema' => $validatedSchema]);

        return $collection->fresh();
    }

    /**
     * Validate a schema definition.
     *
     * @param  array<string, mixed>  $schema
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    protected function validateSchema(array $schema): array
    {
        $rules = [
            'allowed_elements' => 'required|array',
            'allowed_elements.*' => 'string|in:'.implode(',', array_map(
                fn (ElementType $type) => $type->value,
                ElementType::cases()
            )),
            'element_configs' => 'nullable|array',
            'element_configs.text' => 'nullable|array',
            'element_configs.text.enabled' => 'nullable|boolean',
            'element_configs.text.formats' => 'nullable|array',
            'element_configs.text.formats.*' => 'string|in:plain,markdown,html',
            'element_configs.media' => 'nullable|array',
            'element_configs.media.enabled' => 'nullable|boolean',
            'element_configs.media.types' => 'nullable|array',
            'element_configs.media.types.*' => 'string|in:image,video,audio,document,canvas',
            'element_configs.media.max_size' => 'nullable|integer|min:0',
            'content_meta_fields' => 'nullable|array',
            'content_meta_fields.*.name' => 'required|string|max:50',
            'content_meta_fields.*.label' => 'required|string|max:100',
            'content_meta_fields.*.type' => 'required|string|in:text,textarea,number,boolean,date,datetime,select,multi_select,url,email,color,json,media',
            'content_meta_fields.*.required' => 'boolean',
            'content_meta_fields.*.options' => 'nullable|array',
            'content_meta_fields.*.options.*.value' => 'required|string',
            'content_meta_fields.*.options.*.label' => 'required|string',
            'content_meta_fields.*.editor_type' => 'nullable|string|in:textarea,tinymce,codemirror',
            'content_meta_fields.*.target_format' => 'nullable|string|in:plain,html,css,javascript,markdown,json,xml',
            'content_meta_fields.*.input_style' => 'nullable|string|in:dropdown,combobox,tags,radio,checkbox,toggle_group',
            'content_meta_fields.*.allow_custom' => 'nullable|boolean',
            'content_meta_fields.*.placeholder' => 'nullable|string|max:255',
            'content_meta_fields.*.description' => 'nullable|string|max:500',
            'content_meta_fields.*.explanation' => 'nullable|string|max:1000',
            'content_meta_fields.*.default_value' => 'nullable',
            'collection_meta_fields' => 'nullable|array',
            'collection_meta_fields.*.name' => 'required|string|max:50',
            'collection_meta_fields.*.label' => 'required|string|max:100',
            'collection_meta_fields.*.type' => 'required|string|in:text,textarea,number,boolean,date,datetime,select,multi_select,url,email,color,json,media',
            'collection_meta_fields.*.required' => 'boolean',
            'collection_meta_fields.*.options' => 'nullable|array',
            'collection_meta_fields.*.options.*.value' => 'required|string',
            'collection_meta_fields.*.options.*.label' => 'required|string',
            'collection_meta_fields.*.editor_type' => 'nullable|string|in:textarea,tinymce,codemirror',
            'collection_meta_fields.*.target_format' => 'nullable|string|in:plain,html,css,javascript,markdown,json,xml',
            'collection_meta_fields.*.input_style' => 'nullable|string|in:dropdown,combobox,tags,radio,checkbox,toggle_group',
            'collection_meta_fields.*.allow_custom' => 'nullable|boolean',
            'collection_meta_fields.*.placeholder' => 'nullable|string|max:255',
            'collection_meta_fields.*.description' => 'nullable|string|max:500',
            'collection_meta_fields.*.explanation' => 'nullable|string|max:1000',
            'collection_meta_fields.*.default_value' => 'nullable',
            'element_meta_fields' => 'nullable|array',
            'element_meta_fields.*' => 'nullable|array',
            'element_meta_fields.*.*.name' => 'required|string|max:50',
            'element_meta_fields.*.*.label' => 'required|string|max:100',
            'element_meta_fields.*.*.type' => 'required|string|in:text,textarea,number,boolean,date,datetime,select,multi_select,url,email,color,json,media',
            'element_meta_fields.*.*.required' => 'boolean',
            'element_meta_fields.*.*.options' => 'nullable|array',
            'element_meta_fields.*.*.options.*.value' => 'required|string',
            'element_meta_fields.*.*.options.*.label' => 'required|string',
            'element_meta_fields.*.*.editor_type' => 'nullable|string|in:textarea,tinymce,codemirror',
            'element_meta_fields.*.*.target_format' => 'nullable|string|in:plain,html,css,javascript,markdown,json,xml',
            'element_meta_fields.*.*.input_style' => 'nullable|string|in:dropdown,combobox,tags,radio,checkbox,toggle_group',
            'element_meta_fields.*.*.allow_custom' => 'nullable|boolean',
            'element_meta_fields.*.*.placeholder' => 'nullable|string|max:255',
            'element_meta_fields.*.*.description' => 'nullable|string|max:500',
            'element_meta_fields.*.*.explanation' => 'nullable|string|max:1000',
            'element_meta_fields.*.*.default_value' => 'nullable',
        ];

        $validator = Validator::make($schema, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    /**
     * Get schema for frontend use.
     *
     * @return array<string, mixed>
     */
    public function getSchemaForFrontend(Collection $collection): array
    {
        $schema = $collection->getSchemaObject();

        return [
            'allowed_elements' => $schema->allowedElements,
            'element_configs' => [
                'text' => $schema->getElementConfig('text'),
                'media' => $schema->getElementConfig('media'),
            ],
            'content_meta_fields' => $schema->getContentMetaFields(),
            'element_meta_fields' => $schema->elementMetaFields,
            'collection_meta_fields' => $schema->getCollectionMetaFields(),
        ];
    }
}
