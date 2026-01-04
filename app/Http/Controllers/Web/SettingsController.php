<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Edition;
use App\Models\Mongodb\MediaMetaField;
use App\Models\Mongodb\WrapperPurpose;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $purposes = WrapperPurpose::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $editions = Edition::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $mediaMetaFields = MediaMetaField::ordered()->get();

        return Inertia::render('Settings/Index', [
            'purposes' => $purposes,
            'editions' => $editions,
            'mediaMetaFields' => $mediaMetaFields,
            'activeTab' => 'wrapper-purposes',
        ]);
    }
}
