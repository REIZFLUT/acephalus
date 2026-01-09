<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Exceptions\ResourceLockedException;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Element;
use App\Services\LockService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckNotLocked
{
    public function __construct(
        protected LockService $lockService
    ) {}

    /**
     * Handle an incoming request.
     *
     * Check if the resource being modified is locked.
     * The resource type is determined from the route parameters.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     *
     * @throws ResourceLockedException
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only check for modifying requests
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return $next($request);
        }

        // Check for Element in route
        $element = $request->route('element');
        if ($element instanceof Element) {
            $this->lockService->ensureElementCanBeModified($element);

            return $next($request);
        }

        // Check for Content in route
        $content = $request->route('content');
        if ($content instanceof Content) {
            $this->lockService->ensureContentCanBeModified($content);

            return $next($request);
        }

        // Check for Collection in route
        $collection = $request->route('collection');
        if ($collection instanceof Collection) {
            $this->lockService->ensureCollectionCanBeModified($collection);

            return $next($request);
        }

        return $next($request);
    }
}
