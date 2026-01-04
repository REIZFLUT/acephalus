<?php

use App\Http\Controllers\Api\V1\CustomElementController;
use App\Http\Controllers\Api\V1\ReferenceController;
use App\Http\Controllers\Web\AuthController;
use App\Http\Controllers\Web\CollectionController;
use App\Http\Controllers\Web\CollectionReleaseController;
use App\Http\Controllers\Web\ContentController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\EditionController;
use App\Http\Controllers\Web\MediaController;
use App\Http\Controllers\Web\MediaFolderController;
use App\Http\Controllers\Web\MediaMetaFieldController;
use App\Http\Controllers\Web\ProfileController;
use App\Http\Controllers\Web\SettingsController;
use App\Http\Controllers\Web\UserController;
use App\Http\Controllers\Web\WrapperPurposeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Admin Panel Routes for Continy CMS
|
*/

// Redirect root to dashboard or login
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

// Auth routes (public)
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
});

// Protected admin routes
Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    // Profile
    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Collections
    Route::resource('collections', CollectionController::class);

    // Collection Releases
    Route::post('collections/{collection}/releases', [CollectionReleaseController::class, 'store'])
        ->name('collections.releases.store');
    Route::delete('collections/{collection}/versions/purge', [CollectionReleaseController::class, 'purge'])
        ->name('collections.versions.purge');
    Route::get('collections/{collection}/versions/purge-preview', [CollectionReleaseController::class, 'purgePreview'])
        ->name('collections.versions.purge-preview');

    // Contents
    Route::get('collections/{collection}/contents', [ContentController::class, 'index'])
        ->name('collections.contents.index');
    Route::get('collections/{collection}/contents/create', [ContentController::class, 'create'])
        ->name('collections.contents.create');
    Route::post('collections/{collection}/contents', [ContentController::class, 'store'])
        ->name('collections.contents.store');
    Route::get('contents/{content}', [ContentController::class, 'show'])->name('contents.show');
    Route::get('contents/{content}/edit', [ContentController::class, 'edit'])->name('contents.edit');
    Route::get('contents/{content}/preview', [ContentController::class, 'preview'])->name('contents.preview');
    Route::put('contents/{content}', [ContentController::class, 'update'])->name('contents.update');
    Route::delete('contents/{content}', [ContentController::class, 'destroy'])->name('contents.destroy');
    Route::post('contents/{content}/publish', [ContentController::class, 'publish'])->name('contents.publish');
    Route::post('contents/{content}/unpublish', [ContentController::class, 'unpublish'])->name('contents.unpublish');

    // Media
    Route::get('media/{media}/file', [MediaController::class, 'file'])->name('media.file');
    Route::resource('media', MediaController::class)->except(['edit'])->parameters(['media' => 'media']);
    Route::patch('media/{media}', [MediaController::class, 'update'])->name('media.update.patch');

    // Media Folders
    Route::prefix('media-folders')->name('media-folders.')->group(function () {
        Route::get('tree', [MediaFolderController::class, 'tree'])->name('tree');
        Route::get('global-root', [MediaFolderController::class, 'globalRoot'])->name('global-root');
        Route::get('{mediaFolder}', [MediaFolderController::class, 'show'])->name('show');
        Route::post('/', [MediaFolderController::class, 'store'])->name('store');
        Route::put('{mediaFolder}', [MediaFolderController::class, 'update'])->name('update');
        Route::delete('{mediaFolder}', [MediaFolderController::class, 'destroy'])->name('destroy');
    });

    // Users
    Route::resource('users', UserController::class);

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        // Main settings index (tabbed view)
        Route::get('/', [SettingsController::class, 'index'])->name('index');

        // Wrapper Purposes
        Route::get('wrapper-purposes/list', [WrapperPurposeController::class, 'list'])
            ->name('wrapper-purposes.list');
        Route::resource('wrapper-purposes', WrapperPurposeController::class)
            ->parameters(['wrapper-purposes' => 'wrapperPurpose']);

        // Editions
        Route::get('editions/list', [EditionController::class, 'list'])
            ->name('editions.list');
        Route::resource('editions', EditionController::class);

        // Media Meta Fields
        Route::get('media-meta-fields/list', [MediaMetaFieldController::class, 'list'])
            ->name('media-meta-fields.list');
        Route::post('media-meta-fields/reorder', [MediaMetaFieldController::class, 'reorder'])
            ->name('media-meta-fields.reorder');
        Route::resource('media-meta-fields', MediaMetaFieldController::class)
            ->parameters(['media-meta-fields' => 'mediaMetaField']);
    });

    // Internal API routes for the admin panel (JSON responses, but with web session auth)
    Route::prefix('api/v1')->name('api.v1.')->group(function () {
        // Custom Elements
        Route::prefix('custom-elements')->name('custom-elements.')->group(function () {
            Route::get('/', [CustomElementController::class, 'index'])->name('index');
            Route::get('{type}', [CustomElementController::class, 'show'])->name('show');
            Route::get('{type}/defaults', [CustomElementController::class, 'defaults'])->name('defaults');
            Route::post('{type}/validate', [CustomElementController::class, 'validate'])->name('validate');
            Route::post('refresh', [CustomElementController::class, 'refresh'])->name('refresh');
        });

        // Reference Picker (for internal references)
        Route::prefix('references')->name('references.')->group(function () {
            Route::get('collections', [ReferenceController::class, 'collections'])->name('collections');
            Route::get('collections/{collectionId}/contents', [ReferenceController::class, 'contents'])->name('contents');
            Route::get('contents/{contentId}/elements', [ReferenceController::class, 'elements'])->name('elements');
            Route::post('resolve', [ReferenceController::class, 'resolve'])->name('resolve');
            // Preview for content with elements
            Route::get('preview/{contentId}', [ReferenceController::class, 'preview'])->name('preview');
        });
    });
});
