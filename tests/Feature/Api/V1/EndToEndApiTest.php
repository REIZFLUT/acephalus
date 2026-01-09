<?php

declare(strict_types=1);

use App\Enums\ContentStatus;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Element;
use App\Models\User;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

/**
 * End-to-End API Tests
 *
 * These tests simulate complete workflows from user registration
 * through creating and managing content, demonstrating the full
 * capabilities of the acephalus CMS API.
 */
describe('Complete User Journey', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);
    });

    it('can complete a full content creation workflow', function () {
        // Step 1: Register a new user
        $registerResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Content Creator',
            'email' => 'creator@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ]);

        $registerResponse->assertStatus(201)
            ->assertJsonStructure(['user', 'token', 'token_type']);

        $token = $registerResponse->json('token');

        // Step 2: Create an admin user and authenticate for remaining operations
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Passport::actingAs($admin);

        // Step 3: Create a collection
        $collectionResponse = $this->postJson('/api/v1/collections', [
            'name' => 'Blog Articles',
            'slug' => 'blog-articles',
            'description' => 'A collection for blog articles',
            'schema' => [
                'allowed_element_types' => ['text', 'media', 'wrapper', 'html'],
                'min_elements' => 1,
            ],
        ]);

        $collectionResponse->assertStatus(201);
        $collectionSlug = $collectionResponse->json('data.slug');

        // Step 4: Create content in the collection
        $contentResponse = $this->postJson("/api/v1/collections/{$collectionSlug}/contents", [
            'title' => 'Getting Started with acephalus CMS',
        ]);

        $contentResponse->assertStatus(201);
        $contentId = $contentResponse->json('data.id');
        expect($contentResponse->json('data.status'))->toBe('draft');
        expect($contentResponse->json('data.current_version'))->toBe(1);

        // Step 5: Add elements to the content
        // Add a heading as HTML element
        $headingResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'html',
            'data' => [
                'content' => '<h1>Welcome to acephalus</h1>',
            ],
        ]);
        $headingResponse->assertStatus(201);

        // Add a text element
        $textResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'text',
            'data' => [
                'content' => 'acephalus is a modern headless CMS built for developers.',
                'format' => 'plain',
            ],
        ]);
        $textResponse->assertStatus(201);
        $textElementId = $textResponse->json('data.id');

        // Add a wrapper with nested elements
        $wrapperResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'wrapper',
            'data' => [
                'purpose' => 'generic',
                'layout' => 'two-column',
                'style' => ['gap' => '24px'],
            ],
        ]);
        $wrapperResponse->assertStatus(201);
        $wrapperId = $wrapperResponse->json('data.id');

        // Add nested text in wrapper
        $nestedTextResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'text',
            'parent_id' => $wrapperId,
            'data' => [
                'content' => 'Left column content',
            ],
        ]);
        $nestedTextResponse->assertStatus(201);

        // Step 6: Update an element
        $updateElementResponse = $this->putJson("/api/v1/elements/{$textElementId}", [
            'data' => [
                'content' => 'Updated: acephalus is a powerful headless CMS built for modern developers.',
                'format' => 'plain',
            ],
        ]);
        $updateElementResponse->assertOk();

        // Step 7: Move an element
        $moveResponse = $this->postJson("/api/v1/elements/{$textElementId}/move", [
            'order' => 0,
        ]);
        $moveResponse->assertOk();

        // Step 8: Update the content metadata
        $updateContentResponse = $this->putJson("/api/v1/contents/{$contentId}", [
            'title' => 'Complete Guide to Getting Started with acephalus CMS',
            'change_note' => 'Updated title to be more descriptive',
        ]);
        $updateContentResponse->assertOk();

        // Step 9: Verify content version has incremented
        $contentCheck = $this->getJson("/api/v1/contents/{$contentId}");
        $contentCheck->assertOk();
        expect($contentCheck->json('data.current_version'))->toBeGreaterThanOrEqual(2);

        // Step 10: Publish the content
        $publishResponse = $this->postJson("/api/v1/contents/{$contentId}/publish");
        $publishResponse->assertOk()
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.is_published', true);

        // Step 11: Verify the content is published
        $getContentResponse = $this->getJson("/api/v1/contents/{$contentId}");
        $getContentResponse->assertOk()
            ->assertJsonPath('data.status', 'published');

        // Step 12: Unpublish the content
        $unpublishResponse = $this->postJson("/api/v1/contents/{$contentId}/unpublish");
        $unpublishResponse->assertOk()
            ->assertJsonPath('data.status', 'draft');

        // Step 13: Archive the content
        $publishAgainResponse = $this->postJson("/api/v1/contents/{$contentId}/publish");
        $publishAgainResponse->assertOk();

        $archiveResponse = $this->postJson("/api/v1/contents/{$contentId}/archive");
        $archiveResponse->assertOk()
            ->assertJsonPath('data.status', 'archived');

        // Step 14: Verify collection contents list works with filters
        $listContentsResponse = $this->getJson("/api/v1/collections/{$collectionSlug}/contents");
        $listContentsResponse->assertOk()
            ->assertJsonCount(1, 'data');

        // Step 15: Delete the collection (should fail because it has contents)
        // First delete the content
        $deleteContentResponse = $this->deleteJson("/api/v1/contents/{$contentId}");
        $deleteContentResponse->assertOk();

        // Now delete the collection
        $deleteCollectionResponse = $this->deleteJson("/api/v1/collections/{$collectionSlug}");
        $deleteCollectionResponse->assertOk()
            ->assertJson(['message' => 'Collection deleted successfully']);

        // Step 16: Logout
        $logoutResponse = $this->postJson('/api/v1/auth/logout');
        $logoutResponse->assertOk()
            ->assertJson(['message' => 'Successfully logged out']);
    });

});

