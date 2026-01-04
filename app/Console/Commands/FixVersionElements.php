<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Mongodb\Content;
use App\Models\Mongodb\ContentVersion;
use Illuminate\Console\Command;

class FixVersionElements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'versions:fix-elements
        {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix version elements by copying from parent content (for versions with empty elements)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $this->info($dryRun ? 'DRY RUN - No changes will be made' : 'Fixing version elements...');
        $this->newLine();

        // Find all versions with empty elements
        $versionsToFix = ContentVersion::whereNull('elements')
            ->orWhere('elements', [])
            ->get();

        if ($versionsToFix->isEmpty()) {
            $this->info('No versions with empty elements found.');

            return Command::SUCCESS;
        }

        $this->info("Found {$versionsToFix->count()} versions with empty elements.");

        $fixed = 0;
        $skipped = 0;

        foreach ($versionsToFix as $version) {
            $content = Content::find($version->content_id);

            if (! $content) {
                $this->warn("  - Version {$version->_id}: Content not found, skipping");
                $skipped++;

                continue;
            }

            $elements = $content->elements ?? [];

            if (empty($elements)) {
                $this->line("  - Version {$version->version_number} of '{$content->title}': Content also has no elements");
                $skipped++;

                continue;
            }

            if ($dryRun) {
                $this->line("  - Would update Version {$version->version_number} of '{$content->title}' with ".count($elements).' elements');
            } else {
                $version->update(['elements' => $elements]);
                $this->line("  - Updated Version {$version->version_number} of '{$content->title}' with ".count($elements).' elements');
            }

            $fixed++;
        }

        $this->newLine();
        $this->info($dryRun ? "Would fix {$fixed} versions (skipped {$skipped})" : "Fixed {$fixed} versions (skipped {$skipped})");

        return Command::SUCCESS;
    }
}
