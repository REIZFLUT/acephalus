<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'collection_id' => (string) $this->collection_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_published' => $this->isPublished(),
            'current_version' => $this->current_version,
            'published_version_id' => $this->published_version_id ? (string) $this->published_version_id : null,
            'elements' => $this->elements,
            'metadata' => $this->metadata,
            'collection' => new CollectionResource($this->whenLoaded('collection')),
            'versions' => ContentVersionResource::collection($this->whenLoaded('versions')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}


