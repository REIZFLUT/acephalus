<?php

declare(strict_types=1);

namespace App\Services\Agent\Tools;

use App\Models\Mongodb\Agent;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Media;
use Prism\Prism\Facades\Tool;
use Prism\Prism\Tool as PrismTool;

class SearchTool extends AbstractAgentTool
{
    protected string $requiredPermission = 'contents.view';

    public function getName(): string
    {
        return 'search';
    }

    public function getTool(): PrismTool
    {
        return Tool::as('search')
            ->for('Durchsucht das CMS nach Contents, Collections oder Medien. Sucht in Titeln, Beschreibungen und Metadaten.')
            ->withStringParameter('query', 'Der Suchbegriff')
            ->withStringParameter('type', 'Suchbereich: all, contents, collections, media (Standard: all)')
            ->withStringParameter('collection_id', 'Optional: Nur in dieser Collection suchen')
            ->withNumberParameter('limit', 'Maximale Anzahl pro Typ (Standard: 10)')
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

        return $this->handleSearch(
            $parameters['query'],
            $parameters['type'] ?? 'all',
            $parameters['collection_id'] ?? null,
            $parameters['limit'] ?? 10
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function handleSearch(string $query, string $type, ?string $collectionId, int $limit): array
    {
        $results = [
            'query' => $query,
            'type' => $type,
        ];

        $totalFound = 0;

        // Search contents
        if (in_array($type, ['all', 'contents'])) {
            $contentsQuery = Content::query()
                ->where(function ($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                        ->orWhere('slug', 'like', "%{$query}%");
                });

            if ($collectionId) {
                $contentsQuery->where('collection_id', $collectionId);
            }

            $contents = $contentsQuery
                ->select(['_id', 'title', 'slug', 'status', 'collection_id', 'updated_at'])
                ->limit($limit)
                ->get();

            $results['contents'] = $contents->map(fn ($c) => [
                'id' => $c->_id,
                'title' => $c->title,
                'slug' => $c->slug,
                'status' => $c->status,
                'collection_id' => $c->collection_id,
                'updated_at' => $c->updated_at?->toISOString(),
            ])->toArray();

            $totalFound += $contents->count();
        }

        // Search collections
        if (in_array($type, ['all', 'collections'])) {
            $collections = Collection::query()
                ->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('slug', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%");
                })
                ->select(['_id', 'name', 'slug', 'description'])
                ->limit($limit)
                ->get();

            $results['collections'] = $collections->map(fn ($c) => [
                'id' => $c->_id,
                'name' => $c->name,
                'slug' => $c->slug,
                'description' => $c->description,
            ])->toArray();

            $totalFound += $collections->count();
        }

        // Search media
        if (in_array($type, ['all', 'media'])) {
            $media = Media::query()
                ->where(function ($q) use ($query) {
                    $q->where('original_filename', 'like', "%{$query}%")
                        ->orWhere('alt', 'like', "%{$query}%")
                        ->orWhere('caption', 'like', "%{$query}%");
                })
                ->select(['_id', 'original_filename', 'media_type', 'alt', 'updated_at'])
                ->limit($limit)
                ->get();

            $results['media'] = $media->map(fn ($m) => [
                'id' => $m->_id,
                'filename' => $m->original_filename,
                'media_type' => $m->media_type,
                'alt' => $m->alt,
                'updated_at' => $m->updated_at?->toISOString(),
            ])->toArray();

            $totalFound += $media->count();
        }

        $results['total_found'] = $totalFound;

        return $this->success("Suche nach '{$query}': {$totalFound} Ergebnisse gefunden", $results);
    }
}
