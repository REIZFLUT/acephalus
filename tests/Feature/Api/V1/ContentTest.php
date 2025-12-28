<?php

use App\Enums\ContentStatus;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
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

    $this->collection = Collection::create([
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
    ]);
});

it('can list contents of a collection', function () {
    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'First Post',
        'slug' => 'first-post',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
    ]);
    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Second Post',
        'slug' => 'second-post',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
    ]);

    $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('can filter contents by status', function () {
    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Draft Post',
        'slug' => 'draft-post',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
    ]);
    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Published Post',
        'slug' => 'published-post',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
    ]);

    $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?status=published");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Published Post');
});

it('can create content', function () {
    $response = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
        'title' => 'My First Post',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.title', 'My First Post')
        ->assertJsonPath('data.slug', 'my-first-post')
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.current_version', 1);
});

it('can show content details', function () {
    $content = Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Test Post',
        'slug' => 'test-post',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
    ]);

    $response = $this->getJson("/api/v1/contents/{$content->_id}");

    $response->assertOk()
        ->assertJsonPath('data.title', 'Test Post');
});

it('can update content', function () {
    $content = Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Original Title',
        'slug' => 'original-title',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
    ]);

    $response = $this->putJson("/api/v1/contents/{$content->_id}", [
        'title' => 'Updated Title',
        'change_note' => 'Updated the title',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.title', 'Updated Title');
});

it('can delete content', function () {
    $content = Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Delete Me',
        'slug' => 'delete-me',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
    ]);

    $response = $this->deleteJson("/api/v1/contents/{$content->_id}");

    $response->assertOk()
        ->assertJson(['message' => 'Content deleted successfully']);
});

it('can publish content', function () {
    $content = Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Draft Post',
        'slug' => 'draft-post',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
    ]);

    $response = $this->postJson("/api/v1/contents/{$content->_id}/publish");

    $response->assertOk()
        ->assertJsonPath('data.status', 'published')
        ->assertJsonPath('data.is_published', true);
});

it('can unpublish content', function () {
    $content = Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Published Post',
        'slug' => 'published-post',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
    ]);

    $response = $this->postJson("/api/v1/contents/{$content->_id}/unpublish");

    $response->assertOk()
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.is_published', false);
});

it('can archive content', function () {
    $content = Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Old Post',
        'slug' => 'old-post',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
    ]);

    $response = $this->postJson("/api/v1/contents/{$content->_id}/archive");

    $response->assertOk()
        ->assertJsonPath('data.status', 'archived');
});

it('validates content creation', function () {
    $response = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
        'title' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['title']);
});


