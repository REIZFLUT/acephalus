<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CustomElementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomElementController extends Controller
{
    public function __construct(
        private CustomElementService $customElementService
    ) {}

    /**
     * Get all custom element definitions.
     */
    public function index(): JsonResponse
    {
        $elements = $this->customElementService->all();

        // Remove internal fields from response
        $sanitized = $elements->map(function ($element) {
            unset($element['_file'], $element['_lastModified']);

            return $element;
        });

        return response()->json([
            'data' => $sanitized->values()->all(),
            'types' => $this->customElementService->types(),
            'categories' => $sanitized->groupBy('category')->keys()->all(),
        ]);
    }

    /**
     * Get a specific custom element definition.
     */
    public function show(string $type): JsonResponse
    {
        $element = $this->customElementService->get($type);

        if (! $element) {
            return response()->json([
                'message' => 'Custom element type not found.',
            ], 404);
        }

        // Remove internal fields
        unset($element['_file'], $element['_lastModified']);

        return response()->json([
            'data' => $element,
            'defaultData' => $this->customElementService->getDefaultData($type),
        ]);
    }

    /**
     * Get default data for a custom element type.
     */
    public function defaults(string $type): JsonResponse
    {
        if (! $this->customElementService->exists($type)) {
            return response()->json([
                'message' => 'Custom element type not found.',
            ], 404);
        }

        return response()->json([
            'data' => $this->customElementService->getDefaultData($type),
        ]);
    }

    /**
     * Validate data for a custom element.
     */
    public function validate(Request $request, string $type): JsonResponse
    {
        if (! $this->customElementService->exists($type)) {
            return response()->json([
                'message' => 'Custom element type not found.',
            ], 404);
        }

        $data = $request->input('data', []);
        $errors = $this->customElementService->validate($type, $data);

        if (! empty($errors)) {
            return response()->json([
                'valid' => false,
                'errors' => $errors,
            ], 422);
        }

        return response()->json([
            'valid' => true,
        ]);
    }

    /**
     * Refresh the custom elements cache.
     */
    public function refresh(): JsonResponse
    {
        $elements = $this->customElementService->refresh();

        return response()->json([
            'message' => 'Custom elements cache refreshed.',
            'count' => $elements->count(),
            'types' => $this->customElementService->types(),
        ]);
    }
}
