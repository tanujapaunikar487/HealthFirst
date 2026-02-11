<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Supported OAuth providers.
     */
    protected array $providers = ['google', 'apple'];

    /**
     * Redirect to OAuth provider.
     */
    public function redirect(string $provider): RedirectResponse
    {
        if (! in_array($provider, $this->providers)) {
            return redirect()->route('login')
                ->with('error', 'Unsupported authentication provider.');
        }

        $driver = Socialite::driver($provider);

        // Google-specific: Request email scope
        if ($provider === 'google') {
            $driver->scopes(['email', 'profile']);
        }

        return $driver->redirect();
    }

    /**
     * Handle OAuth callback.
     */
    public function callback(string $provider): RedirectResponse
    {
        if (! in_array($provider, $this->providers)) {
            return redirect()->route('login')
                ->with('error', 'Unsupported authentication provider.');
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();

            return $this->handleSocialUser($provider, $socialUser);
        } catch (\Throwable $e) {
            Log::error("Social auth callback error for {$provider}", [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $message = config('app.debug')
                ? 'OAuth error: '.$e->getMessage()
                : 'Unable to authenticate. Please try again.';

            return redirect()->route('login')
                ->with('error', $message);
        }
    }

    /**
     * Handle Apple's POST callback.
     * Apple uses POST for callbacks, not GET.
     */
    public function appleCallback(Request $request): RedirectResponse
    {
        try {
            // Apple sends user data in the POST body on first auth only
            $socialUser = Socialite::driver('apple')->stateless()->user();

            return $this->handleSocialUser('apple', $socialUser);
        } catch (\Throwable $e) {
            Log::error('Apple auth callback error', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('login')
                ->with('error', 'Unable to authenticate with Apple. Please try again.');
        }
    }

    /**
     * Process the social user and create/link account.
     */
    protected function handleSocialUser(string $provider, $socialUser): RedirectResponse
    {
        $providerId = $socialUser->getId();
        $email = $socialUser->getEmail();
        $name = $socialUser->getName() ?? $socialUser->getNickname();
        $avatar = $socialUser->getAvatar();

        // Check if this social account already exists
        $socialAccount = SocialAccount::where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        if ($socialAccount) {
            // Existing social account - log in the user
            $this->updateSocialAccountTokens($socialAccount, $socialUser);
            $user = $socialAccount->user;

            // Seed demo data if missing (e.g., first seed failed)
            $this->ensureDemoData($user);

            Auth::login($user, remember: true);

            return redirect()->intended(route('dashboard'));
        }

        // Social account doesn't exist - check if email matches existing user
        $existingUser = $email ? User::where('email', $email)->first() : null;

        if ($existingUser) {
            // Link social account to existing user
            $this->createSocialAccount($existingUser, $provider, $providerId, $email, $name, $avatar, $socialUser);
            Auth::login($existingUser, remember: true);

            return redirect()->intended(route('dashboard'));
        }

        // Handle case where Apple doesn't provide email
        if (! $email && $provider === 'apple') {
            return redirect()->route('login')
                ->with('error', 'Unable to retrieve email from Apple. Please sign in with email or try again.');
        }

        // Create new user + social account in a transaction
        $user = DB::transaction(function () use ($provider, $providerId, $email, $name, $avatar, $socialUser) {
            $user = User::create([
                'name' => $name ?? 'User',
                'email' => $email,
                'password' => bcrypt(Str::random(32)),
                'email_verified_at' => now(),
            ]);

            $this->createSocialAccount($user, $provider, $providerId, $email, $name, $avatar, $socialUser);

            return $user;
        });

        // Fire event and login AFTER transaction commits so seeder errors
        // don't taint the PostgreSQL connection state
        event(new Registered($user));
        Auth::login($user, remember: true);

        return redirect()->route('dashboard');
    }

    /**
     * Create a social account record.
     */
    protected function createSocialAccount(
        User $user,
        string $provider,
        string $providerId,
        ?string $email,
        ?string $name,
        ?string $avatar,
        $socialUser
    ): SocialAccount {
        return SocialAccount::create([
            'user_id' => $user->id,
            'provider' => $provider,
            'provider_id' => $providerId,
            'provider_email' => $email,
            'provider_name' => $name,
            'avatar_url' => $avatar,
            'access_token' => $socialUser->token ?? null,
            'refresh_token' => $socialUser->refreshToken ?? null,
            'token_expires_at' => isset($socialUser->expiresIn)
                ? now()->addSeconds($socialUser->expiresIn)
                : null,
        ]);
    }

    /**
     * Update tokens for existing social account.
     */
    protected function updateSocialAccountTokens(SocialAccount $socialAccount, $socialUser): void
    {
        $socialAccount->update([
            'access_token' => $socialUser->token ?? $socialAccount->access_token,
            'refresh_token' => $socialUser->refreshToken ?? $socialAccount->refresh_token,
            'token_expires_at' => isset($socialUser->expiresIn)
                ? now()->addSeconds($socialUser->expiresIn)
                : $socialAccount->token_expires_at,
        ]);
    }

    /**
     * Seed demo data if the user has none (e.g., initial seed failed).
     */
    protected function ensureDemoData(User $user): void
    {
        if ($user->familyMembers()->count() > 0) {
            return;
        }

        try {
            \Database\Seeders\HospitalSeeder::seedForUser($user);
        } catch (\Throwable $e) {
            Log::error('Failed to seed demo data on login', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
