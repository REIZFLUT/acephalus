<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Mongodb\MediaFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MediaFolderController extends Controller
{
    /**
     * Get all folders as a tree structure for the media library.
     */
    public function tree(): JsonResponse
    {
        $folders = MediaFolder::with('children')
            ->whereNull('parent_id')
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return response()->json($this->buildFolderTree($folders));
    }

    /**
     * Get folder contents (subfolders and media count).
     */
    public function show(MediaFolder $mediaFolder): JsonResponse
    {
        $mediaFolder->load('children', 'media');

        return response()->json([
            'folder' => $mediaFolder,
            'breadcrumbs' => $mediaFolder->getBreadcrumbs(),
            'children' => $mediaFolder->children()->orderBy('name')->get(),
            'media_count' => $mediaFolder->media()->count(),
            'can_create_subfolders' => $mediaFolder->canCreateSubfolders(),
            'can_delete' => $mediaFolder->canBeDeleted(),
        ]);
    }

    /**
     * Create a new folder (only in global branch).
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'parent_id' => ['required', 'string'],
        ]);

        $parent = MediaFolder::findOrFail($validated['parent_id']);

        // Only allow creating folders in global branch
        if (! $parent->canCreateSubfolders()) {
            return response()->json([
                'message' => 'Cannot create subfolders in this location.',
            ], 403);
        }

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        // Check for duplicate slugs in the same parent
        $existingFolder = MediaFolder::where('parent_id', $parent->_id)
            ->where('slug', $slug)
            ->first();

        if ($existingFolder) {
            return response()->json([
                'message' => 'A folder with this name already exists.',
            ], 422);
        }

        $folder = MediaFolder::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'parent_id' => (string) $parent->_id,
            'path' => $parent->path.'/'.$slug,
            'type' => MediaFolder::TYPE_CUSTOM,
            'is_system' => false,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Folder created successfully.',
                'folder' => $folder,
            ], 201);
        }

        return redirect()->back()->with('success', 'Folder created successfully.');
    }

    /**
     * Update a folder (rename).
     */
    public function update(Request $request, MediaFolder $mediaFolder): JsonResponse|RedirectResponse
    {
        if ($mediaFolder->is_system) {
            return response()->json([
                'message' => 'System folders cannot be renamed.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        // Update folder and path
        $oldPath = $mediaFolder->path;
        $newPath = $mediaFolder->parent ? $mediaFolder->parent->path.'/'.$slug : $slug;

        $mediaFolder->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'path' => $newPath,
        ]);

        // Update paths of all descendants
        $this->updateDescendantPaths($mediaFolder, $oldPath, $newPath);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Folder updated successfully.',
                'folder' => $mediaFolder->fresh(),
            ]);
        }

        return redirect()->back()->with('success', 'Folder updated successfully.');
    }

    /**
     * Delete a folder (only custom folders).
     */
    public function destroy(MediaFolder $mediaFolder): JsonResponse|RedirectResponse
    {
        if (! $mediaFolder->canBeDeleted()) {
            return response()->json([
                'message' => 'This folder cannot be deleted.',
            ], 403);
        }

        // Check if folder has media
        if ($mediaFolder->media()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete folder with media files. Move or delete files first.',
            ], 422);
        }

        // Check if folder has children
        if ($mediaFolder->children()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete folder with subfolders. Delete subfolders first.',
            ], 422);
        }

        $mediaFolder->delete();

        return response()->json([
            'message' => 'Folder deleted successfully.',
        ]);
    }

    /**
     * Get the global root folder for creating custom folders.
     */
    public function globalRoot(): JsonResponse
    {
        $globalFolder = MediaFolder::where('type', MediaFolder::TYPE_ROOT_GLOBAL)->first();

        return response()->json($globalFolder);
    }

    /**
     * Build a nested folder tree structure.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, MediaFolder>  $folders
     * @return array<int, array<string, mixed>>
     */
    protected function buildFolderTree($folders): array
    {
        $tree = [];

        foreach ($folders as $folder) {
            $node = [
                'id' => (string) $folder->_id,
                'name' => $folder->name,
                'slug' => $folder->slug,
                'path' => $folder->path,
                'type' => $folder->type,
                'is_system' => $folder->is_system,
                'can_create_subfolders' => $folder->canCreateSubfolders(),
                'can_delete' => $folder->canBeDeleted(),
                'children' => [],
            ];

            if ($folder->children && $folder->children->count() > 0) {
                $node['children'] = $this->buildFolderTree($folder->children);
            }

            $tree[] = $node;
        }

        return $tree;
    }

    /**
     * Update paths of all descendant folders.
     */
    protected function updateDescendantPaths(MediaFolder $folder, string $oldPath, string $newPath): void
    {
        $descendants = $folder->getDescendants();

        foreach ($descendants as $descendant) {
            $descendant->update([
                'path' => str_replace($oldPath, $newPath, $descendant->path),
            ]);
        }
    }
}
