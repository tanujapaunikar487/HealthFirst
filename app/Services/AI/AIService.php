<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Log;

class AIService
{
    public function __construct(
        private AIProviderInterface $provider
    ) {}

    /**
     * Check if AI is enabled and available.
     */
    public function isEnabled(): bool
    {
        return $this->provider->isAvailable();
    }

    /**
     * Classify user intent from a message.
     *
     * Returns intent classification with confidence score and extracted entities.
     *
     * @param  string  $message  The user's message
     * @param  array  $conversationHistory  Previous messages for context
     * @return array Intent classification result
     */
    public function classifyIntent(string $message, array $conversationHistory = [], ?string $systemPrompt = null): array
    {
        if (!config('ai.features.intent_classification')) {
            throw new \Exception('Intent classification feature is disabled.');
        }

        $systemPrompt = $systemPrompt ?? config('ai.prompts.intent_classifier');

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Add conversation history for context (last 3 messages)
        $recentHistory = array_slice($conversationHistory, -3);
        foreach ($recentHistory as $historyMessage) {
            $messages[] = [
                'role' => $historyMessage['role'] ?? 'user',
                'content' => $historyMessage['content'] ?? '',
            ];
        }

        // Add current message
        $messages[] = [
            'role' => 'user',
            'content' => $message,
        ];

        try {
            $response = $this->provider->chat($messages, [
                'temperature' => 0.3, // Lower temperature for more consistent classification
                'max_tokens' => 2000, // Increased for reasoning tokens
                'extract_thinking' => true, // Enable thinking extraction
                'json_mode' => true, // Enforce JSON output (used by Ollama's constrained decoding)
            ]);

            // Handle thinking extraction response
            $thinkingSteps = [];
            $actualResponse = $response;

            if (is_array($response) && isset($response['thinking'])) {
                $thinkingSteps = $response['thinking'];
                $actualResponse = $response['response'];
            }

            Log::info('Intent classification raw response', [
                'message' => $message,
                'response' => $actualResponse,
                'response_length' => strlen($actualResponse),
                'thinking_steps' => count($thinkingSteps),
            ]);

            // Clean response: Extract JSON from markdown code blocks or text
            // Try to extract JSON from ```json ... ``` blocks first (handle nested braces)
            if (preg_match('/```json\s*([\s\S]*?)\s*```/', $actualResponse, $matches)) {
                $cleanedResponse = trim($matches[1]);
            }
            // Otherwise try to find any JSON object in the response
            elseif (preg_match('/\{[\s\S]*\}/', $actualResponse, $matches)) {
                $cleanedResponse = trim($matches[0]);
            }
            // If no JSON found, use the whole response
            else {
                $cleanedResponse = trim($actualResponse);
            }

            // Handle multi-line JSON responses from models that split objects across lines
            // Example: {"intent": "booking_doctor"}\n{"entities": {...}}
            // Merge into single JSON object
            $lines = preg_split('/\r\n|\r|\n/', $cleanedResponse);
            if (count($lines) > 1) {
                $merged = [];
                $foundMultipleObjects = false;

                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line)) continue;

                    // Try to decode each line as JSON
                    $parsed = json_decode($line, true);
                    if ($parsed && is_array($parsed)) {
                        $merged = array_merge($merged, $parsed);
                        $foundMultipleObjects = true;
                    }
                }

