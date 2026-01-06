<?php

use App\Enums\ContentStatus;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\FilterView;
use App\Models\User;
use App\Services\ContentFilterService;
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
        'name' => 'Articles',
        'slug' => 'articles',
        'schema' => [
            'content_meta_fields' => [
                [
                    'name' => 'category',
                    'label' => 'Category',
                    'type' => 'select',
                    'required' => false,
                    'options' => [
                        ['value' => 'news', 'label' => 'News'],
                        ['value' => 'blog', 'label' => 'Blog'],
                        ['value' => 'tutorial', 'label' => 'Tutorial'],
                    ],
                ],
                [
                    'name' => 'author',
                    'label' => 'Author',
                    'type' => 'text',
                    'required' => false,
                ],
                [
                    'name' => 'featured',
                    'label' => 'Featured',
                    'type' => 'boolean',
                    'required' => false,
                ],
            ],
        ],
    ]);
});

afterEach(function () {
    Collection::where('slug', 'articles')->delete();
    Content::where('collection_id', $this->collection->_id)->delete();
    FilterView::query()->delete();
});

it('can list global filter views', function () {
    FilterView::create([
        'name' => 'Published Only',
        'slug' => 'published-only',
        'collection_id' => null,
        'is_system' => false,
        'conditions' => [
            'type' => 'group',
            'operator' => 'and',
            'children' => [
                ['type' => 'condition', 'field' => 'status', 'operator' => 'equals', 'value' => 'published'],
            ],
        ],
        'sort' => [],
    ]);

    FilterView::create([
        'name' => 'Collection Specific',
        'slug' => 'collection-specific',
        'collection_id' => (string) $this->collection->_id,
        'is_system' => false,
        'conditions' => ['type' => 'group', 'operator' => 'and', 'children' => []],
        'sort' => [],
    ]);

    $response = $this->getJson('/api/v1/filter-views');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Published Only');
});

it('can list filter views for a collection', function () {
    FilterView::create([
        'name' => 'Global Filter',
        'slug' => 'global-filter',
        'collection_id' => null,
        'is_system' => false,
        'conditions' => ['type' => 'group', 'operator' => 'and', 'children' => []],
        'sort' => [],
    ]);

    FilterView::create([
        'name' => 'Articles Filter',
        'slug' => 'articles-filter',
        'collection_id' => (string) $this->collection->_id,
        'is_system' => false,
        'conditions' => ['type' => 'group', 'operator' => 'and', 'children' => []],
        'sort' => [],
    ]);

    $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/filter-views");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('can get available filter fields for a collection', function () {
    $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/filter-fields");

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['field', 'label', 'type'],
            ],
        ]);

    // Check that base fields and metadata fields are included
    $fields = collect($response->json('data'));

    expect($fields->firstWhere('field', 'title'))->not->toBeNull();
    expect($fields->firstWhere('field', 'status'))->not->toBeNull();
    expect($fields->firstWhere('field', 'metadata.category'))->not->toBeNull();
    expect($fields->firstWhere('field', 'metadata.author'))->not->toBeNull();
});

it('can filter contents using a filter view', function () {
    // Create test contents
    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Draft News',
        'slug' => 'draft-news',
        'status' => ContentStatus::DRAFT,
        'current_version' => 1,
        'metadata' => ['category' => 'news'],
    ]);

    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Published Blog',
        'slug' => 'published-blog',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
        'metadata' => ['category' => 'blog'],
    ]);

    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Published News',
        'slug' => 'published-news',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
        'metadata' => ['category' => 'news'],
    ]);

    // Create a filter view for published news
    $filterView = FilterView::create([
        'name' => 'Published News',
        'slug' => 'published-news-filter',
        'collection_id' => (string) $this->collection->_id,
        'is_system' => false,
        'conditions' => [
            'type' => 'group',
            'operator' => 'and',
            'children' => [
                ['type' => 'condition', 'field' => 'status', 'operator' => 'equals', 'value' => 'published'],
                ['type' => 'condition', 'field' => 'metadata.category', 'operator' => 'equals', 'value' => 'news'],
            ],
        ],
        'sort' => [],
    ]);

    $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?filter_view={$filterView->_id}");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Published News');
});

