<?php

declare(strict_types=1);

namespace App\Services;

use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\EncodedImageInterface;

class ThumbnailService
{
    /**
     * Available thumbnail sizes with their dimensions.
     * Sizes are 2x for HiDPI/Retina display support (150dpi+).
     *
     * - small: 80x80 (for 40px CSS display at 2x)
     * - medium: 300x300 (for ~150px CSS display at 2x)
     * - large: 800x800 (for ~400px CSS display at 2x)
     *
     * @var array<string, array{width: int, height: int}>
     */
    public const SIZES = [
        'small' => ['width' => 80, 'height' => 80],
        'medium' => ['width' => 300, 'height' => 300],
        'large' => ['width' => 800, 'height' => 800],
    ];

    protected ImageManager $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver);
    }

    /**
     * Check if a mime type is supported for thumbnail generation.
     */
    public function isSupported(string $mimeType): bool
    {
        return str_starts_with($mimeType, 'image/')
            && ! in_array($mimeType, ['image/svg+xml', 'image/x-icon']);
    }

    /**
     * Generate a thumbnail from image data.
     *
     * @param  string  $imageData  The raw image data
     * @param  string  $size  The size key (small, medium, large)
     */
    public function generate(string $imageData, string $size): ?EncodedImageInterface
    {
        if (! isset(self::SIZES[$size])) {
            return null;
        }

        $dimensions = self::SIZES[$size];

        try {
            $image = $this->manager->read($imageData);

            // Cover resize maintains aspect ratio and crops to fill
            $image->cover($dimensions['width'], $dimensions['height']);

            // Encode as WebP for better compression, fallback to JPEG
            return $image->toWebp(quality: 80);
        } catch (\Exception $e) {
            report($e);

            return null;
        }
    }

    /**
     * Generate all thumbnail sizes from image data.
     *
     * @param  string  $imageData  The raw image data
     * @return array<string, EncodedImageInterface>
     */
    public function generateAll(string $imageData): array
    {
        $thumbnails = [];

        foreach (array_keys(self::SIZES) as $size) {
            $thumbnail = $this->generate($imageData, $size);
            if ($thumbnail !== null) {
                $thumbnails[$size] = $thumbnail;
            }
        }

        return $thumbnails;
    }

    /**
     * Get available size names.
     *
     * @return array<string>
     */
    public function getAvailableSizes(): array
    {
        return array_keys(self::SIZES);
    }

    /**
     * Get dimensions for a specific size.
     *
     * @return array{width: int, height: int}|null
     */
    public function getDimensions(string $size): ?array
    {
        return self::SIZES[$size] ?? null;
    }
}
