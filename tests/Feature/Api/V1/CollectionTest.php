<?php

use App\Models\Mongodb\Collection;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->artisan('passport:client', [
        '--personal' => true,
        '--name' => 'Test Personal Access Client',
        '--no-interaction' => true,
    ]);

    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    Passport::actingAs($this->user);
});

it('can list collections', function () {
    Collection::create([
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
    ]);
    Collection::create([
        'name' => 'Pages',
        'slug' => 'pages',
    ]);

    $response = $this->getJson('/api/v1/collections');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('can create a collection', function () {
    $response = $this->postJson('/api/v1/collections', [
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
        'description' => 'A collection of blog posts',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Blog Posts')
        ->assertJsonPath('data.slug', 'blog-posts');
});

it('auto-generates slug from name', function () {
    $response = $this->postJson('/api/v1/collections', [
        'name' => 'My Blog Posts',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.slug', 'my-blog-posts');
});

it('can show a collection', function () {
    $collection = Collection::create([
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
    ]);

    $response = $this->getJson("/api/v1/collections/{$collection->slug}");

    $response->assertOk()
        ->assertJsonPath('data.name', 'Blog Posts');
});

it('can update a collection', function () {
    $collection = Collection::create([
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
    ]);

    $response = $this->putJson("/api/v1/collections/{$collection->slug}", [
        'name' => 'Updated Blog Posts',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Updated Blog Posts');
});

it('can delete a collection without contents', function () {
    $collection = Collection::create([
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
    ]);

    $response = $this->deleteJson("/api/v1/collections/{$collection->slug}");

    $response->assertOk()
        ->assertJson(['message' => 'Collection deleted successfully']);
});

it('validates collection creation', function () {
    $response = $this->postJson('/api/v1/collections', [
        'name' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

it('prevents duplicate slugs', function () {
    Collection::create([
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
    ]);

    $response = $this->postJson('/api/v1/collections', [
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['slug']);
});

it('can create collection with schema', function () {
    $response = $this->postJson('/api/v1/collections', [
        'name' => 'Articles',
        'slug' => 'articles',
        'schema' => [
            'allowed_element_types' => ['text', 'media'],
            'min_elements' => 1,
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.schema.allowed_element_types', ['text', 'media'])
        ->assertJsonPath('data.schema.min_elements', 1);
});


