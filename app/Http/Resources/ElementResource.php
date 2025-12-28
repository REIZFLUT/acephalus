<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ElementResource extends JsonResource
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
            'content_id' => (string) $this->content_id,
            'parent_id' => $this->parent_id ? (string) $this->parent_id : null,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'data' => $this->data,
            'order' => $this->order,
            'can_have_children' => $this->canHaveChildren(),
            'children' => ElementResource::collection($this->whenLoaded('children')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}


