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

class WrapperPurposeController extends Controller
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
            'activeTab' => 'wrapper-purposes',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Settings/WrapperPurposes/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', 'unique:mongodb.wrapper_purposes,slug'],
            'description' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:50'],
            'css_class' => ['nullable', 'string', 'max:100'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        WrapperPurpose::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'css_class' => $validated['css_class'] ?? null,
            'is_system' => false,
        ]);

        return redirect()
            ->route('settings.wrapper-purposes.index')
            ->with('success', 'Wrapper purpose created successfully.');
    }

    public function edit(WrapperPurpose $wrapperPurpose): Response
    {
        return Inertia::render('Settings/WrapperPurposes/Edit', [
            'purpose' => $wrapperPurpose,
        ]);
    }

    public function update(Request $request, WrapperPurpose $wrapperPurpose): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:50'],
            'css_class' => ['nullable', 'string', 'max:100'],
        ]);

        // System purposes can only update description and icon
        if ($wrapperPurpose->is_system) {
            $wrapperPurpose->update([
                'description' => $validated['description'] ?? $wrapperPurpose->description,
                'icon' => $validated['icon'] ?? $wrapperPurpose->icon,
            ]);
        } else {
            $wrapperPurpose->update([
                'name' => $validated['name'],
                'slug' => $validated['slug'] ?? $wrapperPurpose->slug,
                'description' => $validated['description'] ?? null,
                'icon' => $validated['icon'] ?? null,
                'css_class' => $validated['css_class'] ?? null,
            ]);
        }

        return redirect()
            ->route('settings.wrapper-purposes.index')
            ->with('success', 'Wrapper purpose updated successfully.');
    }

    public function destroy(WrapperPurpose $wrapperPurpose): RedirectResponse
    {
        if ($wrapperPurpose->is_system) {
            return redirect()
                ->route('settings.wrapper-purposes.index')
                ->with('error', 'System purposes cannot be deleted.');
        }

        $wrapperPurpose->delete();

        return redirect()
            ->route('settings.wrapper-purposes.index')
            ->with('success', 'Wrapper purpose deleted successfully.');
    }

    /**
     * Get all purposes as JSON for API usage.
     */
    public function list(): \Illuminate\Http\JsonResponse
    {
        $purposes = WrapperPurpose::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['_id', 'slug', 'name', 'description', 'icon', 'css_class', 'is_system']);

        return response()->json($purposes);
    }
}
