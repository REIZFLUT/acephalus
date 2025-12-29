<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Mongodb\Collection;
use App\Models\Mongodb\ContentVersion;
use App\Services\EditionService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class MigrateEditions extends Command
{
    protected $signature = 'editions:migrate {--dry-run : Show what would be updated without making changes}';

    protected $description = 'Migrate existing collections and content versions to use the editions system';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('Running in dry-run mode. No changes will be made.');
        }

        $this->info('Migrating collections to editions system...');

        // Update all collections without current_edition
        $collections = Collection::whereNull('current_edition')
            ->orWhere('current_edition', '')
            ->get();

        $this->info("Found {$collections->count()} collections to migrate.");

        foreach ($collections as $collection) {
            $this->line("  - Migrating collection: {$collection->name}");

            if (! $isDryRun) {
                $collection->update([
                    'current_edition' => EditionService::DEFAULT_EDITION,
                    'editions' => [
                        [
                            'name' => EditionService::DEFAULT_EDITION,
                            'created_at' => Carbon::now()->toISOString(),
                            'created_by' => null,
                        ],
                    ],
                ]);
            }
        }

        $this->newLine();
        $this->info('Migrating content versions to editions system...');

        // Update all content versions without edition
        $versionsCount = ContentVersion::whereNull('edition')
            ->orWhere('edition', '')
            ->count();

        $this->info("Found {$versionsCount} content versions to migrate.");

        if (! $isDryRun && $versionsCount > 0) {
            ContentVersion::whereNull('edition')
                ->orWhere('edition', '')
                ->update([
                    'edition' => EditionService::DEFAULT_EDITION,
                    'is_edition_end' => false,
                ]);
        }

        $this->newLine();

        if ($isDryRun) {
            $this->warn('Dry run completed. Run without --dry-run to apply changes.');
        } else {
            $this->info('Migration completed successfully!');
        }

        return self::SUCCESS;
    }
}
