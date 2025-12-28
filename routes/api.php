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

    // Protected routes
    Route::middleware('auth:api')->group(function () {
        // Auth routes
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('user', [AuthController::class, 'user'])->name('user');
        });

        // User management
        Route::apiResource('users', UserController::class);

        // Collections
        Route::apiResource('collections', CollectionController::class);

        // Contents (nested under collections for creation)
        Route::get('collections/{collection}/contents', [ContentController::class, 'index'])
            ->name('collections.contents.index');
        Route::post('collections/{collection}/contents', [ContentController::class, 'store'])
            ->name('collections.contents.store');

        // Contents (direct access)
        Route::apiResource('contents', ContentController::class)->except(['index', 'store']);
        Route::post('contents/{content}/publish', [ContentController::class, 'publish'])
            ->name('contents.publish');
        Route::post('contents/{content}/unpublish', [ContentController::class, 'unpublish'])
            ->name('contents.unpublish');
        Route::post('contents/{content}/archive', [ContentController::class, 'archive'])
            ->name('contents.archive');

        // Versions
        Route::get('contents/{content}/versions', [VersionController::class, 'index'])
            ->name('contents.versions.index');
        Route::get('contents/{content}/versions/{version}', [VersionController::class, 'show'])
            ->name('contents.versions.show');
        Route::post('contents/{content}/versions/{version}/restore', [VersionController::class, 'restore'])
            ->name('contents.versions.restore');
        Route::get('contents/{content}/versions/{fromVersion}/compare/{toVersion}', [VersionController::class, 'compare'])
            ->name('contents.versions.compare');

        // Elements
        Route::post('contents/{content}/elements', [ElementController::class, 'store'])
            ->name('contents.elements.store');
        Route::put('elements/{element}', [ElementController::class, 'update'])
            ->name('elements.update');
        Route::delete('elements/{element}', [ElementController::class, 'destroy'])
            ->name('elements.destroy');
        Route::post('elements/{element}/move', [ElementController::class, 'move'])
            ->name('elements.move');

        // Media
        Route::post('media', [MediaController::class, 'store'])->name('media.store');
        Route::get('media/{media}', [MediaController::class, 'show'])->name('media.show');
        Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('media.destroy');
        Route::get('media', [MediaController::class, 'index'])->name('media.index');
    });
});


