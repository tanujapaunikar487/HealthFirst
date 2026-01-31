#!/bin/bash

echo "=========================================="
echo "🛑 Stopping Development Environment"
echo "=========================================="
echo ""

cd "/Users/tanujapaunikar/Desktop/Health Care"

# Stop Laravel (port 3000)
LARAVEL_PID=$(lsof -ti :3000)
if [ ! -z "$LARAVEL_PID" ]; then
    echo "Stopping Laravel server (PID: $LARAVEL_PID)..."
    kill $LARAVEL_PID 2>/dev/null && echo "✅ Laravel stopped"
else
    echo "ℹ️  Laravel server not running on port 3000"
fi

# Stop Vite (port 5173)
VITE_PID=$(lsof -ti :5173)
if [ ! -z "$VITE_PID" ]; then
    echo "Stopping Vite dev server (PID: $VITE_PID)..."
    kill $VITE_PID 2>/dev/null && echo "✅ Vite stopped"
else
    echo "ℹ️  Vite not running on port 5173"
fi

# Check if Ollama should be stopped
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Ollama is currently running"
    echo ""
    echo "Do you want to stop Ollama? (y/n)"
    echo "Note: If it's running as a service, you may want to keep it running"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Stopping Ollama..."
        pkill ollama 2>/dev/null && echo "✅ Ollama stopped"
    else
        echo "ℹ️  Keeping Ollama running"
    fi
else
    echo "ℹ️  Ollama not running"
fi

echo ""
echo "=========================================="
echo "✅ Development environment stopped"
echo "=========================================="
echo ""
