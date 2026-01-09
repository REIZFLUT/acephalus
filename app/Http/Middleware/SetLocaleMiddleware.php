<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleMiddleware
{
    /**
     * Available locales in the application.
     *
     * @var array<string>
     */
    public const AVAILABLE_LOCALES = ['en', 'de'];

    /**
     * Handle an incoming request.
     *
     * Priority: User Setting > Session > Browser Accept-Language > Default (en)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->determineLocale($request);

        app()->setLocale($locale);

        return $next($request);
    }

    /**
     * Determine the locale based on priority.
     */
    protected function determineLocale(Request $request): string
    {
        // 1. Check authenticated user's preference
        if ($request->user() && $request->user()->locale) {
            $userLocale = $request->user()->locale;
            if ($this->isValidLocale($userLocale)) {
                return $userLocale;
            }
        }

        // 2. Check session
        $sessionLocale = $request->session()->get('locale');
        if ($sessionLocale && $this->isValidLocale($sessionLocale)) {
            return $sessionLocale;
        }

        // 3. Check browser Accept-Language header
        $browserLocale = $this->parseAcceptLanguage($request);
        if ($browserLocale) {
            return $browserLocale;
        }

        // 4. Fallback to default
        return config('app.locale', 'en');
    }

    /**
     * Parse the Accept-Language header to find a matching locale.
     */
    protected function parseAcceptLanguage(Request $request): ?string
    {
        $acceptLanguage = $request->header('Accept-Language');

        if (! $acceptLanguage) {
            return null;
        }

        // Parse Accept-Language header (e.g., "de-DE,de;q=0.9,en;q=0.8")
        $languages = [];
        foreach (explode(',', $acceptLanguage) as $part) {
            $part = trim($part);
            $quality = 1.0;

            if (str_contains($part, ';q=')) {
                [$part, $q] = explode(';q=', $part);
                $quality = (float) $q;
            }

            // Get the primary language tag (e.g., "de" from "de-DE")
            $lang = strtolower(explode('-', trim($part))[0]);
            $languages[$lang] = $quality;
        }

        // Sort by quality
        arsort($languages);

        // Find first matching locale
        foreach (array_keys($languages) as $lang) {
            if ($this->isValidLocale($lang)) {
                return $lang;
            }
        }

        return null;
    }

    /**
     * Check if a locale is valid.
     */
    protected function isValidLocale(string $locale): bool
    {
        return in_array($locale, self::AVAILABLE_LOCALES, true);
    }

    /**
     * Get the list of available locales.
     *
     * @return array<string>
     */
    public static function getAvailableLocales(): array
    {
        return self::AVAILABLE_LOCALES;
    }
}
