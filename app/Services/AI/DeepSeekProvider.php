<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class DeepSeekProvider implements AIProviderInterface
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;
    private int $maxTokens;
    private float $temperature;

    public function __construct()
    {
        $this->apiKey = config('ai.providers.deepseek.api_key', '');
        $this->apiUrl = config('ai.providers.deepseek.api_url', 'https://api.deepseek.com/v1');
        $this->model = config('ai.providers.deepseek.model', 'deepseek-chat');
        $this->maxTokens = config('ai.providers.deepseek.max_tokens', 2000);
        $this->temperature = config('ai.providers.deepseek.temperature', 0.7);
    }

    /**
     * Send a prompt to DeepSeek and get a response.
     */
    public function complete(string $prompt, array $options = []): string
    {
        if (!$this->isAvailable()) {
            throw new \Exception('DeepSeek provider is not configured.');
        }

        $messages = [
            ['role' => 'user', 'content' => $prompt],
        ];

        return $this->chat($messages, $options);
    }

    /**
     * Send a structured chat conversation to DeepSeek.
     */
    public function chat(array $messages, array $options = []): string
    {
        if (!$this->isAvailable()) {
            throw new \Exception('DeepSeek provider is not configured.');
        }

        // Check rate limiting
        if ($this->isRateLimited()) {
            throw new \Exception('AI rate limit exceeded. Please try again later.');
        }

        try {
            $payload = [
                'model' => $options['model'] ?? $this->model,
                'messages' => $messages,
                'temperature' => $options['temperature'] ?? $this->temperature,
                'max_tokens' => $options['max_tokens'] ?? $this->maxTokens,
            ];

            // Add system message if provided in options
            if (isset($options['system'])) {
                array_unshift($payload['messages'], [
                    'role' => 'system',
                    'content' => $options['system'],
                ]);
            }

            // Log request if enabled
            if (config('ai.logging.log_prompts')) {
                Log::info('DeepSeek API Request', [
                    'model' => $payload['model'],
                    'message_count' => count($payload['messages']),
                    'temperature' => $payload['temperature'],
                ]);
            }

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->apiUrl . '/chat/completions', $payload);

            if ($response->failed()) {
                Log::error('DeepSeek API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('AI request failed. Please try again.');
            }

            $content = $response->json('choices.0.message.content');

            // Log response if enabled
            if (config('ai.logging.log_responses')) {
                Log::info('DeepSeek API Response', [
                    'content_length' => strlen($content),
                    'usage' => $response->json('usage'),
                ]);
            }

            // Increment rate limit counter
            $this->incrementRateLimit();

            return $content;
        } catch (\Exception $e) {
            if (config('ai.logging.log_errors')) {
                Log::error('DeepSeek provider error', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
            throw new \Exception('AI service is temporarily unavailable: ' . $e->getMessage());
        }
    }

    /**
     * Get a JSON-structured response from DeepSeek.
     */
    public function completeJson(string $prompt, array $options = []): array
    {
        // Add instruction to return JSON
        $jsonPrompt = $prompt . "\n\nIMPORTANT: Respond with valid JSON only, no additional text.";

        $response = $this->complete($jsonPrompt, $options);

        // Try to extract JSON from response (handle cases where AI adds text around JSON)
        $jsonMatch = preg_match('/\{[\s\S]*\}/', $response, $matches);
        if ($jsonMatch) {
            $response = $matches[0];
        }

        try {
            $decoded = json_decode($response, true, 512, JSON_THROW_ON_ERROR);
            return $decoded;
        } catch (\JsonException $e) {
            Log::error('Failed to parse DeepSeek JSON response', [
                'response' => $response,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('AI returned invalid JSON response.');
        }
    }

    /**
     * Check if DeepSeek is configured and enabled.
     */
    public function isAvailable(): bool
    {
        return !empty($this->apiKey)
            && config('ai.default') === 'deepseek';
    }

    /**
     * Get the provider name.
     */
    public function getName(): string
    {
        return 'deepseek';
    }

    /**
     * Check if rate limit is exceeded.
     */
    private function isRateLimited(): bool
    {
        if (!config('ai.rate_limit.enabled')) {
            return false;
        }

        $perMinuteKey = 'ai_rate_limit:minute:' . now()->format('Y-m-d-H-i');
        $perDayKey = 'ai_rate_limit:day:' . now()->format('Y-m-d');

        $perMinuteCount = Cache::get($perMinuteKey, 0);
        $perDayCount = Cache::get($perDayKey, 0);

        $maxPerMinute = config('ai.rate_limit.max_requests_per_minute');
        $maxPerDay = config('ai.rate_limit.max_requests_per_day');

        return $perMinuteCount >= $maxPerMinute || $perDayCount >= $maxPerDay;
    }

    /**
     * Increment rate limit counters.
     */
    private function incrementRateLimit(): void
    {
        if (!config('ai.rate_limit.enabled')) {
            return;
        }

        $perMinuteKey = 'ai_rate_limit:minute:' . now()->format('Y-m-d-H-i');
        $perDayKey = 'ai_rate_limit:day:' . now()->format('Y-m-d');

        Cache::increment($perMinuteKey);
        Cache::put($perMinuteKey, Cache::get($perMinuteKey), now()->addMinute());

        Cache::increment($perDayKey);
        Cache::put($perDayKey, Cache::get($perDayKey), now()->addDay());
    }
}
