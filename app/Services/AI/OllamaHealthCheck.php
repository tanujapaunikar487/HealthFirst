<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaHealthCheck
{
    private string $baseUrl;

    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('ai.ollama.base_url', 'http://localhost:11434');
        $this->timeout = 5; // seconds
    }

    /**
     * Check if Ollama is available and healthy.
     * Uses caching to avoid checking too frequently.
     */
    public function isHealthy(): bool
    {
        // Cache health status for 30 seconds to avoid hammering Ollama
        return Cache::remember('ollama_health_status', 30, function () {
            return $this->performHealthCheck();
        });
    }

    /**
     * Perform actual health check against Ollama.
     */
    private function performHealthCheck(): bool
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get($this->baseUrl.'/api/tags');

            if ($response->successful()) {
                return true;
            }

            Log::warning('Ollama health check failed', [
                'status' => $response->status(),
                'url' => $this->baseUrl,
            ]);

            return false;
        } catch (\Exception $e) {
            Log::warning('Ollama health check exception', [
                'error' => $e->getMessage(),
                'url' => $this->baseUrl,
            ]);

            return false;
        }
    }

    /**
     * Get detailed health information.
     */
    public function getHealthDetails(): array
    {
        $isHealthy = $this->performHealthCheck();

        $message = $isHealthy
            ? 'Ollama is running and healthy'
            : 'Ollama is not available. Start it with: ollama serve (or run setup-ollama-service.sh for auto-start)';

        return [
            'healthy' => $isHealthy,
            'url' => $this->baseUrl,
            'timestamp' => now()->toIso8601String(),
            'message' => $message,
            'model' => config('ai.ollama.model', 'deepseek-r1:7b'),
        ];
    }

    /**
     * Check if a specific model is available.
     */
    public function isModelAvailable(string $modelName): bool
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get($this->baseUrl.'/api/tags');

            if (! $response->successful()) {
                return false;
            }

            $data = $response->json();
            $models = $data['models'] ?? [];

            foreach ($models as $model) {
                if (str_contains($model['name'] ?? '', $modelName)) {
                    return true;
                }
            }

            return false;
        } catch (\Exception $e) {
            Log::warning('Model availability check failed', [
                'model' => $modelName,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get comprehensive status including model availability.
     */
    public function getComprehensiveStatus(): array
    {
        $baseHealth = $this->getHealthDetails();
        $modelName = config('ai.ollama.model', 'deepseek-r1:7b');

        if (! $baseHealth['healthy']) {
            return array_merge($baseHealth, [
                'model_available' => false,
                'model_message' => 'Cannot check model - Ollama not running',
            ]);
        }

        $modelAvailable = $this->isModelAvailable($modelName);

        return array_merge($baseHealth, [
            'model_available' => $modelAvailable,
            'model_message' => $modelAvailable
                ? "Model {$modelName} is available"
                : "Model {$modelName} not found. Download with: ollama pull {$modelName}",
        ]);
    }

    /**
     * Clear health check cache to force immediate recheck.
     */
    public function clearHealthCache(): void
    {
        Cache::forget('ollama_health_status');
    }

    /**
     * Get a user-friendly status message for display.
     */
    public function getStatusMessage(): string
    {
        $status = $this->getComprehensiveStatus();

        if (! $status['healthy']) {
            return '🔴 AI Offline: Ollama not running';
        }

        if (! $status['model_available']) {
            return '🟡 AI Limited: Model not downloaded';
        }

        return '🟢 AI Online and Ready';
    }
}
