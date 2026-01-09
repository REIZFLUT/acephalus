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

    public function index(Request $request, Collection $collection): Response
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
        // Generate slug from title if not provided (before validation)
        if ($request->filled('title') && ! $request->filled('slug')) {
            $request->merge(['slug' => Str::slug($request->input('title'))]);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($collection) {
                    // Check if slug already exists in the same collection
                    $exists = Content::where('collection_id', $collection->_id)
                        ->where('slug', $value)
                        ->exists();

                    if ($exists) {
                        $fail('This slug is already used in this collection.');
                    }
                },
            ],
            'elements' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
        ]);

        $content = Content::create([
            'collection_id' => $collection->_id,
            'title' => $validated['title'],
            'slug' => $validated['slug'],
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
        $content->load('collection');

        // Get enhanced version history with creator info and diff summaries
        $enhancedVersions = $this->versionService->getEnhancedVersionHistory($content);

        // Transform enhanced versions to a format suitable for the frontend
        $versions = collect($enhancedVersions)->map(function ($item) {
            $version = $item['version'];

            return [
                '_id' => (string) $version->_id,
                'content_id' => (string) $version->content_id,
                'version_number' => $version->version_number,
                'elements' => $version->elements,
                'created_by' => $version->created_by,
                'change_note' => $version->change_note,
                'snapshot' => $version->snapshot,
                'created_at' => $version->created_at?->toIso8601String(),
                'creator_name' => $item['creator']?->name,
                'diff_summary' => $item['diff_summary'],
            ];
        })->values()->all();

        // Add versions to the content for backwards compatibility
        $content->versions = $versions;

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
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($content) {
                    // Check if slug already exists in the same collection (excluding current content)
                    $exists = Content::where('collection_id', $content->collection_id)
                        ->where('slug', $value)
                        ->where('_id', '!=', $content->_id)
                        ->exists();

                    if ($exists) {
                        $fail('This slug is already used in this collection.');
                    }
                },
            ],
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

    public function restoreVersion(Request $request, Content $content, int $version): RedirectResponse
    {
        $versionExists = $this->versionService->getVersion($content, $version);

        if (! $versionExists) {
            return redirect()
                ->route('contents.edit', $content->_id)
                ->with('error', 'Version not found.');
        }

        $this->versionService->restoreVersion(
            $content,
            $version,
            $request->user()
        );

        return redirect()
            ->route('contents.edit', $content->_id)
            ->with('success', "Content restored to version {$version}.");
    }

    public function duplicate(Request $request, Content $content): RedirectResponse
    {
        $validated = $request->validate([
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($content) {
                    // Check if slug already exists in the same collection
                    $exists = Content::where('collection_id', $content->collection_id)
                        ->where('slug', $value)
                        ->exists();

                    if ($exists) {
                        $fail('This slug is already used in this collection.');
                    }
                },
            ],
        ]);

        // Create the duplicate with all data from the original
        $duplicatedContent = Content::create([
            'collection_id' => $content->collection_id,
            'title' => $content->title.' (Copy)',
            'slug' => $validated['slug'],
            'status' => ContentStatus::DRAFT,
            'current_version' => 1,
            'elements' => $content->elements ?? [],
            'metadata' => $content->metadata ?? [],
            'editions' => $content->editions ?? [],
        ]);

        // Create initial version for the duplicate
        $this->versionService->createVersion(
            $duplicatedContent,
            $request->user(),
            'Duplicated from '.$content->title,
            false
        );

        return redirect()
            ->route('contents.edit', $duplicatedContent->_id)
            ->with('success', 'Content duplicated successfully.');
    }
}
