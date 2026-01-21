# How to Run the Dashboard

## Quick Start (3 Steps)

### 1️⃣ Install Prerequisites

You need: **PHP, Composer, and Node.js**

**Easiest way:** Install Laravel Herd
- Download: https://herd.laravel.com
- Installs everything you need
- Restart terminal after install

### 2️⃣ Run Setup Script

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
./setup.sh
```

Waits ~2 minutes while it installs everything.

### 3️⃣ Start Servers

**Option A - Automatic (opens 2 terminal windows):**
```bash
./start-servers.sh
```

**Option B - Manual (run in 2 separate terminals):**

Terminal 1:
```bash
php artisan serve --port=3000
```

Terminal 2:
```bash
npm run dev
```

---

## Open Dashboard

Visit: **http://localhost:3000/dashboard**

---

## What You'll See

✅ Full dashboard UI
✅ Sidebar navigation
✅ Profile completion
✅ Book appointment CTA
✅ Family overview

All styled with the design token system!

---

## If Something's Wrong

**Prerequisite error?**
→ Install PHP, Composer, Node via Herd or Homebrew (see [START_HERE.md](START_HERE.md))

**Blank page?**
→ Make sure both servers are running (both terminals)

**CSS not loading?**
→ Restart Vite: `npm run dev`

**Port already in use?**
→ Use different port: `php artisan serve --port=8000`

---

## Files You Need to Know

| File | Purpose |
|------|---------|
| [START_HERE.md](START_HERE.md) | Complete step-by-step guide |
| [SETUP_MACOS.md](SETUP_MACOS.md) | macOS prerequisite installation |
| [QUICK_START.md](QUICK_START.md) | Alternative setup methods |
| [README.md](README.md) | Full project documentation |
| `setup.sh` | Automated setup script |
| `start-servers.sh` | Auto-start both servers |

---

## Current Status

✅ **Architecture locked** - Design tokens, components, structure all defined
✅ **Dashboard built** - Matches your design exactly
✅ **Ready to extend** - Add appointments, patients, records, etc.

Next: Build actual features (appointments, patient management, etc.)

---

**Need help?** Check [START_HERE.md](START_HERE.md) for detailed instructions!
