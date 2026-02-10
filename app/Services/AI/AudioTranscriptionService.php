<?php

namespace App\Services\AI;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Audio Transcription Service
 *
 * Transcribes audio files using Groq's Whisper API
 */
class AudioTranscriptionService
{
    private string $apiKey;

    private string $apiUrl;

    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key', '');
        $this->apiUrl = config('services.groq.whisper_url', 'https://api.groq.com/openai/v1/audio/transcriptions');
        $this->model = config('services.groq.whisper_model', 'whisper-large-v3');
    }

    /**
     * Transcribe an audio file to text
     *
     * @param  UploadedFile|string  $audio  Audio file or path
     * @param  string  $language  Optional language code (e.g., 'en', 'hi')
     * @return array Transcription result with text and metadata
     */
    public function transcribe($audio, string $language = 'en'): array
    {
        if (! $this->isAvailable()) {
            throw new \Exception('Audio transcription is not configured. Please set GROQ_API_KEY in .env');
        }

        try {
            // Prepare the audio file
            if ($audio instanceof UploadedFile) {
                $filePath = $audio->getRealPath();
                $fileName = $audio->getClientOriginalName();
            } else {
                $filePath = $audio;
                $fileName = basename($audio);
            }

            Log::info('Audio transcription request', [
                'file' => $fileName,
                'language' => $language,
                'model' => $this->model,
            ]);

            // Make API request
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$this->apiKey,
            ])
                ->timeout(30)
                ->attach('file', file_get_contents($filePath), $fileName)
                ->post($this->apiUrl, [
                    'model' => $this->model,
                    'language' => $language,
                    'response_format' => 'verbose_json', // Get detailed response
                ]);

            if ($response->failed()) {
                Log::error('Audio transcription failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('Audio transcription failed: '.$response->body());
            }

            $result = $response->json();

            Log::info('Audio transcription successful', [
                'text_length' => strlen($result['text'] ?? ''),
                'duration' => $result['duration'] ?? null,
                'language' => $result['language'] ?? null,
            ]);

            return [
                'text' => $result['text'] ?? '',
                'language' => $result['language'] ?? $language,
                'duration' => $result['duration'] ?? null,
                'segments' => $result['segments'] ?? [],
            ];
        } catch (\Exception $e) {
            Log::error('Audio transcription error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \Exception('Failed to transcribe audio: '.$e->getMessage());
        }
    }

    /**
     * Check if transcription service is available
     */
    public function isAvailable(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Get supported audio formats
     */
    public function getSupportedFormats(): array
    {
        return ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];
    }

    /**
     * Validate audio file
     */
    public function validateAudioFile(UploadedFile $file): bool
    {
        // Check file size (max 25MB for Whisper API)
        if ($file->getSize() > 25 * 1024 * 1024) {
            throw new \Exception('Audio file is too large. Maximum size is 25MB.');
        }

        // Check format
        $extension = strtolower($file->getClientOriginalExtension());
        if (! in_array($extension, $this->getSupportedFormats())) {
            throw new \Exception('Unsupported audio format. Supported formats: '.implode(', ', $this->getSupportedFormats()));
        }

        return true;
    }
}
