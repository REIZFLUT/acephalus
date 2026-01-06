<?php

use App\Http\Controllers\Api\V1\CustomElementController;
use App\Http\Controllers\Api\V1\ReferenceController;
use App\Http\Controllers\Web\AuthController;
use App\Http\Controllers\Web\CollectionController;
use App\Http\Controllers\Web\ContentController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\EditionController;
use App\Http\Controllers\Web\FilterViewController;
use App\Http\Controllers\Web\MediaController;
use App\Http\Controllers\Web\MediaFolderController;
use App\Http\Controllers\Web\MediaMetaFieldController;
use App\Http\Controllers\Web\ProfileController;
use App\Http\Controllers\Web\RoleController;
use App\Http\Controllers\Web\SettingsController;
use App\Http\Controllers\Web\SetupController;
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

// Setup routes (only accessible when SETUP_ENABLED=true in .env)
Route::prefix('setup')->name('setup.')->group(function () {
    Route::get('/', [SetupController::class, 'index'])->name('index');
    Route::post('/', [SetupController::class, 'store'])->name('store');
    Route::post('check-connections', [SetupController::class, 'checkConnections'])->name('check-connections');
});

// Redirect root to dashboard, login, or setup
Route::get('/', function () {
    // Check if setup can be accessed (enabled AND required)
    if (SetupController::canAccessSetup()) {
        return redirect()->route('setup.index');
    }

    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

// Auth routes (public, but redirects to setup if no admin exists)
Route::middleware(['guest', 'setup.required'])->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
});

