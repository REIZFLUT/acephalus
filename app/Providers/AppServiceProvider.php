<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Element;
use App\Models\Mongodb\Media;
use App\Models\User;
use App\Policies\CollectionPolicy;
use App\Policies\ContentPolicy;
use App\Policies\MediaPolicy;
use App\Policies\UserPolicy;
use App\Services\ScopeService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ScopeService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
        $this->configurePassport();
        $this->configureRouteModelBindings();
    }

    /**
     * Configure route model bindings for MongoDB models.
     */
    protected function configureRouteModelBindings(): void
    {
        Route::bind('collection', function (string $value) {
            return Collection::where('slug', $value)->firstOrFail();
        });

        Route::bind('content', function (string $value) {
            return Content::findOrFail($value);
        });

        Route::bind('element', function (string $value) {
            return Element::findOrFail($value);
        });

        Route::bind('media', function (string $value) {
            return Media::findOrFail($value);
        });
    }

    /**
     * Register the application policies.
     */
    protected function registerPolicies(): void
    {
        Gate::policy(Collection::class, CollectionPolicy::class);
        Gate::policy(Content::class, ContentPolicy::class);
        Gate::policy(Media::class, MediaPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }

    /**
     * Configure Laravel Passport.
     */
    protected function configurePassport(): void
    {
        // Token expiration times
        Passport::tokensExpireIn(now()->addDays(15));
        Passport::refreshTokensExpireIn(now()->addDays(30));
        Passport::personalAccessTokensExpireIn(now()->addMonths(6));

        // Define API scopes
        Passport::tokensCan(ScopeService::SCOPES);

        // Set default scope (empty - no default permissions)
        Passport::setDefaultScope([]);
    }
}
