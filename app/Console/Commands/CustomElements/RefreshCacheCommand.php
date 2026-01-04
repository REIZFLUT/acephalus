<?php

declare(strict_types=1);

namespace App\Console\Commands\CustomElements;

use App\Services\CustomElementService;
use Illuminate\Console\Command;

class RefreshCacheCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'custom-elements:refresh 
                            {--list : List all available custom elements}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh the custom elements cache from JSON files';

    /**
     * Execute the console command.
     */
    public function handle(CustomElementService $service): int
    {
        $this->info('Refreshing custom elements cache...');

        $elements = $service->refresh();

        if ($elements->isEmpty()) {
            $this->warn('No custom elements found.');
            $this->line('Place JSON files in: '.$service->getPath());

            return self::SUCCESS;
        }

        $this->info("Loaded {$elements->count()} custom element(s):");

        if ($this->option('list')) {
            $tableData = $elements->map(function ($element) {
                return [
                    'type' => $element['type'],
                    'label' => $element['label'],
                    'category' => $element['category'],
                    'fields' => count($element['fields'] ?? []),
                    'children' => ($element['canHaveChildren'] ?? false) ? 'Yes' : 'No',
                ];
            })->values()->all();

            $this->table(
                ['Type', 'Label', 'Category', 'Fields', 'Can Have Children'],
                $tableData
            );
        } else {
            foreach ($elements as $type => $element) {
                $this->line("  • {$type} ({$element['label']})");
            }
        }

        $this->newLine();
        $this->info('Cache refreshed successfully!');

        return self::SUCCESS;
    }
}
