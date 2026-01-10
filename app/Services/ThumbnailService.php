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

    /**
     * Mime types that are supported for PDF thumbnail generation.
     */
    public const PDF_MIME_TYPES = [
        'application/pdf',
    ];

    protected ImageManager $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver);
    }

    /**
     * Check if a mime type is supported for thumbnail generation (images).
     */
    public function isSupported(string $mimeType): bool
    {
        return str_starts_with($mimeType, 'image/')
            && ! in_array($mimeType, ['image/svg+xml', 'image/x-icon']);
    }

    /**
     * Check if a mime type is a PDF that can have thumbnails generated.
     */
    public function isPdfSupported(string $mimeType): bool
    {
        return in_array($mimeType, self::PDF_MIME_TYPES) && extension_loaded('imagick');
    }

    /**
     * Check if thumbnail generation is supported (images or PDFs).
     */
    public function isThumbnailSupported(string $mimeType): bool
    {
        return $this->isSupported($mimeType) || $this->isPdfSupported($mimeType);
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

    /**
     * Generate a thumbnail from PDF data (first page).
     *
     * @param  string  $pdfData  The raw PDF data
     * @param  string  $size  The size key (small, medium, large)
     */
    public function generateFromPdf(string $pdfData, string $size): ?EncodedImageInterface
    {
        if (! isset(self::SIZES[$size])) {
            return null;
        }

        // Extract first page using Ghostscript (or Imagick fallback)
        $imageData = $this->extractFirstPageWithGhostscript($pdfData);

        if ($imageData === null && extension_loaded('imagick')) {
            $imageData = $this->extractFirstPageWithImagick($pdfData);
        }

        if ($imageData === null) {
            return null;
        }

        return $this->generate($imageData, $size);
    }

    /**
     * Generate all thumbnail sizes from PDF data (first page).
     *
     * @param  string  $pdfData  The raw PDF data
     * @return array<string, EncodedImageInterface>
     */
    public function generateAllFromPdf(string $pdfData): array
    {
        // Try Ghostscript first (more efficient for large PDFs)
        $imageData = $this->extractFirstPageWithGhostscript($pdfData);

        // Fallback to Imagick if Ghostscript fails
        if ($imageData === null && extension_loaded('imagick')) {
            $imageData = $this->extractFirstPageWithImagick($pdfData);
        }

        if ($imageData === null) {
            return [];
        }

        // Generate all sizes - use "contain" mode for PDFs to preserve aspect ratio
        return $this->generateAllContain($imageData);
    }

    /**
     * Generate all thumbnail sizes using "contain" mode (preserves aspect ratio, no cropping).
     *
     * @param  string  $imageData  The raw image data
     * @return array<string, EncodedImageInterface>
     */
    public function generateAllContain(string $imageData): array
    {
        $thumbnails = [];

        foreach (self::SIZES as $size => $dimensions) {
            $thumbnail = $this->generateContain($imageData, $size);
            if ($thumbnail !== null) {
                $thumbnails[$size] = $thumbnail;
            }
        }

        return $thumbnails;
    }

    /**
     * Generate a thumbnail using "contain" mode (preserves aspect ratio).
     *
     * @param  string  $imageData  The raw image data
     * @param  string  $size  The size key (small, medium, large)
     */
    public function generateContain(string $imageData, string $size): ?EncodedImageInterface
    {
        if (! isset(self::SIZES[$size])) {
            return null;
        }

        $dimensions = self::SIZES[$size];

        try {
            $image = $this->manager->read($imageData);

            // Scale down to fit within dimensions while preserving aspect ratio
            $image->scaleDown($dimensions['width'], $dimensions['height']);

            return $image->toWebp(quality: 80);
        } catch (\Exception $e) {
            report($e);

            return null;
        }
    }

    /**
     * Extract first page of PDF as PNG using Ghostscript (memory efficient).
     */
    protected function extractFirstPageWithGhostscript(string $pdfData): ?string
    {
        $gsPath = trim(shell_exec('which gs') ?? '');
        if (empty($gsPath)) {
            return null;
        }

        $tempDir = sys_get_temp_dir();
        $pdfFile = tempnam($tempDir, 'pdf_');
        $pngFile = tempnam($tempDir, 'png_').'.png';

        try {
            // Write PDF to temp file
            file_put_contents($pdfFile, $pdfData);

            // Use Ghostscript to render only the first page
            // -dFirstPage=1 -dLastPage=1 ensures only page 1 is processed
            // Higher resolution (150 DPI) for better quality thumbnails
            $command = sprintf(
                '%s -dNOPAUSE -dBATCH -dSAFER -dQUIET '.
                '-dFirstPage=1 -dLastPage=1 '.
                '-sDEVICE=png16m -r150 '.
                '-dTextAlphaBits=4 -dGraphicsAlphaBits=4 '.
                '-dUseCropBox -dUseTrimBox '.
                '-sOutputFile=%s %s 2>&1',
                escapeshellcmd($gsPath),
                escapeshellarg($pngFile),
                escapeshellarg($pdfFile)
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0 || ! file_exists($pngFile)) {
                return null;
            }

            $imageData = file_get_contents($pngFile);

            return $imageData !== false ? $imageData : null;
        } catch (\Exception $e) {
            report($e);

            return null;
        } finally {
            // Cleanup temp files
            @unlink($pdfFile);
            @unlink($pngFile);
        }
    }

    /**
     * Extract first page of PDF as PNG using Imagick (fallback).
     */
    protected function extractFirstPageWithImagick(string $pdfData): ?string
    {
        try {
            $imagick = new \Imagick();

            // Set resource limits
            $imagick->setResourceLimit(\Imagick::RESOURCETYPE_MEMORY, 128 * 1024 * 1024);
            $imagick->setResourceLimit(\Imagick::RESOURCETYPE_MAP, 128 * 1024 * 1024);

            $imagick->setResolution(72, 72);
            $imagick->readImageBlob($pdfData.'[0]');
            $imagick->thumbnailImage(800, 800, true);

            $imagick->setImageBackgroundColor('white');
            $imagick->setImageAlphaChannel(\Imagick::ALPHACHANNEL_REMOVE);
            $imagick = $imagick->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);

            $imagick->setImageFormat('png');
            $imageData = $imagick->getImageBlob();
            $imagick->clear();
            $imagick->destroy();

            return $imageData;
        } catch (\Exception $e) {
            report($e);

            return null;
        }
    }
}
