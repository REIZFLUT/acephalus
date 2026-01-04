<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\ContentStatus;
use App\Enums\ElementType;
use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Edition;
use App\Models\Mongodb\WrapperPurpose;
use App\Services\ContentService;
use App\Services\ReleaseService;
use App\Services\VersionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ContentController extends Controller
{
    public function __construct(
        private readonly ContentService $contentService,
        private readonly VersionService $versionService,
        private readonly ReleaseService $releaseService,
    ) {}

    public function index(Request $request, Collection $collection): Response
    {
        $selectedRelease = $request->query('release');
        $releases = $collection->releases ?? [];

        // If filtering by release, get release-specific content states
        if ($selectedRelease && $this->releaseService->releaseExists($collection, $selectedRelease)) {
            $releaseContents = $this->releaseService->getContentsForRelease($collection, $selectedRelease);

            // Manual pagination for release-filtered contents
            $perPage = 20;
            $page = $request->integer('page', 1);
            $total = $releaseContents->count();
            $items = $releaseContents->slice(($page - 1) * $perPage, $perPage)->values();

            // Transform to match expected format with release version data
            $contentsData = $items->map(function ($item) use ($selectedRelease) {
                $content = $item['content'];
                $version = $item['version'];

                return [
                    '_id' => (string) $content->_id,
                    'collection_id' => (string) $content->collection_id,
                    'title' => $version?->snapshot['title'] ?? $content->title,
                    'slug' => $version?->snapshot['slug'] ?? $content->slug,
                    'status' => $version?->snapshot['status'] ?? $content->status->value,
                    'current_version' => $version?->version_number ?? $content->current_version,
                    'versions_count' => $version?->version_number,
                    'release' => $selectedRelease,
                    'is_release_end' => $version?->is_release_end ?? false,
                    'updated_at' => $version?->created_at?->toIso8601String() ?? $content->updated_at?->toIso8601String(),
                    'created_at' => $content->created_at?->toIso8601String(),
                ];
            })->toArray();

            $contents = [
                'data' => $contentsData,
                'current_page' => $page,
                'last_page' => (int) ceil($total / $perPage),
                'per_page' => $perPage,
                'total' => $total,
                'from' => $total > 0 ? ($page - 1) * $perPage + 1 : null,
                'to' => $total > 0 ? min($page * $perPage, $total) : null,
            ];
        } else {
            $contents = $collection->contents()
                ->orderBy('updated_at', 'desc')
                ->paginate(20);
        }

        return Inertia::render('Collections/Show', [
            'collection' => $collection,
            'contents' => $contents,
            'releases' => $releases,
            'selectedRelease' => $selectedRelease,
        ]);
    }

    public function create(Collection $collection): Response
    {
        return Inertia::render('Contents/Create', [
            'collection' => $collection,
            'elementTypes' => array_map(fn (ElementType $type) => [
                'value' => $type->value,
                'label' => ucfirst($type->value),
            ], ElementType::cases()),
        ]);
    }

    public function store(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'elements' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['title']);

        $content = Content::create([
            'collection_id' => $collection->_id,
            'title' => $validated['title'],
            'slug' => $slug,
            'status' => ContentStatus::DRAFT,
            'current_version' => 1,
            'elements' => $validated['elements'] ?? [],
            'metadata' => $validated['metadata'] ?? [],
        ]);

        // Create initial version (don't increment since this is the first version)
        $this->versionService->createVersion($content, null, null, false);

        return redirect()
            ->route('contents.edit', $content->_id)
            ->with('success', 'Content created successfully.');
    }

    public function show(Content $content): Response
    {
        $content->load('collection');

        return Inertia::render('Contents/Show', [
            'content' => $content,
        ]);
    }

    public function edit(Content $content): Response
    {
        $content->load(['collection', 'versions']);

        // Get wrapper purposes - filter by collection schema if configured
        $allowedPurposes = $content->collection->schema['allowed_wrapper_purposes'] ?? [];
        $wrapperPurposesQuery = WrapperPurpose::orderBy('is_system', 'desc')->orderBy('name');

        if (! empty($allowedPurposes)) {
            $wrapperPurposesQuery->whereIn('slug', $allowedPurposes);
        }

        $wrapperPurposes = $wrapperPurposesQuery->get(['_id', 'slug', 'name', 'description', 'icon', 'css_class', 'is_system']);

        // Get editions - filter by collection schema if configured
        $allowedEditions = $content->collection->schema['allowed_editions'] ?? null;
        $editionsQuery = Edition::orderBy('is_system', 'desc')->orderBy('name');

        if (! empty($allowedEditions)) {
            $editionsQuery->whereIn('slug', $allowedEditions);
        }

        $editions = $editionsQuery->get(['_id', 'slug', 'name', 'description', 'icon', 'is_system']);

        return Inertia::render('Contents/Edit', [
            'content' => $content,
            'wrapperPurposes' => $wrapperPurposes,
            'editions' => $editions,
            'elementTypes' => array_map(fn (ElementType $type) => [
                'value' => $type->value,
                'label' => ucfirst($type->value),
            ], ElementType::cases()),
        ]);
    }

    public function preview(Content $content): \Illuminate\View\View
    {
        $content->load('collection');

        return view('contents.preview', [
            'content' => $content,
        ]);
    }

    public function update(Request $request, Content $content): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'elements' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'editions' => ['nullable', 'array'],
            'editions.*' => ['string'],
        ]);

        $content->update([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'elements' => $validated['elements'] ?? $content->elements,
            'metadata' => $validated['metadata'] ?? $content->metadata,
            'editions' => $validated['editions'] ?? [],
        ]);

        // Create new version
        $this->versionService->createVersion($content);

        return redirect()
            ->back()
            ->with('success', 'Content updated successfully.');
    }

    public function destroy(Content $content): RedirectResponse
    {
        $collectionSlug = $content->collection?->slug ?? 'unknown';

        $content->delete();

        return redirect()
            ->route('collections.show', $collectionSlug)
            ->with('success', 'Content deleted successfully.');
    }

    public function publish(Content $content): RedirectResponse
    {
        $this->contentService->publish($content);

        return redirect()
            ->back()
            ->with('success', 'Content published successfully.');
    }

    public function unpublish(Content $content): RedirectResponse
    {
        $this->contentService->unpublish($content);

        return redirect()
            ->back()
            ->with('success', 'Content unpublished successfully.');
    }
}
