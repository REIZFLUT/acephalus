<?php

declare(strict_types=1);

namespace App\Models\Mongodb\Schema;

/**
 * Enum defining the available metadata field types.
 */
enum MetaFieldType: string
{
    case TEXT = 'text';
    case TEXTAREA = 'textarea';
    case NUMBER = 'number';
    case BOOLEAN = 'boolean';
    case DATE = 'date';
    case DATETIME = 'datetime';
    case SELECT = 'select';
    case MULTI_SELECT = 'multi_select';
    case URL = 'url';
    case EMAIL = 'email';
    case COLOR = 'color';
    case JSON = 'json';

    /**
     * Get human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::TEXT => 'Text',
            self::TEXTAREA => 'Long Text',
            self::NUMBER => 'Number',
            self::BOOLEAN => 'Boolean',
            self::DATE => 'Date',
            self::DATETIME => 'Date & Time',
            self::SELECT => 'Select',
            self::MULTI_SELECT => 'Multi-Select',
            self::URL => 'URL',
            self::EMAIL => 'Email',
            self::COLOR => 'Color',
            self::JSON => 'JSON',
        };
    }

    /**
     * Check if this type requires options (for select types).
     */
    public function requiresOptions(): bool
    {
        return match ($this) {
            self::SELECT, self::MULTI_SELECT => true,
            default => false,
        };
    }

    /**
     * Get the default value for this type.
     */
    public function defaultValue(): mixed
    {
        return match ($this) {
            self::TEXT, self::TEXTAREA, self::URL, self::EMAIL, self::COLOR => '',
            self::NUMBER => 0,
            self::BOOLEAN => false,
            self::DATE, self::DATETIME => null,
            self::SELECT => null,
            self::MULTI_SELECT => [],
            self::JSON => [],
        };
    }
}