describe('Multi-Collection Content Management', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);
    });

    it('can manage content across multiple collections', function () {
        // Create multiple collections
        $blogCollection = Collection::create([
            'name' => 'Blog Posts',
            'slug' => 'blog-posts',
        ]);

        $pagesCollection = Collection::create([
            'name' => 'Static Pages',
            'slug' => 'static-pages',
        ]);

        $newsCollection = Collection::create([
            'name' => 'News Updates',
            'slug' => 'news-updates',
        ]);

        // Create content in each collection
        $blogContent = $this->postJson("/api/v1/collections/{$blogCollection->slug}/contents", [
            'title' => 'Blog Post 1',
        ]);
        $blogContent->assertStatus(201);

        $pageContent = $this->postJson("/api/v1/collections/{$pagesCollection->slug}/contents", [
            'title' => 'About Us',
        ]);
        $pageContent->assertStatus(201);

        $newsContent = $this->postJson("/api/v1/collections/{$newsCollection->slug}/contents", [
            'title' => 'Latest News',
        ]);
        $newsContent->assertStatus(201);

        // Verify each collection has the right content count
        $blogList = $this->getJson("/api/v1/collections/{$blogCollection->slug}/contents");
        $blogList->assertOk()->assertJsonCount(1, 'data');

        $pagesList = $this->getJson("/api/v1/collections/{$pagesCollection->slug}/contents");
        $pagesList->assertOk()->assertJsonCount(1, 'data');

        $newsList = $this->getJson("/api/v1/collections/{$newsCollection->slug}/contents");
        $newsList->assertOk()->assertJsonCount(1, 'data');

        // List all collections
        $collectionsResponse = $this->getJson('/api/v1/collections');
        $collectionsResponse->assertOk()->assertJsonCount(3, 'data');
    });

});

describe('Version Control Workflow', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);

        $this->collection = Collection::create([
            'name' => 'Versioned Content',
            'slug' => 'versioned-content',
        ]);
    });

    it('can track and restore content versions', function () {
        // Create initial content
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Version Test Article',
        ]);
        $contentId = $contentResponse->json('data.id');

        // Add some elements
        $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'text',
            'data' => ['content' => 'Version 1 content'],
        ]);

        // Make several updates to create version history
        for ($i = 2; $i <= 5; $i++) {
            $this->putJson("/api/v1/contents/{$contentId}", [
                'title' => "Version Test Article - Revision {$i}",
                'change_note' => "Update {$i}",
            ])->assertOk();
        }

        // Verify content version has incremented correctly
        $contentCheck = $this->getJson("/api/v1/contents/{$contentId}");
        $contentCheck->assertOk();
        expect($contentCheck->json('data.current_version'))->toBeGreaterThanOrEqual(5);

        // Verify the title reflects the last update
        expect($contentCheck->json('data.title'))->toBe('Version Test Article - Revision 5');

        // Test version restore functionality
        $restoreResponse = $this->postJson("/api/v1/contents/{$contentId}/versions/2/restore");
        $restoreResponse->assertOk()
            ->assertJsonPath('message', 'Content restored to version 2');

        // Verify version was restored (creates new version)
        $restoredCheck = $this->getJson("/api/v1/contents/{$contentId}");
        $restoredCheck->assertOk();
        expect($restoredCheck->json('data.current_version'))->toBeGreaterThan(5);
    });

});

