<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Models\Mongodb\Content;
use Illuminate\Foundation\Http\FormRequest;

class UpdateContentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        $content = $this->route('content');

        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
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
            'metadata' => ['nullable', 'array'],
            'elements' => ['nullable', 'array'],
            'change_note' => ['nullable', 'string', 'max:500'],
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
