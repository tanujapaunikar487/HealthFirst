# Installation Checklist ✅

Follow this checklist in order. Check off each step as you complete it.

---

## Prerequisites Installation

### [ ] Step 1: Install Homebrew

Open Terminal and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**After it finishes, run the 2 commands it shows you** (they start with `echo` and `eval`)

Close and reopen Terminal.

**Verify:**
```bash
brew --version
```
Should show: `Homebrew 4.x.x`

---

### [ ] Step 2: Install PHP

```bash
brew install php@8.3
```

**Add to PATH:**
```bash
echo 'export PATH="/opt/homebrew/opt/php@8.3/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Verify:**
```bash
php --version
```
Should show: `PHP 8.3.x`

---

### [ ] Step 3: Install Composer

```bash
brew install composer
```

**Verify:**
```bash
composer --version
```
Should show: `Composer version 2.x.x`

---

### [ ] Step 4: Install Node.js

```bash
brew install node@20
```

**Verify:**
```bash
node --version
npm --version
```
Should show: `v20.x.x` and `10.x.x`

---

## Project Setup

### [ ] Step 5: Run Setup Script

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
./setup.sh
```

**Watch for:**
- ✅ Laravel installed
- ✅ PHP dependencies installed
- ✅ Inertia.js installed
- ✅ Environment configured
- ✅ Database created
- ✅ Node dependencies installed
- ✅ Migrations complete

**This takes ~2 minutes**

---

## Run the Application

### [ ] Step 6: Start Servers

**Option A - Automatic:**
```bash
./start-servers.sh
```
This opens 2 Terminal windows automatically.

**Option B - Manual:**

Open **Terminal Window 1:**
```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
php artisan serve --port=3000
```
**Keep this running!** You should see:
```
Starting Laravel development server: http://127.0.0.1:3000
```

Open **Terminal Window 2:**
```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
npm run dev
```
**Keep this running too!** You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### [ ] Step 7: Open Dashboard in Browser

Visit: **http://localhost:3000/dashboard**

---

## What You Should See ✅

- [ ] Sidebar navigation (Home, Appointments, Health Records, Insurance, Billing, Family Members)
- [ ] Top header with search bar and user avatar
- [ ] Welcome message: "Hi, [Name]"
- [ ] "Book Appointment" button (top right)
- [ ] Profile completion card (shows "1 of 3 done")
- [ ] Dark blue appointment booking card
- [ ] Family Overview section

---

## Troubleshooting

### ❌ "command not found: brew"
→ Complete Step 1 again and make sure to run the `echo` and `eval` commands
→ Close and reopen Terminal

### ❌ "command not found: php"
→ Run Step 2 again
→ Make sure you ran the `echo 'export PATH...'` command
→ Run `source ~/.zshrc`

### ❌ "command not found: composer"
→ Run Step 3 again

### ❌ "command not found: node"
→ Run Step 4 again

### ❌ "./setup.sh: Permission denied"
→ Run: `chmod +x setup.sh start-servers.sh`

### ❌ Blank page in browser
→ Make sure BOTH servers are running (both Terminal windows)
→ Check for errors in the Terminal windows

### ❌ CSS not loading
→ In Terminal 2, press `Ctrl+C` to stop Vite
→ Run `npm run dev` again

---

## Current Progress

Mark where you are:

- [ ] Prerequisites installed (Steps 1-4)
- [ ] Setup script completed (Step 5)
- [ ] Servers running (Step 6)
- [ ] Dashboard visible in browser (Step 7)

---

## Time Estimate

| Phase | Time |
|-------|------|
| Prerequisites (Steps 1-4) | ~3-5 minutes |
| Setup script (Step 5) | ~2 minutes |
| Start servers (Step 6) | ~30 seconds |
| **Total** | **~6-8 minutes** |

---

**Start at Step 1 and work your way down. Don't skip steps!**

Once you see the dashboard, you're done! 🎉
