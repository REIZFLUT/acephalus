<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Mongodb\Media;
use App\Models\User;

class MediaPolicy
{
    /**
     * Determine whether the user can view any media.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('media.view')
            || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can view the media.
     */
    public function view(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.view')
            || $user->hasRole('admin')
            || $media->uploaded_by === $user->id;
    }

    /**
     * Determine whether the user can create media.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('media.create')
            || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can delete the media.
     */
    public function delete(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.delete')
            || $user->hasRole('admin')
            || $media->uploaded_by === $user->id;
    }
}


