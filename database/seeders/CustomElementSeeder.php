<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Mongodb\CustomElement;
use Illuminate\Database\Seeder;

class CustomElementSeeder extends Seeder
{
    /**
     * Default custom elements to seed.
     *
     * @var array<array<string, mixed>>
     */
    protected array $elements = [
        // Content Elements
        [
            'type' => 'custom_callout',
            'label' => ['en' => 'Callout', 'de' => 'Hervorhebung'],
            'description' => ['en' => 'Highlighted content box with optional icon', 'de' => 'Hervorgehobener Inhaltsbereich mit optionalem Symbol'],
            'icon' => 'message-square',
            'category' => 'content',
            'can_have_children' => true,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'variant',
                    'label' => ['en' => 'Variant', 'de' => 'Variante'],
                    'inputType' => 'select',
                    'required' => false,
                    'grid' => 'half',
                    'options' => [
                        ['value' => 'info', 'label' => 'Info'],
                        ['value' => 'warning', 'label' => 'Warning'],
                        ['value' => 'success', 'label' => 'Success'],
                        ['value' => 'error', 'label' => 'Error'],
                    ],
                    'defaultValue' => 'info',
                ],
                [
                    'name' => 'title',
                    'label' => ['en' => 'Title', 'de' => 'Titel'],
                    'inputType' => 'text',
                    'required' => false,
                    'grid' => 'half',
                    'placeholder' => ['en' => 'Optional title...', 'de' => 'Optionaler Titel...'],
                ],
            ],
            'default_data' => [
                'variant' => 'info',
            ],
            'css_class' => 'callout',
            'order' => 1,
        ],
        [
            'type' => 'custom_accordion',
            'label' => ['en' => 'Accordion', 'de' => 'Akkordeon'],
            'description' => ['en' => 'Collapsible content sections', 'de' => 'Einklappbare Inhaltsbereiche'],
            'icon' => 'chevrons-down-up',
            'category' => 'interactive',
            'can_have_children' => true,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'allowMultiple',
                    'label' => ['en' => 'Allow Multiple Open', 'de' => 'Mehrere gleichzeitig öffnen'],
                    'inputType' => 'switch',
                    'required' => false,
                    'grid' => 'half',
                    'defaultValue' => false,
                ],
                [
                    'name' => 'defaultOpen',
                    'label' => ['en' => 'Default Open Index', 'de' => 'Standardmäßig geöffneter Index'],
                    'inputType' => 'number',
                    'required' => false,
                    'grid' => 'half',
                    'placeholder' => ['en' => '0 for first item', 'de' => '0 für erstes Element'],
                ],
            ],
            'default_data' => [
                'allowMultiple' => false,
            ],
            'css_class' => 'accordion',
            'order' => 2,
        ],
        [
            'type' => 'custom_accordion_item',
            'label' => ['en' => 'Accordion Item', 'de' => 'Akkordeon-Element'],
            'description' => ['en' => 'Single accordion section with title and content', 'de' => 'Einzelner Akkordeon-Bereich mit Titel und Inhalt'],
            'icon' => 'chevron-down',
            'category' => 'interactive',
            'can_have_children' => true,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'title',
                    'label' => ['en' => 'Title', 'de' => 'Titel'],
                    'inputType' => 'text',
                    'required' => true,
                    'grid' => 'full',
                    'placeholder' => ['en' => 'Accordion section title', 'de' => 'Titel des Akkordeon-Bereichs'],
                ],
            ],
            'default_data' => [],
            'css_class' => 'accordion-item',
            'order' => 3,
        ],
        [
            'type' => 'custom_tabs',
            'label' => ['en' => 'Tabs', 'de' => 'Tabs'],
            'description' => ['en' => 'Tabbed content container', 'de' => 'Tab-basierter Inhaltscontainer'],
            'icon' => 'layout-panel-top',
            'category' => 'interactive',
            'can_have_children' => true,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'defaultTab',
                    'label' => ['en' => 'Default Tab Index', 'de' => 'Standard-Tab-Index'],
                    'inputType' => 'number',
                    'required' => false,
                    'grid' => 'half',
                    'placeholder' => ['en' => '0 for first tab', 'de' => '0 für ersten Tab'],
                    'defaultValue' => 0,
                ],
            ],
            'default_data' => [
                'defaultTab' => 0,
            ],
            'css_class' => 'tabs',
            'order' => 4,
        ],
        [
            'type' => 'custom_tab',
            'label' => ['en' => 'Tab', 'de' => 'Tab'],
            'description' => ['en' => 'Single tab with label and content', 'de' => 'Einzelner Tab mit Label und Inhalt'],
            'icon' => 'square',
            'category' => 'interactive',
            'can_have_children' => true,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'label',
                    'label' => ['en' => 'Tab Label', 'de' => 'Tab-Beschriftung'],
                    'inputType' => 'text',
                    'required' => true,
                    'grid' => 'half',
                    'placeholder' => ['en' => 'Tab name', 'de' => 'Tab-Name'],
                ],
                [
                    'name' => 'icon',
                    'label' => ['en' => 'Icon', 'de' => 'Symbol'],
                    'inputType' => 'text',
                    'required' => false,
                    'grid' => 'half',
                    'placeholder' => ['en' => 'lucide icon name', 'de' => 'Lucide-Symbolname'],
                ],
            ],
            'default_data' => [],
            'css_class' => 'tab',
            'order' => 5,
        ],
        [
            'type' => 'custom_card',
            'label' => ['en' => 'Card', 'de' => 'Karte'],
            'description' => ['en' => 'Content card with optional header and footer', 'de' => 'Inhaltskarte mit optionalem Header und Footer'],
            'icon' => 'square',
            'category' => 'layout',
            'can_have_children' => true,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'title',
                    'label' => ['en' => 'Title', 'de' => 'Titel'],
                    'inputType' => 'text',
                    'required' => false,
                    'grid' => 'half',
                ],
                [
                    'name' => 'subtitle',
                    'label' => ['en' => 'Subtitle', 'de' => 'Untertitel'],
                    'inputType' => 'text',
                    'required' => false,
                    'grid' => 'half',
                ],
                [
                    'name' => 'variant',
                    'label' => ['en' => 'Variant', 'de' => 'Variante'],
                    'inputType' => 'select',
                    'required' => false,
                    'grid' => 'half',
                    'options' => [
                        ['value' => 'default', 'label' => 'Default'],
                        ['value' => 'outlined', 'label' => 'Outlined'],
                        ['value' => 'elevated', 'label' => 'Elevated'],
                    ],
                    'defaultValue' => 'default',
                ],
            ],
            'default_data' => [
                'variant' => 'default',
            ],
            'css_class' => 'card',
            'order' => 6,
        ],
        [
            'type' => 'custom_code_block',
            'label' => ['en' => 'Code Block', 'de' => 'Code-Block'],
            'description' => ['en' => 'Syntax highlighted code snippet', 'de' => 'Syntaxhervorgehobenes Code-Snippet'],
            'icon' => 'code',
            'category' => 'content',
            'can_have_children' => false,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'code',
                    'label' => ['en' => 'Code', 'de' => 'Code'],
                    'inputType' => 'code',
                    'required' => true,
                    'grid' => 'full',
                ],
                [
                    'name' => 'language',
                    'label' => ['en' => 'Language', 'de' => 'Sprache'],
                    'inputType' => 'select',
                    'required' => false,
                    'grid' => 'half',
                    'options' => [
                        ['value' => 'javascript', 'label' => 'JavaScript'],
                        ['value' => 'typescript', 'label' => 'TypeScript'],
                        ['value' => 'php', 'label' => 'PHP'],
                        ['value' => 'python', 'label' => 'Python'],
                        ['value' => 'html', 'label' => 'HTML'],
                        ['value' => 'css', 'label' => 'CSS'],
                        ['value' => 'json', 'label' => 'JSON'],
                        ['value' => 'bash', 'label' => 'Bash'],
                        ['value' => 'sql', 'label' => 'SQL'],
                    ],
                    'defaultValue' => 'javascript',
                ],
                [
                    'name' => 'showLineNumbers',
                    'label' => ['en' => 'Show Line Numbers', 'de' => 'Zeilennummern anzeigen'],
                    'inputType' => 'switch',
                    'required' => false,
                    'grid' => 'quarter',
                    'defaultValue' => true,
                ],
                [
                    'name' => 'filename',
                    'label' => ['en' => 'Filename', 'de' => 'Dateiname'],
                    'inputType' => 'text',
                    'required' => false,
                    'grid' => 'quarter',
                    'placeholder' => ['en' => 'e.g. index.js', 'de' => 'z.B. index.js'],
                ],
            ],
            'default_data' => [
                'language' => 'javascript',
                'showLineNumbers' => true,
            ],
            'css_class' => 'code-block',
            'order' => 7,
        ],
        [
            'type' => 'custom_embed',
            'label' => ['en' => 'Embed', 'de' => 'Einbettung'],
            'description' => ['en' => 'Embed external content (YouTube, Vimeo, etc.)', 'de' => 'Externe Inhalte einbetten (YouTube, Vimeo, etc.)'],
            'icon' => 'play-circle',
            'category' => 'media',
            'can_have_children' => false,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'url',
                    'label' => ['en' => 'URL', 'de' => 'URL'],
                    'inputType' => 'url',
                    'required' => true,
                    'grid' => 'full',
                    'placeholder' => ['en' => 'https://youtube.com/watch?v=...', 'de' => 'https://youtube.com/watch?v=...'],
                ],
                [
                    'name' => 'aspectRatio',
                    'label' => ['en' => 'Aspect Ratio', 'de' => 'Seitenverhältnis'],
                    'inputType' => 'select',
                    'required' => false,
                    'grid' => 'half',
                    'options' => [
                        ['value' => '16:9', 'label' => '16:9 (Widescreen)'],
                        ['value' => '4:3', 'label' => '4:3 (Standard)'],
                        ['value' => '1:1', 'label' => '1:1 (Square)'],
                        ['value' => '9:16', 'label' => '9:16 (Portrait)'],
                    ],
                    'defaultValue' => '16:9',
                ],
                [
                    'name' => 'caption',
                    'label' => ['en' => 'Caption', 'de' => 'Beschriftung'],
                    'inputType' => 'text',
                    'required' => false,
                    'grid' => 'half',
                ],
            ],
            'default_data' => [
                'aspectRatio' => '16:9',
            ],
            'css_class' => 'embed',
            'order' => 8,
        ],
        [
            'type' => 'custom_divider',
            'label' => ['en' => 'Divider', 'de' => 'Trennlinie'],
            'description' => ['en' => 'Visual separator between content sections', 'de' => 'Visuelle Trennung zwischen Inhaltsbereichen'],
            'icon' => 'minus',
            'category' => 'layout',
            'can_have_children' => false,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'style',
                    'label' => ['en' => 'Style', 'de' => 'Stil'],
                    'inputType' => 'select',
                    'required' => false,
                    'grid' => 'half',
                    'options' => [
                        ['value' => 'solid', 'label' => 'Solid'],
                        ['value' => 'dashed', 'label' => 'Dashed'],
                        ['value' => 'dotted', 'label' => 'Dotted'],
                    ],
                    'defaultValue' => 'solid',
                ],
                [
                    'name' => 'spacing',
                    'label' => ['en' => 'Spacing', 'de' => 'Abstand'],
                    'inputType' => 'select',
                    'required' => false,
                    'grid' => 'half',
                    'options' => [
                        ['value' => 'small', 'label' => 'Small'],
                        ['value' => 'medium', 'label' => 'Medium'],
                        ['value' => 'large', 'label' => 'Large'],
                    ],
                    'defaultValue' => 'medium',
                ],
            ],
            'default_data' => [
                'style' => 'solid',
                'spacing' => 'medium',
            ],
            'css_class' => 'divider',
            'order' => 9,
        ],
        [
            'type' => 'custom_button',
            'label' => ['en' => 'Button', 'de' => 'Button'],
            'description' => ['en' => 'Call-to-action button with link', 'de' => 'Call-to-Action-Button mit Link'],
            'icon' => 'mouse-pointer-click',
            'category' => 'interactive',
            'can_have_children' => false,
            'is_system' => true,
            'fields' => [
                [
                    'name' => 'text',
                    'label' => ['en' => 'Button Text', 'de' => 'Button-Text'],
                    'inputType' => 'text',
                    'required' => true,
                    'grid' => 'half',
                    'placeholder' => ['en' => 'Click here', 'de' => 'Hier klicken'],
                ],
                [
                    'name' => 'url',
                    'label' => ['en' => 'URL', 'de' => 'URL'],
                    'inputType' => 'url',
                    'required' => true,
                    'grid' => 'half',
                ],
                [
                    'name' => 'variant',
                    'label' => ['en' => 'Variant', 'de' => 'Variante'],
                    'inputType' => 'select',
                    'required' => false,
                    'grid' => 'third',
                    'options' => [
                        ['value' => 'primary', 'label' => 'Primary'],
                        ['value' => 'secondary', 'label' => 'Secondary'],
                        ['value' => 'outline', 'label' => 'Outline'],
                        ['value' => 'ghost', 'label' => 'Ghost'],
                    ],
                    'defaultValue' => 'primary',
                ],
                [
                    'name' => 'size',
                    'label' => ['en' => 'Size', 'de' => 'Größe'],
                    'inputType' => 'select',
                    'required' => false,
                    'grid' => 'third',
                    'options' => [
                        ['value' => 'small', 'label' => 'Small'],
                        ['value' => 'medium', 'label' => 'Medium'],
                        ['value' => 'large', 'label' => 'Large'],
                    ],
                    'defaultValue' => 'medium',
                ],
                [
                    'name' => 'openInNewTab',
                    'label' => ['en' => 'Open in New Tab', 'de' => 'In neuem Tab öffnen'],
                    'inputType' => 'switch',
                    'required' => false,
                    'grid' => 'third',
                    'defaultValue' => false,
                ],
            ],
            'default_data' => [
                'variant' => 'primary',
                'size' => 'medium',
                'openInNewTab' => false,
            ],
            'css_class' => 'button',
            'order' => 10,
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->elements as $element) {
            CustomElement::updateOrCreate(
                ['type' => $element['type']],
                $element
            );
        }

        $this->command->info('Custom elements seeded successfully (' . count($this->elements) . ' elements).');
    }
}
