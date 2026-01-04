<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Mongodb\Collection;
use App\Models\Mongodb\ContentVersion;
use App\Services\ReleaseService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class MigrateReleases extends Command
{
    protected $signature = 'releases:migrate {--dry-run : Show what would be updated without making changes}';

    protected $description = 'Migrate existing collections and content versions to use the releases system';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('Running in dry-run mode. No changes will be made.');
        }

        $this->info('Migrating collections to releases system...');

        // Update all collections without current_release
        $collections = Collection::whereNull('current_release')
            ->orWhere('current_release', '')
            ->get();

        $this->info("Found {$collections->count()} collections to migrate.");

        foreach ($collections as $collection) {
            $this->line("  - Migrating collection: {$collection->name}");

            if (! $isDryRun) {
                $collection->update([
                    'current_release' => ReleaseService::DEFAULT_RELEASE,
                    'releases' => [
                        [
                            'name' => ReleaseService::DEFAULT_RELEASE,
                            'created_at' => Carbon::now()->toISOString(),
                            'created_by' => null,
                        ],
                    ],
                ]);
            }
        }

        $this->newLine();
        $this->info('Migrating content versions to releases system...');

        // Update all content versions without release
        $versionsCount = ContentVersion::whereNull('release')
            ->orWhere('release', '')
            ->count();

        $this->info("Found {$versionsCount} content versions to migrate.");

        if (! $isDryRun && $versionsCount > 0) {
            ContentVersion::whereNull('release')
                ->orWhere('release', '')
                ->update([
                    'release' => ReleaseService::DEFAULT_RELEASE,
                    'is_release_end' => false,
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
