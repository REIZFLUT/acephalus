<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\Media;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'collections' => Collection::count(),
            'contents' => Content::count(),
            'published' => Content::published()->count(),
            'drafts' => Content::draft()->count(),
            'media' => Media::count(),
            'users' => User::count(),
        ];

        $recentContents = Content::with('collection')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recentContents' => $recentContents,
        ]);
    }
}
