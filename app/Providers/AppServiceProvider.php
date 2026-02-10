<?php

namespace App\Providers;

use App\BookingConversation;
use App\Policies\BookingConversationPolicy;
use App\Services\AI\AIService;
use App\Services\AI\Contracts\AIProviderInterface;
use App\Services\AI\DeepSeekProvider;
use App\Services\AI\GroqProvider;
use App\Services\AI\OllamaProvider;
use App\Services\Booking\BookingDataProvider;
use App\Services\Booking\BookingErrorHandler;
use App\Services\Booking\IntelligentBookingOrchestrator;
use App\Services\KnowledgeBaseService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Apple\AppleExtendSocialite;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register AI Provider based on configuration
        $this->app->singleton(AIProviderInterface::class, function ($app) {
            $provider = config('ai.default');

            return match ($provider) {
                'groq' => new GroqProvider,
                'deepseek' => new DeepSeekProvider,
                'ollama' => new OllamaProvider,
                'none' => throw new \Exception('AI provider is disabled'),
                default => throw new \Exception("Unsupported AI provider: {$provider}"),
            };
        });

        // Register AI Service
        $this->app->singleton(AIService::class, function ($app) {
            try {
                $provider = $app->make(AIProviderInterface::class);

                return new AIService($provider);
            } catch (\Exception $e) {
                // Return a disabled AI service if provider initialization fails
                \Log::warning('AI Service initialization failed', ['error' => $e->getMessage()]);
                throw $e;
            }
        });

        // Register Knowledge Base Service
        $this->app->singleton(KnowledgeBaseService::class, function ($app) {
            return new KnowledgeBaseService;
        });

        // Register Booking System Services
        $this->app->singleton(BookingDataProvider::class);
        $this->app->singleton(BookingErrorHandler::class);

        // Register Intelligent Booking Orchestrator (uses AI for entity extraction)
        $this->app->singleton(IntelligentBookingOrchestrator::class, function ($app) {
            return new IntelligentBookingOrchestrator(
                $app->make(AIService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::policy(BookingConversation::class, BookingConversationPolicy::class);

        // Register Apple Socialite Provider
        Event::listen(SocialiteWasCalled::class, AppleExtendSocialite::class.'@handle');
    }
}
