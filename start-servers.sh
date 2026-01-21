#!/bin/bash

# Start both Laravel and Vite servers simultaneously
# This opens two terminal tabs/windows automatically

echo "🏥 Starting Hospital Management System Servers..."
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - Use osascript to open new Terminal tabs

    # Tab 1: Laravel server on port 3000
    osascript <<END
    tell application "Terminal"
        activate
        do script "cd \"$PWD\" && echo '🚀 Starting Laravel server on port 3000...' && echo '' && php artisan serve --port=3000"
    end tell
END

    # Wait a moment
    sleep 1

    # Tab 2: Vite dev server
    osascript <<END
    tell application "Terminal"
        activate
        do script "cd \"$PWD\" && echo '⚡ Starting Vite dev server...' && echo '' && npm run dev"
    end tell
END

    echo ""
    echo "✅ Servers starting in separate Terminal windows!"
    echo ""
    echo "📱 Visit: http://localhost:3000/dashboard"
    echo ""
    echo "To stop the servers:"
    echo "  - Press Ctrl+C in each Terminal window"
    echo ""

else
    # Linux or other OS - use tmux or provide manual instructions
    echo "Manual startup required. Run these commands in separate terminals:"
    echo ""
    echo "Terminal 1:"
    echo "  php artisan serve --port=3000"
    echo ""
    echo "Terminal 2:"
    echo "  npm run dev"
    echo ""
fi
