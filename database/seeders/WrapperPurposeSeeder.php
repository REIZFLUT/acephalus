<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Mongodb\WrapperPurpose;
use Illuminate\Database\Seeder;

class WrapperPurposeSeeder extends Seeder
{
    /**
     * Default wrapper purposes to seed.
     *
     * @var array<array{slug: string, name: string, description: string, icon: string|null, css_class: string|null, is_system: bool}>
     */
    protected array $purposes = [
        [
            'slug' => 'generic',
            'name' => 'Generic Container',
            'description' => 'A generic wrapper for grouping content',
            'icon' => 'box',
            'css_class' => null,
            'is_system' => true,
        ],
        [
            'slug' => 'infobox',
            'name' => 'Infobox',
            'description' => 'Highlighted information box',
            'icon' => 'info',
            'css_class' => 'infobox',
            'is_system' => false,
        ],
        [
            'slug' => 'warning',
            'name' => 'Warning',
            'description' => 'Warning or caution message',
            'icon' => 'alert-triangle',
            'css_class' => 'warning',
            'is_system' => false,
        ],
        [
            'slug' => 'success',
            'name' => 'Success',
            'description' => 'Success or positive message',
            'icon' => 'check-circle',
            'css_class' => 'success',
            'is_system' => false,
        ],
        [
            'slug' => 'tip',
            'name' => 'Tip',
            'description' => 'Helpful tip or suggestion',
            'icon' => 'lightbulb',
            'css_class' => 'tip',
            'is_system' => false,
        ],
        [
            'slug' => 'quote',
            'name' => 'Quote',
            'description' => 'Blockquote or citation',
            'icon' => 'quote',
            'css_class' => 'quote',
            'is_system' => false,
        ],
        [
            'slug' => 'accordion',
            'name' => 'Accordion',
            'description' => 'Collapsible content section',
            'icon' => 'chevron-down',
            'css_class' => 'accordion',
            'is_system' => false,
        ],
        [
            'slug' => 'slider',
            'name' => 'Slider',
            'description' => 'Carousel or slideshow container',
            'icon' => 'images',
            'css_class' => 'slider',
            'is_system' => false,
        ],
        [
            'slug' => 'columns',
            'name' => 'Columns',
            'description' => 'Multi-column layout',
            'icon' => 'columns',
            'css_class' => 'columns',
            'is_system' => false,
        ],
        [
            'slug' => 'grid',
            'name' => 'Grid',
            'description' => 'Grid layout container',
            'icon' => 'grid',
            'css_class' => 'grid',
            'is_system' => false,
        ],
        [
            'slug' => 'callout',
            'name' => 'Callout',
            'description' => 'Call-to-action or highlighted section',
            'icon' => 'megaphone',
            'css_class' => 'callout',
            'is_system' => false,
        ],
        [
            'slug' => 'code',
            'name' => 'Code Block',
            'description' => 'Code snippet container with syntax highlighting',
            'icon' => 'code',
            'css_class' => 'code-block',
            'is_system' => false,
        ],
        [
            'slug' => 'example',
            'name' => 'Example',
            'description' => 'Example or demonstration section',
            'icon' => 'file-text',
            'css_class' => 'example',
            'is_system' => false,
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->purposes as $purpose) {
            WrapperPurpose::updateOrCreate(
                ['slug' => $purpose['slug']],
                $purpose
            );
        }

        $this->command->info('Wrapper purposes seeded successfully.');
    }
}