describe('Element Hierarchy and Ordering', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);

        $collection = Collection::create([
            'name' => 'Nested Content',
            'slug' => 'nested-content',
        ]);

        $contentResponse = $this->postJson("/api/v1/collections/{$collection->slug}/contents", [
            'title' => 'Complex Layout Article',
        ]);
        $this->contentId = $contentResponse->json('data.id');
    });

    it('can create complex nested element structures', function () {
        // Create a root wrapper
        $rootWrapper = $this->postJson("/api/v1/contents/{$this->contentId}/elements", [
            'type' => 'wrapper',
            'data' => ['purpose' => 'generic', 'layout' => 'container'],
        ]);
        $rootWrapperId = $rootWrapper->json('data.id');

        // Create nested two-column layout
        $twoColumnWrapper = $this->postJson("/api/v1/contents/{$this->contentId}/elements", [
            'type' => 'wrapper',
            'parent_id' => $rootWrapperId,
            'data' => ['purpose' => 'generic', 'layout' => 'two-column'],
        ]);
        $twoColumnId = $twoColumnWrapper->json('data.id');

        // Add text elements to each column
        $leftText = $this->postJson("/api/v1/contents/{$this->contentId}/elements", [
            'type' => 'text',
            'parent_id' => $twoColumnId,
            'data' => ['content' => 'Left column content'],
        ]);
        $leftTextId = $leftText->json('data.id');

        $rightText = $this->postJson("/api/v1/contents/{$this->contentId}/elements", [
            'type' => 'text',
            'parent_id' => $twoColumnId,
            'data' => ['content' => 'Right column content'],
        ]);
        $rightTextId = $rightText->json('data.id');

        // Verify parent relationships
        expect($leftText->json('data.parent_id'))->toBe($twoColumnId);
        expect($rightText->json('data.parent_id'))->toBe($twoColumnId);

        // Reorder elements within wrapper
        $moveResponse = $this->postJson("/api/v1/elements/{$rightTextId}/move", [
            'order' => 0,
        ]);
        $moveResponse->assertOk();

        // Add another level of nesting
        $deepWrapper = $this->postJson("/api/v1/contents/{$this->contentId}/elements", [
            'type' => 'wrapper',
            'parent_id' => $twoColumnId,
            'data' => ['purpose' => 'generic', 'layout' => 'card'],
        ]);
        $deepWrapper->assertStatus(201);
        $deepWrapperId = $deepWrapper->json('data.id');

        $deepText = $this->postJson("/api/v1/contents/{$this->contentId}/elements", [
            'type' => 'text',
            'parent_id' => $deepWrapperId,
            'data' => ['content' => 'Deeply nested content'],
        ]);
        $deepText->assertStatus(201);

        // Delete the deep wrapper element
        $deleteResponse = $this->deleteJson("/api/v1/elements/{$deepWrapperId}");
        $deleteResponse->assertSuccessful();
    });

    it('can handle all element types', function () {
        // Valid element types: text, media, svg, katex, html, json, xml, wrapper
        $elementTypes = [
            [
                'type' => 'text',
                'data' => ['content' => 'Plain text content', 'format' => 'plain'],
            ],
            [
                'type' => 'katex',
                'data' => ['formula' => 'E = mc^2', 'display_mode' => true],
            ],
            [
                'type' => 'html',
                'data' => ['content' => '<div class="custom">Custom HTML</div>'],
            ],
            [
                'type' => 'json',
                'data' => ['data' => ['key' => 'value', 'items' => [1, 2, 3]]],
            ],
            [
                'type' => 'wrapper',
                'data' => ['purpose' => 'generic', 'layout' => 'flex', 'style' => ['gap' => '16px']],
            ],
            [
                'type' => 'svg',
                'data' => ['content' => '<svg><circle cx="50" cy="50" r="40"/></svg>'],
            ],
            [
                'type' => 'xml',
                'data' => ['content' => '<root><item>Test</item></root>'],
            ],
        ];

        foreach ($elementTypes as $element) {
            $response = $this->postJson("/api/v1/contents/{$this->contentId}/elements", $element);
            $response->assertStatus(201)
                ->assertJsonPath('data.type', $element['type']);
        }
    });

});

describe('Content Status Transitions', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);

        $this->collection = Collection::create([
            'name' => 'Status Test',
            'slug' => 'status-test',
        ]);
    });

    it('enforces valid status transitions', function () {
        // Create content (starts as draft)
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Status Test Content',
        ]);
        $contentId = $contentResponse->json('data.id');
        expect($contentResponse->json('data.status'))->toBe('draft');

        // Draft -> Published
        $publishResponse = $this->postJson("/api/v1/contents/{$contentId}/publish");
        $publishResponse->assertOk();
        expect($publishResponse->json('data.status'))->toBe('published');

        // Published -> Draft (unpublish)
        $unpublishResponse = $this->postJson("/api/v1/contents/{$contentId}/unpublish");
        $unpublishResponse->assertOk();
        expect($unpublishResponse->json('data.status'))->toBe('draft');

        // Draft -> Published -> Archived
        $this->postJson("/api/v1/contents/{$contentId}/publish");
        $archiveResponse = $this->postJson("/api/v1/contents/{$contentId}/archive");
        $archiveResponse->assertOk();
        expect($archiveResponse->json('data.status'))->toBe('archived');
    });

    it('can filter contents by status', function () {
        // Create contents with different statuses
        $draftContent = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Draft Article',
            'slug' => 'draft-article',
            'status' => ContentStatus::DRAFT,
            'current_version' => 1,
        ]);

        $publishedContent = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Published Article',
            'slug' => 'published-article',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        $archivedContent = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Archived Article',
            'slug' => 'archived-article',
            'status' => ContentStatus::ARCHIVED,
            'current_version' => 1,
        ]);

        // Filter by draft
        $draftResponse = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?status=draft");
        $draftResponse->assertOk()->assertJsonCount(1, 'data');
        expect($draftResponse->json('data.0.title'))->toBe('Draft Article');

        // Filter by published
        $publishedResponse = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?status=published");
        $publishedResponse->assertOk()->assertJsonCount(1, 'data');
        expect($publishedResponse->json('data.0.title'))->toBe('Published Article');

        // Filter by archived
        $archivedResponse = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?status=archived");
        $archivedResponse->assertOk()->assertJsonCount(1, 'data');
        expect($archivedResponse->json('data.0.title'))->toBe('Archived Article');

        // Get all contents
        $allResponse = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents");
        $allResponse->assertOk()->assertJsonCount(3, 'data');
    });

});

describe('Pagination and Filtering', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);

        $this->collection = Collection::create([
            'name' => 'Pagination Test',
            'slug' => 'pagination-test',
        ]);

        // Create 25 content items
        for ($i = 1; $i <= 25; $i++) {
            Content::create([
                'collection_id' => $this->collection->_id,
                'title' => "Article {$i}",
                'slug' => "article-{$i}",
                'status' => $i % 2 === 0 ? ContentStatus::PUBLISHED : ContentStatus::DRAFT,
                'current_version' => 1,
            ]);
        }
    });

    it('paginates content listings correctly', function () {
        // Get first page (default 15 per page)
        $page1Response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents");
        $page1Response->assertOk()
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        expect($page1Response->json('meta.total'))->toBe(25);
        expect($page1Response->json('meta.per_page'))->toBe(15);
        expect(count($page1Response->json('data')))->toBe(15);

        // Get second page
        $page2Response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?page=2");
        $page2Response->assertOk();
        expect(count($page2Response->json('data')))->toBe(10);

        // Custom per_page
        $customPageResponse = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?per_page=5");
        $customPageResponse->assertOk();
        expect(count($customPageResponse->json('data')))->toBe(5);
        expect($customPageResponse->json('meta.last_page'))->toBe(5);
    });

});

