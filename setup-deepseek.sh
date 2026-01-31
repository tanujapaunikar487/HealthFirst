#!/bin/bash

echo "=========================================="
echo "DeepSeek Open Source Setup Script"
echo "=========================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed"
    echo ""
    echo "Please install Ollama first:"
    echo "  macOS/Linux: curl https://ollama.ai/install.sh | sh"
    echo "  Windows: Download from https://ollama.ai/download/windows"
    echo ""
    exit 1
fi

echo "✅ Ollama is installed"
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running"
    echo "Starting Ollama in background..."
    echo ""

    # Start Ollama in background
    nohup ollama serve > /dev/null 2>&1 &
    sleep 3

    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama started successfully"
    else
        echo "❌ Failed to start Ollama"
        echo "Please start it manually: ollama serve"
        exit 1
    fi
else
    echo "✅ Ollama is already running"
fi

echo ""

# Check if deepseek model is available
MODEL="deepseek-r1:7b"
if ollama list | grep -q "deepseek-r1"; then
    echo "✅ DeepSeek model is already downloaded"
else
    echo "📥 Downloading DeepSeek model (this may take 5-10 minutes)..."
    echo "Model: $MODEL (4GB)"
    echo ""
    ollama pull $MODEL

    if [ $? -eq 0 ]; then
        echo "✅ Model downloaded successfully"
    else
        echo "❌ Failed to download model"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "Running Laravel Setup"
echo "=========================================="
echo ""

# Clear Laravel cache
echo "Clearing Laravel cache..."
php artisan config:clear
php artisan cache:clear

echo ""

# Run migrations
echo "Running migrations..."
php artisan migrate --force

echo ""

# Seed knowledge base
echo "Seeding knowledge base..."
php artisan db:seed --class=KnowledgeBaseSeeder --force

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Your AI-powered booking chat is ready!"
echo ""
echo "Next steps:"
echo "1. Start your Laravel server: php artisan serve"
echo "2. Open the booking chat in your browser"
echo "3. Try natural prompts like:"
echo "   - 'I want to book a doctor appointment tomorrow'"
echo "   - 'Book a followup for myself with Dr. Smith'"
echo "   - 'What tests are included in a CBC?'"
echo ""
echo "The AI will understand and respond naturally!"
echo ""
