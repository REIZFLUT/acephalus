<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\FilterOperator;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\FilterView;
use Illuminate\Contracts\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use MongoDB\Laravel\Eloquent\Builder;

/**
 * Service for building and applying content filters.
 *
 * Handles:
 * - Building MongoDB queries from filter conditions
 * - Validating raw MongoDB queries for security
 * - Applying filter views to content queries
 */
class ContentFilterService
{
    /**
     * Allowed MongoDB operators for raw queries (whitelist for security).
     *
     * @var array<string>
     */
    protected const ALLOWED_RAW_OPERATORS = [
        '$and',
        '$or',
        '$nor',
        '$not',
        '$eq',
        '$ne',
        '$gt',
        '$gte',
        '$lt',
        '$lte',
        '$in',
        '$nin',
        '$exists',
        '$type',
        '$regex',
        '$options',
        '$size',
        '$all',
        '$elemMatch',
    ];

    /**
     * Forbidden MongoDB operators for security.
     *
     * @var array<string>
     */
    protected const FORBIDDEN_OPERATORS = [
        '$where',
        '$function',
        '$accumulator',
        '$expr',
        '$jsonSchema',
        '$text',
        '$search',
        '$nearSphere',
        '$near',
        '$geoWithin',
        '$geoIntersects',
        '$meta',
    ];

    /**
     * Apply a filter view to a content query.
     *
     * @param  Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>  $query
     * @return Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>
     */
    public function applyFilterView(QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany $query, FilterView $filterView, ?Collection $collection = null): QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany
    {
        // Apply raw query if present (takes precedence)
        if ($filterView->hasRawQuery()) {
            return $this->applyRawQuery($query, $filterView->raw_query, $collection);
        }

        // Apply conditions
        if ($filterView->hasConditions()) {
            $query = $this->applyConditionGroup($query, $filterView->conditions);
        }

        // Apply sorting
        if ($filterView->hasSort()) {
            $query = $this->applySorting($query, $filterView->sort);
        }

        return $query;
    }

    /**
     * Apply filter conditions from request parameters.
     *
     * @param  Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>
     */
    public function applyFilters(QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany $query, array $filters, ?Collection $collection = null): QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany
    {
        foreach ($filters as $field => $value) {
            // Skip special parameters
            if (in_array($field, ['filter_view', 'search', 'sort', 'direction', 'page', 'per_page'])) {
                continue;
            }

            $query = $this->applySimpleFilter($query, $field, $value);
        }

        return $query;
    }

    /**
     * Apply a simple filter (single field equals value).
     *
     * @param  Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>  $query
     * @return Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>
     */
    public function applySimpleFilter(QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany $query, string $field, mixed $value): QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany
    {
        // Handle array values as "in" filter
        if (is_array($value)) {
            return $query->whereIn($field, $value);
        }

        return $query->where($field, $value);
    }

    /**
     * Apply a condition group (AND/OR).
     *
     * @param  Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>  $query
     * @param  array<string, mixed>  $group
     * @return Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>
     */
    public function applyConditionGroup(QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany $query, array $group): QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany
    {
        if (! isset($group['type']) || $group['type'] !== 'group') {
            return $query;
        }

        $operator = $group['operator'] ?? 'and';
        $children = $group['children'] ?? [];

        if (empty($children)) {
            return $query;
        }

        $method = $operator === 'or' ? 'orWhere' : 'where';

        return $query->$method(function ($q) use ($children, $operator) {
            foreach ($children as $child) {
                if (($child['type'] ?? '') === 'group') {
                    // Nested group
                    $nestedMethod = $operator === 'or' ? 'orWhere' : 'where';
                    $q->$nestedMethod(function ($nestedQuery) use ($child) {
                        $this->applyConditionGroup($nestedQuery, $child);
                    });
                } elseif (($child['type'] ?? '') === 'condition') {
                    // Single condition
                    $this->applyCondition($q, $child, $operator);
                }
            }
        });
    }

    /**
     * Fields that are known to be arrays.
     *
     * @var array<string>
     */
    protected const ARRAY_FIELDS = ['editions'];

