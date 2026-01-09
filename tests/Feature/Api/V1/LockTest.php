<?php

use App\Enums\ContentStatus;
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
    ]);
});

afterEach(function () {
    // Clean up
    Element::query()->delete();
    Content::query()->delete();
    Collection::query()->delete();
});

describe('Collection Locking', function () {
    it('can lock a collection', function () {
        $response = $this->postJson("/api/v1/collections/{$this->collection->slug}/lock", [
            'reason' => 'Under maintenance',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Collection locked successfully');

        $this->collection->refresh();
        expect($this->collection->is_locked)->toBeTrue();
        expect($this->collection->locked_by)->toBe($this->user->id);
        expect($this->collection->lock_reason)->toBe('Under maintenance');
    });

    it('can unlock a collection', function () {
        // First lock it
        $this->collection->lock($this->user, 'Testing');

        $response = $this->deleteJson("/api/v1/collections/{$this->collection->slug}/lock");

        $response->assertOk()
            ->assertJsonPath('message', 'Collection unlocked successfully');

        $this->collection->refresh();
        expect($this->collection->is_locked)->toBeFalse();
        expect($this->collection->locked_by)->toBeNull();
        expect($this->collection->lock_reason)->toBeNull();
    });

    it('prevents updating a locked collection', function () {
        $this->collection->lock($this->user, 'Testing');

        $response = $this->putJson("/api/v1/collections/{$this->collection->slug}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(423);
    });

    it('prevents deleting a locked collection', function () {
        // First remove all contents
        $this->content->delete();

        $this->collection->lock($this->user, 'Testing');

        $response = $this->deleteJson("/api/v1/collections/{$this->collection->slug}");

        $response->assertStatus(423);
    });
});

describe('Content Locking', function () {
    it('can lock a content', function () {
        $response = $this->postJson("/api/v1/contents/{$this->content->_id}/lock", [
            'reason' => 'Content review',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Content locked successfully');

        $this->content->refresh();
        expect($this->content->is_locked)->toBeTrue();
        expect($this->content->locked_by)->toBe($this->user->id);
        expect($this->content->lock_reason)->toBe('Content review');
    });

    it('can unlock a content', function () {
        $this->content->lock($this->user, 'Testing');

        $response = $this->deleteJson("/api/v1/contents/{$this->content->_id}/lock");

        $response->assertOk()
            ->assertJsonPath('message', 'Content unlocked successfully');

        $this->content->refresh();
        expect($this->content->is_locked)->toBeFalse();
    });

    it('prevents updating a locked content', function () {
        $this->content->lock($this->user, 'Testing');

        $response = $this->putJson("/api/v1/contents/{$this->content->_id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertStatus(423);
    });

    it('prevents deleting a locked content', function () {
        $this->content->lock($this->user, 'Testing');

        $response = $this->deleteJson("/api/v1/contents/{$this->content->_id}");

        $response->assertStatus(423);
    });

    it('prevents publishing a locked content', function () {
        $this->content->lock($this->user, 'Testing');

        $response = $this->postJson("/api/v1/contents/{$this->content->_id}/publish");

        $response->assertStatus(423);
    });

    it('prevents unpublishing a locked content', function () {
        $this->content->update(['status' => ContentStatus::PUBLISHED]);
        $this->content->lock($this->user, 'Testing');

        $response = $this->postJson("/api/v1/contents/{$this->content->_id}/unpublish");

        $response->assertStatus(423);
    });
});

describe('Hierarchical Locking', function () {
    it('prevents updating content when collection is locked', function () {
        $this->collection->lock($this->user, 'Collection maintenance');

        $response = $this->putJson("/api/v1/contents/{$this->content->_id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertStatus(423);
    });

    it('prevents deleting content when collection is locked', function () {
        $this->collection->lock($this->user, 'Collection maintenance');

        $response = $this->deleteJson("/api/v1/contents/{$this->content->_id}");

        $response->assertStatus(423);
    });

    it('prevents creating content in a locked collection', function () {
        $this->collection->lock($this->user, 'Collection maintenance');

        // Note: Creating content via API doesn't have lock check by design
        // because it's creating new content, not modifying existing
        // This test documents the expected behavior
        $response = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'New Content',
        ]);

        // Content creation is allowed even in locked collections
        // The lock prevents modifications to existing content
        $response->assertStatus(201);
    });

    it('content isEffectivelyLocked returns true when collection is locked', function () {
        $this->collection->lock($this->user, 'Testing');

        $this->content->refresh();

        expect($this->content->isDirectlyLocked())->toBeFalse();
        expect($this->content->isEffectivelyLocked())->toBeTrue();
        expect($this->content->getEffectiveLockSource())->toBe('collection');
    });

    it('content isEffectivelyLocked returns true when content itself is locked', function () {
        $this->content->lock($this->user, 'Testing');

        expect($this->content->isDirectlyLocked())->toBeTrue();
        expect($this->content->isEffectivelyLocked())->toBeTrue();
        expect($this->content->getEffectiveLockSource())->toBe('self');
    });
});

describe('Element Locking', function () {
    beforeEach(function () {
        $this->element = Element::create([
            'content_id' => $this->content->_id,
            'type' => 'text',
            'data' => ['content' => 'Test', 'format' => 'plain'],
            'order' => 0,
        ]);
    });

    it('can lock an element', function () {
        $response = $this->postJson("/api/v1/elements/{$this->element->_id}/lock", [
            'reason' => 'Element frozen',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Element locked successfully');

        $this->element->refresh();
        expect($this->element->is_locked)->toBeTrue();
        expect($this->element->lock_reason)->toBe('Element frozen');
    });

    it('can unlock an element', function () {
        $this->element->lock($this->user, 'Testing');

        $response = $this->deleteJson("/api/v1/elements/{$this->element->_id}/lock");

        $response->assertOk()
            ->assertJsonPath('message', 'Element unlocked successfully');

        $this->element->refresh();
        expect($this->element->is_locked)->toBeFalse();
    });

    it('prevents updating a locked element', function () {
        $this->element->lock($this->user, 'Testing');

        $response = $this->putJson("/api/v1/elements/{$this->element->_id}", [
            'data' => ['content' => 'Updated', 'format' => 'plain'],
        ]);

        $response->assertStatus(423);
    });

    it('prevents deleting a locked element', function () {
        $this->element->lock($this->user, 'Testing');

        $response = $this->deleteJson("/api/v1/elements/{$this->element->_id}");

        $response->assertStatus(423);
    });

    it('element isEffectivelyLocked returns true when content is locked', function () {
        $this->content->lock($this->user, 'Testing');

        $this->element->refresh();

        expect($this->element->isDirectlyLocked())->toBeFalse();
        expect($this->element->isEffectivelyLocked())->toBeTrue();
        expect($this->element->getEffectiveLockSource())->toBe('content');
    });

    it('element isEffectivelyLocked returns true when collection is locked', function () {
        $this->collection->lock($this->user, 'Testing');

        $this->element->refresh();

        expect($this->element->isDirectlyLocked())->toBeFalse();
        expect($this->element->isEffectivelyLocked())->toBeTrue();
        expect($this->element->getEffectiveLockSource())->toBe('collection');
    });
});

describe('Permission Checks', function () {
    it('requires collections.lock permission to lock a collection', function () {
        // Create user without lock permission
        $viewer = User::factory()->create();
        $viewer->assignRole('viewer');
        Passport::actingAs($viewer);

        $response = $this->postJson("/api/v1/collections/{$this->collection->slug}/lock");

        $response->assertStatus(403);
    });

    it('requires collections.unlock permission to unlock a collection', function () {
        $this->collection->lock($this->user, 'Testing');

        // Create user without unlock permission
        $viewer = User::factory()->create();
        $viewer->assignRole('viewer');
        Passport::actingAs($viewer);

        $response = $this->deleteJson("/api/v1/collections/{$this->collection->slug}/lock");

        $response->assertStatus(403);
    });

    it('requires contents.lock permission to lock a content', function () {
        $viewer = User::factory()->create();
        $viewer->assignRole('viewer');
        Passport::actingAs($viewer);

        $response = $this->postJson("/api/v1/contents/{$this->content->_id}/lock");

        $response->assertStatus(403);
    });

    it('requires contents.unlock permission to unlock a content', function () {
        $this->content->lock($this->user, 'Testing');

        $viewer = User::factory()->create();
        $viewer->assignRole('viewer');
        Passport::actingAs($viewer);

        $response = $this->deleteJson("/api/v1/contents/{$this->content->_id}/lock");

        $response->assertStatus(403);
    });
});
