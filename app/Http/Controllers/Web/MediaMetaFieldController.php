<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Edition;
use App\Models\Mongodb\MediaMetaField;
use App\Models\Mongodb\WrapperPurpose;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MediaMetaFieldController extends Controller
{
    /**
     * Display a listing of media meta fields (redirects to settings index).
     */
    public function index(): Response
    {
        $mediaMetaFields = MediaMetaField::ordered()->get();
        $purposes = WrapperPurpose::orderBy('is_system', 'desc')->orderBy('name')->get();
        $editions = Edition::orderBy('is_system', 'desc')->orderBy('name')->get();

        return Inertia::render('Settings/Index', [
            'purposes' => $purposes,
            'editions' => $editions,
            'mediaMetaFields' => $mediaMetaFields,
            'activeTab' => 'media-meta-fields',
        ]);
    }

    /**
     * Show the form for creating a new media meta field.
     */
    public function create(): Response
    {
        return Inertia::render('Settings/MediaMetaFields/Create', [
            'fieldTypes' => MediaMetaField::FIELD_TYPES,
        ]);
    }

    /**
     * Store a newly created media meta field.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/', 'unique:mongodb.media_meta_fields,slug'],
            'description' => ['nullable', 'string', 'max:500'],
            'field_type' => ['required', 'string', 'in:'.implode(',', MediaMetaField::FIELD_TYPES)],
            'options' => ['nullable', 'array'],
            'options.*.value' => ['required_with:options', 'string'],
            'options.*.label' => ['required_with:options', 'string'],
            'required' => ['boolean'],
            'placeholder' => ['nullable', 'string', 'max:255'],
        ]);

        $slug = $validated['slug'] ?? Str::snake($validated['name']);

        // Ensure slug is not a reserved system field
        if (in_array($slug, MediaMetaField::SYSTEM_FIELDS, true)) {
            return redirect()
                ->back()
                ->withErrors(['slug' => 'This slug is reserved for system fields.'])
                ->withInput();
        }

        MediaMetaField::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'field_type' => $validated['field_type'],
            'options' => $validated['options'] ?? null,
            'is_system' => false,
            'required' => $validated['required'] ?? false,
            'placeholder' => $validated['placeholder'] ?? null,
        ]);

        return redirect()
            ->route('settings.media-meta-fields.index')
            ->with('success', 'Media meta field created successfully.');
    }

    /**
     * Show the form for editing a media meta field.
     */
    public function edit(MediaMetaField $mediaMetaField): Response
    {
        return Inertia::render('Settings/MediaMetaFields/Edit', [
            'field' => $mediaMetaField,
            'fieldTypes' => MediaMetaField::FIELD_TYPES,
        ]);
    }

    /**
     * Update the specified media meta field.
     */
    public function update(Request $request, MediaMetaField $mediaMetaField): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'field_type' => ['required', 'string', 'in:'.implode(',', MediaMetaField::FIELD_TYPES)],
            'options' => ['nullable', 'array'],
            'options.*.value' => ['required_with:options', 'string'],
            'options.*.label' => ['required_with:options', 'string'],
            'required' => ['boolean'],
            'placeholder' => ['nullable', 'string', 'max:255'],
        ]);

        // System fields can only update description and placeholder
        if ($mediaMetaField->is_system) {
            $mediaMetaField->update([
                'description' => $validated['description'] ?? $mediaMetaField->description,
                'placeholder' => $validated['placeholder'] ?? $mediaMetaField->placeholder,
            ]);
        } else {
            $mediaMetaField->update([
                'name' => $validated['name'],
                'slug' => $validated['slug'] ?? $mediaMetaField->slug,
                'description' => $validated['description'] ?? null,
                'field_type' => $validated['field_type'],
                'options' => $validated['options'] ?? null,
                'required' => $validated['required'] ?? false,
                'placeholder' => $validated['placeholder'] ?? null,
            ]);
        }

        return redirect()
            ->route('settings.media-meta-fields.index')
            ->with('success', 'Media meta field updated successfully.');
    }

    /**
     * Remove the specified media meta field.
     */
    public function destroy(MediaMetaField $mediaMetaField): RedirectResponse
    {
        if ($mediaMetaField->is_system) {
            return redirect()
                ->route('settings.media-meta-fields.index')
                ->with('error', 'System fields cannot be deleted.');
        }

        $mediaMetaField->delete();

        return redirect()
            ->route('settings.media-meta-fields.index')
            ->with('success', 'Media meta field deleted successfully.');
    }

    /**
     * Get all media meta fields as JSON for API usage.
     */
    public function list(): JsonResponse
    {
        $fields = MediaMetaField::ordered()
            ->get(['_id', 'slug', 'name', 'description', 'field_type', 'options', 'is_system', 'required', 'placeholder']);

        return response()->json($fields);
    }

    /**
     * Reorder media meta fields.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['required', 'string'],
        ]);

        foreach ($validated['order'] as $index => $fieldId) {
            MediaMetaField::where('_id', $fieldId)->update(['order' => $index + 1]);
        }

        return response()->json(['message' => 'Order updated successfully.']);
    }
}