    /**
     * Apply a single condition.
     *
     * @param  Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>  $query
     * @param  array<string, mixed>  $condition
     */
    protected function applyCondition(QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany $query, array $condition, string $groupOperator = 'and'): void
    {
        $field = $condition['field'] ?? null;
        $operatorValue = $condition['operator'] ?? 'equals';
        $value = $condition['value'] ?? null;

        if (! $field) {
            return;
        }

        $operator = FilterOperator::tryFrom($operatorValue);
        if (! $operator) {
            return;
        }

        $method = $groupOperator === 'or' ? 'orWhere' : 'where';
        $isArrayField = in_array($field, self::ARRAY_FIELDS, true);

        match ($operator) {
            FilterOperator::EQUALS => $query->$method($field, '=', $value),
            FilterOperator::NOT_EQUALS => $query->$method($field, '!=', $value),
            // For array fields, "contains" checks if the array contains the value
            // For text fields, "contains" does a substring match
            FilterOperator::CONTAINS => $isArrayField
                ? $query->$method($field, $value)  // MongoDB array contains
                : $query->$method($field, 'like', '%'.$value.'%'),
            FilterOperator::NOT_CONTAINS => $isArrayField
                ? $query->$method($field, '!=', $value)  // MongoDB array not contains
                : $query->$method($field, 'not like', '%'.$value.'%'),
            FilterOperator::STARTS_WITH => $query->$method($field, 'like', $value.'%'),
            FilterOperator::ENDS_WITH => $query->$method($field, 'like', '%'.$value),
            FilterOperator::IN => $query->{$method.'In'}($field, (array) $value),
            FilterOperator::NOT_IN => $query->{$method.'NotIn'}($field, (array) $value),
            FilterOperator::GREATER_THAN => $query->$method($field, '>', $value),
            FilterOperator::GREATER_THAN_OR_EQUAL => $query->$method($field, '>=', $value),
            FilterOperator::LESS_THAN => $query->$method($field, '<', $value),
            FilterOperator::LESS_THAN_OR_EQUAL => $query->$method($field, '<=', $value),
            FilterOperator::EXISTS => $query->{$method.'NotNull'}($field),
            FilterOperator::NOT_EXISTS => $query->{$method.'Null'}($field),
            FilterOperator::REGEX => $query->$method($field, 'regex', $value),
            FilterOperator::IS_EMPTY => $query->$method(function ($q) use ($field) {
                $q->whereNull($field)
                    ->orWhere($field, '=', '')
                    ->orWhere($field, '=', []);
            }),
            FilterOperator::IS_NOT_EMPTY => $query->$method(function ($q) use ($field) {
                $q->whereNotNull($field)
                    ->where($field, '!=', '')
                    ->where($field, '!=', []);
            }),
        };
    }

    /**
     * Apply sorting to a query.
     *
     * @param  Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>  $query
     * @param  array<array{field: string, direction: string}>  $sortRules
     * @return Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>
     */
    public function applySorting(QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany $query, array $sortRules): QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany
    {
        foreach ($sortRules as $rule) {
            $field = $rule['field'] ?? null;
            $direction = $rule['direction'] ?? 'asc';

            if ($field) {
                $query->orderBy($field, $direction === 'desc' ? 'desc' : 'asc');
            }
        }

        return $query;
    }

    /**
     * Apply a raw MongoDB query (for advanced users).
     *
     * @param  Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>  $query
     * @param  array<string, mixed>  $rawQuery
     * @return Builder<Content>|\MongoDB\Laravel\Relations\HasMany<Content>
     */
    public function applyRawQuery(QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany $query, array $rawQuery, ?Collection $collection = null): QueryBuilder|Builder|\MongoDB\Laravel\Relations\HasMany
    {
        // Validate the raw query for security
        $this->validateRawQuery($rawQuery);

        // If a collection is specified, ensure the query is scoped to it
        if ($collection) {
            $rawQuery['collection_id'] = (string) $collection->_id;
        }

        return $query->whereRaw($rawQuery);
    }

    /**
     * Validate a raw MongoDB query for security.
     *
     * @param  array<string, mixed>  $query
     *
     * @throws InvalidArgumentException If the query contains forbidden operators
     */
    public function validateRawQuery(array $query): void
    {
        $this->validateQueryRecursive($query);
    }

    /**
     * Recursively validate a query for forbidden operators.
     *
     * @param  array<string, mixed>|mixed  $data
     *
     * @throws InvalidArgumentException
     */
    protected function validateQueryRecursive(mixed $data, string $path = ''): void
    {
        if (! is_array($data)) {
            return;
        }

        foreach ($data as $key => $value) {
            $currentPath = $path ? "{$path}.{$key}" : (string) $key;

            // Check if key is a MongoDB operator
            if (is_string($key) && str_starts_with($key, '$')) {
                // Check forbidden operators
                if (in_array($key, self::FORBIDDEN_OPERATORS, true)) {
                    throw new InvalidArgumentException(
                        "Forbidden MongoDB operator '{$key}' found at path '{$currentPath}'. "
                        .'This operator is not allowed for security reasons.'
                    );
                }

                // Check if operator is in whitelist
                if (! in_array($key, self::ALLOWED_RAW_OPERATORS, true)) {
                    Log::warning('Unknown MongoDB operator in filter query', [
                        'operator' => $key,
                        'path' => $currentPath,
                    ]);
                }
            }

            // Recursively check nested values
            if (is_array($value)) {
                $this->validateQueryRecursive($value, $currentPath);
            }
        }
    }

