<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Enums\ElementType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreElementRequest extends FormRequest
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
        return [
            'type' => [
                'required',
                'string',
                Rule::in(array_map(fn (ElementType $type) => $type->value, ElementType::cases())),
            ],
            'parent_id' => ['nullable', 'string'],
            'data' => ['required', 'array'],
            'order' => ['nullable', 'integer', 'min:0'],
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
            'type.in' => 'Invalid element type. Allowed types: '.implode(', ', array_map(
                fn (ElementType $type) => $type->value,
                ElementType::cases()
            )),
        ];
    }
}


