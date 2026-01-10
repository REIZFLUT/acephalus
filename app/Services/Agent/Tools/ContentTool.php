<?php

declare(strict_types=1);

namespace App\Services\Agent\Tools;

use App\Models\Mongodb\Agent;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\User;
use App\Services\VersionService;
use Prism\Prism\Facades\Tool;
use Prism\Prism\Tool as PrismTool;

class ContentTool extends AbstractAgentTool
{
    protected string $requiredPermission = 'contents.view';

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
            'list', 'show' => 'contents.view',
            'create' => 'contents.create',
            'update' => 'contents.update',
            'delete' => 'contents.delete',
            'publish', 'unpublish' => 'contents.publish',
            default => 'contents.view',
        };
    }

    public function getName(): string
    {
        return "content.{$this->action}";
    }

    public function getTool(): PrismTool
    {
        return match ($this->action) {
            'list' => $this->getListTool(),
            'show' => $this->getShowTool(),
            'create' => $this->getCreateTool(),
            'update' => $this->getUpdateTool(),
            'delete' => $this->getDeleteTool(),
            'publish' => $this->getPublishTool(),
            'unpublish' => $this->getUnpublishTool(),
            default => $this->getListTool(),
        };
    }

    private function getListTool(): PrismTool
    {
        return Tool::as('content_list')
            ->for('Liste Contents in einer Collection auf. Gibt Titel, Status und IDs zurück.')
            ->withStringParameter('collection_id', 'Die ID der Collection')
            ->withNumberParameter('limit', 'Maximale Anzahl der Ergebnisse (Standard: 20)')
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getShowTool(): PrismTool
    {
        return Tool::as('content_show')
            ->for('Zeigt Details eines Contents an, inkl. Metadaten und Elementen.')
            ->withStringParameter('content_id', 'Die ID des Contents')
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getCreateTool(): PrismTool
    {
        // Note: ->using() is called automatically by Prism, so we return a placeholder.
        // Actual execution happens via execute() method which is called by AgentService.
        return Tool::as('content_create')
            ->for('Erstellt einen neuen Content in einer Collection.')
            ->withStringParameter('collection_id', 'Die ID der Collection')
            ->withStringParameter('title', 'Der Titel des Contents')
            ->withStringParameter('slug', 'Der URL-Slug (optional, wird aus Titel generiert)', false)
            ->withStringParameter('metadata_json', 'Metadaten als JSON-String (optional)', false)
            ->withStringParameter('elements_json', 'Array von Block-Elementen als JSON-String (optional)', false)
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getUpdateTool(): PrismTool
    {
        return Tool::as('content_update')
            ->for('Aktualisiert einen bestehenden Content.')
            ->withStringParameter('content_id', 'Die ID des Contents')
            ->withStringParameter('title', 'Neuer Titel (optional)', false)
            ->withStringParameter('metadata_json', 'Aktualisierte Metadaten als JSON-String (optional)', false)
            ->withStringParameter('elements_json', 'Aktualisierte Elemente als JSON-String (optional)', false)
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getDeleteTool(): PrismTool
    {
        return Tool::as('content_delete')
            ->for('Löscht einen Content.')
            ->withStringParameter('content_id', 'Die ID des zu löschenden Contents')
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getPublishTool(): PrismTool
    {
        return Tool::as('content_publish')
            ->for('Veröffentlicht einen Content.')
            ->withStringParameter('content_id', 'Die ID des Contents')
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getUnpublishTool(): PrismTool
    {
        return Tool::as('content_unpublish')
            ->for('Zieht die Veröffentlichung eines Contents zurück.')
            ->withStringParameter('content_id', 'Die ID des Contents')
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
            'list' => $this->handleList($parameters['collection_id'], $parameters['limit'] ?? 20),
            'show' => $this->handleShow($parameters['content_id']),
            'create' => $this->handleCreate(
                $parameters['collection_id'],
                $parameters['title'],
                $parameters['slug'] ?? null,
                $parameters['metadata_json'] ?? null,
                $parameters['elements_json'] ?? null,
                $agent
            ),
            'update' => $this->handleUpdate(
                $parameters['content_id'],
                $parameters['title'] ?? null,
                $parameters['metadata_json'] ?? null,
                $parameters['elements_json'] ?? null,
                $agent
            ),
            'delete' => $this->handleDelete($parameters['content_id']),
            'publish' => $this->handlePublish($parameters['content_id'], $agent),
            'unpublish' => $this->handleUnpublish($parameters['content_id'], $agent),
            default => $this->error('Unbekannte Aktion'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function handleList(string $collectionId, int $limit): array
    {
        $collection = Collection::find($collectionId);
        if (! $collection) {
            return $this->notFound('Collection');
        }

        $contents = Content::where('collection_id', $collectionId)
            ->select(['_id', 'title', 'slug', 'status', 'current_version', 'updated_at'])
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();

        return $this->success("Gefunden: {$contents->count()} Contents in Collection '{$collection->name}'", [
            'collection' => [
                'id' => $collection->_id,
                'name' => $collection->name,
            ],
            'contents' => $contents->map(fn ($c) => [
                'id' => $c->_id,
                'title' => $c->title,
                'slug' => $c->slug,
                'status' => $c->status,
                'version' => $c->current_version,
                'updated_at' => $c->updated_at?->toISOString(),
            ])->toArray(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function handleShow(string $contentId): array
    {
        $content = Content::with('collection')->find($contentId);
        if (! $content) {
            return $this->notFound('Content');
        }

        return $this->success("Content '{$content->title}' geladen", [
            'id' => $content->_id,
            'title' => $content->title,
            'slug' => $content->slug,
            'status' => $content->status,
            'current_version' => $content->current_version,
            'metadata' => $content->metadata,
            'elements' => $content->elements,
            'collection' => $content->collection ? [
                'id' => $content->collection->_id,
                'name' => $content->collection->name,
            ] : null,
            'created_at' => $content->created_at?->toISOString(),
            'updated_at' => $content->updated_at?->toISOString(),
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     * @param  array<mixed>|null  $elements
     * @return array<string, mixed>
     */
    private function handleCreate(string $collectionId, string $title, ?string $slug, ?string $metadataJson, ?string $elementsJson, ?Agent $agent = null): array
    {
        $collection = Collection::find($collectionId);
        if (! $collection) {
            return $this->notFound('Collection');
        }

        // Parse JSON strings if provided
        $metadata = $metadataJson ? json_decode($metadataJson, true) : [];
        $elements = $elementsJson ? json_decode($elementsJson, true) : [];

        // Generate slug if not provided
        if (! $slug) {
            $slug = \Illuminate\Support\Str::slug($title);
        }

        // Ensure unique slug
        $originalSlug = $slug;
        $counter = 1;
        while (Content::where('collection_id', $collectionId)->where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $content = Content::create([
            'collection_id' => $collectionId,
            'title' => $title,
            'slug' => $slug,
            'status' => 'draft',
            'current_version' => 1,
            'metadata' => $metadata ?? [],
            'elements' => $elements ?? [],
        ]);

        // Create initial version
        $user = $agent?->user_id ? User::find($agent->user_id) : null;
        $versionService = app(VersionService::class);
        $versionService->createVersion($content, $user, 'Erstellt via AI Agent', false);

        return $this->success("Content '{$title}' erstellt", [
            'id' => $content->_id,
            'title' => $content->title,
            'slug' => $content->slug,
            'status' => $content->status,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function handleUpdate(string $contentId, ?string $title, ?string $metadataJson, ?string $elementsJson, ?Agent $agent = null): array
    {
        $content = Content::find($contentId);
        if (! $content) {
            return $this->notFound('Content');
        }

        // Parse JSON strings if provided
        $metadata = $metadataJson ? json_decode($metadataJson, true) : null;
        $elements = $elementsJson ? json_decode($elementsJson, true) : null;

        $updates = [];

        // Only update title if provided and not empty
        if ($title !== null && $title !== '') {
            $updates['title'] = $title;
        }

        if ($metadata !== null) {
            $updates['metadata'] = array_merge($content->metadata ?? [], $metadata);
        }

        if ($elements !== null) {
            $updates['elements'] = $elements;
        }

        if (! empty($updates)) {
            $content->update($updates);
            
            // Refresh to get the updated data
            $content->refresh();

            // Create new version after update
            $user = $agent?->user_id ? User::find($agent->user_id) : null;
            $versionService = app(VersionService::class);
            $versionService->createVersion($content, $user, 'Aktualisiert via AI Agent');
        }

        return $this->success("Content '{$content->title}' aktualisiert", [
            'id' => $content->_id,
            'title' => $content->title,
            'updated_fields' => array_keys($updates),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function handleDelete(string $contentId): array
    {
        $content = Content::find($contentId);
        if (! $content) {
            return $this->notFound('Content');
        }

        $title = $content->title;
        $content->delete();

        return $this->success("Content '{$title}' gelöscht");
    }

    /**
     * @return array<string, mixed>
     */
    private function handlePublish(string $contentId, ?Agent $agent = null): array
    {
        $content = Content::find($contentId);
        if (! $content) {
            return $this->notFound('Content');
        }

        $content->update(['status' => 'published']);

        // Create version for publish action
        $user = $agent?->user_id ? User::find($agent->user_id) : null;
        $versionService = app(VersionService::class);
        $versionService->createVersion($content, $user, 'Veröffentlicht via AI Agent');

        return $this->success("Content '{$content->title}' veröffentlicht", [
            'id' => $content->_id,
            'status' => 'published',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function handleUnpublish(string $contentId, ?Agent $agent = null): array
    {
        $content = Content::find($contentId);
        if (! $content) {
            return $this->notFound('Content');
        }

        $content->update(['status' => 'draft']);

        // Create version for unpublish action
        $user = $agent?->user_id ? User::find($agent->user_id) : null;
        $versionService = app(VersionService::class);
        $versionService->createVersion($content, $user, 'Veröffentlichung zurückgezogen via AI Agent');

        return $this->success("Veröffentlichung von '{$content->title}' zurückgezogen", [
            'id' => $content->_id,
            'status' => 'draft',
        ]);
    }
}