    /**
     * Build a filter view from request data.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function buildFilterViewData(array $data): array
    {
        return [
            'name' => $data['name'] ?? 'Unnamed Filter',
            'slug' => $data['slug'] ?? null,
            'description' => $data['description'] ?? null,
            'collection_id' => $data['collection_id'] ?? null,
            'is_system' => $data['is_system'] ?? false,
            'conditions' => $this->normalizeConditions($data['conditions'] ?? []),
            'sort' => $this->normalizeSorting($data['sort'] ?? []),
            'raw_query' => $data['raw_query'] ?? null,
        ];
    }

    /**
     * Normalize conditions structure.
     *
     * @param  array<string, mixed>  $conditions
     * @return array<string, mixed>
     */
    protected function normalizeConditions(array $conditions): array
    {
        // Ensure root is a group
        if (empty($conditions) || ! isset($conditions['type'])) {
            return [
                'type' => 'group',
                'operator' => 'and',
                'children' => [],
            ];
        }

        if ($conditions['type'] !== 'group') {
            return [
                'type' => 'group',
                'operator' => 'and',
                'children' => [$conditions],
            ];
        }

        return $conditions;
    }

    /**
     * Normalize sorting structure.
     *
     * @param  array<mixed>  $sort
     * @return array<array{field: string, direction: string}>
     */
    protected function normalizeSorting(array $sort): array
    {
        $normalized = [];

        foreach ($sort as $rule) {
            if (is_array($rule) && isset($rule['field'])) {
                $normalized[] = [
                    'field' => $rule['field'],
                    'direction' => in_array($rule['direction'] ?? 'asc', ['asc', 'desc']) ? $rule['direction'] : 'asc',
                ];
            }
        }

        return $normalized;
    }

    /**
     * Get available filter fields for a collection.
     *
     * @return array<array{field: string, label: string, type: string, options?: array}>
     */
    public function getAvailableFields(Collection $collection): array
    {
        $fields = [];

        // Base content fields
        $fields[] = ['field' => 'title', 'label' => 'Title', 'type' => 'text'];
        $fields[] = ['field' => 'slug', 'label' => 'Slug', 'type' => 'text'];
        $fields[] = [
            'field' => 'status',
            'label' => 'Status',
            'type' => 'select',
            'options' => $this->getStatusOptions(),
        ];
        $fields[] = ['field' => 'created_at', 'label' => 'Created At', 'type' => 'datetime'];
        $fields[] = ['field' => 'updated_at', 'label' => 'Updated At', 'type' => 'datetime'];
        $fields[] = [
            'field' => 'editions',
            'label' => 'Editions',
            'type' => 'multi_select',
            'options' => $this->getEditionOptions($collection),
        ];

        // Metadata fields from collection schema
        $schema = $collection->getSchemaObject();
        $metaFields = $schema->getContentMetaFields();

        foreach ($metaFields as $metaField) {
            $fields[] = [
                'field' => 'metadata.'.$metaField['name'],
                'label' => $metaField['label'] ?? $metaField['name'],
                'type' => $metaField['type'],
                'options' => $metaField['options'] ?? null,
            ];
        }

        return $fields;
    }

    /**
     * Get status options for the status field.
     *
     * @return array<array{value: string, label: string}>
     */
    protected function getStatusOptions(): array
    {
        return [
            ['value' => 'draft', 'label' => 'Draft'],
            ['value' => 'published', 'label' => 'Published'],
            ['value' => 'archived', 'label' => 'Archived'],
        ];
    }

    /**
     * Get edition options for the editions field.
     *
     * @return array<array{value: string, label: string}>
     */
    protected function getEditionOptions(Collection $collection): array
    {
        // Get allowed editions from collection schema, or all editions if not specified
        $schema = $collection->schema ?? [];
        $allowedEditions = $schema['allowed_editions'] ?? null;

        $query = \App\Models\Mongodb\Edition::orderBy('is_system', 'desc')
            ->orderBy('name');

        if (is_array($allowedEditions) && count($allowedEditions) > 0) {
            $query->whereIn('slug', $allowedEditions);
        }

        return $query->get(['slug', 'name'])
            ->map(fn ($edition) => [
                'value' => $edition->slug,
                'label' => $edition->name,
            ])
            ->toArray();
    }

    /**
     * Get available operators for a field type.
     *
     * @return array<array{value: string, label: string}>
     */
    public function getOperatorsForType(string $type): array
    {
        $operators = match ($type) {
            'text', 'textarea', 'email', 'url' => FilterOperator::forText(),
            'number' => FilterOperator::forNumber(),
            'boolean' => FilterOperator::forBoolean(),
            'date', 'datetime', 'time' => FilterOperator::forDate(),
            'select', 'multi_select' => FilterOperator::forSelect(),
            default => FilterOperator::forText(),
        };

        return array_map(fn (FilterOperator $op) => [
            'value' => $op->value,
            'label' => $op->label(),
        ], $operators);
    }
}
