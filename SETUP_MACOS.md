# macOS Setup Guide

Your system needs PHP and Node.js to run this application. Here's how to install them.

---

## Option 1: Laravel Herd (Recommended - Easiest)

**Laravel Herd** is the easiest way to run Laravel on macOS. It includes PHP, Nginx, and everything you need.

### Install Herd

1. **Download Herd:**
   Visit: https://herd.laravel.com
   Download and install the macOS app

2. **Herd automatically provides:**
   - PHP 8.3
   - Nginx
   - Database tools
   - Local .test domains

3. **After installing Herd:**
   ```bash
   # Herd adds PHP to your PATH automatically
   # Restart your terminal, then check:
   php --version
   ```

4. **Move your project to Herd's sites directory:**
   ```bash
   # Herd typically uses ~/Herd
   mv "/Users/tanujapaunikar/Desktop/Health Care" ~/Herd/hospital-management
   ```

5. **Access your site:**
   - Herd will automatically serve it at: `http://hospital-management.test`
   - Or configure a custom domain in the Herd app

---

## Option 2: Homebrew (More Control)

If you prefer manual control, use Homebrew.

### Step 1: Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install PHP

```bash
# Install PHP 8.3
brew install php@8.3

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/php@8.3/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
php --version
```

### Step 3: Install Composer

```bash
# Install Composer globally
brew install composer

# Verify
composer --version
```

### Step 4: Install Node.js

```bash
# Install Node.js 20 LTS
brew install node@20

# Verify
node --version
npm --version
```

---

## After Prerequisites are Installed

Once you have PHP, Composer, and Node.js installed, follow these steps:

### 1. Navigate to Project

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"
```

### 2. Install Laravel

This is a fresh project, so we need to initialize Laravel:

```bash
# Install Laravel installer globally (one time only)
composer global require laravel/installer

# Create Laravel project structure
# We'll do this by installing dependencies
composer init --name="hospital/management" --type=project --require="laravel/framework:^11.0" -n
composer install
```

Or simpler - let me create a setup script for you.

---

## Automated Setup Script

I'll create a script that does everything for you.

Save this as `setup.sh` and run it:

```bash
chmod +x setup.sh
./setup.sh
```

---

## Alternative: Use Docker (No Local PHP Needed)

If you don't want to install PHP locally, use **Laravel Sail** (Docker):

### Prerequisites
- Install Docker Desktop for Mac: https://www.docker.com/products/docker-desktop

### Setup with Docker

```bash
cd "/Users/tanujapaunikar/Desktop/Health Care"

# Install Laravel Sail
composer require laravel/sail --dev

# Initialize Sail
php artisan sail:install

# Start Docker containers
./vendor/bin/sail up -d

# Install Node dependencies inside container
./vendor/bin/sail npm install

# Run Vite
./vendor/bin/sail npm run dev
```

Then visit: `http://localhost`

---

## Which Option Should You Choose?

| Option | Best For | Pros | Cons |
|--------|----------|------|------|
| **Laravel Herd** | Quick start | Easiest, zero config | Less control |
| **Homebrew** | Developers | Full control, native | Manual setup |
| **Docker Sail** | Teams | Isolated, reproducible | Requires Docker |

**Recommendation:** Start with **Laravel Herd** for fastest setup.

---

## Next Steps

After installing prerequisites:

1. **Return to this project**
2. **Run the setup script I'll create for you**
3. **Start the servers**
4. **View the dashboard**

---

Would you like me to:
1. Create an automated setup script for you?
2. Help you install Homebrew + PHP + Node?
3. Set up Docker instead?

Let me know which path you prefer!
