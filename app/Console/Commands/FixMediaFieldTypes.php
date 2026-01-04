<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Mongodb\Media;
use Illuminate\Console\Command;
use MongoDB\Laravel\Connection;

class FixMediaFieldTypes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:fix-field-types';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix media tags and metadata fields that were stored as JSON strings instead of native MongoDB types';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Fixing media field types...');

        /** @var Connection $connection */
        $connection = Media::getConnectionResolver()->connection('mongodb');
        $collection = $connection->getCollection('media');

        $fixed = 0;
        $errors = 0;

        // Get all media documents
        $cursor = $collection->find();

        foreach ($cursor as $document) {
            $updates = [];

            // Fix tags field if it's a string
            if (isset($document['tags']) && is_string($document['tags'])) {
                $decoded = json_decode($document['tags'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $updates['tags'] = is_array($decoded) ? $decoded : [];
                    $this->line("  - Fixing tags for: {$document['original_filename']}");
                } else {
                    $this->warn("  - Could not decode tags for: {$document['original_filename']}");
                    $errors++;
                }
            }

            // Fix metadata field if it's a string
            if (isset($document['metadata']) && is_string($document['metadata'])) {
                $decoded = json_decode($document['metadata'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $updates['metadata'] = is_array($decoded) ? $decoded : [];
                    $this->line("  - Fixing metadata for: {$document['original_filename']}");
                } else {
                    $this->warn("  - Could not decode metadata for: {$document['original_filename']}");
                    $errors++;
                }
            }

            // Apply updates if any
            if (! empty($updates)) {
                $collection->updateOne(
                    ['_id' => $document['_id']],
                    ['$set' => $updates]
                );
                $fixed++;
            }
        }

        $this->newLine();
        $this->info("Fixed {$fixed} media documents.");

        if ($errors > 0) {
            $this->warn("Encountered {$errors} errors.");
        }

        return Command::SUCCESS;
    }
}
