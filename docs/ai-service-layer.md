# AI Service Layer

**Status:** Locked
**Provider:** DeepSeek (default)
**Authority:** This document defines how AI is integrated into the system.

---

## Principles

1. **AI is optional and assistive.** The system must function fully without AI.
2. **AI never controls business logic.** AI provides suggestions, explanations, and summaries only.
3. **AI never writes to the database.** AI is read-only.
4. **AI never bypasses permissions.** Authorization is checked before AI access.
5. **AI is plug-and-play.** Switching providers requires minimal code changes.
6. **AI access goes through a service layer.** Direct API calls are forbidden.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Controller                                                  │
│  - Receives request                                          │
│  - Authorizes user                                           │
│  - Calls AIService                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  AIService (app/Services/AI/AIService.php)                   │
│  - Orchestrates AI requests                                  │
│  - Validates input                                           │
│  - Calls appropriate provider                                │
│  - Returns formatted response                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  AIProviderInterface                                         │
│  - Contract for all AI providers                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  DeepSeekProvider (app/Services/AI/DeepSeekProvider.php)     │
│  - Implements AIProviderInterface                            │
│  - Handles DeepSeek API calls                                │
│  - Returns standardized responses                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Layer Files

### 1. Provider Interface
**File:** `app/Services/AI/Contracts/AIProviderInterface.php`

**Responsibilities:**
- Define contract for all AI providers
- Ensure provider implementations are interchangeable

**Example:**
```php
<?php

namespace App\Services\AI\Contracts;

interface AIProviderInterface
{
    /**
     * Send a prompt to the AI provider and get a response.
     *
     * @param  string  $prompt  The prompt to send
     * @param  array  $context  Additional context (optional)
     * @return string The AI response
     * @throws \Exception If the request fails
     */
    public function complete(string $prompt, array $context = []): string;

    /**
     * Check if the provider is enabled and configured.
     *
     * @return bool
     */
    public function isAvailable(): bool;
}
```

---

### 2. DeepSeek Provider
**File:** `app/Services/AI/DeepSeekProvider.php`

**Responsibilities:**
- Implement AIProviderInterface
- Handle HTTP requests to DeepSeek API
- Return standardized responses

**Example:**
```php
<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeepSeekProvider implements AIProviderInterface
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('ai.providers.deepseek.api_key');
        $this->apiUrl = config('ai.providers.deepseek.api_url');
        $this->model = config('ai.providers.deepseek.model');
    }

    /**
     * Send a prompt to DeepSeek and get a response.
     */
    public function complete(string $prompt, array $context = []): string
    {
        if (!$this->isAvailable()) {
            throw new \Exception('DeepSeek provider is not configured.');
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/chat/completions', [
                'model' => $this->model,
                'messages' => $this->buildMessages($prompt, $context),
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ]);

            if ($response->failed()) {
                Log::error('DeepSeek API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('AI request failed. Please try again.');
            }

            return $response->json('choices.0.message.content');
        } catch (\Exception $e) {
            Log::error('DeepSeek provider error', [
                'message' => $e->getMessage(),
            ]);
            throw new \Exception('AI service is temporarily unavailable.');
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
     * Build messages array for DeepSeek API.
     */
    private function buildMessages(string $prompt, array $context): array
    {
        $messages = [];

        // System message (context)
        if (!empty($context)) {
            $messages[] = [
                'role' => 'system',
                'content' => $this->formatContext($context),
            ];
        }

        // User message (prompt)
        $messages[] = [
            'role' => 'user',
            'content' => $prompt,
        ];

        return $messages;
    }

    /**
     * Format context array into a string.
     */
    private function formatContext(array $context): string
    {
        $formatted = "You are a medical AI assistant. Provide clear, accurate, and helpful information.\n\n";
        $formatted .= "Context:\n";

        foreach ($context as $key => $value) {
            $formatted .= "- {$key}: {$value}\n";
        }

        return $formatted;
    }
}
```

---

### 3. AI Service
**File:** `app/Services/AI/AIService.php`

**Responsibilities:**
- Orchestrate AI requests
- Validate input and permissions
- Call the configured provider
- Return formatted responses
- **Ensure AI never writes to the database**

