#!/bin/bash

# Hospital Management System - Automated Setup Script
# Run this after installing PHP, Composer, and Node.js

set -e  # Exit on any error

echo "🏥 Hospital Management System - Setup Script"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ PHP is not installed${NC}"
    echo "Please install PHP first. See SETUP_MACOS.md"
    exit 1
fi

if ! command -v composer &> /dev/null; then
    echo -e "${RED}❌ Composer is not installed${NC}"
    echo "Please install Composer first. See SETUP_MACOS.md"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js first. See SETUP_MACOS.md"
    exit 1
fi

echo -e "${GREEN}✅ PHP $(php -v | head -n 1 | cut -d ' ' -f 2)${NC}"
echo -e "${GREEN}✅ Composer $(composer -V | cut -d ' ' -f 3)${NC}"
echo -e "${GREEN}✅ Node $(node -v)${NC}"
echo ""

# Step 1: Check if Laravel is already set up
if [ ! -f "artisan" ]; then
    echo "📦 Installing Laravel framework..."

    # Create composer.json if it doesn't exist
    if [ ! -f "composer.json" ]; then
        composer create-project laravel/laravel temp-laravel --prefer-dist

        # Move files from temp directory
        shopt -s dotglob
        mv temp-laravel/* .
        rm -rf temp-laravel
    fi

    echo -e "${GREEN}✅ Laravel installed${NC}"
else
    echo -e "${GREEN}✅ Laravel already installed${NC}"
fi
echo ""

# Step 2: Install PHP dependencies
echo "📦 Installing PHP dependencies..."
composer install --no-interaction
echo -e "${GREEN}✅ PHP dependencies installed${NC}"
echo ""

# Step 3: Install Inertia.js
echo "📦 Installing Inertia.js..."
composer require inertiajs/inertia-laravel --no-interaction
echo -e "${GREEN}✅ Inertia.js installed${NC}"
echo ""

# Step 4: Set up environment
if [ ! -f ".env" ]; then
    echo "⚙️  Setting up environment..."
    cp .env.example .env
    php artisan key:generate

    # Configure for SQLite (easiest for demo)
    sed -i '' 's/DB_CONNECTION=mysql/DB_CONNECTION=sqlite/' .env
    sed -i '' '/DB_HOST=/d' .env
    sed -i '' '/DB_PORT=/d' .env
    sed -i '' '/DB_DATABASE=/d' .env
    sed -i '' '/DB_USERNAME=/d' .env
    sed -i '' '/DB_PASSWORD=/d' .env

    echo -e "${GREEN}✅ Environment configured${NC}"
else
    echo -e "${GREEN}✅ Environment already configured${NC}"
fi
echo ""

# Step 5: Create SQLite database
if [ ! -f "database/database.sqlite" ]; then
    echo "🗄️  Creating SQLite database..."
    touch database/database.sqlite
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database already exists${NC}"
fi
echo ""

# Step 6: Create Inertia middleware
echo "⚙️  Setting up Inertia middleware..."
php artisan inertia:middleware 2>/dev/null || echo "Middleware already exists"
echo -e "${GREEN}✅ Inertia middleware ready${NC}"
echo ""

# Step 7: Install Node dependencies
echo "📦 Installing Node.js dependencies (this may take a minute)..."
npm install
echo -e "${GREEN}✅ Node dependencies installed${NC}"
echo ""

# Step 8: Create necessary files if they don't exist
echo "📝 Creating configuration files..."

# Vite config
if [ ! -f "vite.config.js" ]; then
    cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
});
EOF
fi

# TypeScript config
if [ ! -f "tsconfig.json" ]; then
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./resources/js/*"]
    }
  },
  "include": ["resources/js/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
fi

# tsconfig.node.json
if [ ! -f "tsconfig.node.json" ]; then
    cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.js"]
}
EOF
fi

# PostCSS config
if [ ! -f "postcss.config.js" ]; then
    cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF
fi

# App entry point
cat > resources/js/app.tsx << 'EOF'
import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME || 'Hospital Management System';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
EOF

# App blade template
mkdir -p resources/views
cat > resources/views/app.blade.php << 'EOF'
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
EOF

echo -e "${GREEN}✅ Configuration files created${NC}"
echo ""

# Step 9: Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force
echo -e "${GREEN}✅ Migrations complete${NC}"
echo ""

# Success!
echo ""
echo -e "${GREEN}=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo -e "${NC}"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Start the Laravel server (Terminal 1):"
echo -e "   ${YELLOW}php artisan serve --port=3000${NC}"
echo ""
echo "2. Start the Vite dev server (Terminal 2):"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Open your browser:"
echo -e "   ${YELLOW}http://localhost:3000/dashboard${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🏥${NC}"
echo ""
