# 🏥 Start Here - View Dashboard in Browser

Follow these steps to see the dashboard on `http://localhost:3000`

---

## Step 1: Install Prerequisites (One-Time Only)

You need PHP, Composer, and Node.js. **Choose ONE option:**

### Option A: Laravel Herd (Easiest ⭐ Recommended)

1. Download and install: https://herd.laravel.com
2. Herd automatically installs PHP, Composer, and everything needed
3. Restart your terminal after installation

### Option B: Homebrew (Manual)

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PHP, Composer, and Node.js
brew install php@8.3 composer node@20

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/php@8.3/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 2: Run Automated Setup

Open Terminal and run:

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
./setup.sh
```

This script will:
- ✅ Install Laravel
- ✅ Install all dependencies
- ✅ Set up the database
- ✅ Configure everything automatically

**Takes about 2-3 minutes.**

---

## Step 3: Start the Servers

You need **TWO terminal windows**:

### Terminal 1 - Laravel Server (Port 3000)

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
php artisan serve --port=3000
```

Keep this running. You'll see:
```
Starting Laravel development server: http://127.0.0.1:3000
```

### Terminal 2 - Vite Dev Server

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
npm run dev
```

Keep this running too. You'll see:
```
VITE v5.x.x  ready in xxx ms
➜ Local: http://localhost:5173/
```

---

## Step 4: Open in Browser

Visit: **http://localhost:3000/dashboard**

You should see:
- ✅ Sidebar navigation
- ✅ Dashboard with "Hi, [Name]" greeting
- ✅ Profile completion card
- ✅ Blue appointment booking card
- ✅ Family overview section

---

## Troubleshooting

### "php: command not found"

You need to install PHP first. Go back to Step 1.

### "composer: command not found"

Herd or Homebrew didn't install correctly. Try:
```bash
brew install composer
```

### "Cannot find module '@inertiajs/react'"

Run the setup script again:
```bash
./setup.sh
```

### Port 3000 already in use?

Use a different port:
```bash
php artisan serve --port=8000
```
Then visit `http://localhost:8000/dashboard`

### Blank page or errors in browser?

Make sure BOTH Terminal 1 and Terminal 2 are running.

### CSS not loading?

Restart Vite in Terminal 2:
1. Press `Ctrl+C` to stop it
2. Run `npm run dev` again

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Start Laravel server | `php artisan serve --port=3000` |
| Start Vite | `npm run dev` |
| Stop servers | Press `Ctrl+C` in each terminal |
| Reinstall everything | `./setup.sh` |
| Clear cache | `php artisan cache:clear` |

---

## What You'll See

The dashboard includes:

1. **Left Sidebar**
   - Home
   - Appointments
   - Health Records
   - Insurance
   - Billing
   - Family Members

2. **Top Header**
   - Search bar
   - Notification bell
   - User profile dropdown

3. **Main Content**
   - Welcome message
   - "Book Appointment" button
   - Profile completion progress (3 steps)
   - Blue CTA card for booking
   - Family overview

---

## Need Help?

1. Check [SETUP_MACOS.md](SETUP_MACOS.md) for detailed installation guides
2. Check [QUICK_START.md](QUICK_START.md) for alternative setup methods
3. Check [README.md](README.md) for full project documentation

---

**Once everything is running, you can start building features!**

The architecture is fully set up and ready for:
- Appointment booking
- Patient management
- Medical records
- And more...

See [docs/](docs/) for complete architectural documentation.