describe('Error Handling', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);
    });

    it('returns 404 for non-existent resources', function () {
        // Non-existent collection
        $collectionResponse = $this->getJson('/api/v1/collections/non-existent-slug');
        $collectionResponse->assertNotFound();

        // Non-existent content
        $contentResponse = $this->getJson('/api/v1/contents/507f1f77bcf86cd799439011');
        $contentResponse->assertNotFound();

        // Non-existent element
        $elementResponse = $this->putJson('/api/v1/elements/507f1f77bcf86cd799439011', [
            'data' => ['content' => 'test'],
        ]);
        $elementResponse->assertNotFound();
    });

    it('returns 422 for validation errors', function () {
        // Empty collection name
        $collectionResponse = $this->postJson('/api/v1/collections', [
            'name' => '',
        ]);
        $collectionResponse->assertStatus(422)
            ->assertJsonValidationErrors(['name']);

        // Invalid email format
        $registerResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'not-an-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);
        $registerResponse->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        // Password too short
        $shortPasswordResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);
        $shortPasswordResponse->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    });

    it('returns 401 for unauthenticated requests', function () {
        // Clear authentication
        $this->app['auth']->forgetGuards();

        $response = $this->getJson('/api/v1/collections');
        $response->assertStatus(401);
    });

});

describe('Concurrent Operations', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);

        $this->collection = Collection::create([
            'name' => 'Concurrent Test',
            'slug' => 'concurrent-test',
        ]);
    });

    it('handles rapid successive updates correctly', function () {
        // Create content
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Concurrent Update Test',
        ]);
        $contentId = $contentResponse->json('data.id');

        // Perform rapid updates
        $updates = [];
        for ($i = 1; $i <= 10; $i++) {
            $updateResponse = $this->putJson("/api/v1/contents/{$contentId}", [
                'title' => "Updated Title {$i}",
                'change_note' => "Rapid update {$i}",
            ]);
            $updateResponse->assertOk();
            $updates[] = $updateResponse->json('data.current_version');
        }

        // Verify versions are incrementing correctly
        $finalContent = $this->getJson("/api/v1/contents/{$contentId}");
        $finalContent->assertOk();
        expect($finalContent->json('data.current_version'))->toBeGreaterThanOrEqual(10);

        // Verify the final title reflects the last update
        expect($finalContent->json('data.title'))->toBe('Updated Title 10');
    });

    it('handles multiple element operations correctly', function () {
        // Create content
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Multiple Elements Test',
        ]);
        $contentId = $contentResponse->json('data.id');

        // Create multiple elements rapidly
        $elementIds = [];
        for ($i = 1; $i <= 10; $i++) {
            $elementResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
                'type' => 'text',
                'data' => ['content' => "Paragraph {$i}"],
            ]);
            $elementResponse->assertStatus(201);
            $elementIds[] = $elementResponse->json('data.id');
        }

        // All elements should have unique IDs
        expect(count(array_unique($elementIds)))->toBe(10);

        // Delete half the elements
        foreach (array_slice($elementIds, 0, 5) as $elementId) {
            $deleteResponse = $this->deleteJson("/api/v1/elements/{$elementId}");
            $deleteResponse->assertOk();
        }
    });

});

describe('Role-Based Access Control Workflow', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        // Create users with different roles
        $this->admin = User::factory()->create(['name' => 'Admin User']);
        $this->admin->assignRole('admin');

        $this->editor = User::factory()->create(['name' => 'Editor User']);
        $this->editor->assignRole('editor');

        $this->author = User::factory()->create(['name' => 'Author User']);
        $this->author->assignRole('author');

        $this->viewer = User::factory()->create(['name' => 'Viewer User']);
        $this->viewer->assignRole('viewer');

        // Create test collection and content
        $this->collection = Collection::create([
            'name' => 'RBAC Test Collection',
            'slug' => 'rbac-test-collection',
        ]);

        $this->content = Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'RBAC Test Content',
            'slug' => 'rbac-test-content',
            'status' => ContentStatus::DRAFT,
            'current_version' => 1,
        ]);
    });

    it('allows admin full access to all resources', function () {
        Passport::actingAs($this->admin);

        // Admin can manage users
        $usersResponse = $this->getJson('/api/v1/users');
        $usersResponse->assertOk();

        // Admin can create collections
        $collectionResponse = $this->postJson('/api/v1/collections', [
            'name' => 'Admin Created Collection',
        ]);
        $collectionResponse->assertStatus(201);

        // Admin can create and manage content
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Admin Created Content',
        ]);
        $contentResponse->assertStatus(201);
        $contentId = $contentResponse->json('data.id');

        // Admin can publish content
        $publishResponse = $this->postJson("/api/v1/contents/{$contentId}/publish");
        $publishResponse->assertOk();

        // Admin can delete content
        $deleteResponse = $this->deleteJson("/api/v1/contents/{$contentId}");
        $deleteResponse->assertOk();
    });

    it('restricts editor from user management', function () {
        Passport::actingAs($this->editor);

        // Editor cannot access user management
        $usersResponse = $this->getJson('/api/v1/users');
        $usersResponse->assertForbidden();

        // Editor can view collections
        $collectionsResponse = $this->getJson('/api/v1/collections');
        $collectionsResponse->assertOk();

        // Editor can create content
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Editor Created Content',
        ]);
        $contentResponse->assertStatus(201);
    });

    it('restricts author from administrative actions', function () {
        Passport::actingAs($this->author);

        // Author cannot access user management
        $usersResponse = $this->getJson('/api/v1/users');
        $usersResponse->assertForbidden();

        // Author can view collections
        $collectionsResponse = $this->getJson('/api/v1/collections');
        $collectionsResponse->assertOk();

        // Author can create content
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Author Created Content',
        ]);
        $contentResponse->assertStatus(201);
    });

    it('restricts viewer to read-only access', function () {
        Passport::actingAs($this->viewer);

        // Viewer cannot access user management
        $usersResponse = $this->getJson('/api/v1/users');
        $usersResponse->assertForbidden();

        // Viewer can read collections
        $collectionsResponse = $this->getJson('/api/v1/collections');
        $collectionsResponse->assertOk();

        // Viewer can read content
        $contentResponse = $this->getJson("/api/v1/contents/{$this->content->_id}");
        $contentResponse->assertOk();
    });

    it('handles role changes correctly in same session', function () {
        // Start with viewer role - viewer cannot access user management
        Passport::actingAs($this->viewer);

        $usersResponse = $this->getJson('/api/v1/users');
        $usersResponse->assertForbidden();

        // Upgrade viewer to admin role
        $this->viewer->syncRoles(['admin']);

        // Clear any cached permissions
        $this->viewer->fresh();
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        Passport::actingAs($this->viewer);

        // Now viewer (as admin) can access user management
        $usersResponse = $this->getJson('/api/v1/users');
        $usersResponse->assertOk();
    });

});

