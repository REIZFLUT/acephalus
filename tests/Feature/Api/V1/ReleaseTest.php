<?php

use App\Enums\ContentStatus;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\ContentVersion;
use App\Models\User;
use App\Services\ReleaseService;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

beforeEach(function () {
    Client::factory()->asPersonalAccessTokenClient()->create([
        'name' => 'Test Personal Access Client',
    ]);

    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    Passport::actingAs($this->user);

    $this->releaseService = app(ReleaseService::class);

    // Create a collection with initial release
    $this->collection = Collection::create([
        'name' => 'Blog Posts',
        'slug' => 'blog-posts',
        'current_release' => 'Basis',
        'releases' => [
            [
                'name' => 'Basis',
                'created_at' => now()->toISOString(),
                'created_by' => null,
            ],
        ],
    ]);
});

describe('Release API Filter', function () {
    it('returns 404 when filtering by non-existent release', function () {
        $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?release=non-existent");

        $response->assertNotFound()
            ->assertJsonPath('message', "Release 'non-existent' not found in this collection.");
    });

    it('returns available releases when filtering by non-existent release', function () {
        $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?release=non-existent");

        $response->assertNotFound()
            ->assertJsonPath('available_releases.0', 'Basis');
    });

    it('returns contents for a specific release', function () {
        // Create content with version in Basis release
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Hello']]],
        ]);

        // Create version in Basis release marked as release_end
        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Hello from Basis']]],
            'release' => 'Basis',
            'is_release_end' => true,
            'snapshot' => [
                'title' => 'Test Post',
                'slug' => 'test-post',
                'status' => 'published',
                'metadata' => null,
            ],
        ]);

        $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?release=Basis");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.release', 'Basis')
            ->assertJsonPath('data.0.is_release_end', true)
            ->assertJsonPath('meta.release', 'Basis');
    });

    it('only returns contents that have versions in the specified release', function () {
        // Create first content with version in Basis release
        $content1 = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Post in Basis',
            'slug' => 'post-in-basis',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        ContentVersion::create([
            'content_id' => $content1->_id,
            'version_number' => 1,
            'elements' => [],
            'release' => 'Basis',
            'is_release_end' => true,
            'snapshot' => ['title' => 'Post in Basis', 'slug' => 'post-in-basis', 'status' => 'published', 'metadata' => null],
        ]);

        // Create second content WITHOUT version in Basis release
        Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Post without Basis version',
            'slug' => 'post-without-basis',
            'status' => ContentStatus::DRAFT,
            'current_version' => 1,
        ]);
        // Note: No ContentVersion created for this content

        $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?release=Basis");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Post in Basis');
    });

    it('returns content state from release endpoint version', function () {
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Current Title',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 3,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Current content']]],
        ]);

        // Old version at release endpoint
        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Old content from Basis']]],
            'release' => 'Basis',
            'is_release_end' => true,
            'snapshot' => [
                'title' => 'Old Title from Basis',
                'slug' => 'test-post',
                'status' => 'published',
                'metadata' => null,
            ],
        ]);

        // Newer version (not at release endpoint)
        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 3,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Current content']]],
            'release' => 'v2.0',
            'is_release_end' => false,
            'snapshot' => [
                'title' => 'Current Title',
                'slug' => 'test-post',
                'status' => 'published',
                'metadata' => null,
            ],
        ]);

        $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?release=Basis");

        $response->assertOk()
            ->assertJsonPath('data.0.title', 'Old Title from Basis')
            ->assertJsonPath('data.0.elements.0.data.content', 'Old content from Basis')
            ->assertJsonPath('data.0.release_version_number', 1);
    });

    it('can show single content for a specific release', function () {
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Hello']]],
            'release' => 'Basis',
            'is_release_end' => true,
            'snapshot' => ['title' => 'Test Post', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        $response = $this->getJson("/api/v1/contents/{$content->_id}?release=Basis");

        $response->assertOk()
            ->assertJsonPath('data.release', 'Basis')
            ->assertJsonPath('data.is_release_end', true);
    });

    it('returns 404 when content has no version in specified release', function () {
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        // Create version in different release
        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [],
            'release' => 'v2.0',
            'is_release_end' => false,
            'snapshot' => ['title' => 'Test Post', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Add v2.0 release to collection
        $this->collection->update([
            'releases' => [
                ...$this->collection->releases,
                ['name' => 'v2.0', 'created_at' => now()->toISOString(), 'created_by' => null],
            ],
        ]);

        $response = $this->getJson("/api/v1/contents/{$content->_id}?release=Basis");

        $response->assertNotFound()
            ->assertJsonPath('message', "Content not found in release 'Basis'.");
    });
});

