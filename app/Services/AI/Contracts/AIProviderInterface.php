<?php

namespace App\Services\AI\Contracts;

interface AIProviderInterface
{
    /**
     * Send a prompt to the AI provider and get a response.
     *
     * @param  string  $prompt  The prompt to send
     * @param  array  $options  Additional options (temperature, max_tokens, etc.)
     * @return string The AI response
     *
     * @throws \Exception If the request fails
     */
    public function complete(string $prompt, array $options = []): string;

    /**
     * Send a structured chat conversation to the AI provider.
     *
     * @param  array  $messages  Array of messages with role and content
     * @param  array  $options  Additional options (can include 'extract_thinking' => true)
     * @return string|array The AI response (string) or array with ['thinking' => [...], 'response' => '...'] if extract_thinking is enabled
     *
     * @throws \Exception If the request fails
     */
    public function chat(array $messages, array $options = []): string|array;

    /**
     * Get a JSON-structured response from the AI provider.
     *
     * @param  string  $prompt  The prompt to send
     * @param  array  $options  Additional options
     * @return array Parsed JSON response
     *
     * @throws \Exception If the request fails or JSON is invalid
     */
    public function completeJson(string $prompt, array $options = []): array;

    /**
     * Check if the provider is enabled and configured.
     */
    public function isAvailable(): bool;

    /**
     * Get the provider name.
     */
    public function getName(): string;
}