describe('Complete Media Workflow', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);

        $this->collection = Collection::create([
            'name' => 'Media Workflow Test',
            'slug' => 'media-workflow-test',
        ]);
    });

    it('can complete full media lifecycle with content', function () {
        // Step 1: Create content
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Article with Media',
        ]);
        $contentResponse->assertStatus(201);
        $contentId = $contentResponse->json('data.id');

        // Step 2: Create media record (simulating upload)
        $media = \App\Models\Mongodb\Media::create([
            'original_filename' => 'article-hero.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 204800,
            'alt' => 'Article hero image',
            'caption' => 'Main article image',
            'uploaded_by' => $this->user->id,
        ]);

        // Step 3: Create media element in content
        $mediaElementResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'media',
            'data' => [
                'media_id' => (string) $media->_id,
                'media_type' => 'image',
                'alt' => 'Hero image',
                'caption' => 'Featured image for the article',
            ],
        ]);
        $mediaElementResponse->assertStatus(201);
        $mediaElementId = $mediaElementResponse->json('data.id');

        // Step 4: Add more content around the media
        $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'text',
            'data' => ['content' => 'Introduction text before the image'],
        ])->assertStatus(201);

        $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'text',
            'data' => ['content' => 'Conclusion text after the image'],
        ])->assertStatus(201);

        // Step 5: Verify media is retrievable
        $mediaGetResponse = $this->getJson("/api/v1/media/{$media->_id}?metadata_only=true");
        $mediaGetResponse->assertOk()
            ->assertJsonPath('data.original_filename', 'article-hero.jpg')
            ->assertJsonPath('data.alt', 'Article hero image');

        // Step 6: Verify media listing includes the uploaded file
        $mediaListResponse = $this->getJson('/api/v1/media');
        $mediaListResponse->assertOk();
        expect(count($mediaListResponse->json('data')))->toBeGreaterThanOrEqual(1);

        // Step 7: Publish content with media
        $publishResponse = $this->postJson("/api/v1/contents/{$contentId}/publish");
        $publishResponse->assertOk();

        // Step 8: Verify content includes media element
        $contentGetResponse = $this->getJson("/api/v1/contents/{$contentId}");
        $contentGetResponse->assertOk()
            ->assertJsonPath('data.status', 'published');
    });

    it('can manage multiple media types', function () {
        // Create different media types
        $imageMedia = \App\Models\Mongodb\Media::create([
            'original_filename' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 102400,
            'uploaded_by' => $this->user->id,
        ]);

        $documentMedia = \App\Models\Mongodb\Media::create([
            'original_filename' => 'document.pdf',
            'mime_type' => 'application/pdf',
            'media_type' => 'document',
            'size' => 512000,
            'uploaded_by' => $this->user->id,
        ]);

        $videoMedia = \App\Models\Mongodb\Media::create([
            'original_filename' => 'intro.mp4',
            'mime_type' => 'video/mp4',
            'media_type' => 'video',
            'size' => 10485760,
            'uploaded_by' => $this->user->id,
        ]);

        // Filter by type
        $imagesResponse = $this->getJson('/api/v1/media?type=image');
        $imagesResponse->assertOk();
        expect($imagesResponse->json('data.0.media_type'))->toBe('image');

        $documentsResponse = $this->getJson('/api/v1/media?type=document');
        $documentsResponse->assertOk();
        expect($documentsResponse->json('data.0.media_type'))->toBe('document');

        $videosResponse = $this->getJson('/api/v1/media?type=video');
        $videosResponse->assertOk();
        expect($videosResponse->json('data.0.media_type'))->toBe('video');

        // Search media by filename
        $searchResponse = $this->getJson('/api/v1/media?search=photo');
        $searchResponse->assertOk();
        expect(count($searchResponse->json('data')))->toBe(1);
        expect($searchResponse->json('data.0.original_filename'))->toBe('photo.jpg');
    });

});

