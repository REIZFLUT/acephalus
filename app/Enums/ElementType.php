<?php

declare(strict_types=1);

namespace App\Enums;

enum ElementType: string
{
    case TEXT = 'text';
    case MEDIA = 'media';
    case SVG = 'svg';
    case KATEX = 'katex';
    case HTML = 'html';
    case JSON = 'json';
    case XML = 'xml';
    case WRAPPER = 'wrapper';

    /**
     * Get the required data fields for this element type.
     *
     * @return array<string, string>
     */
    public function requiredFields(): array
    {
        return match ($this) {
            self::TEXT => ['content' => 'string'],
            self::MEDIA => ['file_id' => 'string', 'media_type' => 'string'],
            self::SVG => ['content' => 'string'],
            self::KATEX => ['formula' => 'string'],
            self::HTML => ['content' => 'string'],
            self::JSON => ['data' => 'array'],
            self::XML => ['content' => 'string'],
            self::WRAPPER => ['children' => 'array'],
        };
    }

    /**
     * Get optional data fields for this element type.
     *
     * @return array<string, string>
     */
    public function optionalFields(): array
    {
        return match ($this) {
            self::TEXT => ['format' => 'string'], // plain, markdown, html
            self::MEDIA => ['alt' => 'string', 'caption' => 'string'],
            self::SVG => ['viewBox' => 'string', 'title' => 'string'],
            self::KATEX => ['display_mode' => 'boolean'],
            self::HTML => [],
            self::JSON => [],
            self::XML => ['schema' => 'string'],
            self::WRAPPER => ['layout' => 'string', 'style' => 'array'],
        };
    }

    /**
     * Check if this element type can contain children.
     */
    public function canHaveChildren(): bool
    {
        return $this === self::WRAPPER;
    }

    /**
     * Get a human-readable label for this element type.
     */
    public function label(): string
    {
        return match ($this) {
            self::TEXT => 'Text',
            self::MEDIA => 'Media (Image, Video, Audio)',
            self::SVG => 'SVG Illustration',
            self::KATEX => 'KaTeX Formula',
            self::HTML => 'Custom HTML',
            self::JSON => 'Custom JSON Data',
            self::XML => 'Custom XML Data',
            self::WRAPPER => 'Wrapper Container',
        };
    }
}


