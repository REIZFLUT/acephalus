<?php

declare(strict_types=1);

namespace App\Services\Agent\Tools;

use App\Models\Mongodb\Agent;
use App\Models\Mongodb\Collection;
use Prism\Prism\Facades\Tool;
use Prism\Prism\Tool as PrismTool;

class CollectionTool extends AbstractAgentTool
{
    protected string $requiredPermission = 'collections.view';

    /**
     * The action being performed.
     */
    private string $action;

    public function __construct(string $action = 'list')
    {
        $this->action = $action;
        $this->requiredPermission = $this->getRequiredPermissionForAction($action);
    }

    private function getRequiredPermissionForAction(string $action): string
    {
        return match ($action) {
            'list', 'show' => 'collections.view',
            default => 'collections.view',
        };
    }

    public function getName(): string
    {
        return "collection.{$this->action}";
    }

    public function getTool(): PrismTool
    {
        return match ($this->action) {
            'list' => $this->getListTool(),
            'show' => $this->getShowTool(),
            default => $this->getListTool(),
        };
    }

    private function getListTool(): PrismTool
    {
        return Tool::as('collection_list')
            ->for('Listet alle verfügbaren Collections auf. Zeigt Name, Slug und Anzahl der Contents.')
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getShowTool(): PrismTool
    {
        return Tool::as('collection_show')
            ->for('Zeigt Details einer Collection inkl. Schema und Einstellungen.')
            ->withStringParameter('collection_id', 'Die ID oder der Slug der Collection')
            ->using(fn () => ['_placeholder' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    public function execute(Agent $agent, array $parameters): array
    {
        if (! $this->hasPermission($agent)) {
            return $this->permissionDenied();
        }

        return match ($this->action) {
            'list' => $this->handleList(),
            'show' => $this->handleShow($parameters['collection_id']),
            default => $this->error('Unbekannte Aktion'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function handleList(): array
    {
        $collections = Collection::orderBy('name')->get();

        return $this->success("Gefunden: {$collections->count()} Collections", [
            'collections' => $collections->map(fn ($c) => [
                'id' => (string) $c->_id,
                'name' => $c->name,
                'slug' => $c->slug,
                'description' => $c->description,
                'contents_count' => \App\Models\Mongodb\Content::where('collection_id', (string) $c->_id)->count(),
            ])->toArray(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function handleShow(string $collectionId): array
    {
        // Try to find by ID first, then by slug
        $collection = Collection::find($collectionId);
        if (! $collection) {
            $collection = Collection::where('slug', $collectionId)->first();
        }

        if (! $collection) {
            return $this->notFound('Collection');
        }

        $schema = $collection->schema;

        return $this->success("Collection '{$collection->name}' geladen", [
            'id' => $collection->_id,
            'name' => $collection->name,
            'slug' => $collection->slug,
            'description' => $collection->description,
            'schema' => $schema ? [
                'allowed_elements' => $schema['allowed_elements'] ?? [],
                'content_meta_fields' => collect($schema['content_meta_fields'] ?? [])->map(fn ($f) => [
                    'name' => $f['name'] ?? null,
                    'label' => $f['label'] ?? null,
                    'type' => $f['type'] ?? null,
                    'required' => $f['required'] ?? false,
                ])->toArray(),
            ] : null,
            'settings' => $collection->settings,
            'created_at' => $collection->created_at?->toISOString(),
            'updated_at' => $collection->updated_at?->toISOString(),
        ]);
    }
}
