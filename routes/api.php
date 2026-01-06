<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CollectionController;
use App\Http\Controllers\Api\V1\ContentController;
use App\Http\Controllers\Api\V1\ElementController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VersionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->name('api.v1.')->group(function () {
    // Public authentication routes
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->name('login');
        Route::post('register', [AuthController::class, 'register'])->name('register');
    });

    // Protected routes (API token auth)
    Route::middleware('auth:api')->group(function () {
        // Auth routes (accessible to all authenticated users)
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('user', [AuthController::class, 'user'])->name('user');
        });

        // Collections - Read
        Route::middleware('api.permission:collections:read')->group(function () {
            Route::get('collections', [CollectionController::class, 'index'])->name('collections.index');
            Route::get('collections/{collection}', [CollectionController::class, 'show'])->name('collections.show');
        });

        // Collections - Write
        Route::middleware('api.permission:collections:write')->group(function () {
            Route::post('collections', [CollectionController::class, 'store'])->name('collections.store');
            Route::put('collections/{collection}', [CollectionController::class, 'update'])->name('collections.update');
            Route::patch('collections/{collection}', [CollectionController::class, 'update']);
        });

        // Collections - Delete
        Route::middleware('api.permission:collections:delete')->group(function () {
            Route::delete('collections/{collection}', [CollectionController::class, 'destroy'])->name('collections.destroy');
        });

        // Contents - Read
        Route::middleware('api.permission:contents:read')->group(function () {
            Route::get('collections/{collection}/contents', [ContentController::class, 'index'])
                ->name('collections.contents.index');
            Route::get('contents/{content}', [ContentController::class, 'show'])->name('contents.show');

            // Versions
            Route::get('contents/{content}/versions', [VersionController::class, 'index'])
                ->name('contents.versions.index');
            Route::get('contents/{content}/versions/{version}', [VersionController::class, 'show'])
                ->name('contents.versions.show');
            Route::get('contents/{content}/versions/{fromVersion}/compare/{toVersion}', [VersionController::class, 'compare'])
                ->name('contents.versions.compare');
        });

        // Contents - Write
        Route::middleware('api.permission:contents:write')->group(function () {
            Route::post('collections/{collection}/contents', [ContentController::class, 'store'])
                ->name('collections.contents.store');
            Route::put('contents/{content}', [ContentController::class, 'update'])->name('contents.update');
            Route::patch('contents/{content}', [ContentController::class, 'update']);
            Route::post('contents/{content}/versions/{version}/restore', [VersionController::class, 'restore'])
                ->name('contents.versions.restore');

            // Elements
            Route::post('contents/{content}/elements', [ElementController::class, 'store'])
                ->name('contents.elements.store');
            Route::put('elements/{element}', [ElementController::class, 'update'])
                ->name('elements.update');
            Route::post('elements/{element}/move', [ElementController::class, 'move'])
                ->name('elements.move');
        });

        // Contents - Delete
        Route::middleware('api.permission:contents:delete')->group(function () {
            Route::delete('contents/{content}', [ContentController::class, 'destroy'])->name('contents.destroy');
            Route::delete('elements/{element}', [ElementController::class, 'destroy'])
                ->name('elements.destroy');
        });

        // Contents - Publish
        Route::middleware('api.permission:contents:publish')->group(function () {
            Route::post('contents/{content}/publish', [ContentController::class, 'publish'])
                ->name('contents.publish');
            Route::post('contents/{content}/unpublish', [ContentController::class, 'unpublish'])
                ->name('contents.unpublish');
            Route::post('contents/{content}/archive', [ContentController::class, 'archive'])
                ->name('contents.archive');
        });

        // Media - Read
        Route::middleware('api.permission:media:read')->group(function () {
            Route::get('media', [MediaController::class, 'index'])->name('media.index');
            Route::get('media/{media}', [MediaController::class, 'show'])->name('media.show');
        });

        // Media - Write
        Route::middleware('api.permission:media:write')->group(function () {
            Route::post('media', [MediaController::class, 'store'])->name('media.store');
        });

        // Media - Delete
        Route::middleware('api.permission:media:delete')->group(function () {
            Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('media.destroy');
        });

        // Users - Read
        Route::middleware('api.permission:users:read')->group(function () {
            Route::get('users', [UserController::class, 'index'])->name('users.index');
            Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
        });

        // Users - Write
        Route::middleware('api.permission:users:write')->group(function () {
            Route::post('users', [UserController::class, 'store'])->name('users.store');
            Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
            Route::patch('users/{user}', [UserController::class, 'update']);
        });

        // Users - Delete
        Route::middleware('api.permission:users:delete')->group(function () {
            Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        });
    });
});
