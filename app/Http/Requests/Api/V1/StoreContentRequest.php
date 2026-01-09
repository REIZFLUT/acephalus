<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Models\Mongodb\Content;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreContentRequest extends FormRequest
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
        if ($this->filled('title') && ! $this->filled('slug')) {
            $this->merge([
                'slug' => Str::slug($this->input('title')),
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
        $collection = $this->route('collection');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
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
            'metadata' => ['nullable', 'array'],
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
        ];
    }
}
