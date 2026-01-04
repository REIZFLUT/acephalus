<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RenameEditionToRelease extends Command
{
    protected $signature = 'releases:rename-fields {--dry-run : Show what would be updated without making changes}';

    protected $description = 'Rename edition fields to release in existing MongoDB documents';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('Running in dry-run mode. No changes will be made.');
        }

        $this->info('Renaming edition fields to release...');
        $this->newLine();

        // Rename fields in collections
        $this->renameCollectionFields($isDryRun);

        // Rename fields in content_versions
        $this->renameContentVersionFields($isDryRun);

        $this->newLine();

        if ($isDryRun) {
            $this->warn('Dry run completed. Run without --dry-run to apply changes.');
        } else {
            $this->info('Field renaming completed successfully!');
        }

        return self::SUCCESS;
    }

    protected function renameCollectionFields(bool $isDryRun): void
    {
        $this->info('Processing collections...');

        $mongodb = DB::connection('mongodb');
        $collection = $mongodb->getCollection('collections');

        // Count documents with old field names
        $countWithEdition = $collection->countDocuments([
            '$or' => [
                ['current_edition' => ['$exists' => true]],
                ['editions' => ['$exists' => true]],
            ],
        ]);

        $this->line("  Found {$countWithEdition} collection(s) with edition fields.");

        if (! $isDryRun && $countWithEdition > 0) {
            // Rename current_edition to current_release
            $collection->updateMany(
                ['current_edition' => ['$exists' => true]],
                ['$rename' => ['current_edition' => 'current_release']]
            );

            // Rename editions to releases
            $collection->updateMany(
                ['editions' => ['$exists' => true]],
                ['$rename' => ['editions' => 'releases']]
            );

            $this->line("  ✓ Renamed fields in {$countWithEdition} collection(s).");
        }
    }

    protected function renameContentVersionFields(bool $isDryRun): void
    {
        $this->info('Processing content versions...');

        $mongodb = DB::connection('mongodb');
        $collection = $mongodb->getCollection('content_versions');

        // Count documents with old field names
        $countWithEdition = $collection->countDocuments([
            '$or' => [
                ['edition' => ['$exists' => true]],
                ['is_edition_end' => ['$exists' => true]],
            ],
        ]);

        $this->line("  Found {$countWithEdition} content version(s) with edition fields.");

        if (! $isDryRun && $countWithEdition > 0) {
            // Rename edition to release
            $collection->updateMany(
                ['edition' => ['$exists' => true]],
                ['$rename' => ['edition' => 'release']]
            );

            // Rename is_edition_end to is_release_end
            $collection->updateMany(
                ['is_edition_end' => ['$exists' => true]],
                ['$rename' => ['is_edition_end' => 'is_release_end']]
            );

            $this->line("  ✓ Renamed fields in {$countWithEdition} content version(s).");
        }
    }
}
