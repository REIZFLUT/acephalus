<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Edition;
use App\Models\Mongodb\WrapperPurpose;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EditionController extends Controller
{
    public function index(): Response
    {
        $purposes = WrapperPurpose::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $editions = Edition::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings/Index', [
            'purposes' => $purposes,
            'editions' => $editions,
            'activeTab' => 'editions',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Settings/Editions/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', 'unique:mongodb.editions,slug'],
            'description' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:50'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        Edition::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'is_system' => false,
        ]);

        return redirect()
            ->route('settings.editions.index')
            ->with('success', 'Edition created successfully.');
    }

    public function edit(Edition $edition): Response
    {
        return Inertia::render('Settings/Editions/Edit', [
            'edition' => $edition,
        ]);
    }

    public function update(Request $request, Edition $edition): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:50'],
        ]);

        // System editions can only update description and icon
        if ($edition->is_system) {
            $edition->update([
                'description' => $validated['description'] ?? $edition->description,
                'icon' => $validated['icon'] ?? $edition->icon,
            ]);
        } else {
            $edition->update([
                'name' => $validated['name'],
                'slug' => $validated['slug'] ?? $edition->slug,
                'description' => $validated['description'] ?? null,
                'icon' => $validated['icon'] ?? null,
            ]);
        }

        return redirect()
            ->route('settings.editions.index')
            ->with('success', 'Edition updated successfully.');
    }

    public function destroy(Edition $edition): RedirectResponse
    {
        if ($edition->is_system) {
            return redirect()
                ->route('settings.editions.index')
                ->with('error', 'System editions cannot be deleted.');
        }

        $edition->delete();

        return redirect()
            ->route('settings.editions.index')
            ->with('success', 'Edition deleted successfully.');
    }

    /**
     * Get all editions as JSON for API usage.
     */
    public function list(): \Illuminate\Http\JsonResponse
    {
        $editions = Edition::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['_id', 'slug', 'name', 'description', 'icon', 'is_system']);

        return response()->json($editions);
    }
}
