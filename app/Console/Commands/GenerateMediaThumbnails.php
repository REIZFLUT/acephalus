<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Mongodb\Media;
use App\Services\GridFsMediaService;
use App\Services\ThumbnailService;
use Illuminate\Console\Command;

class GenerateMediaThumbnails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:generate-thumbnails
                            {--force : Regenerate thumbnails even if they already exist}
                            {--id= : Generate thumbnails for a specific media ID only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate thumbnails for existing media files that do not have them';

    public function __construct(
        protected GridFsMediaService $mediaService,
        protected ThumbnailService $thumbnailService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $force = $this->option('force');
        $specificId = $this->option('id');

        $query = Media::query();

        // Filter by specific ID if provided
        if ($specificId) {
            $query->where('_id', $specificId);
        }

        // Only process images that the thumbnail service supports
        $supportedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        $query->whereIn('mime_type', $supportedMimeTypes);

        // If not forcing, only get media without thumbnails
        if (! $force) {
            $query->where(function ($q) {
                $q->whereNull('thumbnails')
                    ->orWhere('thumbnails', []);
            });
        }

        $total = $query->count();

        if ($total === 0) {
            $this->info('No media files need thumbnail generation.');

            return self::SUCCESS;
        }

        $this->info("Generating thumbnails for {$total} media file(s)...");
        $this->newLine();

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $success = 0;
        $failed = 0;
        $skipped = 0;

        // Process in chunks to manage memory
        $query->chunk(50, function ($mediaItems) use ($bar, $force, &$success, &$failed, &$skipped) {
            foreach ($mediaItems as $media) {
                try {
                    // Skip if thumbnails exist and not forcing
                    if (! $force && $media->hasThumbnails()) {
                        $skipped++;
                        $bar->advance();

                        continue;
                    }

                    $thumbnails = $this->mediaService->generateThumbnailsForMedia($media);

                    if (! empty($thumbnails)) {
                        $success++;
                    } else {
                        $failed++;
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $this->newLine();
                    $this->error("Failed to generate thumbnails for {$media->original_filename}: {$e->getMessage()}");
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info('Thumbnail generation complete!');
        $this->table(
            ['Status', 'Count'],
            [
                ['Success', $success],
                ['Failed', $failed],
                ['Skipped', $skipped],
            ]
        );

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
