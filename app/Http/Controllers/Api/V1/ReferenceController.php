<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferenceController extends Controller
{
    /**
     * Get all collections for the reference picker.
     */
    public function collections(Request $request): JsonResponse
    {
        $search = $request->input('search', '');

        $query = Collection::query()
            ->select(['_id', 'name', 'slug', 'description'])
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $collections = $query->get()->map(function ($collection) {
            return [
                '_id' => (string) $collection->_id,
                'name' => $collection->name,
                'slug' => $collection->slug,
                'description' => $collection->description,
                'has_contents' => Content::where('collection_id', (string) $collection->_id)->exists(),
            ];
        });

        return response()->json([
            'data' => $collections,
        ]);
    }

    /**
     * Get contents for a specific collection.
     */
    public function contents(Request $request, string $collectionId): JsonResponse
    {
        $search = $request->input('search', '');

        $query = Content::query()
            ->where('collection_id', $collectionId)
            ->select(['_id', 'title', 'slug', 'status', 'elements'])
            ->orderBy('title');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $contents = $query->get()->map(function ($content) {
            $elements = $content->elements ?? [];
            $hasElements = is_array($elements) && count($elements) > 0;

            return [
                '_id' => (string) $content->_id,
                'title' => $content->title,
                'slug' => $content->slug,
                'status' => $content->status?->value ?? 'draft',
                'has_elements' => $hasElements,
                'element_count' => $hasElements ? count($elements) : 0,
            ];
        });

        return response()->json([
            'data' => $contents,
        ]);
    }

    /**
     * Get elements for a specific content.
     */
    public function elements(Request $request, string $contentId): JsonResponse
    {
        $content = Content::find($contentId);

        if (! $content) {
            return response()->json([
                'message' => 'Content not found.',
            ], 404);
        }

        $elements = $content->elements ?? [];

        // Flatten nested elements (wrapper children) into a tree structure
        $flattenedElements = $this->flattenElements($elements);

        return response()->json([
            'data' => $flattenedElements,
            'content' => [
                '_id' => (string) $content->_id,
                'title' => $content->title,
            ],
        ]);
    }

    /**
     * Resolve a reference to get display information.
     */
    public function resolve(Request $request): JsonResponse
    {
        $referenceType = $request->input('reference_type');
        $collectionId = $request->input('collection_id');
        $contentId = $request->input('content_id');
        $elementId = $request->input('element_id');

        $result = [
            'reference_type' => $referenceType,
            'path' => [],
            'display_title' => '',
            'valid' => true,
        ];

        // Resolve collection
        if ($collectionId) {
            $collection = Collection::find($collectionId);
            if ($collection) {
                $result['path'][] = [
                    'type' => 'collection',
                    '_id' => (string) $collection->_id,
                    'name' => $collection->name,
                    'slug' => $collection->slug,
                ];
                $result['display_title'] = $collection->name;
            } else {
                $result['valid'] = false;
                $result['error'] = 'Collection not found';
            }
        }

        // Resolve content
        if ($contentId && $result['valid']) {
            $content = Content::find($contentId);
            if ($content) {
                $result['path'][] = [
                    'type' => 'content',
                    '_id' => (string) $content->_id,
                    'title' => $content->title,
                    'slug' => $content->slug,
                ];
                $result['display_title'] = $content->title;
            } else {
                $result['valid'] = false;
                $result['error'] = 'Content not found';
            }
        }

        // Resolve element
        if ($elementId && $contentId && $result['valid']) {
            $content = Content::find($contentId);
            if ($content) {
                $element = $this->findElementById($content->elements ?? [], $elementId);
                if ($element) {
                    $result['path'][] = [
                        'type' => 'element',
                        'id' => $element['id'] ?? $elementId,
                        'element_type' => $element['type'] ?? 'unknown',
                        'preview' => $this->getElementPreview($element),
                    ];
                    $result['display_title'] = $this->getElementPreview($element);
                } else {
                    $result['valid'] = false;
                    $result['error'] = 'Element not found';
                }
            }
        }

        return response()->json($result);
    }

    /**
     * Get full content preview with elements for the reference picker.
     */
    public function preview(string $contentId): JsonResponse
    {
        $content = Content::find($contentId);

        if (! $content) {
            return response()->json([
                'message' => 'Content not found.',
            ], 404);
        }

        // Get the collection for edit URL
        $collection = Collection::find($content->collection_id);

        return response()->json([
            'content' => [
                '_id' => (string) $content->_id,
                'title' => $content->title,
                'slug' => $content->slug,
                'status' => $content->status?->value ?? 'draft',
                'collection_id' => $content->collection_id,
                'collection_slug' => $collection?->slug ?? '',
            ],
            'elements' => $content->elements ?? [],
        ]);
    }

    /**
     * Get collection preview with the 3 newest content items.
     */
    public function previewCollection(string $collectionId): JsonResponse
    {
        $collection = Collection::find($collectionId);

        if (! $collection) {
            return response()->json([
                'message' => 'Collection not found.',
            ], 404);
        }

        // Get the 3 newest contents from this collection
        $contents = Content::where('collection_id', $collectionId)
            ->select(['_id', 'title', 'slug', 'status', 'created_at'])
            ->orderByDesc('created_at')
            ->limit(3)
            ->get()
            ->map(function ($content) {
                return [
                    '_id' => (string) $content->_id,
                    'title' => $content->title,
                    'slug' => $content->slug,
                    'status' => $content->status?->value ?? 'draft',
                    'created_at' => $content->created_at?->toISOString(),
                ];
            });

        // Count total contents in collection
        $totalCount = Content::where('collection_id', $collectionId)->count();

        return response()->json([
            'collection' => [
                '_id' => (string) $collection->_id,
                'name' => $collection->name,
                'slug' => $collection->slug,
                'description' => $collection->description,
            ],
            'contents' => $contents,
            'total_count' => $totalCount,
        ]);
    }

    /**
     * Flatten elements including wrapper children into a tree structure.
     * Reference elements are excluded to prevent endless reference loops.
     *
     * @param  array<int, array<string, mixed>>  $elements
     * @return array<int, array<string, mixed>>
     */
    private function flattenElements(array $elements, int $depth = 0, ?string $parentId = null): array
    {
        $result = [];

        foreach ($elements as $index => $element) {
            $elementId = $element['id'] ?? $element['_id'] ?? "element-{$index}";
            $type = $element['type'] ?? 'unknown';

            // Skip reference elements to prevent endless reference loops
            if ($type === 'reference') {
                continue;
            }

            $flatElement = [
                'id' => $elementId,
                'type' => $type,
                'depth' => $depth,
                'parent_id' => $parentId,
                'order' => $element['order'] ?? $index,
                'preview' => $this->getElementPreview($element),
                'has_children' => isset($element['children']) && is_array($element['children']) && count($element['children']) > 0,
            ];

            $result[] = $flatElement;

            // Recursively process children (for wrappers)
            if (isset($element['children']) && is_array($element['children'])) {
                $childElements = $this->flattenElements($element['children'], $depth + 1, $elementId);
                $result = array_merge($result, $childElements);
            }
        }

        return $result;
    }

    /**
     * Find an element by ID in a nested structure.
     *
     * @param  array<int, array<string, mixed>>  $elements
     * @return array<string, mixed>|null
     */
    private function findElementById(array $elements, string $targetId): ?array
    {
        foreach ($elements as $element) {
            $elementId = $element['id'] ?? $element['_id'] ?? null;

            if ($elementId === $targetId) {
                return $element;
            }

            // Search in children
            if (isset($element['children']) && is_array($element['children'])) {
                $found = $this->findElementById($element['children'], $targetId);
                if ($found) {
                    return $found;
                }
            }
        }

        return null;
    }

    /**
     * Get a short preview text for an element.
     *
     * @param  array<string, mixed>  $element
     */
    private function getElementPreview(array $element): string
    {
        $type = $element['type'] ?? 'unknown';
        $data = $element['data'] ?? [];

        $preview = match ($type) {
            'text' => $this->truncate($data['content'] ?? '', 50),
            'media' => $data['alt'] ?? $data['caption'] ?? 'Media',
            'html' => $this->truncate(strip_tags($data['content'] ?? ''), 50),
            'wrapper' => sprintf('Wrapper (%d children)', count($element['children'] ?? [])),
            'katex' => $this->truncate($data['formula'] ?? '', 30),
            'json' => 'JSON Data',
            'xml' => 'XML Content',
            'svg' => $data['title'] ?? 'SVG',
            'reference' => $data['display_title'] ?? 'Reference',
            default => ucfirst($type),
        };

        return "[{$type}] {$preview}";
    }

    /**
     * Truncate a string to a maximum length.
     */
    private function truncate(string $text, int $maxLength): string
    {
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');

        if (strlen($text) <= $maxLength) {
            return $text;
        }

        return substr($text, 0, $maxLength - 3).'...';
    }
}
