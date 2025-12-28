<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use MongoDB\Client;

class MigrateMongoArrays extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'mongo:migrate-arrays
                            {--dry-run : Run without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Migrate MongoDB string fields to native arrays where applicable';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('Running in dry-run mode. No changes will be made.');
        }

        $client = new Client(config('database.connections.mongodb.dsn'));
        $database = $client->selectDatabase(config('database.connections.mongodb.database'));

        $this->migrateCollection($database, 'contents', ['elements', 'metadata'], $dryRun);
        $this->migrateCollection($database, 'content_versions', ['elements', 'snapshot'], $dryRun);
        $this->migrateCollection($database, 'collections', ['schema', 'settings'], $dryRun);

        $this->newLine();
        $this->info('Migration completed!');

        return Command::SUCCESS;
    }

    /**
     * Migrate a collection's string fields to native arrays.
     */
    private function migrateCollection(
        \MongoDB\Database $database,
        string $collectionName,
        array $fields,
        bool $dryRun
    ): void {
        $this->newLine();
        $this->info("Processing collection: {$collectionName}");

        $collection = $database->selectCollection($collectionName);
        $documents = $collection->find();

        $total = 0;
        $migrated = 0;

        foreach ($documents as $document) {
            $total++;
            $updates = [];
            $documentId = (string) $document->_id;

            foreach ($fields as $field) {
                if (! isset($document->{$field})) {
                    continue;
                }

                $value = $document->{$field};

                // Check if value is a string (JSON encoded)
                if (is_string($value)) {
                    $decoded = json_decode($value, true);

                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $updates[$field] = $decoded;
                        $this->line("  [{$documentId}] Field '{$field}': String -> Array");
                    }
                }
            }

            if (! empty($updates)) {
                if (! $dryRun) {
                    $collection->updateOne(
                        ['_id' => $document->_id],
                        ['$set' => $updates]
                    );
                }
                $migrated++;
            }
        }

        $this->info("  Total documents: {$total}, Migrated: {$migrated}");
    }
}
