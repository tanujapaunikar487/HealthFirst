<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <meta name="csrf-token" content="{{ csrf_token() }}">

        <!-- Open Graph -->
        <meta property="og:title" content="{{ config('app.name', 'HealthFirst') }}" />
        <meta property="og:description" content="Book appointments, consult doctors, and manage your health — all in one place." />
        <meta property="og:image" content="{{ url('/assets/images/og-image.png') }}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="{{ url('/') }}" />

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <!-- Razorpay -->
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
