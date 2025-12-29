<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\WrapperPurpose;
use App\Services\SchemaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function __construct(private readonly SchemaService $schemaService) {}

    public function index(): Response
    {
        $collections = Collection::all();

        // Sort manually if needed, or just return
        $collections = $collections->sortBy('name');

        // Manually count contents for each collection
        $collections = $collections->map(function ($collection) {
            $collection->contents_count = $collection->contents()->count();

            return $collection;
        });

        return Inertia::render('Collections/Index', [
            'collections' => $collections->values()->all(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Collections/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        $collection = Collection::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'schema' => $this->schemaService->createDefaultSchema(),
            'settings' => [],
        ]);

        return redirect()
            ->route('collections.show', $collection->slug)
            ->with('success', 'Collection created successfully.');
    }

    public function show(Collection $collection): Response
    {
        $collection->load('contents');

        // Get paginated contents
        $contents = $collection->contents()
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        // Manually add versions_count for each content (withCount not supported by MongoDB)
        $contents->getCollection()->transform(function ($content) {
            $content->versions_count = $content->versions()->count();

            return $content;
        });

        return Inertia::render('Collections/Show', [
            'collection' => $collection,
            'contents' => $contents,
        ]);
    }

    public function edit(Collection $collection): Response
    {
        $wrapperPurposes = WrapperPurpose::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['_id', 'slug', 'name', 'description', 'icon', 'is_system']);

        return Inertia::render('Collections/Edit', [
            'collection' => $collection,
            'wrapperPurposes' => $wrapperPurposes,
        ]);
    }

    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string'],
            'schema' => ['nullable', 'array'],
            'collection_meta' => ['nullable', 'array'],
        ]);

        $collection->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'schema' => $validated['schema'] ?? $collection->schema,
            'collection_meta' => $validated['collection_meta'] ?? $collection->collection_meta,
        ]);

        return redirect()
            ->route('collections.show', $collection->slug)
            ->with('success', 'Collection updated successfully.');
    }

    public function destroy(Collection $collection): RedirectResponse
    {
        $collection->delete();

        return redirect()
            ->route('collections.index')
            ->with('success', 'Collection deleted successfully.');
    }
}
