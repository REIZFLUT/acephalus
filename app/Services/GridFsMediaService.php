<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MediaType;
use App\Models\Mongodb\Media;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use MongoDB\BSON\ObjectId;
use MongoDB\Client;
use MongoDB\GridFS\Bucket;

class GridFsMediaService
{
    protected ?Bucket $bucket = null;

    protected ?Client $client = null;

    public ThumbnailService $thumbnailService;

    public function __construct(ThumbnailService $thumbnailService)
    {
        $this->thumbnailService = $thumbnailService;
    }

    /**
     * Get the MongoDB client.
     */
    protected function getClient(): Client
    {
        if ($this->client === null) {
            $dsn = config('database.connections.mongodb.dsn');
            $this->client = new Client($dsn);
        }

        return $this->client;
    }

    /**
     * Get the GridFS bucket.
     */
    protected function getBucket(): Bucket
    {
        if ($this->bucket === null) {
            $database = config('database.connections.mongodb.database');
            $this->bucket = $this->getClient()->selectDatabase($database)->selectGridFSBucket();
        }

        return $this->bucket;
    }

    /**
     * Upload a file to GridFS.
     *
     * @param  array<string, mixed>  $metadata  Additional metadata (alt, caption, etc.)
     * @param  string|null  $folderId  Optional folder ID to organize media
     */
    public function upload(UploadedFile $file, ?User $user = null, array $metadata = [], ?string $folderId = null): Media
    {
        $filename = $this->generateFilename($file);
        $mimeType = $file->getMimeType() ?? 'application/octet-stream';
        $mediaType = MediaType::fromMimeType($mimeType);

        // Upload to GridFS
        $stream = fopen($file->getPathname(), 'rb');
        try {
            $gridFsId = $this->getBucket()->uploadFromStream(
                $filename,
                $stream,
                [
                    'metadata' => [
                        'original_filename' => $file->getClientOriginalName(),
                        'mime_type' => $mimeType,
                        'uploaded_by' => $user?->id,
                        'folder_id' => $folderId,
                        ...$metadata,
                    ],
                ]
            );
        } finally {
            fclose($stream);
        }

        // Generate thumbnails for images and PDFs
        $thumbnails = [];
        if ($this->thumbnailService->isSupported($mimeType)) {
            $imageData = file_get_contents($file->getPathname());
            if ($imageData !== false) {
                $thumbnails = $this->generateAndStoreThumbnails($imageData, $filename);
            }
        } elseif ($this->thumbnailService->isPdfSupported($mimeType)) {
            $pdfData = file_get_contents($file->getPathname());
            if ($pdfData !== false) {
                $thumbnails = $this->generateAndStorePdfThumbnails($pdfData, $filename);
            }
        }

        // Create media record
        // Note: tags and metadata must be arrays for proper MongoDB BSON storage
        return Media::create([
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'media_type' => $mediaType,
            'size' => $file->getSize(),
            'gridfs_id' => (string) $gridFsId,
            'thumbnails' => $thumbnails,
            'alt' => $metadata['alt'] ?? null,
            'caption' => $metadata['caption'] ?? null,
            'tags' => [],
            'metadata' => $metadata ?: [],
            'uploaded_by' => $user?->id,
            'folder_id' => $folderId,
        ]);
    }

    /**
     * Download a file from GridFS.
     *
     * @return resource|null
     */
    public function download(Media $media)
    {
        if (! $media->gridfs_id) {
            return null;
        }

        $gridFsId = new ObjectId($media->gridfs_id);

        return $this->getBucket()->openDownloadStream($gridFsId);
    }

    /**
     * Get file contents from GridFS.
     */
    public function getContents(Media $media): ?string
    {
        $stream = $this->download($media);

        if ($stream === null) {
            return null;
        }

        $contents = stream_get_contents($stream);
        fclose($stream);

        return $contents !== false ? $contents : null;
    }

    /**
     * Delete a file from GridFS.
     */
    public function delete(Media $media): bool
    {
        // Delete original file
        if ($media->gridfs_id) {
            try {
                $gridFsId = new ObjectId($media->gridfs_id);
                $this->getBucket()->delete($gridFsId);
            } catch (\Exception $exception) {
                // File might already be deleted from GridFS
                report($exception);
            }
        }

        // Delete thumbnails
        $this->deleteThumbnails($media);

        // MongoDB delete() can return null, so we ensure a boolean is returned
        return (bool) $media->delete();
    }

    /**
     * Delete all thumbnails for a media item.
     */
    protected function deleteThumbnails(Media $media): void
    {
        $thumbnails = $media->thumbnails;
        if ($thumbnails instanceof \MongoDB\Model\BSONDocument || $thumbnails instanceof \MongoDB\Model\BSONArray) {
            $thumbnails = $thumbnails->getArrayCopy();
        }

        if (! is_array($thumbnails)) {
            return;
        }

        foreach ($thumbnails as $gridFsId) {
            try {
                $this->getBucket()->delete(new ObjectId($gridFsId));
            } catch (\Exception $exception) {
                // Thumbnail might already be deleted
                report($exception);
            }
        }
    }

