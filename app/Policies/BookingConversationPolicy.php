<?php

namespace App\Policies;

use App\BookingConversation;
use App\Models\User;

class BookingConversationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, BookingConversation $bookingConversation): bool
    {
        return $user->id === $bookingConversation->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, BookingConversation $bookingConversation): bool
    {
        return $user->id === $bookingConversation->user_id
            && $bookingConversation->status === 'active';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, BookingConversation $bookingConversation): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, BookingConversation $bookingConversation): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, BookingConversation $bookingConversation): bool
    {
        return false;
    }
}
