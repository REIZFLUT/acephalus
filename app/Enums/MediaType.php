<?php

declare(strict_types=1);

namespace App\Enums;

enum MediaType: string
{
    case IMAGE = 'image';
    case VIDEO = 'video';
    case AUDIO = 'audio';
    case DOCUMENT = 'document';

    /**
     * Get a human-readable label for this media type.
     */
    public function label(): string
    {
        return match ($this) {
            self::IMAGE => 'Image',
            self::VIDEO => 'Video',
            self::AUDIO => 'Audio',
            self::DOCUMENT => 'Document',
        };
    }

    /**
     * Get the allowed MIME types for this media type.
     *
     * @return array<string>
     */
    public function allowedMimeTypes(): array
    {
        return match ($this) {
            self::IMAGE => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
            self::VIDEO => ['video/mp4', 'video/webm', 'video/ogg'],
            self::AUDIO => ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
            self::DOCUMENT => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        };
    }

    /**
     * Determine the media type from a MIME type.
     */
    public static function fromMimeType(string $mimeType): ?self
    {
        foreach (self::cases() as $type) {
            if (in_array($mimeType, $type->allowedMimeTypes(), true)) {
                return $type;
            }
        }

        return null;
    }
}


