<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource for content data from a specific release version.
 * This returns the content state as it was at the release endpoint.
 */
class ReleaseContentResource extends JsonResource
{
    protected string $release;

    protected $version;

    /**
     * Create a new resource instance with release context.
     */
    public function __construct($resource, string $release, $version = null)
    {
        parent::__construct($resource);
        $this->release = $release;
        $this->version = $version;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $version = $this->version;

        return [
            'id' => (string) $this->_id,
            'collection_id' => (string) $this->collection_id,
            'title' => $version?->snapshot['title'] ?? $this->title,
            'slug' => $version?->snapshot['slug'] ?? $this->slug,
            'status' => $version?->snapshot['status'] ?? $this->status->value,
            'release' => $this->release,
            'release_version_number' => $version?->version_number,
            'is_release_end' => $version?->is_release_end ?? false,
            'elements' => $version?->elements ?? $this->elements,
            'metadata' => $version?->snapshot['metadata'] ?? $this->metadata,
            'version_created_at' => $version?->created_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
