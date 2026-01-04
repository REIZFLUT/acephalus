<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Mongodb\MediaMetaField;
use Illuminate\Database\Seeder;

class MediaMetaFieldSeeder extends Seeder
{
    /**
     * Default media meta fields to seed.
     *
     * @var array<array{slug: string, name: string, description: string|null, field_type: string, options: array|null, is_system: bool, required: bool, placeholder: string|null, order: int}>
     */
    protected array $fields = [
        [
            'slug' => 'alt',
            'name' => 'Alt Text',
            'description' => 'Alternative text for accessibility',
            'field_type' => 'text',
            'options' => null,
            'is_system' => true,
            'required' => false,
            'placeholder' => 'Describe the image for accessibility...',
            'order' => 1,
        ],
        [
            'slug' => 'caption',
            'name' => 'Caption',
            'description' => 'Visible caption below the media',
            'field_type' => 'text',
            'options' => null,
            'is_system' => true,
            'required' => false,
            'placeholder' => 'Optional visible caption...',
            'order' => 2,
        ],
        [
            'slug' => 'copyright',
            'name' => 'Copyright',
            'description' => 'Copyright information for the media',
            'field_type' => 'text',
            'options' => null,
            'is_system' => false,
            'required' => false,
            'placeholder' => 'e.g., © 2024 Photographer Name',
            'order' => 3,
        ],
        [
            'slug' => 'photographer',
            'name' => 'Photographer / Creator',
            'description' => 'Name of the photographer or creator',
            'field_type' => 'text',
            'options' => null,
            'is_system' => false,
            'required' => false,
            'placeholder' => 'Name of the creator...',
            'order' => 4,
        ],
        [
            'slug' => 'source',
            'name' => 'Source',
            'description' => 'Source or origin of the media',
            'field_type' => 'text',
            'options' => null,
            'is_system' => false,
            'required' => false,
            'placeholder' => 'e.g., agency name or URL...',
            'order' => 5,
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->fields as $field) {
            MediaMetaField::updateOrCreate(
                ['slug' => $field['slug']],
                $field
            );
        }

        $this->command->info('Media meta fields seeded successfully.');
    }
}
