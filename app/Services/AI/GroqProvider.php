<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Groq Provider for Fast Cloud AI Inference
 *
 * This provider uses Groq's cloud API for fast inference with large models.
 * Requires API key from https://console.groq.com/
 *
 * Setup:
 * 1. Get API key from Groq console
 * 2. Set GROQ_API_KEY in .env
 * 3. Configure: AI_PROVIDER=groq
 */
class GroqProvider implements AIProviderInterface
{
    private string $apiKey;

    private string $baseUrl;

    private string $model;

    private int $maxTokens;

    private float $temperature;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key', '');
        $this->baseUrl = config('services.groq.base_url', 'https://api.groq.com/openai/v1/chat/completions');
        $this->model = config('services.groq.model', 'llama-3.3-70b-versatile');
        $this->maxTokens = config('ai.providers.groq.max_tokens', 2000);
        $this->temperature = config('ai.providers.groq.temperature', 0.7);
    }

    /**
     * Send a prompt to Groq and get a response.
     */
    public function complete(string $prompt, array $options = []): string
    {
        if (! $this->isAvailable()) {
            throw new \Exception('Groq API key is not configured. Please set GROQ_API_KEY in .env');
        }

        $messages = [
            ['role' => 'user', 'content' => $prompt],
        ];

        return $this->chat($messages, $options);
    }

    /**
     * Send a structured chat conversation to Groq.
     */
    public function chat(array $messages, array $options = []): string|array
    {
        if (! $this->isAvailable()) {
            throw new \Exception('Groq API key is not configured. Set GROQ_API_KEY in .env');
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
                Log::info('Groq API Request', [
                    'model' => $payload['model'],
                    'message_count' => count($payload['messages']),
                    'temperature' => $payload['temperature'],
                ]);
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$this->apiKey,
                'Content-Type' => 'application/json',
            ])
                ->timeout(30)
                ->post($this->baseUrl, $payload);

            if ($response->failed()) {
                Log::error('Groq request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('Groq API request failed: '.$response->body());
            }

            $responseData = $response->json();
            $content = $responseData['choices'][0]['message']['content'] ?? '';

            // Log response if enabled
            if (config('ai.logging.log_responses')) {
                Log::info('Groq API Response', [
                    'content_length' => strlen($content),
                    'finish_reason' => $responseData['choices'][0]['finish_reason'] ?? null,
                    'usage' => $responseData['usage'] ?? null,
                ]);
            }

            // Check if caller wants thinking/reasoning extraction
            if (isset($options['extract_thinking']) && $options['extract_thinking']) {
                return $this->extractThinkingSteps($content);
            }

            return $content;
        } catch (\Exception $e) {
            if (config('ai.logging.log_errors')) {
                Log::error('Groq provider error', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
            throw new \Exception('Groq API error: '.$e->getMessage());
        }
    }

    /**
     * Get a JSON-structured response from Groq.
     */
    public function completeJson(string $prompt, array $options = []): array
    {
        // Add instruction to return JSON
        $jsonPrompt = $prompt."\n\nIMPORTANT: Respond with valid JSON only, no additional text or markdown.";

        $response = $this->complete($jsonPrompt, array_merge($options, [
            'temperature' => 0.3, // Lower temperature for more consistent JSON
        ]));

        // Try to extract JSON from response (handle cases where model adds text around JSON)
        $jsonMatch = preg_match('/\{[\s\S]*\}/', $response, $matches);
        if ($jsonMatch) {
            $response = $matches[0];
        }

        // Remove markdown code blocks if present
        $response = preg_replace('/```json\s*|\s*```/', '', $response);
        $response = trim($response);

        try {
            $decoded = json_decode($response, true, 512, JSON_THROW_ON_ERROR);

            return $decoded;
        } catch (\JsonException $e) {
            Log::error('Failed to parse Groq JSON response', [
                'response' => $response,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('AI returned invalid JSON response.');
        }
    }

    /**
     * Check if Groq is configured with API key.
     */
    public function isAvailable(): bool
    {
        return ! empty($this->apiKey) && config('ai.default') === 'groq';
    }

    /**
     * Get the provider name.
     */
    public function getName(): string
    {
        return 'groq';
    }

    /**
     * Extract thinking steps from AI response.
     * Looks for <think>...</think> tags or reasoning patterns.
     */
    private function extractThinkingSteps(string $content): array
    {
        $thinkingSteps = [];
        $finalResponse = $content;

        // Method 1: Extract <think> tags (for models that support it)
        if (preg_match_all('/<think>(.*?)<\/think>/s', $content, $matches)) {
            foreach ($matches[1] as $thinkBlock) {
                $steps = array_filter(array_map('trim', explode("\n", $thinkBlock)));
                $thinkingSteps = array_merge($thinkingSteps, array_values($steps));
            }
            // Remove think tags from final response
            $finalResponse = preg_replace('/<think>.*?<\/think>/s', '', $content);
            $finalResponse = trim($finalResponse);
        }

        // Method 2: Extract numbered reasoning steps (1., 2., etc.)
        if (empty($thinkingSteps) && preg_match('/^(\d+\.\s+.+?)(?=\n\n|\n[A-Z]|$)/m', $content, $matches)) {
            // Look for reasoning section markers
            $reasoningMarkers = ['Let me think', 'Analyzing', 'Reasoning:', 'Step by step:', 'Thinking:'];
            foreach ($reasoningMarkers as $marker) {
                if (stripos($content, $marker) !== false) {
                    // Extract reasoning section
                    if (preg_match('/'.preg_quote($marker, '/').':?\s*(.*?)(?=\n\n[A-Z]|\Z)/s', $content, $reasoningMatch)) {
                        $reasoningText = $reasoningMatch[1];
                        // Split by numbered steps
                        preg_match_all('/^\d+\.\s+(.+?)(?=\n\d+\.|\Z)/m', $reasoningText, $stepMatches);
                        if (! empty($stepMatches[1])) {
                            $thinkingSteps = array_map('trim', $stepMatches[1]);
                            // Remove reasoning section from final response
                            $finalResponse = trim(str_replace($reasoningMatch[0], '', $content));
                            break;
                        }
                    }
                }
            }
        }

        // Method 3: Simulate thinking steps based on content analysis (fallback)
        if (empty($thinkingSteps)) {
            // Parse the JSON response to understand what the AI is doing
            $jsonMatch = preg_match('/\{[\s\S]*\}/', $content, $matches);
            if ($jsonMatch) {
                $json = json_decode($matches[0], true);
                if ($json) {
                    $steps = [];

                    // Analyze what's being extracted
                    if (isset($json['intent'])) {
                        $steps[] = "Analyzing user intent: {$json['intent']}";
                    }

                    if (isset($json['entities']) && ! empty($json['entities'])) {
                        $entityCount = count($json['entities']);
                        $entityTypes = implode(', ', array_keys($json['entities']));
                        $steps[] = "Extracted {$entityCount} entities: {$entityTypes}";
                    }

                    if (isset($json['changes_requested']) && ! empty($json['changes_requested'])) {
                        $changes = implode(', ', $json['changes_requested']);
                        $steps[] = "Detected changes to: {$changes}";
                    }

                    if (isset($json['is_emergency']) && $json['is_emergency']) {
                        $steps[] = '⚠️ Emergency situation detected';
                    }

                    if (! empty($steps)) {
                        array_unshift($steps, 'Processing your request...');
                        $thinkingSteps = $steps;
                    }
                }
            }
        }

        return [
            'thinking' => $thinkingSteps,
            'response' => $finalResponse,
        ];
    }
}
