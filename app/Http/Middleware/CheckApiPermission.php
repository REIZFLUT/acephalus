<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\ScopeService;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check API permissions based on user's Spatie permissions.
 *
 * This middleware checks if the authenticated user has the required permission
 * based on the scope-to-permission mapping. It also respects token scopes if present.
 *
 * Usage in routes: ->middleware('api.permission:contents:read')
 */
class CheckApiPermission
{
    public function __construct(
        private readonly ScopeService $scopeService
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $scope): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Super-admin bypasses all permission checks (check both guards)
        if ($user->hasRole('super-admin', 'web') || $user->hasRole('super-admin', 'api')) {
            return $next($request);
        }

        // Check if user has the required permission(s) for this scope
        $permissions = $this->scopeService->getPermissionsForScope($scope);

        if (empty($permissions)) {
            // Unknown scope - deny access
            return response()->json(['message' => 'Invalid scope.'], 403);
        }

        // Check if user has ANY of the required permissions (on any guard)
        $hasPermission = $this->userHasAnyPermission($user, $permissions);

        if (! $hasPermission) {
            return response()->json(['message' => 'Forbidden. Missing required permission.'], 403);
        }

        // Optionally check token scopes if the token has scopes defined
        // This provides an additional layer of security for API tokens
        $token = $user->token();
        if ($token && ! empty($token->scopes)) {
            // Token has scopes - check if it includes the required scope or wildcard
            if (! in_array('*', $token->scopes) && ! in_array($scope, $token->scopes)) {
                return response()->json(['message' => 'Token does not have required scope.'], 403);
            }
        }

        return $next($request);
    }

    /**
     * Check if the user has any of the given permissions on any guard.
     *
     * @param  array<string>  $permissions
     */
    private function userHasAnyPermission(User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            // Check on 'web' guard (primary)
            if ($user->hasPermissionTo($permission, 'web')) {
                return true;
            }

            // Check on 'api' guard as fallback
            if ($user->hasPermissionTo($permission, 'api')) {
                return true;
            }
        }

        return false;
    }
}
