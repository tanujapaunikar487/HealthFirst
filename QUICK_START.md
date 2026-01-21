# Quick Start Guide

Follow these steps to see the dashboard in your browser.

---

## Prerequisites Check

Make sure you have:
- PHP 8.2 or higher
- Composer
- Node.js 18 or higher
- npm

**Check versions:**
```bash
php --version
composer --version
node --version
npm --version
```

---

## Installation Steps

### 1. Install Laravel (First Time Only)

Since this is a new project, we need to install Laravel first:

```bash
# Navigate to project directory
cd "/Users/tanujapaunikar/Desktop/Health Care"

# Create a new Laravel project in a temporary directory
composer create-project laravel/laravel temp-laravel

# Move Laravel files to current directory
cp -r temp-laravel/* .
cp temp-laravel/.env.example .env.example
cp temp-laravel/.gitignore .gitignore

# Remove temporary directory
rm -rf temp-laravel

# Generate application key
php artisan key:generate
```

### 2. Install Inertia.js Server-Side

```bash
composer require inertiajs/inertia-laravel
```

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Configure Environment

The `.env` file should already be created. Update these values:

```env
APP_NAME="Hospital Management System"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# For now, use SQLite (no MySQL needed for demo)
DB_CONNECTION=sqlite
```

Create SQLite database:
```bash
touch database/database.sqlite
```

### 5. Set Up Vite Configuration

Create `vite.config.js`:

```bash
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
```

### 6. Create Inertia Root Template

We need to create the root Blade file:

```bash
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
```

### 7. Create Inertia App Entry Point

```bash
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
```

### 8. Set Up Inertia Middleware

```bash
php artisan inertia:middleware
```

Then add it to `app/Http/Kernel.php` in the `web` middleware group:

```php
'web' => [
    // ... other middleware
    \App\Http\Middleware\HandleInertiaRequests::class,
],
```

### 9. Create TypeScript Config

```bash
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
```

### 10. Create PostCSS Config

```bash
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF
```

---

## Running the Application

### Start Both Servers

You need **TWO terminal windows**:

**Terminal 1 - Laravel Server:**
```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
php artisan serve
```
This runs on `http://localhost:8000`

**Terminal 2 - Vite Dev Server:**
```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
npm run dev
```
This runs on `http://localhost:5173` but compiles assets for Laravel

---

## View the Dashboard

Open your browser and visit:
```
http://localhost:8000/dashboard
```

---

## Troubleshooting

### "Class 'Inertia' not found"
```bash
composer require inertiajs/inertia-laravel
```

### "Cannot find module '@inertiajs/react'"
```bash
npm install
```

### "Vite manifest not found"
Make sure Vite is running in Terminal 2:
```bash
npm run dev
```

### Port 8000 already in use?
Use a different port:
```bash
php artisan serve --port=3000
```
Then visit `http://localhost:3000/dashboard`

### CSS not loading?
Make sure both servers are running and restart Vite:
```bash
# Stop Vite (Ctrl+C), then:
npm run dev
```

---

## Current Limitations

Since we haven't created the database models yet:
- Profile completion will show errors
- Family members won't load
- You'll need to add temporary data or create models

**Quick fix for demo:**
Modify `DashboardController.php` to return dummy data instead of querying the database.

---

## Next Steps After Viewing

Once you see the UI:
1. Create database models (Patient, FamilyMember, etc.)
2. Run migrations
3. Add authentication
4. Build other features

---

**Let me know if you hit any errors during setup!**
