#!/bin/bash

# Debug AI Processing for Symptom Detection

echo "🔍 AI Symptom Detection Debug"
echo "=============================="
echo ""

PHP_CMD="/opt/homebrew/bin/php"

echo "1. Testing Ollama availability..."
curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama is running" || echo "❌ Ollama is NOT running"
echo ""

echo "2. Testing AI provider config..."
$PHP_CMD artisan tinker --execute="
\$ai = app(App\Services\AI\OllamaProvider::class);
echo 'AI Provider: ' . \$ai->getName() . PHP_EOL;
echo 'AI Available: ' . (\$ai->isAvailable() ? 'YES' : 'NO') . PHP_EOL;
"
echo ""

echo "3. Testing intent classification..."
$PHP_CMD artisan tinker --execute="
\$enhancer = app(App\Services\Booking\AIConversationEnhancer::class);
echo 'AI Enhancer Enabled: ' . (\$enhancer->isEnabled() ? 'YES' : 'NO') . PHP_EOL;
"
echo ""

echo "4. Testing symptom message classification..."
$PHP_CMD artisan tinker --execute="
try {
    \$ai = app(App\Services\AI\OllamaProvider::class);
    \$prompt = config('ai.intent_classifier');
    \$message = 'My daughter has had a headache for 2 days and some dizziness';

    echo 'Testing message: ' . \$message . PHP_EOL;
    echo 'Calling AI...' . PHP_EOL;

    \$response = \$ai->completeJson(\$prompt . PHP_EOL . PHP_EOL . 'User message: ' . \$message);

    echo 'AI Response:' . PHP_EOL;
    print_r(\$response);
} catch (Exception \$e) {
    echo '❌ Error: ' . \$e->getMessage() . PHP_EOL;
}
"
echo ""

echo "=============================="
echo "Debug complete!"
