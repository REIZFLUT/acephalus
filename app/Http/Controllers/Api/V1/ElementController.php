<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\ElementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\MoveElementRequest;
use App\Http\Requests\Api\V1\StoreElementRequest;
use App\Http\Requests\Api\V1\UpdateElementRequest;
use App\Http\Resources\ElementResource;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Element;
use App\Services\ContentService;
use App\Services\SchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ElementController extends Controller
{
    public function __construct(
        protected ContentService $contentService,
        protected SchemaService $schemaService
    ) {}

    /**
     * Store a newly created element.
     */
    public function store(StoreElementRequest $request, Content $content): JsonResponse
    {
        $data = $request->validated();

        $elementType = ElementType::from($data['type']);

        // Validate element data against type requirements
        try {
            $this->schemaService->validateElement($elementType, $data['data'] ?? []);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Element data validation failed',
                'errors' => $exception->errors(),
            ], 422);
        }

        $element = $this->contentService->addElement(
            $content,
            $data,
            $request->user()
        );

        return response()->json([
            'message' => 'Element created successfully',
            'data' => new ElementResource($element),
        ], 201);
    }

    /**
     * Update the specified element.
     */
    public function update(UpdateElementRequest $request, Element $element): JsonResponse
    {
        $data = $request->validated();

        $elementType = isset($data['type'])
            ? ElementType::from($data['type'])
            : $element->type;

        // Validate element data against type requirements
        if (isset($data['data'])) {
            try {
                $this->schemaService->validateElement($elementType, $data['data']);
            } catch (ValidationException $exception) {
                return response()->json([
                    'message' => 'Element data validation failed',
                    'errors' => $exception->errors(),
                ], 422);
            }
        }

        $element = $this->contentService->updateElement(
            $element,
            $data,
            $request->user()
        );

        return response()->json([
            'message' => 'Element updated successfully',
            'data' => new ElementResource($element),
        ]);
    }

    /**
     * Remove the specified element.
     */
    public function destroy(Element $element): JsonResponse
    {
        $this->contentService->deleteElement($element, request()->user());

        return response()->json([
            'message' => 'Element deleted successfully',
        ]);
    }

    /**
     * Move an element to a new position or parent.
     */
    public function move(MoveElementRequest $request, Element $element): JsonResponse
    {
        $data = $request->validated();

        // Validate that the new parent is a wrapper (if specified)
        if (isset($data['parent_id'])) {
            $parent = Element::find($data['parent_id']);

            if ($parent && ! $parent->isWrapper()) {
                return response()->json([
                    'message' => 'Elements can only be moved into wrapper elements',
                ], 422);
            }

            // Prevent moving an element into itself or its children
            if ($this->isDescendant($element, $data['parent_id'])) {
                return response()->json([
                    'message' => 'Cannot move an element into itself or its descendants',
                ], 422);
            }
        }

        $element = $this->contentService->moveElement(
            $element,
            $data['parent_id'] ?? null,
            $data['order'],
            $request->user()
        );

        return response()->json([
            'message' => 'Element moved successfully',
            'data' => new ElementResource($element),
        ]);
    }

    /**
     * Check if a potential parent is a descendant of the element.
     */
    protected function isDescendant(Element $element, string $parentId): bool
    {
        if ((string) $element->_id === $parentId) {
            return true;
        }

        $children = Element::where('parent_id', $element->_id)->get();

        foreach ($children as $child) {
            if ($this->isDescendant($child, $parentId)) {
                return true;
            }
        }

        return false;
    }
}


