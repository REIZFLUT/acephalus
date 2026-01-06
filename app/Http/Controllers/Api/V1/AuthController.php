<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Requests\Api\V1\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\ScopeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private readonly ScopeService $scopeService
    ) {}

    /**
     * Login user and create token with scopes based on permissions.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        // Get scopes based on user permissions
        $scopes = $this->scopeService->getScopesForUser($user);
        $token = $user->createToken('API Token', $scopes)->accessToken;

        return response()->json([
            'user' => new UserResource($user->load('roles', 'permissions')),
            'token' => $token,
            'token_type' => 'Bearer',
            'scopes' => $scopes,
        ]);
    }

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // New users get viewer role by default
        $user->assignRole('viewer');

        // Get scopes based on user permissions (viewer permissions)
        $scopes = $this->scopeService->getScopesForUser($user);
        $token = $user->createToken('API Token', $scopes)->accessToken;

        return response()->json([
            'user' => new UserResource($user->load('roles', 'permissions')),
            'token' => $token,
            'token_type' => 'Bearer',
            'scopes' => $scopes,
        ], 201);
    }

    /**
     * Logout user (revoke token).
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->token()->revoke();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Get authenticated user with permissions and scopes.
     */
    public function user(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->load('roles', 'permissions');

        // Get current token scopes
        $tokenScopes = $user->token()?->scopes ?? [];

        return response()->json([
            'user' => new UserResource($user),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'roles' => $user->getRoleNames(),
            'scopes' => $tokenScopes,
            'is_super_admin' => $user->hasRole('super-admin'),
        ]);
    }
}
