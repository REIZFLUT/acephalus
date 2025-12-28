<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
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
     * @return array<string, array<string>>
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:102400', // 100 MB
                'mimes:jpeg,jpg,png,gif,webp,svg,mp4,webm,ogg,mp3,wav,pdf,doc,docx',
            ],
            'alt' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:1000'],
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
            'file.max' => 'The file must not be larger than 100 MB.',
            'file.mimes' => 'The file must be an image, video, audio, or document file.',
        ];
    }
}


