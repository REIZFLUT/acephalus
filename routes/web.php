<?php

use App\Http\Controllers\Web\AuthController;
use App\Http\Controllers\Web\CollectionController;
use App\Http\Controllers\Web\ContentController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\MediaController;
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

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Collections
    Route::resource('collections', CollectionController::class);

    // Contents
    Route::get('collections/{collection}/contents', [ContentController::class, 'index'])
        ->name('collections.contents.index');
    Route::get('collections/{collection}/contents/create', [ContentController::class, 'create'])
        ->name('collections.contents.create');
    Route::post('collections/{collection}/contents', [ContentController::class, 'store'])
        ->name('collections.contents.store');
    Route::get('contents/{content}', [ContentController::class, 'show'])->name('contents.show');
    Route::get('contents/{content}/edit', [ContentController::class, 'edit'])->name('contents.edit');
    Route::put('contents/{content}', [ContentController::class, 'update'])->name('contents.update');
    Route::delete('contents/{content}', [ContentController::class, 'destroy'])->name('contents.destroy');
    Route::post('contents/{content}/publish', [ContentController::class, 'publish'])->name('contents.publish');
    Route::post('contents/{content}/unpublish', [ContentController::class, 'unpublish'])->name('contents.unpublish');

    // Media
    Route::get('media/{media}/file', [MediaController::class, 'file'])->name('media.file');
    Route::resource('media', MediaController::class)->except(['edit', 'update']);

    // Users
    Route::resource('users', UserController::class);

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        // Wrapper Purposes
        Route::get('wrapper-purposes/list', [WrapperPurposeController::class, 'list'])
            ->name('wrapper-purposes.list');
        Route::resource('wrapper-purposes', WrapperPurposeController::class)
            ->parameters(['wrapper-purposes' => 'wrapperPurpose']);
    });
});
