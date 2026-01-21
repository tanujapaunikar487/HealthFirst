# Install & Run in 5 Minutes ⚡

Copy and paste these commands one by one into your Terminal.

---

## Step 1: Install Homebrew (1 minute)

**Copy and paste this entire command:**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- Press **Enter**
- Enter your **Mac password** when asked
- Wait for it to finish (~1 minute)
- **IMPORTANT:** After installation, it will show 2 commands like:
  ```
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
  ```
  **Copy and run those 2 commands!**

---

## Step 2: Install PHP, Composer, and Node.js (2 minutes)

**Copy and paste each line:**

```bash
brew install php@8.3
```
Wait for it to finish, then:

```bash
brew install composer
```
Wait for it to finish, then:

```bash
brew install node@20
```

**Add PHP to your PATH:**
```bash
echo 'export PATH="/opt/homebrew/opt/php@8.3/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 3: Verify Installation

**Copy and paste:**

```bash
php --version && composer --version && node --version
```

You should see version numbers for all three. ✅

---

## Step 4: Run the Setup Script (2 minutes)

**Copy and paste:**

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care" && ./setup.sh
```

This will install Laravel and all dependencies automatically.

---

## Step 5: Start the Servers

**Option A - Automatic (Opens 2 Terminal Windows):**

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care" && ./start-servers.sh
```

**Option B - Manual (You Need 2 Terminal Windows):**

Terminal Window 1:
```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
php artisan serve --port=3000
```

Terminal Window 2 (open a NEW terminal):
```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
npm run dev
```

---

## Step 6: Open Your Browser

Visit: **http://localhost:3000/dashboard**

🎉 **You should see the dashboard!**

---

## Troubleshooting

### "zsh: command not found: brew" after Step 1

You need to run the two commands Homebrew shows you at the end:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Then **close and reopen Terminal**.

### "Permission denied: ./setup.sh"

Make it executable:
```bash
chmod +x "/Users/tanujapaunikar/Desktop/Health Care/setup.sh"
chmod +x "/Users/tanujapaunikar/Desktop/Health Care/start-servers.sh"
```

### Blank page in browser

Make sure **both Terminal windows are running** (you should see output in both).

### CSS not loading

In the Terminal running `npm run dev`, press `Ctrl+C` and run `npm run dev` again.

---

## Alternative: Use Laravel Herd (Even Easier!)

If you don't want to use Homebrew, download Laravel Herd:

1. **Download:** https://herd.laravel.com
2. **Install** the app
3. **Restart Terminal**
4. **Run:** `cd "/Users/tanujapaunikar/Desktop/Health Care" && ./setup.sh`
5. **Run:** `./start-servers.sh`
6. **Visit:** http://localhost:3000/dashboard

---

## Summary

| Step | Command | Time |
|------|---------|------|
| 1. Install Homebrew | `(curl command from above)` | 1 min |
| 2. Install PHP, Composer, Node | `brew install php@8.3 composer node@20` | 2 min |
| 3. Run setup script | `./setup.sh` | 2 min |
| 4. Start servers | `./start-servers.sh` | instant |
| 5. Open browser | http://localhost:3000/dashboard | instant |

**Total: ~5 minutes**

---

**Start with Step 1 and work your way down. Each command builds on the previous one! 🚀**