describe('ReleaseService', function () {
    it('creates a new release and finalizes current release', function () {
        // Create content with version
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [],
            'release' => 'Basis',
            'is_release_end' => false,
            'snapshot' => ['title' => 'Test Post', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Create new release
        $this->releaseService->createRelease($this->collection, 'v2.0', $this->user);

        // Verify the collection was updated
        $this->collection->refresh();
        expect($this->collection->current_release)->toBe('v2.0');
        expect($this->collection->releases)->toHaveCount(2);
        expect($this->collection->releases[1]['name'])->toBe('v2.0');

        // Verify the old version was marked as release_end
        $version = ContentVersion::where('content_id', $content->_id)->first();
        expect($version->is_release_end)->toBeTrue();
    });

    it('copies contents to new release when option is enabled', function () {
        // Create content with version
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Original']]],
        ]);

        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Original']]],
            'release' => 'Basis',
            'is_release_end' => false,
            'snapshot' => ['title' => 'Test Post', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Create new release WITH copying
        $this->releaseService->createRelease($this->collection, 'v2.0', $this->user, copyContents: true);

        // Verify content version was incremented
        $content->refresh();
        expect($content->current_version)->toBe(2);

        // Verify new version was created in v2.0 release
        $newVersion = ContentVersion::where('content_id', $content->_id)
            ->where('release', 'v2.0')
            ->first();

        expect($newVersion)->not->toBeNull();
        expect($newVersion->version_number)->toBe(2);
        expect($newVersion->elements)->toBe([['type' => 'text', 'data' => ['content' => 'Original']]]);
        expect($newVersion->change_note)->toContain('Copied to release');
    });

    it('does not copy contents when option is disabled', function () {
        // Create content with version
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [],
            'release' => 'Basis',
            'is_release_end' => false,
            'snapshot' => ['title' => 'Test Post', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Create new release WITHOUT copying
        $this->releaseService->createRelease($this->collection, 'v2.0', $this->user, copyContents: false);

        // Verify content version was NOT incremented
        $content->refresh();
        expect($content->current_version)->toBe(1);

        // Verify no version was created in v2.0 release
        $newVersion = ContentVersion::where('content_id', $content->_id)
            ->where('release', 'v2.0')
            ->first();

        expect($newVersion)->toBeNull();
    });

    it('content appears in new release after modification even without copying', function () {
        // Create content with version in Basis
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Original']]],
            'release' => 'Basis',
            'is_release_end' => false,
            'snapshot' => ['title' => 'Test Post', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Create new release WITHOUT copying
        $this->releaseService->createRelease($this->collection, 'v2.0', $this->user, copyContents: false);

        // Verify content is NOT in v2.0 yet
        $releaseContents = $this->releaseService->getContentsForRelease($this->collection->fresh(), 'v2.0');
        expect($releaseContents)->toHaveCount(0);

        // Simulate content modification by creating a new version in v2.0
        $content->increment('current_version');
        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 2,
            'elements' => [['type' => 'text', 'data' => ['content' => 'Modified']]],
            'release' => 'v2.0',
            'is_release_end' => false,
            'snapshot' => ['title' => 'Test Post', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Now content should appear in v2.0
        $releaseContents = $this->releaseService->getContentsForRelease($this->collection->fresh(), 'v2.0');
        expect($releaseContents)->toHaveCount(1);
    });

    it('purges only intermediate versions, keeping release endpoints', function () {
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 5,
        ]);

        // Version 1 - release endpoint (should be kept)
        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [],
            'release' => 'Basis',
            'is_release_end' => true,
            'snapshot' => ['title' => 'v1', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Versions 2-4 - intermediate (should be deleted)
        for ($i = 2; $i <= 4; $i++) {
            ContentVersion::create([
                'content_id' => $content->_id,
                'version_number' => $i,
                'elements' => [],
                'release' => 'Basis',
                'is_release_end' => false,
                'snapshot' => ['title' => "v{$i}", 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
            ]);
        }

        // Version 5 - latest (should be kept)
        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 5,
            'elements' => [],
            'release' => 'v2.0',
            'is_release_end' => false,
            'snapshot' => ['title' => 'v5', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Purge
        $deletedCount = $this->releaseService->purgeOldVersions($content);

        expect($deletedCount)->toBe(3); // versions 2, 3, 4

        // Verify remaining versions
        $remainingVersions = ContentVersion::where('content_id', $content->_id)
            ->orderBy('version_number')
            ->get();

        expect($remainingVersions)->toHaveCount(2);
        expect($remainingVersions[0]->version_number)->toBe(1);
        expect($remainingVersions[1]->version_number)->toBe(5);
    });
});

describe('Web Content List Release Filter', function () {
    beforeEach(function () {
        $this->actingAs($this->user);
    });

    it('shows release filter dropdown when releases exist', function () {
        $response = $this->get("/collections/{$this->collection->slug}");

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('releases')
                ->has('collection')
            );
    });

    it('filters contents by release in web view', function () {
        // Create content with version in Basis
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [],
            'release' => 'Basis',
            'is_release_end' => true,
            'snapshot' => ['title' => 'Old Title', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        // Update current content to different title
        $content->update(['title' => 'New Title']);

        // Without release filter - should show current state
        $response = $this->get("/collections/{$this->collection->slug}");
        $response->assertOk();

        // With release filter - should show release state
        $response = $this->get("/collections/{$this->collection->slug}?release=Basis");
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('selectedRelease', 'Basis')
                ->has('contents.data', 1)
                ->where('contents.data.0.title', 'Old Title')
            );
    });

    it('shows empty list when no contents exist in filtered release', function () {
        // Create content WITHOUT version in Basis release
        Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);
        // Note: No ContentVersion created

        $response = $this->get("/collections/{$this->collection->slug}?release=Basis");

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('selectedRelease', 'Basis')
                ->has('contents.data', 0)
            );
    });
});

describe('Web Release Controller', function () {
    beforeEach(function () {
        // For web routes, use session auth
        $this->actingAs($this->user);
    });

    it('can create a release without copying contents', function () {
        $response = $this->post("/collections/{$this->collection->slug}/releases", [
            'name' => 'v2.0',
            'copy_contents' => false,
        ]);

        $response->assertRedirect();

        $this->collection->refresh();
        expect($this->collection->current_release)->toBe('v2.0');
    });

    it('can create a release with copying contents', function () {
        // Create content first
        $content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        ContentVersion::create([
            'content_id' => $content->_id,
            'version_number' => 1,
            'elements' => [],
            'release' => 'Basis',
            'is_release_end' => false,
            'snapshot' => ['title' => 'Test Post', 'slug' => 'test-post', 'status' => 'published', 'metadata' => null],
        ]);

        $response = $this->post("/collections/{$this->collection->slug}/releases", [
            'name' => 'v2.0',
            'copy_contents' => true,
        ]);

        $response->assertRedirect();

        // Verify content was copied
        $content->refresh();
        expect($content->current_version)->toBe(2);

        $newVersion = ContentVersion::where('content_id', $content->_id)
            ->where('release', 'v2.0')
            ->first();
        expect($newVersion)->not->toBeNull();
    });

    it('prevents duplicate release names', function () {
        $response = $this->post("/collections/{$this->collection->slug}/releases", [
            'name' => 'Basis', // Already exists
            'copy_contents' => false,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('name');
    });
});
