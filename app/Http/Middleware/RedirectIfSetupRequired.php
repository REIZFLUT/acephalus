<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Controllers\Web\SetupController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfSetupRequired
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Don't redirect if already on setup pages
        if ($request->is('setup*')) {
            return $next($request);
        }

        // Only redirect to setup if it's enabled AND required
        if (SetupController::canAccessSetup()) {
            return redirect()->route('setup.index');
        }

        return $next($request);
    }
}
