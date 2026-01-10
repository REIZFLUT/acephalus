<?php

use App\Models\Mongodb\CustomElement;
use App\Models\User;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

beforeEach(function () {
    Client::factory()->asPersonalAccessTokenClient()->create([
        'name' => 'Test Personal Access Client',
    ]);

    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    Passport::actingAs($this->user);

    // Clear any existing custom elements
    CustomElement::truncate();
});

// ============================================================================
// LIST ALL ELEMENTS
// ============================================================================

it('can list all custom elements via API', function () {
    CustomElement::create([
        'type' => 'custom_callout',
        'label' => ['en' => 'Callout', 'de' => 'Hervorhebung'],
        'category' => 'content',
        'can_have_children' => true,
        'is_system' => true,
        'fields' => [],
    ]);
    CustomElement::create([
        'type' => 'custom_card',
        'label' => ['en' => 'Card', 'de' => 'Karte'],
        'category' => 'layout',
        'can_have_children' => true,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->getJson('/api/v1/custom-elements');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'type',
                    'label',
                    'category',
                    'canHaveChildren',
                    'fields',
                ],
            ],
            'types',
            'categories',
        ])
        ->assertJsonCount(2, 'data')
        ->assertJsonCount(2, 'types');
});

it('returns elements in legacy format via API', function () {
    CustomElement::create([
        'type' => 'custom_test',
        'label' => ['en' => 'Test Element'],
        'category' => 'content',
        'can_have_children' => true,
        'is_system' => false,
        'default_data' => ['key' => 'value'],
        'preview_template' => 'test-template',
        'css_class' => 'test-class',
        'fields' => [],
    ]);

    $response = $this->getJson('/api/v1/custom-elements');

    $response->assertOk()
        ->assertJsonPath('data.0.type', 'custom_test')
        ->assertJsonPath('data.0.canHaveChildren', true)
        ->assertJsonPath('data.0.defaultData.key', 'value')
        ->assertJsonPath('data.0.previewTemplate', 'test-template')
        ->assertJsonPath('data.0.cssClass', 'test-class');
});

