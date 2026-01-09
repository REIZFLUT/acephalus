<?php

use App\Enums\ContentStatus;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\ContentVersion;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    $this->actingAs($this->user);

    $this->collection = Collection::create([
        'name' => 'Test Collection',
        'slug' => 'test-collection',
    ]);

    $this->content = Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Test Content',
        'slug' => 'test-content',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
        'elements' => [],
        'metadata' => [],
    ]);

    // Create initial version
    ContentVersion::create([
        'content_id' => $this->content->_id,
        'version_number' => 1,
        'elements' => [],
        'created_by' => $this->user->id,
        'change_note' => 'Initial version',
        'snapshot' => [
            'title' => 'Test Content',
            'slug' => 'test-content',
            'status' => 'draft',
        ],
    ]);
});

it('stores user id when updating content via web route', function () {
    $response = $this->put("/contents/{$this->content->_id}", [
        'title' => 'Updated Title',
        'slug' => 'test-content',
        'elements' => [],
        'metadata' => [],
    ]);

    $response->assertRedirect();

    // Get the latest version
    $latestVersion = ContentVersion::where('content_id', $this->content->_id)
        ->orderBy('version_number', 'desc')
        ->first();

    expect($latestVersion->version_number)->toBe(2);
    expect($latestVersion->created_by)->toBe($this->user->id);
});

it('stores change note when provided via web route', function () {
    $response = $this->put("/contents/{$this->content->_id}", [
        'title' => 'Updated Title',
        'slug' => 'test-content',
        'elements' => [],
        'metadata' => [],
        'change_note' => 'Fixed a typo in the title',
    ]);

    $response->assertRedirect();

    // Get the latest version
    $latestVersion = ContentVersion::where('content_id', $this->content->_id)
        ->orderBy('version_number', 'desc')
        ->first();

    expect($latestVersion->version_number)->toBe(2);
    expect($latestVersion->created_by)->toBe($this->user->id);
    expect($latestVersion->change_note)->toBe('Fixed a typo in the title');
});

it('stores user id when creating content via web route', function () {
    $response = $this->post("/collections/{$this->collection->slug}/contents", [
        'title' => 'New Content',
        'slug' => 'new-content',
    ]);

    $response->assertRedirect();

    // Find the new content
    $newContent = Content::where('slug', 'new-content')->first();
    expect($newContent)->not->toBeNull();

    // Get the initial version
    $initialVersion = ContentVersion::where('content_id', $newContent->_id)
        ->where('version_number', 1)
        ->first();

    expect($initialVersion)->not->toBeNull();
    expect($initialVersion->created_by)->toBe($this->user->id);
});