describe('Advanced Search and Filtering', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);

        // Create collection with varied content
        $this->collection = Collection::create([
            'name' => 'Search Test Collection',
            'slug' => 'search-test-collection',
        ]);

        // Create contents with different statuses and titles
        Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Introduction to PHP',
            'slug' => 'intro-php',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Advanced PHP Techniques',
            'slug' => 'advanced-php',
            'status' => ContentStatus::DRAFT,
            'current_version' => 1,
        ]);

        Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'JavaScript Fundamentals',
            'slug' => 'js-fundamentals',
            'status' => ContentStatus::PUBLISHED,
            'current_version' => 1,
        ]);

        Content::create([
            'collection_id' => $this->collection->_id,
            'title' => 'Python for Beginners',
            'slug' => 'python-beginners',
            'status' => ContentStatus::ARCHIVED,
            'current_version' => 1,
        ]);
    });

    it('can filter contents by multiple criteria simultaneously', function () {
        // Filter by status only
        $publishedResponse = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?status=published");
        $publishedResponse->assertOk();
        expect(count($publishedResponse->json('data')))->toBe(2);

        // All published content titles should be returned
        $titles = collect($publishedResponse->json('data'))->pluck('title')->toArray();
        expect($titles)->toContain('Introduction to PHP');
        expect($titles)->toContain('JavaScript Fundamentals');
    });

    it('can paginate and sort results', function () {
        // Create more content for pagination testing
        for ($i = 1; $i <= 20; $i++) {
            Content::create([
                'collection_id' => $this->collection->_id,
                'title' => "Pagination Test Article {$i}",
                'slug' => "pagination-test-{$i}",
                'status' => ContentStatus::DRAFT,
                'current_version' => 1,
            ]);
        }

        // First page with 5 per page
        $page1Response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?per_page=5&page=1");
        $page1Response->assertOk();
        expect(count($page1Response->json('data')))->toBe(5);
        expect($page1Response->json('meta.current_page'))->toBe(1);
        expect($page1Response->json('meta.total'))->toBe(24);

        // Navigate to last page
        $lastPage = $page1Response->json('meta.last_page');
        $lastPageResponse = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?per_page=5&page={$lastPage}");
        $lastPageResponse->assertOk();
        expect($lastPageResponse->json('meta.current_page'))->toBe($lastPage);
    });

    it('handles empty search results gracefully', function () {
        // Search for non-existent content status
        $emptyResponse = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?status=nonexistent");
        $emptyResponse->assertOk();
        expect(count($emptyResponse->json('data')))->toBe(0);
    });

    it('can search users by name and email', function () {
        // Create test users
        User::factory()->create([
            'name' => 'John Developer',
            'email' => 'john@developers.com',
        ]);
        User::factory()->create([
            'name' => 'Jane Designer',
            'email' => 'jane@designers.com',
        ]);
        User::factory()->create([
            'name' => 'Bob Manager',
            'email' => 'bob@managers.com',
        ]);

        // Search by name
        $nameSearchResponse = $this->getJson('/api/v1/users?search=Developer');
        $nameSearchResponse->assertOk();
        expect(count($nameSearchResponse->json('data')))->toBe(1);
        expect($nameSearchResponse->json('data.0.name'))->toBe('John Developer');

        // Search by email domain
        $emailSearchResponse = $this->getJson('/api/v1/users?search=designers');
        $emailSearchResponse->assertOk();
        expect(count($emailSearchResponse->json('data')))->toBe(1);
        expect($emailSearchResponse->json('data.0.email'))->toBe('jane@designers.com');
    });

});

