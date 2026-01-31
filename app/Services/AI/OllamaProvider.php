<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Ollama Provider for Local AI Models
 *
 * This provider uses Ollama to run models locally.
 * No API key required, no external API calls, complete privacy.
 *
 * Setup:
 * 1. Install Ollama: https://ollama.ai/
 * 2. Pull model: ollama pull qwen2.5:7b
 * 3. Start Ollama: ollama serve
 * 4. Configure: AI_PROVIDER=ollama
 */
class OllamaProvider implements AIProviderInterface
{
    private string $baseUrl;
    private string $model;
    private int $maxTokens;
    private float $temperature;

    public function __construct()
    {
        $this->baseUrl = config('ai.providers.ollama.base_url', 'http://localhost:11434');
        $this->model = config('ai.providers.ollama.model', 'qwen2.5:7b');
        $this->maxTokens = config('ai.providers.ollama.max_tokens', 2000);
        $this->temperature = config('ai.providers.ollama.temperature', 0.3);
    }

    /**
     * Send a prompt to Ollama and get a response.
     */
    public function complete(string $prompt, array $options = []): string
    {
        if (!$this->isAvailable()) {
            throw new \Exception('Ollama is not running or not configured. Please start Ollama service.');
        }

        $messages = [
            ['role' => 'user', 'content' => $prompt],
        ];

        return $this->chat($messages, $options);
    }

    /**
     * Send a structured chat conversation to Ollama.
     */
    public function chat(array $messages, array $options = []): string
    {
        if (!$this->isAvailable()) {
            throw new \Exception('Ollama is not running. Start it with: ollama serve');
        }

        try {
            $payload = [
                'model' => $options['model'] ?? $this->model,
                'messages' => $messages,
                'stream' => false,
                'options' => [
                    'temperature' => $options['temperature'] ?? $this->temperature,
                    'num_predict' => $options['max_tokens'] ?? $this->maxTokens,
                ],
            ];

            // Add JSON format enforcement via Ollama's constrained decoding
            if (isset($options['json_schema'])) {
                $payload['format'] = $options['json_schema'];
            } elseif (!empty($options['json_mode'])) {
                $payload['format'] = 'json';
            }

            // Add system message if provided in options
            if (isset($options['system'])) {
                array_unshift($payload['messages'], [
                    'role' => 'system',
                    'content' => $options['system'],
                ]);
            }

            // Log request if enabled
            if (config('ai.logging.log_prompts')) {
                Log::info('Ollama API Request', [
                    'model' => $payload['model'],
                    'message_count' => count($payload['messages']),
                    'temperature' => $payload['options']['temperature'],
                ]);
            }

            $response = Http::timeout(120) // Longer timeout for local inference
                ->post($this->baseUrl . '/api/chat', $payload);

            if ($response->failed()) {
                Log::error('Ollama request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('Ollama request failed. Is Ollama running?');
            }

            $responseData = $response->json();
            $content = $responseData['message']['content'] ?? '';

            // Log response if enabled
            if (config('ai.logging.log_responses')) {
                Log::info('Ollama API Response', [
                    'content_length' => strlen($content),
                    'eval_count' => $responseData['eval_count'] ?? null,
                    'total_duration_ms' => ($responseData['total_duration'] ?? 0) / 1000000,
                ]);
            }

            return $content;
        } catch (\Exception $e) {
            if (config('ai.logging.log_errors')) {
                Log::error('Ollama provider error', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
            throw new \Exception('Ollama service error: ' . $e->getMessage());
        }
    }

    /**
     * Get a JSON-structured response from Ollama.
     */
    public function completeJson(string $prompt, array $options = []): array
    {
        // Use Ollama's format parameter for guaranteed JSON output
        $response = $this->complete($prompt, array_merge($options, [
            'temperature' => 0.3,
            'json_mode' => true,
        ]));

        // Safety net: extract JSON if model wraps it in text
        $jsonMatch = preg_match('/\{[\s\S]*\}/', $response, $matches);
        if ($jsonMatch) {
            $response = $matches[0];
        }

        $response = preg_replace('/```json\s*|\s*```/', '', $response);
        $response = trim($response);

        try {
            $decoded = json_decode($response, true, 512, JSON_THROW_ON_ERROR);
            return $decoded;
        } catch (\JsonException $e) {
            Log::error('Failed to parse Ollama JSON response', [
                'response' => $response,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('AI returned invalid JSON response.');
        }
    }

    /**
     * Check if Ollama is running and configured.
     */
    public function isAvailable(): bool
    {
        if (config('ai.default') !== 'ollama') {
            return false;
        }

        try {
            // Quick health check - ping Ollama API
            $response = Http::timeout(2)->get($this->baseUrl . '/api/tags');

            if ($response->successful()) {
                // Check if our model is available
                $models = $response->json('models', []);
                $modelName = $this->model;

                foreach ($models as $model) {
                    if ($model['name'] === $modelName) {
                        return true;
                    }
                }

                Log::warning('Ollama model not found', [
                    'model' => $modelName,
                    'available_models' => array_column($models, 'name'),
                    'hint' => "Run: ollama pull {$modelName}",
                ]);

                // Still return true if Ollama is running (user can pull model)
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::debug('Ollama availability check failed', [
                'error' => $e->getMessage(),
                'hint' => 'Start Ollama with: ollama serve',
            ]);
            return false;
        }
    }

    /**
     * Get the provider name.
     */
    public function getName(): string
    {
        return 'ollama';
    }
}