it('groups categories in API response', function () {
    CustomElement::create([
        'type' => 'custom_content_one',
        'label' => ['en' => 'Content One'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);
    CustomElement::create([
        'type' => 'custom_layout_one',
        'label' => ['en' => 'Layout One'],
        'category' => 'layout',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->getJson('/api/v1/custom-elements');

    $response->assertOk()
        ->assertJsonFragment(['categories' => ['content', 'layout']]);
});

// ============================================================================
// SHOW SINGLE ELEMENT
// ============================================================================

it('can show a specific custom element via API', function () {
    CustomElement::create([
        'type' => 'custom_specific',
        'label' => ['en' => 'Specific Element'],
        'description' => ['en' => 'A specific test element'],
        'icon' => 'star',
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [
            [
                'name' => 'title',
                'label' => ['en' => 'Title'],
                'inputType' => 'text',
                'required' => true,
            ],
        ],
        'default_data' => ['title' => 'Default Title'],
    ]);

    $response = $this->getJson('/api/v1/custom-elements/custom_specific');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'type',
                'label',
                'description',
                'icon',
                'category',
                'canHaveChildren',
                'fields',
            ],
            'defaultData',
        ])
        ->assertJsonPath('data.type', 'custom_specific')
        ->assertJsonPath('data.icon', 'star')
        ->assertJsonPath('defaultData.title', 'Default Title');
});

it('returns 404 for non-existent element', function () {
    $response = $this->getJson('/api/v1/custom-elements/custom_nonexistent');

    $response->assertNotFound()
        ->assertJson(['message' => 'Custom element type not found.']);
});

// ============================================================================
// GET DEFAULTS
// ============================================================================

it('can get default data for an element via API', function () {
    CustomElement::create([
        'type' => 'custom_with_defaults',
        'label' => ['en' => 'With Defaults'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'default_data' => [
            'color' => 'blue',
            'size' => 'medium',
        ],
        'fields' => [
            [
                'name' => 'title',
                'label' => ['en' => 'Title'],
                'inputType' => 'text',
                'defaultValue' => 'Default Title',
            ],
        ],
    ]);

    $response = $this->getJson('/api/v1/custom-elements/custom_with_defaults/defaults');

    $response->assertOk()
        ->assertJsonStructure(['data'])
        ->assertJsonPath('data.color', 'blue')
        ->assertJsonPath('data.size', 'medium')
        ->assertJsonPath('data.title', 'Default Title');
});

it('returns 404 for defaults of non-existent element', function () {
    $response = $this->getJson('/api/v1/custom-elements/custom_nonexistent/defaults');

    $response->assertNotFound()
        ->assertJson(['message' => 'Custom element type not found.']);
});

// ============================================================================
// VALIDATE DATA
// ============================================================================

it('can validate valid element data via API', function () {
    CustomElement::create([
        'type' => 'custom_validatable',
        'label' => ['en' => 'Validatable'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [
            [
                'name' => 'title',
                'label' => ['en' => 'Title'],
                'inputType' => 'text',
                'required' => true,
            ],
            [
                'name' => 'description',
                'label' => ['en' => 'Description'],
                'inputType' => 'textarea',
                'required' => false,
            ],
        ],
    ]);

    $response = $this->postJson('/api/v1/custom-elements/custom_validatable/validate', [
        'data' => [
            'title' => 'Valid Title',
        ],
    ]);

    $response->assertOk()
        ->assertJson(['valid' => true]);
});

it('returns validation errors for invalid element data', function () {
    CustomElement::create([
        'type' => 'custom_strict',
        'label' => ['en' => 'Strict'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [
            [
                'name' => 'requiredField',
                'label' => ['en' => 'Required Field'],
                'inputType' => 'text',
                'required' => true,
            ],
        ],
    ]);

    $response = $this->postJson('/api/v1/custom-elements/custom_strict/validate', [
        'data' => [
            // Missing required field
        ],
    ]);

    $response->assertStatus(422)
        ->assertJson(['valid' => false])
        ->assertJsonStructure(['errors']);
});

it('returns 404 for validation of non-existent element', function () {
    $response = $this->postJson('/api/v1/custom-elements/custom_nonexistent/validate', [
        'data' => [],
    ]);

    $response->assertNotFound()
        ->assertJson(['message' => 'Custom element type not found.']);
});

// ============================================================================
// REFRESH CACHE
// ============================================================================

it('can refresh custom elements cache via API', function () {
    CustomElement::create([
        'type' => 'custom_cached',
        'label' => ['en' => 'Cached'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->postJson('/api/v1/custom-elements/refresh');

    $response->assertOk()
        ->assertJsonStructure([
            'message',
            'count',
            'types',
        ])
        ->assertJson(['message' => 'Custom elements cache refreshed.'])
        ->assertJsonPath('count', 1);
});


// ============================================================================
// FIELD TYPES
// ============================================================================

it('returns elements with various field types correctly', function () {
    CustomElement::create([
        'type' => 'custom_complex',
        'label' => ['en' => 'Complex Element'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [
            [
                'name' => 'textField',
                'label' => ['en' => 'Text'],
                'inputType' => 'text',
                'required' => true,
                'grid' => 'half',
            ],
            [
                'name' => 'selectField',
                'label' => ['en' => 'Select'],
                'inputType' => 'select',
                'required' => false,
                'grid' => 'half',
                'options' => [
                    ['value' => 'option1', 'label' => 'Option 1'],
                    ['value' => 'option2', 'label' => 'Option 2'],
                ],
            ],
            [
                'name' => 'switchField',
                'label' => ['en' => 'Switch'],
                'inputType' => 'switch',
                'required' => false,
                'defaultValue' => true,
            ],
            [
                'name' => 'editorField',
                'label' => ['en' => 'Rich Text'],
                'inputType' => 'editor',
                'required' => false,
                'grid' => 'full',
            ],
        ],
    ]);

    $response = $this->getJson('/api/v1/custom-elements/custom_complex');

    $response->assertOk()
        ->assertJsonPath('data.fields.0.inputType', 'text')
        ->assertJsonPath('data.fields.1.inputType', 'select')
        ->assertJsonPath('data.fields.1.options.0.value', 'option1')
        ->assertJsonPath('data.fields.2.inputType', 'switch')
        ->assertJsonPath('data.fields.2.defaultValue', true)
        ->assertJsonPath('data.fields.3.inputType', 'editor');
});

// ============================================================================
// CATEGORIES
// ============================================================================

it('returns elements from all categories', function () {
    foreach (['content', 'data', 'layout', 'interactive', 'media'] as $index => $category) {
        CustomElement::create([
            'type' => "custom_{$category}_element",
            'label' => ['en' => ucfirst($category) . ' Element'],
            'category' => $category,
            'can_have_children' => false,
            'is_system' => false,
            'fields' => [],
            'order' => $index,
        ]);
    }

    $response = $this->getJson('/api/v1/custom-elements');

    $response->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonCount(5, 'categories');
});
