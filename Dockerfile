FROM php:8.3-cli

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
RUN composer dump-autoload --optimize && npm run build

# Create required directories and set permissions
RUN mkdir -p storage/logs storage/framework/sessions storage/framework/views \
    storage/framework/cache/data storage/app/public bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    php artisan migrate --force && \
    php artisan db:seed --force && \
    php artisan storage:link --force 2>/dev/null || true && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
