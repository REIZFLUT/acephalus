<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Middleware\SetLocaleMiddleware;
use App\Models\Mongodb\PinnedNavigationItem;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'is_super_admin' => $user->hasRole('super-admin'),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'locale' => app()->getLocale(),
            'availableLocales' => SetLocaleMiddleware::getAvailableLocales(),
            'timezone' => config('app.timezone'),
            'pinnedNavigation' => fn () => $user ? $this->getPinnedNavigation() : [],
        ];
    }

    /**
     * Get the pinned navigation items for the sidebar.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function getPinnedNavigation(): array
    {
        $items = PinnedNavigationItem::query()
            ->active()
            ->ordered()
            ->get();

        // Pre-load collections for all items
        $collectionIds = $items->pluck('collection_id')->filter()->unique()->toArray();
        $collections = \App\Models\Mongodb\Collection::whereIn('_id', $collectionIds)
            ->get(['_id', 'name', 'slug'])
            ->keyBy(fn ($c) => (string) $c->_id);

        return $items->map(function (PinnedNavigationItem $item) use ($collections) {
            $collectionId = (string) $item->collection_id;
            $collection = $collections->get($collectionId);
            $collectionSlug = $collection?->slug;

            // Build URL
            $url = $collectionSlug ? "/collections/{$collectionSlug}/contents" : '#';
            if ($collectionSlug && $item->filter_view_id) {
                $url .= "?filter_view={$item->filter_view_id}";
            }

            return [
                '_id' => (string) $item->_id,
                'name' => $item->name,
                'icon' => $item->icon,
                'url' => $url,
                'collection_slug' => $collectionSlug,
                'filter_view_id' => $item->filter_view_id ? (string) $item->filter_view_id : null,
            ];
        })->toArray();
    }
}
