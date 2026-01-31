#!/bin/bash

echo "=========================================="
echo "🚀 Starting Development Environment"
echo "=========================================="
echo ""

cd "/Users/tanujapaunikar/Desktop/Health Care"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "=========================================="
    echo "🛑 Shutting down services..."
    echo "=========================================="

    # Kill Ollama if we started it
    if [ ! -z "$OLLAMA_PID" ]; then
        echo "Stopping Ollama (PID: $OLLAMA_PID)..."
        kill $OLLAMA_PID 2>/dev/null
    fi

    # Kill Laravel server if running
    if [ ! -z "$LARAVEL_PID" ]; then
        echo "Stopping Laravel server (PID: $LARAVEL_PID)..."
        kill $LARAVEL_PID 2>/dev/null
    fi

    # Kill Vite if running
    if [ ! -z "$VITE_PID" ]; then
        echo "Stopping Vite (PID: $VITE_PID)..."
        kill $VITE_PID 2>/dev/null
    fi

    echo "✅ All services stopped"
    exit 0
}

# Trap CTRL+C and other termination signals
trap cleanup SIGINT SIGTERM EXIT

# Check if Ollama is installed
OLLAMA_CMD=""
if command -v ollama &> /dev/null; then
    OLLAMA_CMD="ollama"
elif [ -f /opt/homebrew/bin/ollama ]; then
    OLLAMA_CMD="/opt/homebrew/bin/ollama"
elif [ -f /usr/local/bin/ollama ]; then
    OLLAMA_CMD="/usr/local/bin/ollama"
else
    echo "❌ Ollama is not installed!"
    echo ""
    echo "Install it with:"
    echo "  /opt/homebrew/bin/brew install ollama"
    echo "  OR download from: https://ollama.ai/download/mac"
    echo ""
    exit 1
fi

echo "✅ Ollama is installed"
echo ""

# Check if Ollama is already running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
    OLLAMA_ALREADY_RUNNING=true
else
    echo "🔄 Starting Ollama..."
    $OLLAMA_CMD serve > /tmp/ollama-dev.log 2>&1 &
    OLLAMA_PID=$!
    OLLAMA_ALREADY_RUNNING=false

    # Wait for Ollama to start
    echo "⏳ Waiting for Ollama to be ready..."
    for i in {1..10}; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo "✅ Ollama started successfully (PID: $OLLAMA_PID)"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""

    # Check if it started
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "❌ Failed to start Ollama. Check logs:"
        echo "  tail -f /tmp/ollama-dev.log"
        exit 1
    fi
fi

echo ""

# Check if DeepSeek model is available
if $OLLAMA_CMD list | grep -q "deepseek-r1:7b"; then
    echo "✅ DeepSeek model is available"
else
    echo "⚠️  DeepSeek model not found!"
    echo ""
    echo "Download it now? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "📥 Downloading deepseek-r1:7b (this may take 5-10 minutes)..."
        $OLLAMA_CMD pull deepseek-r1:7b
        echo "✅ Model downloaded!"
    else
        echo "⚠️  AI features will not work without the model"
        echo "   Download later with: $OLLAMA_CMD pull deepseek-r1:7b"
    fi
fi

echo ""
echo "=========================================="
echo "🌐 Starting Laravel Server"
echo "=========================================="
echo ""

# Find PHP
PHP_CMD=""
if command -v php &> /dev/null; then
    PHP_CMD="php"
elif [ -f /opt/homebrew/bin/php ]; then
    PHP_CMD="/opt/homebrew/bin/php"
elif [ -f /usr/local/bin/php ]; then
    PHP_CMD="/usr/local/bin/php"
else
    echo "❌ PHP is not installed!"
    echo ""
    echo "Install it with:"
    echo "  /opt/homebrew/bin/brew install php"
    echo ""
    exit 1
fi

# Start Laravel server
$PHP_CMD artisan serve --port=3000 > /tmp/laravel-dev.log 2>&1 &
LARAVEL_PID=$!

# Wait for Laravel to start
sleep 2

if ps -p $LARAVEL_PID > /dev/null; then
    echo "✅ Laravel server started (PID: $LARAVEL_PID)"
    echo "   URL: http://localhost:3000"
else
    echo "❌ Failed to start Laravel server. Check logs:"
    echo "  tail -f /tmp/laravel-dev.log"
    exit 1
fi

echo ""

# Check if Vite should be started
if [ -f "package.json" ] && grep -q "vite" package.json; then
    echo "=========================================="
    echo "⚡ Starting Vite Dev Server"
    echo "=========================================="
    echo ""

    # Find npm
    NPM_CMD=""
    if command -v npm &> /dev/null; then
        NPM_CMD="npm"
    elif [ -f /opt/homebrew/bin/npm ]; then
        NPM_CMD="/opt/homebrew/bin/npm"
    elif [ -f /usr/local/bin/npm ]; then
        NPM_CMD="/usr/local/bin/npm"
    else
        echo "⚠️  npm not found, skipping Vite"
        NPM_CMD=""
    fi

    if [ ! -z "$NPM_CMD" ]; then
        $NPM_CMD run dev > /tmp/vite-dev.log 2>&1 &
        VITE_PID=$!

        sleep 2

        if ps -p $VITE_PID > /dev/null; then
            echo "✅ Vite dev server started (PID: $VITE_PID)"
            echo "   Hot reload enabled"
        else
            echo "⚠️  Failed to start Vite (not critical)"
        fi
    fi

    echo ""
fi

echo "=========================================="
echo "✅ Development Environment Ready!"
echo "=========================================="
echo ""
echo "Services running:"
if [ "$OLLAMA_ALREADY_RUNNING" = true ]; then
    echo "  • Ollama:  http://localhost:11434 (was already running)"
else
    echo "  • Ollama:  http://localhost:11434 (PID: $OLLAMA_PID)"
fi
echo "  • Laravel: http://localhost:3000 (PID: $LARAVEL_PID)"
if [ ! -z "$VITE_PID" ] && ps -p $VITE_PID > /dev/null; then
    echo "  • Vite:    http://localhost:5173 (PID: $VITE_PID)"
fi
echo ""
echo "📋 Quick checks:"
echo "  • AI Status:  $PHP_CMD artisan ollama:health"
echo "  • Test URL:   http://localhost:3000/booking/"
echo ""
echo "📝 View logs:"
echo "  • Ollama:  tail -f /tmp/ollama-dev.log"
echo "  • Laravel: tail -f /tmp/laravel-dev.log"
if [ ! -z "$VITE_PID" ]; then
    echo "  • Vite:    tail -f /tmp/vite-dev.log"
fi
echo "  • App:     tail -f storage/logs/laravel.log"
echo ""
echo "🛑 Press CTRL+C to stop all services"
echo ""
echo "=========================================="
echo ""

# Keep script running and show live Laravel logs
echo "📊 Live Laravel logs (CTRL+C to stop):"
echo "=========================================="
echo ""
tail -f /tmp/laravel-dev.log storage/logs/laravel.log 2>/dev/null
