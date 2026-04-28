FROM dunglas/frankenphp:1-php8.3

# Install system dependencies + Node 20
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev libpq-dev \
    zip unzip libzip-dev libcurl4-openssl-dev libsodium-dev libicu-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && docker-php-ext-install pdo pdo_pgsql pgsql mbstring exif pcntl bcmath gd zip curl xml intl sodium \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

ENV COMPOSER_MEMORY_LIMIT=-1

WORKDIR /var/www/html

# Install PHP dependencies (layer caching)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --ignore-platform-reqs 2>&1

# Install Node dependencies (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application code
COPY . .

# Generate optimized autoloader + build frontend
RUN composer dump-autoload --optimize --classmap-authoritative && npm run build

# Create required directories and set permissions
RUN mkdir -p storage/logs storage/framework/sessions storage/framework/views \
    storage/framework/cache/data storage/app/public bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Bake env-independent caches into the image (route, view, event)
# config:cache runs at boot since it reads .env values that exist only at runtime
RUN php artisan route:cache \
    && php artisan view:cache \
    && php artisan event:cache

EXPOSE 8080

# Run migrations as a Render Pre-Deploy Command, not on container boot
CMD php artisan config:cache && \
    php artisan storage:link --force 2>/dev/null || true && \
    frankenphp php-server --listen :${PORT:-8080} --root public/
