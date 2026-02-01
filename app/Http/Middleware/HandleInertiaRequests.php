<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user() ?? \App\User::first();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'notificationUnreadCount' => $user
                ? \App\Models\BillingNotification::where('user_id', $user->id)->whereNull('read_at')->count()
                : 0,
            'allNotifications' => $user
                ? \App\Models\BillingNotification::where('user_id', $user->id)
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(fn ($n) => [
                        'id' => $n->id,
                        'type' => $n->type,
                        'title' => $n->title,
                        'message' => $n->message,
                        'channels' => $n->channels,
                        'read_at' => $n->read_at?->toIso8601String(),
                        'created_at' => $n->created_at->toIso8601String(),
                        'appointment_id' => $n->appointment_id,
                    ])
                : [],
            'toast' => fn () => $request->session()->get('toast'),
        ];
    }
}
