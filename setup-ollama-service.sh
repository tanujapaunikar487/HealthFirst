#!/bin/bash

echo "=========================================="
echo "Setting up Ollama as Auto-Start Service"
echo "=========================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed"
    echo ""
    echo "Install Ollama first:"
    echo "  macOS: brew install ollama"
    echo "  Or visit: https://ollama.ai/download/mac"
    exit 1
fi

echo "✅ Ollama is installed"
echo ""

# Get the actual Ollama path
OLLAMA_PATH=$(which ollama)
echo "Ollama path: $OLLAMA_PATH"
echo ""

# Create LaunchAgent
echo "Creating LaunchAgent configuration..."
mkdir -p ~/Library/LaunchAgents

cat > ~/Library/LaunchAgents/com.ollama.server.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>$OLLAMA_PATH</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ollama.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ollama-error.log</string>
</dict>
</plist>
EOF

echo "✅ LaunchAgent created at: ~/Library/LaunchAgents/com.ollama.server.plist"
echo ""

# Unload if already loaded (suppress errors if not loaded)
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist 2>/dev/null || true

# Load the service
echo "Loading Ollama service..."
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

# Start the service
echo "Starting Ollama..."
launchctl start com.ollama.server

# Wait for it to start
echo "Waiting for Ollama to start..."
sleep 5

# Verify it's running
echo ""
echo "Verifying Ollama is running..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running!"
    echo ""

    # Check if model is downloaded
    if ollama list | grep -q "deepseek-r1:7b"; then
        echo "✅ DeepSeek model is already downloaded"
    else
        echo "⚠️  DeepSeek model not found"
        echo ""
        echo "Would you like to download it now? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo "Downloading deepseek-r1:7b (this may take 5-10 minutes)..."
            ollama pull deepseek-r1:7b
            echo "✅ Model downloaded!"
        fi
    fi
else
    echo "⚠️  Ollama may not have started yet. Check logs:"
    echo "  tail -f /tmp/ollama.log"
    echo "  tail -f /tmp/ollama-error.log"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Ollama will now:"
echo "  • Start automatically when you log in"
echo "  • Restart automatically if it crashes"
echo "  • Run in the background"
echo ""
echo "Useful commands:"
echo "  Check if running:  curl http://localhost:11434/api/tags"
echo "  View logs:         tail -f /tmp/ollama.log"
echo "  Stop service:      launchctl stop com.ollama.server"
echo "  Start service:     launchctl start com.ollama.server"
echo "  Restart service:   launchctl kickstart -k gui/\$UID/com.ollama.server"
echo "  Disable auto-start: launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist"
echo ""
echo "Next steps:"
echo "  1. Run: cd \"/Users/tanujapaunikar/Desktop/Health Care\""
echo "  2. Run: ./reload-ai-with-flow.sh"
echo "  3. Test at: http://localhost:3000/booking/"
echo ""
