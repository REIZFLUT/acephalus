<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Mongodb\Content;
use App\Models\User;

class ContentPolicy
{
    /**
     * Determine whether the user can view any contents.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('contents.view')
            || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can view the content.
     */
    public function view(User $user, Content $content): bool
    {
        return $user->hasPermissionTo('contents.view')
            || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can create contents.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('contents.create')
            || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can update the content.
     */
    public function update(User $user, Content $content): bool
    {
        return $user->hasPermissionTo('contents.update')
            || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can delete the content.
     */
    public function delete(User $user, Content $content): bool
    {
        return $user->hasPermissionTo('contents.delete')
            || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can publish the content.
     */
    public function publish(User $user, Content $content): bool
    {
        return $user->hasPermissionTo('contents.publish')
            || $user->hasRole('admin');
    }
}