    /**
     * Get the file info from GridFS.
     *
     * @return array<string, mixed>|null
     */
    public function getFileInfo(Media $media): ?array
    {
        if (! $media->gridfs_id) {
            return null;
        }

        $gridFsId = new ObjectId($media->gridfs_id);

        $file = $this->getBucket()->findOne(['_id' => $gridFsId]);

        if (! $file) {
            return null;
        }

        return [
            'filename' => $file->filename,
            'length' => $file->length,
            'upload_date' => $file->uploadDate->toDateTime(),
            'metadata' => $file->metadata ?? [],
        ];
    }

    /**
     * Generate a unique filename for an uploaded file.
     */
    protected function generateFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $basename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $uniqueId = Str::uuid()->toString();

        return "{$basename}-{$uniqueId}.{$extension}";
    }

    /**
     * Check if a media file exists in GridFS.
     */
    public function exists(Media $media): bool
    {
        if (! $media->gridfs_id) {
            return false;
        }

        $gridFsId = new ObjectId($media->gridfs_id);

        return $this->getBucket()->findOne(['_id' => $gridFsId]) !== null;
    }

    /**
     * Get the URL for a media file (for API responses).
     */
    public function getUrl(Media $media): string
    {
        return route('api.v1.media.show', ['media' => $media->_id]);
    }

    /**
     * Download a thumbnail from GridFS.
     *
     * @return resource|null
     */
    public function downloadThumbnail(Media $media, string $size)
    {
        $gridFsId = $media->getThumbnailGridFsId($size);

        if ($gridFsId === null) {
            return null;
        }

        try {
            return $this->getBucket()->openDownloadStream(new ObjectId($gridFsId));
        } catch (\Exception $exception) {
            report($exception);

            return null;
        }
    }

    /**
     * Generate and store thumbnails in GridFS.
     *
     * @param  string  $imageData  Raw image data
     * @param  string  $originalFilename  Original filename for naming thumbnails
     * @return array<string, string> Map of size => GridFS ID
     */
    protected function generateAndStoreThumbnails(string $imageData, string $originalFilename): array
    {
        $thumbnails = $this->thumbnailService->generateAll($imageData);
        $stored = [];

        $baseName = pathinfo($originalFilename, PATHINFO_FILENAME);

        foreach ($thumbnails as $size => $encodedImage) {
            $thumbnailFilename = "{$baseName}-thumb-{$size}.webp";

            try {
                $gridFsId = $this->getBucket()->uploadFromStream(
                    $thumbnailFilename,
                    $this->createStreamFromString($encodedImage->toString()),
                    [
                        'metadata' => [
                            'type' => 'thumbnail',
                            'size' => $size,
                            'mime_type' => 'image/webp',
                            'original_filename' => $originalFilename,
                        ],
                    ]
                );
                $stored[$size] = (string) $gridFsId;
            } catch (\Exception $exception) {
                report($exception);
            }
        }

        return $stored;
    }

    /**
     * Generate thumbnails for an existing media item.
     *
     * @return array<string, string> Map of size => GridFS ID
     */
    public function generateThumbnailsForMedia(Media $media): array
    {
        // Get contents
        $data = $this->getContents($media);
        if ($data === null) {
            return [];
        }

        $thumbnails = [];

        // Generate thumbnails based on media type
        if ($this->thumbnailService->isSupported($media->mime_type)) {
            $thumbnails = $this->generateAndStoreThumbnails($data, $media->filename);
        } elseif ($this->thumbnailService->isPdfSupported($media->mime_type)) {
            $thumbnails = $this->generateAndStorePdfThumbnails($data, $media->filename);
        }

        // Update media record with thumbnail IDs
        if (! empty($thumbnails)) {
            $media->update(['thumbnails' => $thumbnails]);
        }

        return $thumbnails;
    }

    /**
     * Generate and store PDF thumbnails (first page) in GridFS.
     *
     * @param  string  $pdfData  Raw PDF data
     * @param  string  $originalFilename  Original filename for naming thumbnails
     * @return array<string, string> Map of size => GridFS ID
     */
    protected function generateAndStorePdfThumbnails(string $pdfData, string $originalFilename): array
    {
        $thumbnails = $this->thumbnailService->generateAllFromPdf($pdfData);
        $stored = [];

        $baseName = pathinfo($originalFilename, PATHINFO_FILENAME);

        foreach ($thumbnails as $size => $encodedImage) {
            $thumbnailFilename = "{$baseName}-thumb-{$size}.webp";

            try {
                $gridFsId = $this->getBucket()->uploadFromStream(
                    $thumbnailFilename,
                    $this->createStreamFromString($encodedImage->toString()),
                    [
                        'metadata' => [
                            'type' => 'thumbnail',
                            'size' => $size,
                            'mime_type' => 'image/webp',
                            'original_filename' => $originalFilename,
                            'source_type' => 'pdf',
                        ],
                    ]
                );
                $stored[$size] = (string) $gridFsId;
            } catch (\Exception $exception) {
                report($exception);
            }
        }

        return $stored;
    }

    /**
     * Create a stream from a string.
     *
     * @return resource
     */
    protected function createStreamFromString(string $data)
    {
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $data);
        rewind($stream);

        return $stream;
    }
}