it('can filter with OR conditions', function () {
    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'News Article',
        'slug' => 'news-article',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
        'metadata' => ['category' => 'news'],
    ]);

    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Blog Post',
        'slug' => 'blog-post',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
        'metadata' => ['category' => 'blog'],
    ]);

    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'Tutorial',
        'slug' => 'tutorial',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
        'metadata' => ['category' => 'tutorial'],
    ]);

    // Create a filter view for news OR blog
    $filterView = FilterView::create([
        'name' => 'News or Blog',
        'slug' => 'news-or-blog',
        'collection_id' => (string) $this->collection->_id,
        'is_system' => false,
        'conditions' => [
            'type' => 'group',
            'operator' => 'or',
            'children' => [
                ['type' => 'condition', 'field' => 'metadata.category', 'operator' => 'equals', 'value' => 'news'],
                ['type' => 'condition', 'field' => 'metadata.category', 'operator' => 'equals', 'value' => 'blog'],
            ],
        ],
        'sort' => [],
    ]);

    $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?filter_view={$filterView->_id}");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('can apply custom sorting from filter view', function () {
    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'ZZZ Article',
        'slug' => 'zzz-article',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
    ]);

    Content::create([
        'collection_id' => $this->collection->_id,
        'title' => 'AAA Article',
        'slug' => 'aaa-article',
        'status' => ContentStatus::PUBLISHED,
        'current_version' => 1,
    ]);

    $filterView = FilterView::create([
        'name' => 'Sorted by Title',
        'slug' => 'sorted-by-title',
        'collection_id' => (string) $this->collection->_id,
        'is_system' => false,
        'conditions' => ['type' => 'group', 'operator' => 'and', 'children' => []],
        'sort' => [
            ['field' => 'title', 'direction' => 'asc'],
        ],
    ]);

    $response = $this->getJson("/api/v1/collections/{$this->collection->slug}/contents?filter_view={$filterView->_id}");

    $response->assertOk()
        ->assertJsonPath('data.0.title', 'AAA Article')
        ->assertJsonPath('data.1.title', 'ZZZ Article');
});

describe('ContentFilterService', function () {
    it('validates raw queries and blocks forbidden operators', function () {
        $service = app(ContentFilterService::class);

        // Should pass - valid operators
        $validQuery = [
            'status' => 'published',
            '$and' => [
                ['metadata.category' => ['$eq' => 'news']],
                ['title' => ['$regex' => 'test', '$options' => 'i']],
            ],
        ];
        expect(fn () => $service->validateRawQuery($validQuery))->not->toThrow(Exception::class);

        // Should fail - $where is forbidden
        $invalidQuery = [
            '$where' => 'this.title === "test"',
        ];
        expect(fn () => $service->validateRawQuery($invalidQuery))->toThrow(InvalidArgumentException::class);

        // Should fail - $function is forbidden
        $invalidQuery2 = [
            '$function' => ['body' => 'function() { return true; }'],
        ];
        expect(fn () => $service->validateRawQuery($invalidQuery2))->toThrow(InvalidArgumentException::class);
    });

    it('returns correct operators for field types', function () {
        $service = app(ContentFilterService::class);

        $textOperators = $service->getOperatorsForType('text');
        expect($textOperators)->toBeArray();
        expect(collect($textOperators)->pluck('value'))->toContain('contains', 'starts_with', 'ends_with');

        $numberOperators = $service->getOperatorsForType('number');
        expect(collect($numberOperators)->pluck('value'))->toContain('gt', 'gte', 'lt', 'lte');

        $booleanOperators = $service->getOperatorsForType('boolean');
        expect(collect($booleanOperators)->pluck('value'))->toContain('equals', 'not_equals');
        expect(collect($booleanOperators)->pluck('value'))->not->toContain('contains');
    });

    it('gets available fields from collection schema', function () {
        $service = app(ContentFilterService::class);
        $fields = $service->getAvailableFields($this->collection);

        expect($fields)->toBeArray();

        $fieldNames = collect($fields)->pluck('field');
        expect($fieldNames)->toContain('title', 'slug', 'status');
        expect($fieldNames)->toContain('metadata.category', 'metadata.author', 'metadata.featured');
    });
});