**Example:**
```php
<?php

namespace App\Services\AI;

use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Services\AI\Contracts\AIProviderInterface;

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
     * Explain a prescription to a patient in plain language.
     *
     * @param  Prescription  $prescription  The prescription to explain
     * @return string The AI explanation
     */
    public function explainPrescription(Prescription $prescription): string
    {
        // Feature flag check
        if (!config('ai.features.explain_prescriptions')) {
            throw new \Exception('This AI feature is disabled.');
        }

        // Build prompt
        $prompt = "Explain this prescription to a patient in simple, clear language:\n\n";
        $prompt .= "Medication: {$prescription->medication_name}\n";
        $prompt .= "Dosage: {$prescription->dosage}\n";
        $prompt .= "Frequency: {$prescription->frequency}\n";
        $prompt .= "Duration: {$prescription->duration}\n";

        if ($prescription->instructions) {
            $prompt .= "Instructions: {$prescription->instructions}\n";
        }

        $prompt .= "\nProvide:\n";
        $prompt .= "1. What this medication does\n";
        $prompt .= "2. How to take it\n";
        $prompt .= "3. Important things to know\n";
        $prompt .= "4. When to contact a doctor\n";

        // Call provider
        return $this->provider->complete($prompt, [
            'task' => 'explain prescription',
            'audience' => 'patient',
        ]);
    }

    /**
     * Summarize a patient's medical history.
     *
     * @param  int  $patientId  The patient ID
     * @return string The AI summary
     */
    public function summarizeMedicalHistory(int $patientId): string
    {
        // Feature flag check
        if (!config('ai.features.summarize_medical_history')) {
            throw new \Exception('This AI feature is disabled.');
        }

        // Fetch medical records (read-only)
        $records = MedicalRecord::where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        if ($records->isEmpty()) {
            return 'No medical history available.';
        }

        // Build prompt
        $prompt = "Summarize this patient's medical history in a clear, chronological format:\n\n";

        foreach ($records as $record) {
            $prompt .= "Date: {$record->created_at->format('Y-m-d')}\n";
            $prompt .= "Diagnosis: {$record->diagnosis}\n";
            $prompt .= "Treatment: {$record->treatment}\n";
            $prompt .= "Notes: {$record->notes}\n\n";
        }

        $prompt .= "Provide:\n";
        $prompt .= "1. Chronological summary of key events\n";
        $prompt .= "2. Recurring conditions or patterns\n";
        $prompt .= "3. Current active conditions\n";

        // Call provider
        return $this->provider->complete($prompt, [
            'task' => 'summarize medical history',
            'patient_id' => $patientId,
        ]);
    }

    /**
     * Answer a general medical question (informational only).
     *
     * IMPORTANT: This is for general information only.
     * AI never provides diagnoses or medical advice.
     *
     * @param  string  $question  The question to answer
     * @return string The AI response
     */
    public function answerGeneralQuestion(string $question): string
    {
        // Sanitize input
        $question = strip_tags($question);

        // Build prompt with strict constraints
        $prompt = "Answer this general medical question in simple language.\n\n";
        $prompt .= "Question: {$question}\n\n";
        $prompt .= "IMPORTANT:\n";
        $prompt .= "- Provide general educational information only\n";
        $prompt .= "- Do NOT provide specific medical advice\n";
        $prompt .= "- Do NOT attempt to diagnose\n";
        $prompt .= "- Always recommend consulting a healthcare professional\n";

        // Call provider
        return $this->provider->complete($prompt, [
            'task' => 'answer general question',
            'mode' => 'informational only',
        ]);
    }
}
```

---

### 4. Service Provider Registration
**File:** `app/Providers/AppServiceProvider.php`

**Register AI provider:**
```php
<?php

namespace App\Providers;

use App\Services\AI\AIService;
use App\Services\AI\Contracts\AIProviderInterface;
use App\Services\AI\DeepSeekProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind AI provider based on configuration
        $this->app->singleton(AIProviderInterface::class, function ($app) {
            $provider = config('ai.default');

            return match ($provider) {
                'deepseek' => new DeepSeekProvider(),
                default => throw new \Exception("Unsupported AI provider: {$provider}"),
            };
        });

        // Bind AI service
        $this->app->singleton(AIService::class, function ($app) {
            return new AIService($app->make(AIProviderInterface::class));
        });
    }
}
```

---

## Controller Integration

### Example: Prescription Explanation
**File:** `app/Http/Controllers/PrescriptionController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Services\AI\AIService;
use Inertia\Inertia;
use Inertia\Response;

class PrescriptionController extends Controller
{
    public function __construct(
        private AIService $aiService
    ) {}

    /**
     * Show prescription with AI explanation.
     */
    public function show(Prescription $prescription): Response
    {
        // Authorization
        $this->authorize('view', $prescription);

        // Load relationships
        $prescription->load(['patient', 'doctor']);

        // Get AI explanation (if enabled)
        $aiExplanation = null;
        if ($this->aiService->isEnabled()) {
            try {
                $aiExplanation = $this->aiService->explainPrescription($prescription);
            } catch (\Exception $e) {
                // AI failure is not critical - log and continue
                \Log::warning('AI explanation failed', [
                    'prescription_id' => $prescription->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return Inertia::render('Prescriptions/Show', [
            'prescription' => $prescription,
            'aiExplanation' => $aiExplanation,
            'aiEnabled' => $this->aiService->isEnabled(),
        ]);
    }
}
```

---

## Frontend Integration

### Example: Prescription Page with AI Explanation
**File:** `resources/js/Pages/Prescriptions/Show.tsx`

