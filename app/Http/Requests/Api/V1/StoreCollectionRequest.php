<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Enums\ElementType;
use App\Models\Mongodb\Collection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreCollectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->filled('name') && ! $this->filled('slug')) {
            $this->merge([
                'slug' => Str::slug($this->input('name')),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique(Collection::class, 'slug'),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'schema' => ['nullable', 'array'],
            'schema.allowed_element_types' => ['nullable', 'array'],
            'schema.allowed_element_types.*' => [
                'string',
                Rule::in(array_map(fn (ElementType $type) => $type->value, ElementType::cases())),
            ],
            'schema.required_fields' => ['nullable', 'array'],
            'schema.min_elements' => ['nullable', 'integer', 'min:0'],
            'schema.max_elements' => ['nullable', 'integer', 'min:1'],
            'schema.collection_meta_fields' => ['nullable', 'array'],
            'schema.collection_meta_fields.*.name' => ['required_with:schema.collection_meta_fields', 'string', 'max:255'],
            'schema.collection_meta_fields.*.label' => ['required_with:schema.collection_meta_fields', 'string', 'max:255'],
            'schema.collection_meta_fields.*.type' => ['required_with:schema.collection_meta_fields', 'string'],
            'schema.collection_meta_fields.*.required' => ['nullable', 'boolean'],
            'schema.collection_meta_fields.*.options' => ['nullable', 'array'],
            'schema.collection_meta_fields.*.input_style' => ['nullable', 'string', 'in:dropdown,combobox,tags,radio,checkbox,toggle_group'],
            'schema.collection_meta_fields.*.allow_custom' => ['nullable', 'boolean'],
            'schema.content_meta_fields' => ['nullable', 'array'],
            'schema.content_meta_fields.*.name' => ['required_with:schema.content_meta_fields', 'string', 'max:255'],
            'schema.content_meta_fields.*.label' => ['required_with:schema.content_meta_fields', 'string', 'max:255'],
            'schema.content_meta_fields.*.type' => ['required_with:schema.content_meta_fields', 'string'],
            'schema.content_meta_fields.*.required' => ['nullable', 'boolean'],
            'schema.content_meta_fields.*.options' => ['nullable', 'array'],
            'schema.content_meta_fields.*.input_style' => ['nullable', 'string', 'in:dropdown,combobox,tags,radio,checkbox,toggle_group'],
            'schema.content_meta_fields.*.allow_custom' => ['nullable', 'boolean'],
            'schema.element_meta_fields' => ['nullable', 'array'],
            'collection_meta' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
        ];
    }

    /**
     * Get custom error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug must only contain lowercase letters, numbers, and hyphens.',
            'slug.unique' => 'A collection with this slug already exists.',
        ];
    }
}
