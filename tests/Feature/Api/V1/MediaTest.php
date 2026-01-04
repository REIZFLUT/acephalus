<?php

declare(strict_types=1);

use App\Models\Mongodb\Media;
use App\Models\User;
use App\Services\GridFsMediaService;
use Illuminate\Http\UploadedFile;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

beforeEach(function () {
    Client::factory()->asPersonalAccessTokenClient()->create([
        'name' => 'Test Personal Access Client',
    ]);

    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    Passport::actingAs($this->user);
});

describe('Media Listing', function () {

    it('can list all media files', function () {
        Media::create([
            'original_filename' => 'image1.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 1024,
            'uploaded_by' => $this->user->id,
        ]);
        Media::create([
            'original_filename' => 'image2.png',
            'mime_type' => 'image/png',
            'media_type' => 'image',
            'size' => 2048,
            'uploaded_by' => $this->user->id,
        ]);

        $response = $this->getJson('/api/v1/media');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'original_filename', 'mime_type', 'media_type', 'size'],
                ],
            ]);

        expect(count($response->json('data')))->toBe(2);
    });

    it('can filter media by type', function () {
        Media::create([
            'original_filename' => 'image.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 1024,
            'uploaded_by' => $this->user->id,
        ]);
        Media::create([
            'original_filename' => 'document.pdf',
            'mime_type' => 'application/pdf',
            'media_type' => 'document',
            'size' => 5120,
            'uploaded_by' => $this->user->id,
        ]);
        Media::create([
            'original_filename' => 'video.mp4',
            'mime_type' => 'video/mp4',
            'media_type' => 'video',
            'size' => 10240,
            'uploaded_by' => $this->user->id,
        ]);

        $response = $this->getJson('/api/v1/media?type=image');

        $response->assertOk();
        expect(count($response->json('data')))->toBe(1);
        expect($response->json('data.0.media_type'))->toBe('image');
    });

    it('can search media by filename', function () {
        Media::create([
            'original_filename' => 'company-logo.png',
            'mime_type' => 'image/png',
            'media_type' => 'image',
            'size' => 1024,
            'uploaded_by' => $this->user->id,
        ]);
        Media::create([
            'original_filename' => 'hero-banner.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 2048,
            'uploaded_by' => $this->user->id,
        ]);

        $response = $this->getJson('/api/v1/media?search=logo');

        $response->assertOk();
        expect(count($response->json('data')))->toBe(1);
        expect($response->json('data.0.original_filename'))->toBe('company-logo.png');
    });

    it('paginates media listing', function () {
        for ($i = 1; $i <= 25; $i++) {
            Media::create([
                'original_filename' => "image{$i}.jpg",
                'mime_type' => 'image/jpeg',
                'media_type' => 'image',
                'size' => 1024 * $i,
                'uploaded_by' => $this->user->id,
            ]);
        }

        $response = $this->getJson('/api/v1/media?per_page=10');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        expect(count($response->json('data')))->toBe(10);
        expect($response->json('meta.total'))->toBe(25);
    });

    it('orders media by creation date descending', function () {
        $older = Media::create([
            'original_filename' => 'older.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 1024,
            'uploaded_by' => $this->user->id,
            'created_at' => now()->subDays(5),
        ]);

        $newer = Media::create([
            'original_filename' => 'newer.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 1024,
            'uploaded_by' => $this->user->id,
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/media');

        $response->assertOk();
        expect($response->json('data.0.original_filename'))->toBe('newer.jpg');
    });

});

