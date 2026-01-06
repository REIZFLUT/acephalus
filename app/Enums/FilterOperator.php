<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Available filter operators for content filtering.
 */
enum FilterOperator: string
{
    case EQUALS = 'equals';
    case NOT_EQUALS = 'not_equals';
    case CONTAINS = 'contains';
    case NOT_CONTAINS = 'not_contains';
    case STARTS_WITH = 'starts_with';
    case ENDS_WITH = 'ends_with';
    case IN = 'in';
    case NOT_IN = 'not_in';
    case GREATER_THAN = 'gt';
    case GREATER_THAN_OR_EQUAL = 'gte';
    case LESS_THAN = 'lt';
    case LESS_THAN_OR_EQUAL = 'lte';
    case EXISTS = 'exists';
    case NOT_EXISTS = 'not_exists';
    case REGEX = 'regex';
    case IS_EMPTY = 'is_empty';
    case IS_NOT_EMPTY = 'is_not_empty';

    /**
     * Get human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::EQUALS => 'Equals',
            self::NOT_EQUALS => 'Not equals',
            self::CONTAINS => 'Contains',
            self::NOT_CONTAINS => 'Does not contain',
            self::STARTS_WITH => 'Starts with',
            self::ENDS_WITH => 'Ends with',
            self::IN => 'Is one of',
            self::NOT_IN => 'Is not one of',
            self::GREATER_THAN => 'Greater than',
            self::GREATER_THAN_OR_EQUAL => 'Greater than or equal',
            self::LESS_THAN => 'Less than',
            self::LESS_THAN_OR_EQUAL => 'Less than or equal',
            self::EXISTS => 'Exists',
            self::NOT_EXISTS => 'Does not exist',
            self::REGEX => 'Matches regex',
            self::IS_EMPTY => 'Is empty',
            self::IS_NOT_EMPTY => 'Is not empty',
        };
    }

    /**
     * Check if operator requires a value.
     */
    public function requiresValue(): bool
    {
        return match ($this) {
            self::EXISTS, self::NOT_EXISTS, self::IS_EMPTY, self::IS_NOT_EMPTY => false,
            default => true,
        };
    }

    /**
     * Check if operator requires an array value.
     */
    public function requiresArrayValue(): bool
    {
        return match ($this) {
            self::IN, self::NOT_IN => true,
            default => false,
        };
    }

    /**
     * Get the MongoDB operator for this filter operator.
     */
    public function toMongoOperator(): string
    {
        return match ($this) {
            self::EQUALS => '$eq',
            self::NOT_EQUALS => '$ne',
            self::CONTAINS, self::STARTS_WITH, self::ENDS_WITH, self::REGEX => '$regex',
            self::NOT_CONTAINS => '$not',
            self::IN => '$in',
            self::NOT_IN => '$nin',
            self::GREATER_THAN => '$gt',
            self::GREATER_THAN_OR_EQUAL => '$gte',
            self::LESS_THAN => '$lt',
            self::LESS_THAN_OR_EQUAL => '$lte',
            self::EXISTS, self::NOT_EXISTS => '$exists',
            self::IS_EMPTY, self::IS_NOT_EMPTY => '$eq',
        };
    }

    /**
     * Get operators suitable for text fields.
     *
     * @return array<self>
     */
    public static function forText(): array
    {
        return [
            self::EQUALS,
            self::NOT_EQUALS,
            self::CONTAINS,
            self::NOT_CONTAINS,
            self::STARTS_WITH,
            self::ENDS_WITH,
            self::IN,
            self::NOT_IN,
            self::REGEX,
            self::IS_EMPTY,
            self::IS_NOT_EMPTY,
            self::EXISTS,
            self::NOT_EXISTS,
        ];
    }

    /**
     * Get operators suitable for numeric fields.
     *
     * @return array<self>
     */
    public static function forNumber(): array
    {
        return [
            self::EQUALS,
            self::NOT_EQUALS,
            self::GREATER_THAN,
            self::GREATER_THAN_OR_EQUAL,
            self::LESS_THAN,
            self::LESS_THAN_OR_EQUAL,
            self::IN,
            self::NOT_IN,
            self::EXISTS,
            self::NOT_EXISTS,
        ];
    }

    /**
     * Get operators suitable for boolean fields.
     *
     * @return array<self>
     */
    public static function forBoolean(): array
    {
        return [
            self::EQUALS,
            self::NOT_EQUALS,
            self::EXISTS,
            self::NOT_EXISTS,
        ];
    }

    /**
     * Get operators suitable for date fields.
     *
     * @return array<self>
     */
    public static function forDate(): array
    {
        return [
            self::EQUALS,
            self::NOT_EQUALS,
            self::GREATER_THAN,
            self::GREATER_THAN_OR_EQUAL,
            self::LESS_THAN,
            self::LESS_THAN_OR_EQUAL,
            self::EXISTS,
            self::NOT_EXISTS,
        ];
    }

    /**
     * Get operators suitable for select/multi-select fields.
     *
     * @return array<self>
     */
    public static function forSelect(): array
    {
        return [
            self::EQUALS,
            self::NOT_EQUALS,
            self::IN,
            self::NOT_IN,
            self::IS_EMPTY,
            self::IS_NOT_EMPTY,
            self::EXISTS,
            self::NOT_EXISTS,
        ];
    }
}
