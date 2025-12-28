<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\ContentStatus;
use App\Enums\ElementType;
use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\WrapperPurpose;
use App\Services\ContentService;
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
    ) {}

    public function index(Collection $collection): Response
    {
        $contents = $collection->contents()
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return Inertia::render('Collections/Show', [
            'collection' => $collection,
            'contents' => $contents,
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

        // Create initial version
        $this->versionService->createVersion($content);

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

        return Inertia::render('Contents/Edit', [
            'content' => $content,
            'wrapperPurposes' => $wrapperPurposes,
            'elementTypes' => array_map(fn (ElementType $type) => [
                'value' => $type->value,
                'label' => ucfirst($type->value),
            ], ElementType::cases()),
        ]);
    }

    public function update(Request $request, Content $content): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'elements' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
        ]);

        $content->update([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'elements' => $validated['elements'] ?? $content->elements,
            'metadata' => $validated['metadata'] ?? $content->metadata,
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
