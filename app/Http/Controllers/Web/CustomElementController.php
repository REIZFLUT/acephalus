<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\CustomElement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomElementController extends Controller
{
    /**
     * Display the custom elements in settings.
     */
    public function index(): Response
    {
        $customElements = CustomElement::orderBy('is_system', 'desc')
            ->orderBy('category')
            ->orderBy('order')
            ->get();

        return Inertia::render('Settings/CustomElements/Index', [
            'customElements' => $customElements,
            'categories' => CustomElement::CATEGORIES,
            'inputTypes' => CustomElement::INPUT_TYPES,
        ]);
    }

    /**
     * Show the create form.
     */
    public function create(): Response
    {
        return Inertia::render('Settings/CustomElements/Create', [
            'categories' => CustomElement::CATEGORIES,
            'inputTypes' => CustomElement::INPUT_TYPES,
            'gridSizes' => CustomElement::GRID_SIZES,
        ]);
    }

    /**
     * Store a new custom element.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => [
                'required',
                'string',
                'max:100',
                'regex:/^custom_[a-z][a-z0-9_]*$/',
                'unique:mongodb.custom_elements,type',
            ],
            'label' => ['required', 'array'],
            'label.en' => ['required', 'string', 'max:255'],
            'label.de' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'array'],
            'description.en' => ['nullable', 'string', 'max:500'],
            'description.de' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:50'],
            'category' => ['required', 'string', Rule::in(CustomElement::CATEGORIES)],
            'can_have_children' => ['boolean'],
            'fields' => ['array'],
            'fields.*.name' => ['required', 'string', 'max:100', 'regex:/^[a-z][a-zA-Z0-9_]*$/'],
            'fields.*.label' => ['required'],
            'fields.*.inputType' => ['required', 'string', Rule::in(CustomElement::INPUT_TYPES)],
            'fields.*.placeholder' => ['nullable'],
            'fields.*.helpText' => ['nullable'],
            'fields.*.required' => ['boolean'],
            'fields.*.defaultValue' => ['nullable'],
            'fields.*.validation' => ['nullable', 'array'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.editorConfig' => ['nullable', 'array'],
            'fields.*.sliderConfig' => ['nullable', 'array'],
            'fields.*.mediaConfig' => ['nullable', 'array'],
            'fields.*.referenceConfig' => ['nullable', 'array'],
            'fields.*.conditional' => ['nullable', 'array'],
            'fields.*.grid' => ['nullable', 'string', Rule::in(CustomElement::GRID_SIZES)],
            'default_data' => ['nullable', 'array'],
            'preview_template' => ['nullable', 'string', 'max:100'],
            'css_class' => ['nullable', 'string', 'max:100'],
        ]);

        CustomElement::create([
            'type' => $validated['type'],
            'label' => $validated['label'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'category' => $validated['category'],
            'can_have_children' => $validated['can_have_children'] ?? false,
            'fields' => $validated['fields'] ?? [],
            'default_data' => $validated['default_data'] ?? [],
            'preview_template' => $validated['preview_template'] ?? null,
            'css_class' => $validated['css_class'] ?? null,
            'is_system' => false,
        ]);

        return redirect()
            ->route('settings.custom-elements.index')
            ->with('success', 'Custom element created successfully.');
    }

    /**
     * Show the edit form.
     */
    public function edit(CustomElement $customElement): Response
    {
        return Inertia::render('Settings/CustomElements/Edit', [
            'customElement' => $customElement,
            'categories' => CustomElement::CATEGORIES,
            'inputTypes' => CustomElement::INPUT_TYPES,
            'gridSizes' => CustomElement::GRID_SIZES,
        ]);
    }

    /**
     * Update the custom element.
     */
    public function update(Request $request, CustomElement $customElement): RedirectResponse
    {
        $validated = $request->validate([
            'type' => [
                'required',
                'string',
                'max:100',
                'regex:/^custom_[a-z][a-z0-9_]*$/',
                Rule::unique('mongodb.custom_elements', 'type')->ignore($customElement->_id, '_id'),
            ],
            'label' => ['required', 'array'],
            'label.en' => ['required', 'string', 'max:255'],
            'label.de' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'array'],
            'description.en' => ['nullable', 'string', 'max:500'],
            'description.de' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:50'],
            'category' => ['required', 'string', Rule::in(CustomElement::CATEGORIES)],
            'can_have_children' => ['boolean'],
            'fields' => ['array'],
            'fields.*.name' => ['required', 'string', 'max:100', 'regex:/^[a-z][a-zA-Z0-9_]*$/'],
            'fields.*.label' => ['required'],
            'fields.*.inputType' => ['required', 'string', Rule::in(CustomElement::INPUT_TYPES)],
            'fields.*.placeholder' => ['nullable'],
            'fields.*.helpText' => ['nullable'],
            'fields.*.required' => ['boolean'],
            'fields.*.defaultValue' => ['nullable'],
            'fields.*.validation' => ['nullable', 'array'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.editorConfig' => ['nullable', 'array'],
            'fields.*.sliderConfig' => ['nullable', 'array'],
            'fields.*.mediaConfig' => ['nullable', 'array'],
            'fields.*.referenceConfig' => ['nullable', 'array'],
            'fields.*.conditional' => ['nullable', 'array'],
            'fields.*.grid' => ['nullable', 'string', Rule::in(CustomElement::GRID_SIZES)],
            'default_data' => ['nullable', 'array'],
            'preview_template' => ['nullable', 'string', 'max:100'],
            'css_class' => ['nullable', 'string', 'max:100'],
        ]);

        // System elements can only update certain fields
        if ($customElement->is_system) {
            $customElement->update([
                'label' => $validated['label'],
                'description' => $validated['description'] ?? $customElement->description,
                'icon' => $validated['icon'] ?? $customElement->icon,
            ]);
        } else {
            $customElement->update([
                'type' => $validated['type'],
                'label' => $validated['label'],
                'description' => $validated['description'] ?? null,
                'icon' => $validated['icon'] ?? null,
                'category' => $validated['category'],
                'can_have_children' => $validated['can_have_children'] ?? false,
                'fields' => $validated['fields'] ?? [],
                'default_data' => $validated['default_data'] ?? [],
                'preview_template' => $validated['preview_template'] ?? null,
                'css_class' => $validated['css_class'] ?? null,
            ]);
        }

        return redirect()
            ->route('settings.custom-elements.index')
            ->with('success', 'Custom element updated successfully.');
    }

    /**
     * Delete the custom element.
     */
    public function destroy(CustomElement $customElement): RedirectResponse
    {
        if ($customElement->is_system) {
            return redirect()
                ->route('settings.custom-elements.index')
                ->with('error', 'System elements cannot be deleted.');
        }

        $customElement->delete();

        return redirect()
            ->route('settings.custom-elements.index')
            ->with('success', 'Custom element deleted successfully.');
    }

    /**
     * Duplicate a custom element.
     */
    public function duplicate(CustomElement $customElement): RedirectResponse
    {
        $newType = $customElement->type . '_copy';
        $counter = 1;

        while (CustomElement::where('type', $newType)->exists()) {
            $newType = $customElement->type . '_copy' . $counter;
            $counter++;
        }

        $newLabel = $customElement->label;
        if (is_array($newLabel)) {
            foreach ($newLabel as $locale => $value) {
                $newLabel[$locale] = $value . ' (Copy)';
            }
        } elseif (is_string($newLabel)) {
            $newLabel = $newLabel . ' (Copy)';
        }

        CustomElement::create([
            'type' => $newType,
            'label' => $newLabel,
            'description' => $customElement->description,
            'icon' => $customElement->icon,
            'category' => $customElement->category,
            'can_have_children' => $customElement->can_have_children,
            'fields' => $customElement->fields,
            'default_data' => $customElement->default_data,
            'preview_template' => $customElement->preview_template,
            'css_class' => $customElement->css_class,
            'is_system' => false,
        ]);

        return redirect()
            ->route('settings.custom-elements.index')
            ->with('success', 'Custom element duplicated successfully.');
    }

    /**
     * Get all custom elements as JSON for API usage.
     */
    public function list(): JsonResponse
    {
        $elements = CustomElement::orderBy('is_system', 'desc')
            ->orderBy('category')
            ->orderBy('order')
            ->get();

        return response()->json($elements);
    }

    /**
     * Reorder custom elements.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*' => ['required', 'string'],
        ]);

        foreach ($validated['items'] as $index => $type) {
            CustomElement::where('type', $type)->update(['order' => $index]);
        }

        return redirect()
            ->route('settings.custom-elements.index')
            ->with('success', 'Order updated successfully.');
    }
}