describe('Media Upload Validation', function () {

    it('validates required file', function () {
        $response = $this->postJson('/api/v1/media', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    });

    it('validates file type', function () {
        $file = UploadedFile::fake()->create('malware.exe', 1024, 'application/x-msdownload');

        $response = $this->postJson('/api/v1/media', [
            'file' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    });

    // Note: File size validation depends on php.ini and StoreMediaRequest max_file_size configuration.
    // Not testing file size validation here as it varies by environment.

});

describe('Media Retrieval', function () {

    it('can get media metadata', function () {
        $media = Media::create([
            'original_filename' => 'details.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 2048,
            'alt' => 'Test alt text',
            'caption' => 'Test caption',
            'uploaded_by' => $this->user->id,
        ]);

        $response = $this->getJson("/api/v1/media/{$media->_id}?metadata_only=true");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'original_filename',
                    'mime_type',
                    'media_type',
                    'size',
                    'alt',
                    'caption',
                ],
            ])
            ->assertJsonPath('data.original_filename', 'details.jpg')
            ->assertJsonPath('data.alt', 'Test alt text');
    });

    it('can download media file', function () {
        $media = Media::create([
            'original_filename' => 'download.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 2048,
            'gridfs_id' => 'test-gridfs-id',
            'uploaded_by' => $this->user->id,
        ]);

        $fakeStream = fopen('php://memory', 'r+');
        fwrite($fakeStream, 'fake image content');
        rewind($fakeStream);

        $this->mock(GridFsMediaService::class, function ($mock) use ($fakeStream) {
            $mock->shouldReceive('download')
                ->once()
                ->andReturn($fakeStream);
        });

        $response = $this->get("/api/v1/media/{$media->_id}");

        $response->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg')
            ->assertHeader('Content-Disposition', 'inline; filename="download.jpg"');
    });

    it('returns 404 when file not found in storage', function () {
        $media = Media::create([
            'original_filename' => 'missing.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 2048,
            'gridfs_id' => 'missing-gridfs-id',
            'uploaded_by' => $this->user->id,
        ]);

        $this->mock(GridFsMediaService::class, function ($mock) {
            $mock->shouldReceive('download')
                ->once()
                ->andReturn(null);
        });

        $response = $this->getJson("/api/v1/media/{$media->_id}");

        $response->assertNotFound()
            ->assertJson(['message' => 'File not found in storage']);
    });

    it('returns 404 for non-existent media', function () {
        $response = $this->getJson('/api/v1/media/507f1f77bcf86cd799439011');

        $response->assertNotFound();
    });

});

describe('Media Deletion', function () {

    it('can delete a media file', function () {
        $media = Media::create([
            'original_filename' => 'delete-me.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 1024,
            'gridfs_id' => 'test-gridfs-id',
            'uploaded_by' => $this->user->id,
        ]);

        $this->mock(GridFsMediaService::class, function ($mock) {
            $mock->shouldReceive('delete')
                ->once();
        });

        $response = $this->deleteJson("/api/v1/media/{$media->_id}");

        $response->assertOk()
            ->assertJson(['message' => 'File deleted successfully']);
    });

    it('returns 404 when deleting non-existent media', function () {
        $response = $this->deleteJson('/api/v1/media/507f1f77bcf86cd799439011');

        $response->assertNotFound();
    });

});

describe('Media Authorization', function () {

    it('requires authentication', function () {
        $this->app['auth']->forgetGuards();

        $response = $this->getJson('/api/v1/media');

        $response->assertStatus(401);
    });

    it('any authenticated user can view media', function () {
        // Create some media first
        Media::create([
            'original_filename' => 'viewable.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 1024,
            'uploaded_by' => $this->user->id,
        ]);

        // Should be able to list media
        $listResponse = $this->getJson('/api/v1/media');
        $listResponse->assertOk();
    });

});

describe('Media Integration with Content', function () {

    it('can use media in content elements', function () {
        $media = Media::create([
            'original_filename' => 'content-image.jpg',
            'mime_type' => 'image/jpeg',
            'media_type' => 'image',
            'size' => 2048,
            'uploaded_by' => $this->user->id,
        ]);

        $collection = \App\Models\Mongodb\Collection::create([
            'name' => 'Media Test',
            'slug' => 'media-test',
        ]);

        $contentResponse = $this->postJson("/api/v1/collections/{$collection->slug}/contents", [
            'title' => 'Article with Media',
        ]);
        $contentId = $contentResponse->json('data.id');

        // Add media element
        $elementResponse = $this->postJson("/api/v1/contents/{$contentId}/elements", [
            'type' => 'media',
            'data' => [
                'media_id' => (string) $media->_id,
                'media_type' => 'image',
                'alt' => 'Article image',
                'caption' => 'Image caption',
            ],
        ]);

        $elementResponse->assertStatus(201)
            ->assertJsonPath('data.type', 'media')
            ->assertJsonPath('data.data.media_id', (string) $media->_id);
    });

});
