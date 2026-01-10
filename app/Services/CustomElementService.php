<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Mongodb\CustomElement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class CustomElementService
{
    private const CACHE_KEY = 'custom_elements_definitions';

    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Get all custom element definitions.
     *
     * @return Collection<string, array<string, mixed>>
     */
    public function all(): Collection
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return $this->loadFromDatabase();
        });
    }

    /**
     * Get a specific custom element definition by type.
     *
     * @return array<string, mixed>|null
     */
    public function get(string $type): ?array
    {
        return $this->all()->get($type);
    }

    /**
     * Check if a custom element type exists.
     */
    public function exists(string $type): bool
    {
        return $this->all()->has($type);
    }

    /**
     * Check if a type is a custom element (starts with 'custom_').
     */
    public function isCustomType(string $type): bool
    {
        return str_starts_with($type, 'custom_');
    }

    /**
     * Get all custom element types.
     *
     * @return array<int, string>
     */
    public function types(): array
    {
        return $this->all()->keys()->all();
    }

    /**
     * Get custom elements grouped by category.
     *
     * @return Collection<string, Collection<string, array<string, mixed>>>
     */
    public function byCategory(): Collection
    {
        return $this->all()->groupBy('category');
    }

    /**
     * Get field definitions for a custom element type.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getFields(string $type): array
    {
        $element = $this->get($type);

        return $element['fields'] ?? [];
    }

    /**
     * Get default data for a custom element type.
     *
     * @return array<string, mixed>
     */
    public function getDefaultData(string $type): array
    {
        $element = $this->get($type);

        if (! $element) {
            return [];
        }

        // Start with explicit defaultData if defined
        $defaults = $element['defaultData'] ?? [];

        // Fill in defaults from field definitions
        foreach ($element['fields'] ?? [] as $field) {
            $fieldName = $field['name'] ?? null;
            if ($fieldName && ! isset($defaults[$fieldName]) && isset($field['defaultValue'])) {
                $defaults[$fieldName] = $field['defaultValue'];
            }
        }

        return $defaults;
    }

    /**
     * Validate data against a custom element's field definitions.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, array<string>>
     */
    public function validate(string $type, array $data): array
    {
        $element = $this->get($type);
        $errors = [];

        if (! $element) {
            return ['_element' => ['Custom element type not found: '.$type]];
        }

        foreach ($element['fields'] ?? [] as $field) {
            $fieldName = $field['name'] ?? null;
            if (! $fieldName) {
                continue;
            }

            $value = $data[$fieldName] ?? null;
            $fieldErrors = $this->validateField($field, $value, $data);

            if (! empty($fieldErrors)) {
                $errors[$fieldName] = $fieldErrors;
            }
        }

        return $errors;
    }

    /**
     * Clear the cached custom elements.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Refresh the cache by reloading from database.
     *
     * @return Collection<string, array<string, mixed>>
     */
    public function refresh(): Collection
    {
        $this->clearCache();

        return $this->all();
    }

    /**
     * Get the path to the legacy custom elements directory.
     */
    public function getLegacyPath(): string
    {
        return resource_path('custom-elements');
    }

    /**
     * Load all custom element definitions from MongoDB.
     *
     * @return Collection<string, array<string, mixed>>
     */
    private function loadFromDatabase(): Collection
    {
        $elements = collect();

        $customElements = CustomElement::orderBy('category')
            ->orderBy('order')
            ->get();

        foreach ($customElements as $element) {
            $elements->put($element->type, $element->toLegacyFormat());
        }

        return $elements;
    }

    /**
     * Load all custom element definitions from legacy JSON files.
     * Used for migration purposes.
     *
     * @return Collection<string, array<string, mixed>>
     */
    public function loadFromFiles(): Collection
    {
        $path = $this->getLegacyPath();

        if (! File::isDirectory($path)) {
            return collect();
        }

        $elements = collect();
        $files = File::glob($path.'/*.json');

        foreach ($files as $file) {
            // Skip schema file
            if (str_contains($file, '_schema.json')) {
                continue;
            }

            try {
                $content = File::get($file);
                $definition = json_decode($content, true, 512, JSON_THROW_ON_ERROR);

                if (isset($definition['type'])) {
                    // Validate type format
                    if (! preg_match('/^custom_[a-z][a-z0-9_]*$/', $definition['type'])) {
                        logger()->warning("Invalid custom element type: {$definition['type']} in {$file}");

                        continue;
                    }

                    // Add file info for debugging
                    $definition['_file'] = basename($file);
                    $definition['_lastModified'] = File::lastModified($file);

                    $elements->put($definition['type'], $definition);
                }
            } catch (\JsonException $e) {
                logger()->error("Failed to parse custom element file: {$file}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $elements;
    }

    /**
     * Validate a single field value.
     *
     * @param  array<string, mixed>  $field
     * @param  array<string, mixed>  $allData
     * @return array<string>
     */
    private function validateField(array $field, mixed $value, array $allData): array
    {
        $errors = [];
        $label = $field['label'] ?? $field['name'];

        // Handle translatable labels
        if (is_array($label)) {
            $label = $label['en'] ?? $label['de'] ?? $field['name'];
        }

        // Check conditional visibility
        if (isset($field['conditional']) && ! $this->evaluateCondition($field['conditional'], $allData)) {
            return []; // Skip validation for hidden fields
        }

        // Required validation
        if (($field['required'] ?? false) && $this->isEmpty($value)) {
            $errors[] = "{$label} ist erforderlich.";

            return $errors; // Don't continue validation if required and empty
        }

        // Skip further validation if empty and not required
        if ($this->isEmpty($value)) {
            return [];
        }

        $validation = $field['validation'] ?? [];

        // String validations
        if (is_string($value)) {
            if (isset($validation['minLength']) && strlen($value) < $validation['minLength']) {
                $errors[] = "{$label} muss mindestens {$validation['minLength']} Zeichen lang sein.";
            }

            if (isset($validation['maxLength']) && strlen($value) > $validation['maxLength']) {
                $errors[] = "{$label} darf maximal {$validation['maxLength']} Zeichen lang sein.";
            }

            if (isset($validation['pattern']) && ! preg_match('/'.$validation['pattern'].'/', $value)) {
                $message = $validation['patternMessage'] ?? "{$label} hat ein ungültiges Format.";
                $errors[] = $message;
            }
        }

        // Number validations
        if (is_numeric($value)) {
            $numValue = (float) $value;

            if (isset($validation['min']) && $numValue < $validation['min']) {
                $errors[] = "{$label} muss mindestens {$validation['min']} sein.";
            }

            if (isset($validation['max']) && $numValue > $validation['max']) {
                $errors[] = "{$label} darf maximal {$validation['max']} sein.";
            }
        }

        // Array validations (for multi-select, tags, etc.)
        if (is_array($value)) {
            if (isset($validation['minItems']) && count($value) < $validation['minItems']) {
                $errors[] = "{$label} muss mindestens {$validation['minItems']} Einträge haben.";
            }

            if (isset($validation['maxItems']) && count($value) > $validation['maxItems']) {
                $errors[] = "{$label} darf maximal {$validation['maxItems']} Einträge haben.";
            }
        }

        // URL validation
        if ($field['inputType'] === 'url' && ! filter_var($value, FILTER_VALIDATE_URL)) {
            $errors[] = "{$label} muss eine gültige URL sein.";
        }

        // Email validation
        if ($field['inputType'] === 'email' && ! filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "{$label} muss eine gültige E-Mail-Adresse sein.";
        }

        return $errors;
    }

    /**
     * Check if a value is considered empty.
     */
    private function isEmpty(mixed $value): bool
    {
        if ($value === null) {
            return true;
        }

        if (is_string($value) && trim($value) === '') {
            return true;
        }

        if (is_array($value) && count($value) === 0) {
            return true;
        }

        return false;
    }

    /**
     * Evaluate a conditional visibility rule.
     *
     * @param  array<string, mixed>  $condition
     * @param  array<string, mixed>  $data
     */
    private function evaluateCondition(array $condition, array $data): bool
    {
        $fieldName = $condition['field'] ?? null;
        if (! $fieldName || ! isset($data[$fieldName])) {
            return true; // Show field if condition field doesn't exist
        }

        $fieldValue = $data[$fieldName];
        $operator = $condition['operator'] ?? 'equals';
        $targetValue = $condition['value'] ?? null;

        return match ($operator) {
            'equals' => $fieldValue === $targetValue,
            'notEquals' => $fieldValue !== $targetValue,
            'contains' => is_string($fieldValue) && str_contains($fieldValue, (string) $targetValue),
            'notContains' => is_string($fieldValue) && ! str_contains($fieldValue, (string) $targetValue),
            'isEmpty' => $this->isEmpty($fieldValue),
            'isNotEmpty' => ! $this->isEmpty($fieldValue),
            'greaterThan' => is_numeric($fieldValue) && $fieldValue > $targetValue,
            'lessThan' => is_numeric($fieldValue) && $fieldValue < $targetValue,
            default => true,
        };
    }
}
