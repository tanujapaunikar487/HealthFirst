<?php

namespace App\Http\Controllers;

use App\Models\BillingNotification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function markAsRead(BillingNotification $billingNotification)
    {
        $billingNotification->markAsRead();

        return back();
    }

    public function markAllAsRead()
    {
        $user = Auth::user() ?? \App\User::first();

        BillingNotification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);

        return back();
    }
}