```tsx
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

interface Prescription {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Props {
  prescription: Prescription;
  aiExplanation: string | null;
  aiEnabled: boolean;
}

export default function Show({ prescription, aiExplanation, aiEnabled }: Props) {
  return (
    <>
      <Head title="Prescription Details" />

      <div className="p-6 space-y-6">
        <h1 className="text-4xl font-bold">Prescription Details</h1>

        <Card>
          <CardHeader>
            <CardTitle>{prescription.medication_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Dosage</p>
                <p className="text-base font-medium">{prescription.dosage}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="text-base font-medium">{prescription.frequency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-base font-medium">{prescription.duration}</p>
              </div>
            </div>

            {prescription.instructions && (
              <div>
                <p className="text-sm text-muted-foreground">Instructions</p>
                <p className="text-base">{prescription.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Explanation (if available) */}
        {aiEnabled && aiExplanation && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plain Language Explanation</CardTitle>
                <Badge variant="info">AI-Assisted</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {aiExplanation}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Disabled Notice */}
        {!aiEnabled && (
          <Alert>
            <AlertTitle>AI Features Disabled</AlertTitle>
            <AlertDescription>
              AI-powered explanations are currently unavailable.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}
```

---

## AI Safety Rules

### ✅ AI CAN:
- Explain existing prescriptions in plain language
- Summarize existing medical records
- Answer general medical questions (informational only)
- Provide educational content
- Assist with understanding medical terminology

### ❌ AI CANNOT:
- Write to the database
- Create prescriptions
- Modify medical records
- Make diagnoses
- Provide specific medical advice
- Bypass authorization checks
- Access data the user doesn't have permission to view
- Be a dependency for core functionality

---

## AI Feature Flags

All AI features are controlled via `config/ai.php`:

```php
'features' => [
    'explain_prescriptions' => env('AI_FEATURE_EXPLAIN_PRESCRIPTIONS', true),
    'summarize_medical_history' => env('AI_FEATURE_SUMMARIZE_HISTORY', true),
    'answer_general_questions' => env('AI_FEATURE_ANSWER_QUESTIONS', true),
],
```

**To disable all AI:**
```env
AI_PROVIDER=none
```

**To disable specific features:**
```env
AI_FEATURE_EXPLAIN_PRESCRIPTIONS=false
AI_FEATURE_SUMMARIZE_HISTORY=false
```

---

## Testing AI Integration

### Unit Test Example
**File:** `tests/Unit/Services/AIServiceTest.php`

```php
<?php

namespace Tests\Unit\Services;

use App\Models\Prescription;
use App\Services\AI\AIService;
use App\Services\AI\Contracts\AIProviderInterface;
use Tests\TestCase;

class AIServiceTest extends TestCase
{
    public function test_explain_prescription_returns_explanation()
    {
        // Mock provider
        $provider = $this->createMock(AIProviderInterface::class);
        $provider->method('isAvailable')->willReturn(true);
        $provider->method('complete')->willReturn('This medication helps with...');

        // Create service with mocked provider
        $service = new AIService($provider);

        // Create prescription
        $prescription = Prescription::factory()->make([
            'medication_name' => 'Test Medication',
            'dosage' => '100mg',
            'frequency' => 'Twice daily',
            'duration' => '7 days',
        ]);

        // Get explanation
        $explanation = $service->explainPrescription($prescription);

        // Assert
        $this->assertStringContainsString('medication', $explanation);
    }

    public function test_ai_service_handles_disabled_provider()
    {
        // Mock disabled provider
        $provider = $this->createMock(AIProviderInterface::class);
        $provider->method('isAvailable')->willReturn(false);

        // Create service
        $service = new AIService($provider);

        // Assert AI is disabled
        $this->assertFalse($service->isEnabled());
    }
}
```

---

## Adding a New AI Provider

To add a new provider (e.g., OpenAI):

1. **Create provider class:**
   ```
   app/Services/AI/OpenAIProvider.php
   ```

2. **Implement interface:**
   ```php
   class OpenAIProvider implements AIProviderInterface
   {
       public function complete(string $prompt, array $context = []): string { ... }
       public function isAvailable(): bool { ... }
   }
   ```

3. **Register in service provider:**
   ```php
   return match ($provider) {
       'deepseek' => new DeepSeekProvider(),
       'openai' => new OpenAIProvider(),
       default => throw new \Exception("Unsupported AI provider"),
   };
   ```

4. **Add configuration:**
   ```php
   'providers' => [
       'openai' => [
           'api_key' => env('OPENAI_API_KEY'),
           'model' => env('OPENAI_MODEL', 'gpt-4'),
       ],
   ],
   ```

---

## Summary

**AI service layer is locked.**
**AI is optional, assistive, and read-only.**
**AI never writes to the database.**
**AI never bypasses permissions.**
**AI is provider-agnostic through interface.**
**AI failure does not break core functionality.**
**All AI features are controlled via feature flags.**
