<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
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
            'filename' => $this->filename,
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'media_type' => $this->media_type?->value,
            'media_type_label' => $this->media_type?->label(),
            'size' => $this->size,
            'size_human' => $this->human_readable_size,
            'alt' => $this->alt,
            'caption' => $this->caption,
            'metadata' => $this->metadata,
            'url' => route('api.v1.media.show', ['media' => $this->_id]),
            'uploaded_by' => $this->uploaded_by,
            'uploader' => new UserResource($this->whenLoaded('uploader')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}


