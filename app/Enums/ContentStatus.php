<?php

declare(strict_types=1);

namespace App\Enums;

enum ContentStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';

    /**
     * Get a human-readable label for this status.
     */
    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::PUBLISHED => 'Published',
            self::ARCHIVED => 'Archived',
        };
    }

    /**
     * Check if the content is publicly visible.
     */
    public function isPublic(): bool
    {
        return $this === self::PUBLISHED;
    }
}


