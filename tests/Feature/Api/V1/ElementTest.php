<?php

use App\Enums\ContentStatus;
use App\Enums\ElementType;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Element;
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

    $collection = Collection::create([
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
    ]);

    $this->content = Content::create([
        'collection_id' => $collection->_id,
        'title' => 'Test Post',
        'slug' => 'test-post',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
    ]);
});

it('can add a text element to content', function () {
    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'text',
        'data' => [
            'content' => 'This is a paragraph of text.',
            'format' => 'plain',
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.type', 'text')
        ->assertJsonPath('data.data.content', 'This is a paragraph of text.');
});

it('can add a wrapper element', function () {
    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'wrapper',
        'data' => [
            'purpose' => 'generic',
            'layout' => 'two-column',
            'style' => ['gap' => '20px'],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.type', 'wrapper')
        ->assertJsonPath('data.can_have_children', true);
});

it('can add nested elements in wrapper', function () {
    $wrapper = Element::create([
        'content_id' => $this->content->_id,
        'type' => ElementType::WRAPPER,
        'data' => ['layout' => 'grid'],
        'order' => 0,
    ]);

    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'text',
        'parent_id' => (string) $wrapper->_id,
        'data' => [
            'content' => 'Nested text element',
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.parent_id', (string) $wrapper->_id);
});

it('can update an element', function () {
    $element = Element::create([
        'content_id' => $this->content->_id,
        'type' => ElementType::TEXT,
        'data' => ['content' => 'Original text'],
        'order' => 0,
    ]);

    $response = $this->putJson("/api/v1/elements/{$element->_id}", [
        'data' => [
            'content' => 'Updated text',
            'format' => 'markdown',
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.data.content', 'Updated text');
});

it('can delete an element', function () {
    $element = Element::create([
        'content_id' => $this->content->_id,
        'type' => ElementType::TEXT,
        'data' => ['content' => 'Delete me'],
        'order' => 0,
    ]);

    $response = $this->deleteJson("/api/v1/elements/{$element->_id}");

    $response->assertOk()
        ->assertJson(['message' => 'Element deleted successfully']);
});

it('can move an element', function () {
    $element1 = Element::create([
        'content_id' => $this->content->_id,
        'type' => ElementType::TEXT,
        'data' => ['content' => 'First'],
        'order' => 0,
    ]);
    Element::create([
        'content_id' => $this->content->_id,
        'type' => ElementType::TEXT,
        'data' => ['content' => 'Second'],
        'order' => 1,
    ]);

    $response = $this->postJson("/api/v1/elements/{$element1->_id}/move", [
        'order' => 1,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.order', 1);
});

it('validates element type', function () {
    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'invalid-type',
        'data' => [],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['type']);
});

it('validates text element data', function () {
    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'text',
        'data' => [], // Missing required 'content' field
    ]);

    $response->assertStatus(422);
});

it('can add KaTeX element', function () {
    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'katex',
        'data' => [
            'formula' => 'E = mc^2',
            'display_mode' => true,
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.type', 'katex')
        ->assertJsonPath('data.data.formula', 'E = mc^2');
});

it('can add HTML element', function () {
    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'html',
        'data' => [
            'content' => '<div class="custom">Custom HTML</div>',
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.type', 'html');
});

it('can add JSON data element', function () {
    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'json',
        'data' => [
            'data' => ['key' => 'value', 'nested' => ['a' => 1]],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.type', 'json')
        ->assertJsonPath('data.data.data.key', 'value');
});