describe('Data Integrity and Cascading Operations', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);
    });

    it('maintains data integrity when deleting content with elements', function () {
        // Create collection and content
        $collection = Collection::create([
            'name' => 'Integrity Test',
            'slug' => 'integrity-test',
        ]);

        $contentResponse = $this->postJson("/api/v1/collections/{$collection->slug}/contents", [
            'title' => 'Content with Elements',
        ]);
        $contentId = $contentResponse->json('data.id');

        // Add multiple elements
        $elementIds = [];
        for ($i = 1; $i <= 5; $i++) {
            $elementResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
                'type' => 'text',
                'data' => ['content' => "Paragraph {$i}"],
            ]);
            $elementIds[] = $elementResponse->json('data.id');
        }

        // Delete the content
        $deleteResponse = $this->deleteJson("/api/v1/contents/{$contentId}");
        $deleteResponse->assertOk();

        // Verify content is gone
        $getResponse = $this->getJson("/api/v1/contents/{$contentId}");
        $getResponse->assertNotFound();

        // Verify elements are also deleted (they should return 404)
        foreach ($elementIds as $elementId) {
            $elementGetResponse = $this->putJson("/api/v1/elements/{$elementId}", [
                'data' => ['content' => 'test'],
            ]);
            $elementGetResponse->assertNotFound();
        }
    });

    it('maintains version integrity across updates', function () {
        $collection = Collection::create([
            'name' => 'Version Integrity Test',
            'slug' => 'version-integrity-test',
        ]);

        // Create content
        $contentResponse = $this->postJson("/api/v1/collections/{$collection->slug}/contents", [
            'title' => 'Version Test',
        ]);
        $contentId = $contentResponse->json('data.id');
        $initialVersion = $contentResponse->json('data.current_version');
        expect($initialVersion)->toBe(1);

        // Add element (creates version 2)
        $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'text',
            'data' => ['content' => 'First paragraph'],
        ])->assertStatus(201);

        // Update content multiple times
        for ($i = 1; $i <= 5; $i++) {
            $updateResponse = $this->putJson("/api/v1/contents/{$contentId}", [
                'title' => "Version Test Update {$i}",
                'change_note' => "Update number {$i}",
            ]);
            $updateResponse->assertOk();
        }

        // Verify the final content has incremented version
        $finalContentResponse = $this->getJson("/api/v1/contents/{$contentId}");
        $finalContentResponse->assertOk();
        $finalVersion = $finalContentResponse->json('data.current_version');

        // Should have at least 7 versions (1 initial + 1 element + 5 updates)
        expect($finalVersion)->toBeGreaterThanOrEqual(7);
    });

    it('handles nested element deletion correctly', function () {
        $collection = Collection::create([
            'name' => 'Nested Deletion Test',
            'slug' => 'nested-deletion-test',
        ]);

        $contentResponse = $this->postJson("/api/v1/collections/{$collection->slug}/contents", [
            'title' => 'Nested Elements',
        ]);
        $contentId = $contentResponse->json('data.id');

        // Create wrapper with nested elements
        $wrapperResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'wrapper',
            'data' => ['purpose' => 'generic', 'layout' => 'container'],
        ]);
        $wrapperId = $wrapperResponse->json('data.id');

        // Add nested elements
        $nestedIds = [];
        for ($i = 1; $i <= 3; $i++) {
            $nestedResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
                'type' => 'text',
                'parent_id' => $wrapperId,
                'data' => ['content' => "Nested text {$i}"],
            ]);
            $nestedIds[] = $nestedResponse->json('data.id');
        }

        // Delete the wrapper (should handle children appropriately)
        $deleteResponse = $this->deleteJson("/api/v1/elements/{$wrapperId}");
        $deleteResponse->assertSuccessful();

        // Verify wrapper is gone
        $wrapperGetResponse = $this->putJson("/api/v1/elements/{$wrapperId}", [
            'data' => ['layout' => 'test'],
        ]);
        $wrapperGetResponse->assertNotFound();
    });

});

describe('API Response Consistency', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);
    });

    it('returns consistent response structure for list endpoints', function () {
        // Create test data
        $collection = Collection::create([
            'name' => 'Response Test',
            'slug' => 'response-test',
        ]);

        for ($i = 1; $i <= 5; $i++) {
            Content::create([
                'collection_id' => $collection->_id,
                'title' => "Content {$i}",
                'slug' => "content-{$i}",
                'status' => ContentStatus::DRAFT,
                'current_version' => 1,
            ]);
        }

        // Check collections list structure
        $collectionsResponse = $this->getJson('/api/v1/collections');
        $collectionsResponse->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug'],
                ],
            ]);

        // Check contents list structure
        $contentsResponse = $this->getJson("/api/v1/collections/{$collection->slug}/contents");
        $contentsResponse->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'slug', 'status', 'current_version'],
                ],
                'links',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        // Check users list structure
        $usersResponse = $this->getJson('/api/v1/users');
        $usersResponse->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email'],
                ],
            ]);
    });

    it('returns consistent response structure for single resource endpoints', function () {
        $collection = Collection::create([
            'name' => 'Single Resource Test',
            'slug' => 'single-resource-test',
        ]);

        $content = Content::create([
            'collection_id' => $collection->_id,
            'title' => 'Single Content',
            'slug' => 'single-content',
            'status' => ContentStatus::DRAFT,
            'current_version' => 1,
        ]);

        // Check collection show structure
        $collectionResponse = $this->getJson("/api/v1/collections/{$collection->slug}");
        $collectionResponse->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'slug'],
            ]);

        // Check content show structure
        $contentResponse = $this->getJson("/api/v1/contents/{$content->_id}");
        $contentResponse->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'title', 'slug', 'status', 'current_version'],
            ]);

        // Check user show structure
        $userResponse = $this->getJson("/api/v1/users/{$this->user->id}");
        $userResponse->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email', 'roles'],
            ]);
    });

    it('returns consistent error response structure', function () {
        // 404 error structure
        $notFoundResponse = $this->getJson('/api/v1/contents/nonexistent-id');
        $notFoundResponse->assertNotFound()
            ->assertJsonStructure(['message']);

        // 422 validation error structure
        $validationResponse = $this->postJson('/api/v1/collections', [
            'name' => '',
        ]);
        $validationResponse->assertStatus(422)
            ->assertJsonStructure([
                'message',
                'errors' => ['name'],
            ]);
    });

});

