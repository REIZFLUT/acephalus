<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\FilterView;
use App\Services\ContentFilterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FilterViewController extends Controller
{
    public function __construct(
        protected ContentFilterService $filterService,
    ) {}

    /**
     * Get filter views for a specific collection.
     */
    public function forCollection(Collection $collection): JsonResponse
    {
        $filterViews = FilterView::forCollection((string) $collection->_id)
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $filterViews,
        ]);
    }

    /**
     * Show a specific filter view.
     */
    public function show(FilterView $filterView): JsonResponse
    {
        return response()->json([
            'data' => $filterView,
        ]);
    }

    /**
     * Get available fields for a collection (for building filters).
     */
    public function fields(Collection $collection): JsonResponse
    {
        $fields = $this->filterService->getAvailableFields($collection);

        return response()->json([
            'data' => $fields,
        ]);
    }

    /**
     * Get available operators for a field type.
     */
    public function operators(Request $request): JsonResponse
    {
        $type = $request->query('type', 'text');
        $operators = $this->filterService->getOperatorsForType($type);

        return response()->json([
            'data' => $operators,
        ]);
    }
}
