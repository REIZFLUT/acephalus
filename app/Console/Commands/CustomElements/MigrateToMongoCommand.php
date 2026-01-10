<?php

declare(strict_types=1);

namespace App\Console\Commands\CustomElements;

use App\Models\Mongodb\CustomElement;
use App\Services\CustomElementService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MigrateToMongoCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'custom-elements:migrate 
                            {--force : Overwrite existing elements in MongoDB}
                            {--delete-files : Delete JSON files after successful migration}
                            {--dry-run : Show what would be migrated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate custom elements from JSON files to MongoDB';

    /**
     * Execute the console command.
     */
    public function handle(CustomElementService $service): int
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');
        $deleteFiles = $this->option('delete-files');

        if ($dryRun) {
            $this->warn('DRY RUN - No changes will be made.');
            $this->newLine();
        }

        $this->info('Loading custom elements from JSON files...');

        $elements = $service->loadFromFiles();

        if ($elements->isEmpty()) {
            $this->warn('No custom element JSON files found.');
            $this->line('Place JSON files in: ' . $service->getLegacyPath());

            return self::SUCCESS;
        }

        $this->info("Found {$elements->count()} custom element(s) to migrate:");
        $this->newLine();

        $migrated = 0;
        $skipped = 0;
        $errors = 0;
        $migratedFiles = [];

        foreach ($elements as $type => $data) {
            $exists = CustomElement::where('type', $type)->exists();

            if ($exists && ! $force) {
                $this->warn("  ⏭ Skipping '{$type}' - already exists in MongoDB (use --force to overwrite)");
                $skipped++;

                continue;
            }

            $this->line("  → Migrating '{$type}'...");

            if ($dryRun) {
                $this->info("    Would create/update: {$type}");
                $migrated++;
                if (isset($data['_file'])) {
                    $migratedFiles[] = $service->getLegacyPath() . '/' . $data['_file'];
                }

                continue;
            }

            try {
                $elementData = [
                    'type' => $data['type'],
                    'label' => $data['label'] ?? null,
                    'description' => $data['description'] ?? null,
                    'icon' => $data['icon'] ?? null,
                    'category' => $data['category'] ?? 'content',
                    'can_have_children' => $data['canHaveChildren'] ?? false,
                    'fields' => $data['fields'] ?? [],
                    'default_data' => $data['defaultData'] ?? [],
                    'preview_template' => $data['previewTemplate'] ?? null,
                    'css_class' => $data['cssClass'] ?? null,
                    'is_system' => false,
                ];

                if ($exists) {
                    CustomElement::where('type', $type)->update($elementData);
                    $this->info("    ✓ Updated '{$type}'");
                } else {
                    CustomElement::create($elementData);
                    $this->info("    ✓ Created '{$type}'");
                }

                $migrated++;

                if (isset($data['_file'])) {
                    $migratedFiles[] = $service->getLegacyPath() . '/' . $data['_file'];
                }
            } catch (\Exception $e) {
                $this->error("    ✗ Failed to migrate '{$type}': " . $e->getMessage());
                $errors++;
            }
        }

        $this->newLine();
        $this->info('Migration Summary:');
        $this->line("  Migrated: {$migrated}");
        $this->line("  Skipped:  {$skipped}");
        $this->line("  Errors:   {$errors}");

        // Delete files if requested
        if ($deleteFiles && ! $dryRun && $migrated > 0 && $errors === 0) {
            $this->newLine();

            if ($this->confirm('Delete the migrated JSON files?', true)) {
                $deletedCount = 0;
                foreach ($migratedFiles as $file) {
                    if (File::exists($file)) {
                        File::delete($file);
                        $this->line("  Deleted: {$file}");
                        $deletedCount++;
                    }
                }
                $this->info("Deleted {$deletedCount} file(s).");
            }
        }

        // Clear cache
        if (! $dryRun && $migrated > 0) {
            $this->newLine();
            $this->info('Clearing custom elements cache...');
            $service->clearCache();
            $this->info('Cache cleared.');
        }

        return $errors > 0 ? self::FAILURE : self::SUCCESS;
    }
}