describe('Complete Publishing Workflow', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Passport::actingAs($this->user);

        $this->collection = Collection::create([
            'name' => 'Publishing Workflow',
            'slug' => 'publishing-workflow',
        ]);
    });

    it('can complete full editorial workflow', function () {
        // Step 1: Create draft content
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Editorial Workflow Article',
        ]);
        $contentId = $contentResponse->json('data.id');
        expect($contentResponse->json('data.status'))->toBe('draft');

        // Step 2: Add content elements
        $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'html',
            'data' => ['content' => '<h1>Article Title</h1>'],
        ])->assertStatus(201);

        $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'text',
            'data' => ['content' => 'This is the article introduction.'],
        ])->assertStatus(201);

        // Step 3: Update content with more details
        $this->putJson("/api/v1/contents/{$contentId}", [
            'title' => 'Editorial Workflow Article - Updated',
            'change_note' => 'Added introduction',
        ])->assertOk();

        // Step 4: Verify content version has incremented
        $contentCheck = $this->getJson("/api/v1/contents/{$contentId}");
        $contentCheck->assertOk();
        expect($contentCheck->json('data.current_version'))->toBeGreaterThanOrEqual(2);

        // Step 5: Publish the content
        $publishResponse = $this->postJson("/api/v1/contents/{$contentId}/publish");
        $publishResponse->assertOk()
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.is_published', true);

        // Step 6: Make corrections (unpublish, edit, republish)
        $this->postJson("/api/v1/contents/{$contentId}/unpublish")->assertOk();

        $this->putJson("/api/v1/contents/{$contentId}", [
            'title' => 'Editorial Workflow Article - Corrected',
            'change_note' => 'Fixed typos',
        ])->assertOk();

        $this->postJson("/api/v1/contents/{$contentId}/publish")->assertOk();

        // Step 7: Eventually archive the content
        $archiveResponse = $this->postJson("/api/v1/contents/{$contentId}/archive");
        $archiveResponse->assertOk()
            ->assertJsonPath('data.status', 'archived');

        // Step 8: Verify final state
        $finalContent = $this->getJson("/api/v1/contents/{$contentId}");
        $finalContent->assertOk()
            ->assertJsonPath('data.status', 'archived')
            ->assertJsonPath('data.title', 'Editorial Workflow Article - Corrected');

        // Step 9: Verify content version reflects all changes
        $finalContent = $this->getJson("/api/v1/contents/{$contentId}");
        $finalContent->assertOk();
        expect($finalContent->json('data.current_version'))->toBeGreaterThanOrEqual(4);
    });

    it('can restore content from any version', function () {
        // Create content with multiple versions
        $contentResponse = $this->postJson("/api/v1/collections/{$this->collection->slug}/contents", [
            'title' => 'Version 1 Title',
        ]);
        $contentId = $contentResponse->json('data.id');

        // Create version 2
        $this->putJson("/api/v1/contents/{$contentId}", [
            'title' => 'Version 2 Title',
            'change_note' => 'Changed title',
        ])->assertOk();

        // Create version 3
        $this->putJson("/api/v1/contents/{$contentId}", [
            'title' => 'Version 3 Title',
            'change_note' => 'Changed title again',
        ])->assertOk();

        // Verify current is version 3
        $currentContent = $this->getJson("/api/v1/contents/{$contentId}");
        expect($currentContent->json('data.title'))->toBe('Version 3 Title');

        // Restore to version 1
        $restoreResponse = $this->postJson("/api/v1/contents/{$contentId}/versions/1/restore");
        $restoreResponse->assertOk();

        // Verify content has been restored (creates new version)
        $restoredContent = $this->getJson("/api/v1/contents/{$contentId}");
        $restoredContent->assertOk();

        // Version should be incremented
        expect($restoredContent->json('data.current_version'))->toBeGreaterThan(3);
    });

});

describe('User Management Workflow', function () {

    beforeEach(function () {
        Client::factory()->asPersonalAccessTokenClient()->create([
            'name' => 'Test Personal Access Client',
        ]);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        Passport::actingAs($this->admin);
    });

    it('can complete full user lifecycle', function () {
        // Step 1: Create a new user
        $createResponse = $this->postJson('/api/v1/users', [
            'name' => 'New Team Member',
            'email' => 'team.member@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
            'roles' => ['author'],
        ]);
        $createResponse->assertStatus(201);
        $userId = $createResponse->json('data.id');

        // Step 2: Verify user was created
        $getResponse = $this->getJson("/api/v1/users/{$userId}");
        $getResponse->assertOk()
            ->assertJsonPath('data.name', 'New Team Member')
            ->assertJsonPath('data.email', 'team.member@example.com');

        // Step 3: Update user's role
        $updateResponse = $this->putJson("/api/v1/users/{$userId}", [
            'roles' => ['editor'],
        ]);
        $updateResponse->assertOk();

        // Step 4: Verify role was updated
        $verifyResponse = $this->getJson("/api/v1/users/{$userId}");
        expect($verifyResponse->json('data.roles'))->toContain('editor');

        // Step 5: Update user's profile
        $profileUpdateResponse = $this->putJson("/api/v1/users/{$userId}", [
            'name' => 'Senior Team Member',
        ]);
        $profileUpdateResponse->assertOk()
            ->assertJsonPath('data.name', 'Senior Team Member');

        // Step 6: List all users and verify the new user is included
        $listResponse = $this->getJson('/api/v1/users');
        $listResponse->assertOk();
        $users = collect($listResponse->json('data'));
        expect($users->where('email', 'team.member@example.com')->count())->toBe(1);

        // Step 7: Delete the user
        $deleteResponse = $this->deleteJson("/api/v1/users/{$userId}");
        $deleteResponse->assertOk();

        // Step 8: Verify user is deleted
        $deletedGetResponse = $this->getJson("/api/v1/users/{$userId}");
        $deletedGetResponse->assertNotFound();
    });

    it('prevents admin from deleting themselves', function () {
        $deleteResponse = $this->deleteJson("/api/v1/users/{$this->admin->id}");
        $deleteResponse->assertForbidden();

        // Verify admin still exists
        $verifyResponse = $this->getJson("/api/v1/users/{$this->admin->id}");
        $verifyResponse->assertOk();
    });

    it('validates unique email across user updates', function () {
        // Create two users
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);

        // Try to update user2's email to user1's email
        $updateResponse = $this->putJson("/api/v1/users/{$user2->id}", [
            'email' => 'user1@example.com',
        ]);
        $updateResponse->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

});
