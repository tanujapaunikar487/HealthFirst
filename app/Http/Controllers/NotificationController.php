<?php

namespace App\Http\Controllers;

use App\Models\BillingNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    public function markAsRead(BillingNotification $billingNotification)
    {
        $billingNotification->markAsRead();
        self::clearNotificationCache($billingNotification->user_id);

        return back();
    }

    public function markAllAsRead()
    {
        $user = Auth::user() ?? \App\User::first();

        BillingNotification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);

        self::clearNotificationCache($user->id);

        return back();
    }

    public static function clearNotificationCache($userId): void
    {
        Cache::forget("notifications_unread:{$userId}");
        Cache::forget("notifications_all:{$userId}");
    }
}