// Protected admin routes
Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    // Profile (accessible to all authenticated users)
    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Dashboard (accessible to all authenticated users)
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Collections - View
    Route::middleware('permission:collections.view')->group(function () {
        Route::get('collections', [CollectionController::class, 'index'])->name('collections.index');
        Route::get('collections/{collection}', [CollectionController::class, 'show'])->name('collections.show');
        Route::get('collections/{collection}/filter-views', [FilterViewController::class, 'forCollection'])
            ->name('collections.filter-views');
        Route::get('collections/{collection}/filter-fields', [FilterViewController::class, 'fields'])
            ->name('collections.filter-fields');
    });

    // Collections - Create/Update/Delete
    Route::middleware('permission:collections.create')->group(function () {
        Route::get('collections/create', [CollectionController::class, 'create'])->name('collections.create');
        Route::post('collections', [CollectionController::class, 'store'])->name('collections.store');
    });

    Route::middleware('permission:collections.update')->group(function () {
        Route::get('collections/{collection}/edit', [CollectionController::class, 'edit'])->name('collections.edit');
        Route::put('collections/{collection}', [CollectionController::class, 'update'])->name('collections.update');
        Route::patch('collections/{collection}', [CollectionController::class, 'update']);
    });

    Route::middleware('permission:collections.delete')->group(function () {
        Route::delete('collections/{collection}', [CollectionController::class, 'destroy'])->name('collections.destroy');
    });

    // Contents - View
    Route::middleware('permission:contents.view')->group(function () {
        Route::get('collections/{collection}/contents', [ContentController::class, 'index'])
            ->name('collections.contents.index');
        Route::get('contents/{content}', [ContentController::class, 'show'])->name('contents.show');
        Route::get('contents/{content}/preview', [ContentController::class, 'preview'])->name('contents.preview');
    });

    // Contents - Create
    Route::middleware('permission:contents.create')->group(function () {
        Route::get('collections/{collection}/contents/create', [ContentController::class, 'create'])
            ->name('collections.contents.create');
        Route::post('collections/{collection}/contents', [ContentController::class, 'store'])
            ->name('collections.contents.store');
    });

    // Contents - Update
    Route::middleware('permission:contents.update')->group(function () {
        Route::get('contents/{content}/edit', [ContentController::class, 'edit'])->name('contents.edit');
        Route::put('contents/{content}', [ContentController::class, 'update'])->name('contents.update');
        Route::post('contents/{content}/versions/{version}/restore', [ContentController::class, 'restoreVersion'])
            ->name('contents.versions.restore');
    });

    // Contents - Duplicate (requires create permission)
    Route::middleware('permission:contents.create')->group(function () {
        Route::post('contents/{content}/duplicate', [ContentController::class, 'duplicate'])
            ->name('contents.duplicate');
    });

    // Contents - Delete
    Route::middleware('permission:contents.delete')->group(function () {
        Route::delete('contents/{content}', [ContentController::class, 'destroy'])->name('contents.destroy');
    });

    // Contents - Publish
    Route::middleware('permission:contents.publish')->group(function () {
        Route::post('contents/{content}/publish', [ContentController::class, 'publish'])->name('contents.publish');
        Route::post('contents/{content}/unpublish', [ContentController::class, 'unpublish'])->name('contents.unpublish');
    });

    // Media - View
    Route::middleware('permission:media.view')->group(function () {
        Route::get('media', [MediaController::class, 'index'])->name('media.index');
        Route::get('media/{media}', [MediaController::class, 'show'])->name('media.show');
        Route::get('media/{media}/file', [MediaController::class, 'file'])->name('media.file');

        // Media Folders
        Route::get('media-folders/tree', [MediaFolderController::class, 'tree'])->name('media-folders.tree');
        Route::get('media-folders/global-root', [MediaFolderController::class, 'globalRoot'])->name('media-folders.global-root');
        Route::get('media-folders/{mediaFolder}', [MediaFolderController::class, 'show'])->name('media-folders.show');
    });

    // Media - Create
    Route::middleware('permission:media.create')->group(function () {
        Route::get('media/create', [MediaController::class, 'create'])->name('media.create');
        Route::post('media', [MediaController::class, 'store'])->name('media.store');
        Route::post('media-folders', [MediaFolderController::class, 'store'])->name('media-folders.store');
    });

    // Media - Update
    Route::middleware('permission:media.update')->group(function () {
        Route::put('media/{media}', [MediaController::class, 'update'])->name('media.update');
        Route::patch('media/{media}', [MediaController::class, 'update'])->name('media.update.patch');
        Route::put('media-folders/{mediaFolder}', [MediaFolderController::class, 'update'])->name('media-folders.update');
    });

    // Media - Delete
    Route::middleware('permission:media.delete')->group(function () {
        Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('media.destroy');
        Route::delete('media-folders/{mediaFolder}', [MediaFolderController::class, 'destroy'])->name('media-folders.destroy');
    });

    // Users - View
    Route::middleware('permission:users.view')->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    });

    // Users - Create
    Route::middleware('permission:users.create')->group(function () {
        Route::get('users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
    });

    // Users - Update
    Route::middleware('permission:users.update')->group(function () {
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::patch('users/{user}', [UserController::class, 'update']);
    });

    // Users - Delete
    Route::middleware('permission:users.delete')->group(function () {
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Settings - requires settings.view permission
    Route::middleware('permission:settings.view')->prefix('settings')->name('settings.')->group(function () {
        // Main settings index (tabbed view)
        Route::get('/', [SettingsController::class, 'index'])->name('index');

        // Roles Management
        Route::middleware('permission:roles.view')->group(function () {
            Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
            Route::get('roles/list', [RoleController::class, 'list'])->name('roles.list');
        });

        Route::middleware('permission:roles.create')->group(function () {
            Route::get('roles/create', [RoleController::class, 'create'])->name('roles.create');
            Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
        });

        Route::middleware('permission:roles.update')->group(function () {
            Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
            Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        });

        Route::middleware('permission:roles.delete')->group(function () {
            Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        });

        Route::middleware('permission:roles.view')->group(function () {
            Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show');
        });

        // Wrapper Purposes
        Route::middleware('permission:wrapper-purposes.view')->group(function () {
            Route::get('wrapper-purposes/list', [WrapperPurposeController::class, 'list'])
                ->name('wrapper-purposes.list');
            Route::get('wrapper-purposes', [WrapperPurposeController::class, 'index'])->name('wrapper-purposes.index');
            Route::get('wrapper-purposes/{wrapperPurpose}', [WrapperPurposeController::class, 'show'])
                ->name('wrapper-purposes.show');
        });

        Route::middleware('permission:wrapper-purposes.create')->group(function () {
            Route::get('wrapper-purposes/create', [WrapperPurposeController::class, 'create'])
                ->name('wrapper-purposes.create');
            Route::post('wrapper-purposes', [WrapperPurposeController::class, 'store'])->name('wrapper-purposes.store');
        });

        Route::middleware('permission:wrapper-purposes.update')->group(function () {
            Route::get('wrapper-purposes/{wrapperPurpose}/edit', [WrapperPurposeController::class, 'edit'])
                ->name('wrapper-purposes.edit');
            Route::put('wrapper-purposes/{wrapperPurpose}', [WrapperPurposeController::class, 'update'])
                ->name('wrapper-purposes.update');
            Route::patch('wrapper-purposes/{wrapperPurpose}', [WrapperPurposeController::class, 'update']);
        });

        Route::middleware('permission:wrapper-purposes.delete')->group(function () {
            Route::delete('wrapper-purposes/{wrapperPurpose}', [WrapperPurposeController::class, 'destroy'])
                ->name('wrapper-purposes.destroy');
        });

        // Editions
        Route::middleware('permission:editions.view')->group(function () {
            Route::get('editions/list', [EditionController::class, 'list'])->name('editions.list');
            Route::get('editions', [EditionController::class, 'index'])->name('editions.index');
            Route::get('editions/{edition}', [EditionController::class, 'show'])->name('editions.show');
        });

        Route::middleware('permission:editions.create')->group(function () {
            Route::get('editions/create', [EditionController::class, 'create'])->name('editions.create');
            Route::post('editions', [EditionController::class, 'store'])->name('editions.store');
        });

        Route::middleware('permission:editions.update')->group(function () {
            Route::get('editions/{edition}/edit', [EditionController::class, 'edit'])->name('editions.edit');
            Route::put('editions/{edition}', [EditionController::class, 'update'])->name('editions.update');
            Route::patch('editions/{edition}', [EditionController::class, 'update']);
        });

        Route::middleware('permission:editions.delete')->group(function () {
            Route::delete('editions/{edition}', [EditionController::class, 'destroy'])->name('editions.destroy');
        });

        // Media Meta Fields
        Route::middleware('permission:media-meta-fields.view')->group(function () {
            Route::get('media-meta-fields/list', [MediaMetaFieldController::class, 'list'])
                ->name('media-meta-fields.list');
            Route::get('media-meta-fields', [MediaMetaFieldController::class, 'index'])->name('media-meta-fields.index');
            Route::get('media-meta-fields/{mediaMetaField}', [MediaMetaFieldController::class, 'show'])
                ->name('media-meta-fields.show');
        });

        Route::middleware('permission:media-meta-fields.create')->group(function () {
            Route::get('media-meta-fields/create', [MediaMetaFieldController::class, 'create'])
                ->name('media-meta-fields.create');
            Route::post('media-meta-fields', [MediaMetaFieldController::class, 'store'])
                ->name('media-meta-fields.store');
        });

        Route::middleware('permission:media-meta-fields.update')->group(function () {
            Route::get('media-meta-fields/{mediaMetaField}/edit', [MediaMetaFieldController::class, 'edit'])
                ->name('media-meta-fields.edit');
            Route::put('media-meta-fields/{mediaMetaField}', [MediaMetaFieldController::class, 'update'])
                ->name('media-meta-fields.update');
            Route::patch('media-meta-fields/{mediaMetaField}', [MediaMetaFieldController::class, 'update']);
            Route::post('media-meta-fields/reorder', [MediaMetaFieldController::class, 'reorder'])
                ->name('media-meta-fields.reorder');
        });

        Route::middleware('permission:media-meta-fields.delete')->group(function () {
            Route::delete('media-meta-fields/{mediaMetaField}', [MediaMetaFieldController::class, 'destroy'])
                ->name('media-meta-fields.destroy');
        });

        // Filter Views
        Route::middleware('permission:collections.view')->group(function () {
            Route::get('filter-views', [FilterViewController::class, 'index'])->name('filter-views.index');
            Route::get('filter-views/operators', [FilterViewController::class, 'operators'])->name('filter-views.operators');
        });

        Route::middleware('permission:collections.update')->group(function () {
            Route::get('filter-views/create', [FilterViewController::class, 'create'])->name('filter-views.create');
            Route::post('filter-views', [FilterViewController::class, 'store'])->name('filter-views.store');
            Route::post('filter-views/json', [FilterViewController::class, 'storeJson'])->name('filter-views.store.json');
            Route::get('filter-views/{filterView}/edit', [FilterViewController::class, 'edit'])->name('filter-views.edit');
            Route::put('filter-views/{filterView}', [FilterViewController::class, 'update'])->name('filter-views.update');
            Route::put('filter-views/{filterView}/json', [FilterViewController::class, 'updateJson'])->name('filter-views.update.json');
            Route::delete('filter-views/{filterView}', [FilterViewController::class, 'destroy'])->name('filter-views.destroy');
            Route::delete('filter-views/{filterView}/json', [FilterViewController::class, 'destroyJson'])->name('filter-views.destroy.json');
        });
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
            // Preview for collection with sample contents
            Route::get('preview/collection/{collectionId}', [ReferenceController::class, 'previewCollection'])->name('preview.collection');
        });
    });
});
