<?php

use App\Models\Mongodb\CustomElement;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    $this->actingAs($this->user);

    // Clear any existing custom elements
    CustomElement::truncate();
});

// ============================================================================
// INDEX / LIST
// ============================================================================

it('can view custom elements index page', function () {
    CustomElement::create([
        'type' => 'custom_test_element',
        'label' => ['en' => 'Test Element', 'de' => 'Test-Element'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->get('/settings/custom-elements');

    $response->assertOk();
});

it('can get custom elements list as json', function () {
    CustomElement::create([
        'type' => 'custom_test_one',
        'label' => ['en' => 'Test One'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);
    CustomElement::create([
        'type' => 'custom_test_two',
        'label' => ['en' => 'Test Two'],
        'category' => 'layout',
        'can_have_children' => true,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->getJson('/settings/custom-elements/list');

    $response->assertOk()
        ->assertJsonCount(2);
});

// ============================================================================
// CREATE
// ============================================================================

it('can view create custom element page', function () {
    $response = $this->get('/settings/custom-elements/create');

    $response->assertOk();
});

it('can create a custom element', function () {
    $response = $this->post('/settings/custom-elements', [
        'type' => 'custom_my_element',
        'label' => ['en' => 'My Custom Element', 'de' => 'Mein benutzerdefiniertes Element'],
        'description' => ['en' => 'A test element', 'de' => 'Ein Test-Element'],
        'icon' => 'star',
        'category' => 'content',
        'can_have_children' => false,
        'fields' => [
            [
                'name' => 'title',
                'label' => ['en' => 'Title'],
                'inputType' => 'text',
                'required' => true,
                'grid' => 'full',
            ],
        ],
    ]);

    $response->assertRedirect('/settings/custom-elements');

    $element = CustomElement::where('type', 'custom_my_element')->first();
    expect($element)->not->toBeNull();
    expect($element->label)->toEqual(['en' => 'My Custom Element', 'de' => 'Mein benutzerdefiniertes Element']);
    expect($element->category)->toBe('content');
    expect($element->can_have_children)->toBe(false);
    expect($element->is_system)->toBe(false);
    expect($element->fields)->toHaveCount(1);
});

it('validates type format on create', function () {
    $response = $this->post('/settings/custom-elements', [
        'type' => 'invalid_type', // Missing 'custom_' prefix
        'label' => ['en' => 'Invalid Element'],
        'category' => 'content',
    ]);

    $response->assertSessionHasErrors(['type']);
});

it('validates type uniqueness on create', function () {
    CustomElement::create([
        'type' => 'custom_existing',
        'label' => ['en' => 'Existing'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->post('/settings/custom-elements', [
        'type' => 'custom_existing',
        'label' => ['en' => 'Duplicate'],
        'category' => 'content',
    ]);

    $response->assertSessionHasErrors(['type']);
});

it('validates required fields on create', function () {
    $response = $this->post('/settings/custom-elements', [
        'type' => '',
        'label' => ['en' => ''],
        'category' => '',
    ]);

    $response->assertSessionHasErrors(['type', 'label.en', 'category']);
});

it('validates category value on create', function () {
    $response = $this->post('/settings/custom-elements', [
        'type' => 'custom_test',
        'label' => ['en' => 'Test'],
        'category' => 'invalid_category',
    ]);

    $response->assertSessionHasErrors(['category']);
});

// ============================================================================
// EDIT / UPDATE
// ============================================================================

it('can view edit custom element page', function () {
    $element = CustomElement::create([
        'type' => 'custom_editable',
        'label' => ['en' => 'Editable'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->get("/settings/custom-elements/{$element->type}/edit");

    $response->assertOk();
});

it('can update a custom element', function () {
    $element = CustomElement::create([
        'type' => 'custom_updateable',
        'label' => ['en' => 'Original Label'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->put("/settings/custom-elements/{$element->type}", [
        'type' => 'custom_updateable', // Type is required in update
        'label' => ['en' => 'Updated Label', 'de' => 'Aktualisiertes Label'],
        'description' => ['en' => 'Updated description'],
        'icon' => 'edit',
        'category' => 'layout',
        'can_have_children' => true,
        'fields' => [],
    ]);

    $response->assertRedirect('/settings/custom-elements');

    $element->refresh();
    expect($element->label)->toEqual(['en' => 'Updated Label', 'de' => 'Aktualisiertes Label']);
    expect($element->category)->toBe('layout');
    expect($element->can_have_children)->toBe(true);
});

it('can update system element with limited fields', function () {
    $element = CustomElement::create([
        'type' => 'custom_system_element',
        'label' => ['en' => 'System Element'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => true,
        'fields' => [],
    ]);

    $response = $this->put("/settings/custom-elements/{$element->type}", [
        'type' => 'custom_system_element',
        'label' => ['en' => 'Updated System Element'],
        'description' => ['en' => 'Updated description'],
        'icon' => 'shield',
        'category' => 'content',
        'can_have_children' => false,
        'fields' => [],
    ]);

    $response->assertRedirect('/settings/custom-elements');

    $element->refresh();
    expect($element->label)->toEqual(['en' => 'Updated System Element']);
    // Category should remain unchanged for system elements
    expect($element->category)->toBe('content');
});

// ============================================================================
// DELETE
// ============================================================================

it('can delete a custom element', function () {
    $element = CustomElement::create([
        'type' => 'custom_deletable',
        'label' => ['en' => 'Deletable'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);

    $response = $this->delete("/settings/custom-elements/{$element->type}");

    $response->assertRedirect('/settings/custom-elements');

    expect(CustomElement::where('type', 'custom_deletable')->exists())->toBe(false);
});

it('cannot delete a system element', function () {
    $element = CustomElement::create([
        'type' => 'custom_system',
        'label' => ['en' => 'System'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => true,
        'fields' => [],
    ]);

    $response = $this->delete("/settings/custom-elements/{$element->type}");

    // Controller redirects with error message instead of returning 403
    $response->assertRedirect('/settings/custom-elements');

    // Element should still exist
    expect(CustomElement::where('type', 'custom_system')->exists())->toBe(true);
});

// ============================================================================
// DUPLICATE
// ============================================================================

it('can duplicate a custom element', function () {
    $element = CustomElement::create([
        'type' => 'custom_original',
        'label' => ['en' => 'Original Element'],
        'description' => ['en' => 'Original description'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [
            [
                'name' => 'title',
                'label' => ['en' => 'Title'],
                'inputType' => 'text',
                'required' => true,
                'grid' => 'full',
            ],
        ],
    ]);

    $response = $this->post("/settings/custom-elements/{$element->type}/duplicate");

    $response->assertRedirect();

    $duplicate = CustomElement::where('type', 'like', 'custom_original_copy%')->first();
    expect($duplicate)->not->toBeNull();
    expect($duplicate->label['en'])->toContain('Copy');
    expect($duplicate->is_system)->toBe(false);
    expect($duplicate->fields)->toHaveCount(1);
});

// ============================================================================
// REORDER
// ============================================================================

it('can reorder custom elements', function () {
    $element1 = CustomElement::create([
        'type' => 'custom_first',
        'label' => ['en' => 'First'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
        'order' => 0,
    ]);
    $element2 = CustomElement::create([
        'type' => 'custom_second',
        'label' => ['en' => 'Second'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
        'order' => 1,
    ]);

    $response = $this->postJson('/settings/custom-elements/reorder', [
        'items' => ['custom_second', 'custom_first'],
    ]);

    $response->assertRedirect();

    $element1->refresh();
    $element2->refresh();

    expect($element2->order)->toBe(0);
    expect($element1->order)->toBe(1);
});

// ============================================================================
// PERMISSIONS
// ============================================================================

it('requires permission to view custom elements', function () {
    $userWithoutPermission = User::factory()->create();
    $userWithoutPermission->assignRole('author'); // Author doesn't have custom-elements.view

    $this->actingAs($userWithoutPermission);

    $response = $this->get('/settings/custom-elements');

    $response->assertStatus(403);
});

it('requires permission to create custom elements', function () {
    $userWithoutPermission = User::factory()->create();
    $userWithoutPermission->assignRole('author');

    $this->actingAs($userWithoutPermission);

    $response = $this->post('/settings/custom-elements', [
        'type' => 'custom_test',
        'label' => ['en' => 'Test'],
        'category' => 'content',
    ]);

    $response->assertStatus(403);
});

it('requires permission to delete custom elements', function () {
    $element = CustomElement::create([
        'type' => 'custom_protected',
        'label' => ['en' => 'Protected'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'fields' => [],
    ]);

    $userWithoutPermission = User::factory()->create();
    $userWithoutPermission->assignRole('author');

    $this->actingAs($userWithoutPermission);

    $response = $this->delete("/settings/custom-elements/{$element->type}");

    $response->assertStatus(403);
});

// ============================================================================
// MODEL METHODS
// ============================================================================

it('generates valid type from label', function () {
    $type = CustomElement::generateType('My Custom Element');
    expect($type)->toBe('custom_my_custom_element');

    $type = CustomElement::generateType('Über spezial Element!');
    expect($type)->toBe('custom_ber_spezial_element');
});

it('validates type format correctly', function () {
    expect(CustomElement::isValidType('custom_valid'))->toBe(true);
    expect(CustomElement::isValidType('custom_valid_element'))->toBe(true);
    expect(CustomElement::isValidType('custom_valid123'))->toBe(true);

    expect(CustomElement::isValidType('invalid'))->toBe(false);
    expect(CustomElement::isValidType('custom_'))->toBe(false);
    expect(CustomElement::isValidType('custom_123invalid'))->toBe(false);
    expect(CustomElement::isValidType('CUSTOM_UPPERCASE'))->toBe(false);
});

it('computes default data from fields', function () {
    $element = CustomElement::create([
        'type' => 'custom_with_defaults',
        'label' => ['en' => 'With Defaults'],
        'category' => 'content',
        'can_have_children' => false,
        'is_system' => false,
        'default_data' => [
            'explicitDefault' => 'explicit',
        ],
        'fields' => [
            [
                'name' => 'fieldWithDefault',
                'label' => ['en' => 'Field'],
                'inputType' => 'text',
                'defaultValue' => 'field default',
            ],
            [
                'name' => 'fieldWithoutDefault',
                'label' => ['en' => 'No Default'],
                'inputType' => 'text',
            ],
        ],
    ]);

    $computed = $element->getComputedDefaultData();

    expect($computed)->toHaveKey('explicitDefault');
    expect($computed['explicitDefault'])->toBe('explicit');
    expect($computed)->toHaveKey('fieldWithDefault');
    expect($computed['fieldWithDefault'])->toBe('field default');
    expect($computed)->not->toHaveKey('fieldWithoutDefault');
});

it('converts to legacy format correctly', function () {
    $element = CustomElement::create([
        'type' => 'custom_legacy_test',
        'label' => ['en' => 'Legacy Test'],
        'description' => ['en' => 'Test description'],
        'icon' => 'test',
        'category' => 'content',
        'can_have_children' => true,
        'is_system' => false,
        'fields' => [['name' => 'test', 'inputType' => 'text']],
        'default_data' => ['key' => 'value'],
        'preview_template' => 'template',
        'css_class' => 'test-class',
    ]);

    $legacy = $element->toLegacyFormat();

    expect($legacy)->toHaveKey('type');
    expect($legacy['type'])->toBe('custom_legacy_test');
    expect($legacy)->toHaveKey('canHaveChildren');
    expect($legacy['canHaveChildren'])->toBe(true);
    expect($legacy)->toHaveKey('defaultData');
    expect($legacy['defaultData'])->toEqual(['key' => 'value']);
    expect($legacy)->toHaveKey('previewTemplate');
    expect($legacy['previewTemplate'])->toBe('template');
    expect($legacy)->toHaveKey('cssClass');
    expect($legacy['cssClass'])->toBe('test-class');
});
