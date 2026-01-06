<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Mongodb\Content;
use App\Models\Mongodb\ContentVersion;
use Illuminate\Console\Command;

class FixVersionNumbers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'versions:fix-numbers
        {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix version numbers to be sequential (1, 2, 3, ...) per content';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $this->info($dryRun ? 'DRY RUN - No changes will be made' : 'Fixing version numbers...');
        $this->newLine();

        // Get all contents
        $contents = Content::all();

        foreach ($contents as $content) {
            $this->info("Processing content: {$content->title} ({$content->_id})");

            // Get all versions for this content, ordered by creation time
            $versions = ContentVersion::where('content_id', $content->_id)
                ->orderBy('created_at')
                ->get();

            if ($versions->isEmpty()) {
                $this->line('  - No versions found, skipping');

                continue;
            }

            $this->line("  - Found {$versions->count()} versions");

            // Assign sequential version numbers
            $versionNumber = 1;
            foreach ($versions as $version) {
                $oldNumber = $version->version_number;

                if ($oldNumber !== $versionNumber) {
                    if ($dryRun) {
                        $this->line("    Would change v{$oldNumber} -> v{$versionNumber}");
                    } else {
                        $version->update(['version_number' => $versionNumber]);
                        $this->line("    Changed v{$oldNumber} -> v{$versionNumber}");
                    }
                } else {
                    $this->line("    v{$versionNumber} is correct");
                }

                $versionNumber++;
            }

            // Update the content's current_version to the highest version number
            $highestVersion = $versions->count();
            if ($content->current_version !== $highestVersion) {
                if ($dryRun) {
                    $this->line("  - Would update content current_version: {$content->current_version} -> {$highestVersion}");
                } else {
                    $content->update(['current_version' => $highestVersion]);
                    $this->line("  - Updated content current_version: {$content->current_version} -> {$highestVersion}");
                }
            }

            $this->newLine();
        }

        $this->info($dryRun ? 'Dry run complete.' : 'Version numbers fixed!');

        return Command::SUCCESS;
    }
}
