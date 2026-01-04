<?php

use App\Enums\ContentStatus;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\ContentVersion;
use App\Models\User;
use App\Services\ContentService;
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

    // Create initial version
    ContentVersion::create([
        'content_id' => $this->content->_id,
        'version_number' => 1,
        'elements' => [],
        'created_by' => $this->user->id,
        'change_note' => 'Initial version',
        'snapshot' => [
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => 'draft',
        ],
    ]);
});

it('can list version history', function () {
    // Add more versions
    ContentVersion::create([
        'content_id' => $this->content->_id,
        'version_number' => 2,
        'elements' => [],
        'created_by' => $this->user->id,
        'change_note' => 'Second version',
    ]);

    $response = $this->getJson("/api/v1/contents/{$this->content->_id}/versions");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('can show a specific version', function () {
    $response = $this->getJson("/api/v1/contents/{$this->content->_id}/versions/1");

    $response->assertOk()
        ->assertJsonPath('data.version_number', 1)
        ->assertJsonPath('data.change_note', 'Initial version');
});

it('returns 404 for non-existent version', function () {
    $response = $this->getJson("/api/v1/contents/{$this->content->_id}/versions/999");

    $response->assertNotFound();
});

it('can restore a previous version', function () {
    // Update content to create version 2
    $contentService = app(ContentService::class);
    $contentService->update($this->content, [
        'title' => 'Updated Title',
    ], $this->user, 'Updated title');

    $this->content->refresh();
    expect($this->content->current_version)->toBe(2);

    // Restore version 1
    $response = $this->postJson("/api/v1/contents/{$this->content->_id}/versions/1/restore");

    $response->assertOk()
        ->assertJsonPath('message', 'Content restored to version 1');
});

it('can compare two versions', function () {
    // Create second version with different elements
    ContentVersion::create([
        'content_id' => $this->content->_id,
        'version_number' => 2,
        'elements' => [
            ['_id' => 'elem1', 'type' => 'text', 'data' => ['content' => 'Hello']],
        ],
        'created_by' => $this->user->id,
        'change_note' => 'Added text element',
    ]);

    $response = $this->getJson("/api/v1/contents/{$this->content->_id}/versions/1/compare/2");

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'from',
                'to',
                'changes' => ['added', 'removed', 'modified'],
            ],
        ]);
});

it('increments version when updating content', function () {
    $originalVersion = $this->content->current_version;

    $this->putJson("/api/v1/contents/{$this->content->_id}", [
        'title' => 'New Title',
    ]);

    $this->content->refresh();
    expect($this->content->current_version)->toBe($originalVersion + 1);
});

it('creates version when adding elements', function () {
    $originalVersion = $this->content->current_version;

    $this->postJson("/api/v1/contents/{$this->content->_id}/elements", [
        'type' => 'text',
        'data' => ['content' => 'New paragraph'],
    ]);

    $this->content->refresh();
    expect($this->content->current_version)->toBe($originalVersion + 1);
});