                // If we successfully merged multiple objects, use the merged version
                if ($foundMultipleObjects && !empty($merged)) {
                    $cleanedResponse = json_encode($merged);
                }
            }

            // Parse JSON response
            $result = json_decode($cleanedResponse, true);

            if (!$result || !isset($result['intent'])) {
                Log::error('Intent JSON parse failed', [
                    'original_response' => $actualResponse,
                    'cleaned_response' => $cleanedResponse,
                    'json_error' => json_last_error_msg(),
                ]);
                throw new \Exception('Invalid intent classification response');
            }

            Log::info('Intent successfully parsed', [
                'intent' => $result['intent'],
                'confidence' => $result['confidence'] ?? 0,
                'thinking_steps' => count($thinkingSteps),
            ]);

            return [
                'intent' => $result['intent'] ?? 'unclear',
                'confidence' => $result['confidence'] ?? 0.0,
                'entities' => $result['entities'] ?? [],
                'changes_requested' => $result['changes_requested'] ?? null,
                'is_emergency' => $result['is_emergency'] ?? false,
                'emergency_indicators' => $result['emergency_indicators'] ?? null,
                'is_skip' => $result['is_skip'] ?? false,
                'is_confirmation' => $result['is_confirmation'] ?? false,
                'requires_clarification' => $result['requires_clarification'] ?? false,
                'clarification_needed' => $result['clarification_needed'] ?? null,
                'thinking' => $thinkingSteps,
                'raw_response' => $actualResponse,
            ];
        } catch (\Exception $e) {
            Log::error('Intent classification failed', [
                'message' => $message,
                'error' => $e->getMessage(),
            ]);

            // Return fallback result
            return [
                'intent' => 'unclear',
                'confidence' => 0.0,
                'entities' => [],
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generate a conversational response based on context and knowledge base.
     *
     * @param  string  $message  The user's message
     * @param  array  $context  Context including conversation history, collected data, etc.
     * @param  array  $knowledgeBase  Relevant knowledge base articles/resources
     * @return string The AI-generated response
     */
    public function generateResponse(string $message, array $context = [], array $knowledgeBase = []): string
    {
        if (!config('ai.features.booking_conversation')) {
            throw new \Exception('Booking conversation feature is disabled.');
        }

        $systemPrompt = config('ai.prompts.booking_assistant');

        // Build context string
        $contextString = $this->buildContextString($context, $knowledgeBase);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Add context as system message if available
        if (!empty($contextString)) {
            $messages[] = [
                'role' => 'system',
                'content' => "CONTEXT:\n" . $contextString,
            ];
        }

        // Add conversation history
        if (isset($context['conversation_history'])) {
            foreach ($context['conversation_history'] as $historyMessage) {
                $messages[] = [
                    'role' => $historyMessage['role'] ?? 'user',
                    'content' => $historyMessage['content'] ?? '',
                ];
            }
        }

        // Add current message
        $messages[] = [
            'role' => 'user',
            'content' => $message,
        ];

        try {
            return $this->provider->chat($messages, [
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ]);
        } catch (\Exception $e) {
            Log::error('Response generation failed', [
                'message' => $message,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to generate AI response.');
        }
    }

    /**
     * Determine if the AI should initiate a booking flow.
     *
     * @param  array  $intentClassification  Result from classifyIntent()
     * @param  array  $context  Conversation context
     * @return array Decision with flow_type and confidence
     */
    public function shouldInitiateBookingFlow(array $intentClassification, array $context = []): array
    {
        $intent = $intentClassification['intent'] ?? 'unclear';
        $confidence = $intentClassification['confidence'] ?? 0.0;
        $entities = $intentClassification['entities'] ?? [];

        $threshold = config('ai.booking.auto_initiate_threshold', 0.8);
        $requireConfirmation = config('ai.booking.require_confirmation', false);

        // Determine flow type based on intent
        $flowType = null;
        if (in_array($intent, ['booking_doctor'])) {
            $flowType = 'doctor';
        } elseif (in_array($intent, ['booking_lab'])) {
            $flowType = 'lab_test';
        }

        // Check if we have enough confidence and information
        $shouldInitiate = false;
        $reason = null;

        if ($flowType && $confidence >= $threshold) {
            // High confidence - can initiate
            $shouldInitiate = true;
            $reason = 'high_confidence';
        } elseif ($flowType && $confidence >= 0.6) {
            // Medium confidence - suggest if we have some entities
            if (count($entities) >= 2) {
                $shouldInitiate = true;
                $reason = 'medium_confidence_with_entities';
            }
        }

        // Check conversation length - suggest booking if user has been chatting a while
        $turnCount = $context['turn_count'] ?? 0;
        $maxTurns = config('ai.booking.max_turns_before_suggest', 5);
        if ($turnCount >= $maxTurns && $flowType) {
            $shouldInitiate = true;
            $reason = 'conversation_length';
        }

        return [
            'should_initiate' => $shouldInitiate && !$requireConfirmation,
            'should_suggest' => $shouldInitiate && $requireConfirmation,
            'flow_type' => $flowType,
            'confidence' => $confidence,
            'reason' => $reason,
            'extracted_entities' => $entities,
        ];
    }

    /**
     * Extract relevant search keywords from a user query for knowledge base lookup.
     *
     * @param  string  $query  The user's query
     * @return array Array of search keywords
     */
    public function extractSearchKeywords(string $query): array
    {
        if (!config('ai.features.resource_learning')) {
            // Fallback to simple extraction
            return $this->simpleKeywordExtraction($query);
        }

        $systemPrompt = config('ai.prompts.resource_query');

        try {
            $response = $this->provider->complete($query, [
                'system' => $systemPrompt,
                'temperature' => 0.3,
                'max_tokens' => 100,
            ]);

            // Parse comma-separated keywords
            $keywords = array_map('trim', explode(',', $response));
            return array_filter($keywords);
        } catch (\Exception $e) {
            Log::warning('Keyword extraction failed, using fallback', [
                'query' => $query,
                'error' => $e->getMessage(),
            ]);
            return $this->simpleKeywordExtraction($query);
        }
    }

    /**
     * Simple keyword extraction fallback (no AI).
     */
    private function simpleKeywordExtraction(string $query): array
    {
        // Remove common words
        $stopWords = ['the', 'a', 'an', 'is', 'are', 'what', 'when', 'where', 'how', 'can', 'do', 'does'];

        $words = str_word_count(strtolower($query), 1);
        $keywords = array_diff($words, $stopWords);

        return array_slice(array_values($keywords), 0, 5);
    }

    /**
     * Build context string from context array and knowledge base.
     */
    private function buildContextString(array $context, array $knowledgeBase): string
    {
        $parts = [];

        // Add collected booking data
        if (isset($context['collected_data']) && !empty($context['collected_data'])) {
            $parts[] = "BOOKING INFORMATION:";
            foreach ($context['collected_data'] as $key => $value) {
                if (!empty($value) && !is_array($value)) {
                    $parts[] = "- " . ucwords(str_replace('_', ' ', $key)) . ": " . $value;
                }
            }
        }

        // Add current step
        if (isset($context['current_step'])) {
            $parts[] = "\nCURRENT STEP: " . $context['current_step'];
        }

        // Add knowledge base information
        if (!empty($knowledgeBase)) {
            $parts[] = "\nKNOWLEDGE BASE:";
            foreach ($knowledgeBase as $resource) {
                if (isset($resource['title']) && isset($resource['content'])) {
                    $parts[] = "- {$resource['title']}: {$resource['content']}";
                }
            }
        }

        return implode("\n", $parts);
    }

    /**
     * Generate a plain-language AI summary for a health record.
     *
     * @param  string  $category  The record category (e.g., 'lab_report', 'prescription')
     * @param  string  $title  The record title
     * @param  array|null  $metadata  Category-specific metadata
     * @param  array|null  $status  Computed status (label, variant)
     * @return string The AI-generated summary
     */
    public function generateHealthRecordSummary(
        string $category,
        string $title,
        ?array $metadata = null,
        ?array $status = null
    ): string {
        if (!config('ai.features.summarize_medical_history')) {
            throw new \Exception('Medical history summarization feature is disabled.');
        }

        $systemPrompt = <<<PROMPT
You are a helpful health assistant that explains medical reports in plain, easy-to-understand language.

GUIDELINES:
1. Be informational and supportive - help users understand what their results mean
2. NEVER make definitive diagnoses or alarming statements like "you have a disease"
3. Explain values that are in or out of range in simple terms
4. Mention possible common, non-alarming reasons for any abnormal values
5. Always recommend discussing results with a healthcare provider for proper interpretation
6. Keep the summary concise (2-4 sentences for simple reports, up to 6 sentences for complex ones)
7. Use everyday language, avoid medical jargon when possible
8. Be reassuring without dismissing concerns
9. Focus on what the user can understand and actionable next steps

EXAMPLE GOOD RESPONSES:
- "Your cholesterol levels are slightly elevated. This is common and can often be managed with dietary changes and exercise. Consider discussing lifestyle modifications with your doctor at your next visit."
- "All your blood test values are within normal ranges, which is a positive sign. Continue maintaining your current healthy habits."
- "Your hemoglobin is a bit lower than the typical range. This can happen for various reasons including diet or hydration. Your doctor can help determine if any follow-up is needed."

AVOID RESPONSES LIKE:
- "You have high cholesterol which indicates heart disease risk" (too alarming)
- "Your low hemoglobin means you are anemic" (definitive diagnosis)
- "This is a serious condition" (alarming language)
PROMPT;

        // Build the record context for the AI
        $recordContext = "HEALTH RECORD TO SUMMARIZE:\n";
        $recordContext .= "Category: {$category}\n";
        $recordContext .= "Title: {$title}\n";

        if ($status) {
            $recordContext .= "Status: {$status['label']}\n";
        }

        if ($metadata) {
            $recordContext .= "\nDetails:\n";
            $recordContext .= $this->formatMetadataForSummary($category, $metadata);
        }

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $recordContext . "\n\nPlease provide a brief, easy-to-understand summary of this health record."],
        ];

        try {
            $response = $this->provider->chat($messages, [
                'temperature' => 0.5,
                'max_tokens' => 500,
            ]);

            Log::info('Health record summary generated', [
                'category' => $category,
                'title' => $title,
            ]);

            return trim($response);
        } catch (\Exception $e) {
            Log::error('Health record summary generation failed', [
                'category' => $category,
                'title' => $title,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to generate health record summary.');
        }
    }

    /**
     * Format metadata for AI summary based on category.
     */
    private function formatMetadataForSummary(string $category, array $metadata): string
    {
        $formatted = '';

        switch ($category) {
            case 'lab_report':
                if (isset($metadata['test_name'])) {
                    $formatted .= "Test: {$metadata['test_name']}\n";
                }
                if (isset($metadata['results']) && is_array($metadata['results'])) {
                    $formatted .= "Results:\n";
                    foreach ($metadata['results'] as $result) {
                        $param = $result['parameter'] ?? 'Unknown';
                        $value = $result['value'] ?? '';
                        $unit = $result['unit'] ?? '';
                        $range = $result['reference_range'] ?? '';
                        $status = $result['status'] ?? 'normal';
                        $formatted .= "- {$param}: {$value} {$unit} (Reference: {$range}) - Status: {$status}\n";
                    }
                }
                break;

            case 'prescription':
                if (isset($metadata['drugs']) && is_array($metadata['drugs'])) {
                    $formatted .= "Medications prescribed:\n";
                    foreach ($metadata['drugs'] as $drug) {
                        $name = $drug['name'] ?? 'Unknown';
                        $dosage = $drug['dosage'] ?? '';
                        $frequency = $drug['frequency'] ?? '';
                        $duration = $drug['duration'] ?? '';
                        $formatted .= "- {$name}: {$dosage}, {$frequency}, for {$duration}\n";
                    }
                }
                if (isset($metadata['valid_until'])) {
                    $formatted .= "Valid until: {$metadata['valid_until']}\n";
                }
                break;

            case 'consultation_notes':
                if (isset($metadata['diagnosis'])) {
                    $formatted .= "Diagnosis: {$metadata['diagnosis']}\n";
                }
                if (isset($metadata['symptoms']) && is_array($metadata['symptoms'])) {
                    $formatted .= "Symptoms: " . implode(', ', $metadata['symptoms']) . "\n";
                }
                if (isset($metadata['treatment_plan'])) {
                    $formatted .= "Treatment plan: {$metadata['treatment_plan']}\n";
                }
                if (isset($metadata['follow_up_recommendation'])) {
                    $formatted .= "Follow-up: {$metadata['follow_up_recommendation']}\n";
                }
                break;

            case 'discharge_summary':
                if (isset($metadata['primary_diagnosis']) || isset($metadata['diagnosis'])) {
                    $formatted .= "Primary diagnosis: " . ($metadata['primary_diagnosis'] ?? $metadata['diagnosis']) . "\n";
                }
                if (isset($metadata['length_of_stay'])) {
                    $formatted .= "Hospital stay: {$metadata['length_of_stay']}\n";
                }
                if (isset($metadata['discharge_instructions'])) {
                    $formatted .= "Instructions: {$metadata['discharge_instructions']}\n";
                }
                break;

            case 'xray_report':
            case 'mri_report':
            case 'ultrasound_report':
            case 'ecg_report':
            case 'pathology_report':
            case 'pft_report':
                if (isset($metadata['body_part'])) {
                    $formatted .= "Body part: {$metadata['body_part']}\n";
                }
                if (isset($metadata['indication'])) {
                    $formatted .= "Indication: {$metadata['indication']}\n";
                }
                if (isset($metadata['findings'])) {
                    $formatted .= "Findings: {$metadata['findings']}\n";
                }
                if (isset($metadata['impression'])) {
                    $formatted .= "Impression: {$metadata['impression']}\n";
                }
                if (isset($metadata['interpretation'])) {
                    $formatted .= "Interpretation: {$metadata['interpretation']}\n";
                }
                break;

            case 'vaccination':
                if (isset($metadata['vaccine_name'])) {
                    $formatted .= "Vaccine: {$metadata['vaccine_name']}\n";
                }
                if (isset($metadata['dose_number']) && isset($metadata['total_doses'])) {
                    $formatted .= "Dose: {$metadata['dose_number']} of {$metadata['total_doses']}\n";
                }
                if (isset($metadata['next_due_date'])) {
                    $formatted .= "Next due: {$metadata['next_due_date']}\n";
                }
                break;

            case 'medication_active':
            case 'medication_past':
                if (isset($metadata['drug_name'])) {
                    $formatted .= "Medication: {$metadata['drug_name']}\n";
                }
                if (isset($metadata['condition'])) {
                    $formatted .= "Prescribed for: {$metadata['condition']}\n";
                }
                if (isset($metadata['dosage'])) {
                    $formatted .= "Dosage: {$metadata['dosage']}\n";
                }
                if (isset($metadata['reason_stopped'])) {
                    $formatted .= "Reason stopped: {$metadata['reason_stopped']}\n";
                }
                break;

            default:
                // Generic formatting for other categories
                foreach ($metadata as $key => $value) {
                    if (is_string($value) && !empty($value)) {
                        $formatted .= ucfirst(str_replace('_', ' ', $key)) . ": {$value}\n";
                    }
                }
        }

        return $formatted ?: "No specific details available.\n";
    }

    /**
     * Answer a general medical/booking question (informational only).
     *
     * @param  string  $question  The question to answer
     * @param  array  $knowledgeBase  Relevant resources
     * @return string The AI response
     */
    public function answerGeneralQuestion(string $question, array $knowledgeBase = []): string
    {
        if (!config('ai.features.answer_general_questions')) {
            throw new \Exception('Question answering feature is disabled.');
        }

        $systemPrompt = "You are a helpful assistant for a healthcare booking system. "
            . "Answer questions about booking appointments, lab tests, facility information, "
            . "and general healthcare procedures. "
            . "\nIMPORTANT:\n"
            . "- Provide general educational information only\n"
            . "- Do NOT provide specific medical advice\n"
            . "- Do NOT attempt to diagnose\n"
            . "- Always recommend consulting a healthcare professional for medical concerns\n"
            . "- Use the knowledge base information when available\n";

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Add knowledge base as context
        if (!empty($knowledgeBase)) {
            $kbContent = "AVAILABLE INFORMATION:\n";
            foreach ($knowledgeBase as $resource) {
                if (isset($resource['title']) && isset($resource['content'])) {
                    $kbContent .= "\n{$resource['title']}:\n{$resource['content']}\n";
                }
            }
            $messages[] = ['role' => 'system', 'content' => $kbContent];
        }

        // Add question
        $messages[] = ['role' => 'user', 'content' => $question];

        try {
            return $this->provider->chat($messages, [
                'temperature' => 0.7,
                'max_tokens' => 800,
            ]);
        } catch (\Exception $e) {
            Log::error('Question answering failed', [
                'question' => $question,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to answer question.');
        }
    }
}
