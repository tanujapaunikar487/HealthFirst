<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $user = Auth::user() ?? \App\User::first();

        $videoSettings = $user->getSetting('video_conferencing', [
            'provider' => 'google_meet',
            'google_meet' => ['enabled' => true],
            'zoom' => ['enabled' => false],
        ]);

        return Inertia::render('Settings/Index', [
            'user' => $user,
            'videoSettings' => $videoSettings,
        ]);
    }

    public function updateVideoSettings(Request $request)
    {
        $user = Auth::user() ?? \App\User::first();

        $validated = $request->validate([
            'provider' => 'required|in:google_meet,zoom',
        ]);

        $currentSettings = $user->getSetting('video_conferencing', [
            'provider' => 'google_meet',
            'google_meet' => ['enabled' => true],
            'zoom' => ['enabled' => false],
        ]);

        $currentSettings['provider'] = $validated['provider'];

        $user->setSetting('video_conferencing', $currentSettings);

        return back()->with('success', 'Video provider updated successfully.');
    }
}
