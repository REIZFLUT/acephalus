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
     */
    public function upload(UploadedFile $file, ?User $user = null, array $metadata = []): Media
    {
        $filename = $this->generateFilename($file);
        $mimeType = $file->getMimeType() ?? 'application/octet-stream';
        $mediaType = MediaType::fromMimeType($mimeType);

        // Upload to GridFS
        $stream = fopen($file->getPathname(), 'rb');
        $gridFsId = $this->getBucket()->uploadFromStream(
            $filename,
            $stream,
            [
                'metadata' => [
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $mimeType,
                    'uploaded_by' => $user?->id,
                    ...$metadata,
                ],
            ]
        );
        fclose($stream);

        // Create media record
        return Media::create([
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'media_type' => $mediaType,
            'size' => $file->getSize(),
            'gridfs_id' => (string) $gridFsId,
            'alt' => $metadata['alt'] ?? null,
            'caption' => $metadata['caption'] ?? null,
            'metadata' => $metadata,
            'uploaded_by' => $user?->id,
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
        if ($media->gridfs_id) {
            try {
                $gridFsId = new ObjectId($media->gridfs_id);
                $this->getBucket()->delete($gridFsId);
            } catch (\Exception $exception) {
                // File might already be deleted from GridFS
                report($exception);
            }
        }

        return $media->delete();
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
}


