<?php

declare(strict_types=1);

namespace App\Services\Agent\Tools;

use App\Models\Mongodb\Agent;
use App\Models\Mongodb\Media;
use Prism\Prism\Facades\Tool;
use Prism\Prism\Tool as PrismTool;

class MediaTool extends AbstractAgentTool
{
    protected string $requiredPermission = 'media.view';

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
            'list', 'show' => 'media.view',
            'update' => 'media.update',
            'delete' => 'media.delete',
            default => 'media.view',
        };
    }

    public function getName(): string
    {
        return "media.{$this->action}";
    }

    public function getTool(): PrismTool
    {
        return match ($this->action) {
            'list' => $this->getListTool(),
            'show' => $this->getShowTool(),
            'update' => $this->getUpdateTool(),
            'delete' => $this->getDeleteTool(),
            default => $this->getListTool(),
        };
    }

    private function getListTool(): PrismTool
    {
        return Tool::as('media_list')
            ->for('Listet Medien auf. Kann nach Typ und Ordner gefiltert werden.')
            ->withStringParameter('media_type', 'Filter nach Medientyp: image, video, audio, document (optional)')
            ->withStringParameter('folder_id', 'Filter nach Ordner-ID (optional)')
            ->withNumberParameter('limit', 'Maximale Anzahl (Standard: 20)')
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getShowTool(): PrismTool
    {
        return Tool::as('media_show')
            ->for('Zeigt Details einer Mediendatei an.')
            ->withStringParameter('media_id', 'Die ID der Mediendatei')
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getUpdateTool(): PrismTool
    {
        return Tool::as('media_update')
            ->for('Aktualisiert Metadaten einer Mediendatei.')
            ->withStringParameter('media_id', 'Die ID der Mediendatei')
            ->withStringParameter('alt', 'Neuer Alt-Text (optional)', false)
            ->withStringParameter('caption', 'Neue Bildunterschrift (optional)', false)
            ->withStringParameter('tags_json', 'Neue Tags als JSON-Array (optional)', false)
            ->using(fn () => ['_placeholder' => true]);
    }

    private function getDeleteTool(): PrismTool
    {
        return Tool::as('media_delete')
            ->for('Löscht eine Mediendatei.')
            ->withStringParameter('media_id', 'Die ID der zu löschenden Mediendatei')
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
            'list' => $this->handleList(
                $parameters['media_type'] ?? null,
                $parameters['folder_id'] ?? null,
                $parameters['limit'] ?? 20
            ),
            'show' => $this->handleShow($parameters['media_id']),
            'update' => $this->handleUpdate(
                $parameters['media_id'],
                $parameters['alt'] ?? null,
                $parameters['caption'] ?? null,
                $parameters['tags'] ?? null
            ),
            'delete' => $this->handleDelete($parameters['media_id']),
            default => $this->error('Unbekannte Aktion'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function handleList(?string $mediaType, ?string $folderId, int $limit): array
    {
        $query = Media::query();

        if ($mediaType) {
            $query->where('media_type', $mediaType);
        }

        if ($folderId) {
            $query->where('folder_id', $folderId);
        }

        $media = $query->select(['_id', 'filename', 'original_filename', 'media_type', 'mime_type', 'size', 'alt', 'updated_at'])
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();

        return $this->success("Gefunden: {$media->count()} Medien", [
            'media' => $media->map(fn ($m) => [
                'id' => $m->_id,
                'filename' => $m->filename,
                'original_filename' => $m->original_filename,
                'media_type' => $m->media_type,
                'mime_type' => $m->mime_type,
                'size' => $m->size,
                'alt' => $m->alt,
                'updated_at' => $m->updated_at?->toISOString(),
            ])->toArray(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function handleShow(string $mediaId): array
    {
        $media = Media::find($mediaId);
        if (! $media) {
            return $this->notFound('Mediendatei');
        }

        return $this->success("Mediendatei '{$media->original_filename}' geladen", [
            'id' => $media->_id,
            'filename' => $media->filename,
            'original_filename' => $media->original_filename,
            'media_type' => $media->media_type,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'size_human' => $media->size_human,
            'alt' => $media->alt,
            'caption' => $media->caption,
            'tags' => $media->tags,
            'metadata' => $media->metadata,
            'url' => $media->url,
            'folder_id' => $media->folder_id,
            'created_at' => $media->created_at?->toISOString(),
            'updated_at' => $media->updated_at?->toISOString(),
        ]);
    }

    /**
     * @param  array<string>|null  $tags
     * @return array<string, mixed>
     */
    private function handleUpdate(string $mediaId, ?string $alt, ?string $caption, ?string $tagsJson): array
    {
        $media = Media::find($mediaId);
        if (! $media) {
            return $this->notFound('Mediendatei');
        }

        // Parse JSON string if provided
        $tags = $tagsJson ? json_decode($tagsJson, true) : null;

        $updates = [];

        if ($alt !== null) {
            $updates['alt'] = $alt;
        }

        if ($caption !== null) {
            $updates['caption'] = $caption;
        }

        if ($tags !== null) {
            $updates['tags'] = $tags;
        }

        if (! empty($updates)) {
            $media->update($updates);
        }

        return $this->success("Mediendatei '{$media->original_filename}' aktualisiert", [
            'id' => $media->_id,
            'updated_fields' => array_keys($updates),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function handleDelete(string $mediaId): array
    {
        $media = Media::find($mediaId);
        if (! $media) {
            return $this->notFound('Mediendatei');
        }

        $filename = $media->original_filename;
        $media->delete();

        return $this->success("Mediendatei '{$filename}' gelöscht");
    }
}
