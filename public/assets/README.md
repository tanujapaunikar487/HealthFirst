# Assets Folder

This folder contains all icons, logos, and images for the Hospital Management System.

## Structure

```
public/assets/
├── icons/          # Navigation icons, UI icons
├── logos/          # Hospital logos, application branding
└── images/         # Other images (illustrations, backgrounds, etc.)
```

## How to Add Assets

### 1. Place Files in Appropriate Folders

**Icons:**
```
public/assets/icons/
├── home.svg
├── appointments.svg
├── health-records.svg
├── insurance.svg
├── billing.svg
└── family-members.svg
```

**Logos:**
```
public/assets/logos/
├── hospital-logo.svg      # Main hospital logo
└── app-logo.svg           # Application logo
```

### 2. Use in React Components

**As Image:**
```tsx
<img src="/assets/icons/home.svg" alt="Home" className="h-6 w-6" />
```

**As Background:**
```tsx
<div style={{ backgroundImage: 'url(/assets/logos/hospital-logo.svg)' }} />
```

**Via Tailwind:**
```css
.logo {
  background-image: url('/assets/logos/hospital-logo.svg');
}
```

### 3. Reference in Laravel Blade (for emails, PDFs)

```blade
<img src="{{ asset('assets/logos/hospital-logo.svg') }}" alt="Logo">
```

## Recommended Formats

- **Icons:** SVG (scalable, best for UI)
- **Logos:** SVG or PNG with transparency
- **Photos:** JPG or WebP
- **Illustrations:** SVG or PNG

## Naming Conventions

- Use **kebab-case**: `health-records.svg`, `profile-avatar.png`
- Be descriptive: `notification-bell.svg`, `search-icon.svg`
- Include size for raster images: `logo-512.png`, `banner-1920x1080.jpg`

## Icon Usage in Components

Once you add icons to `/public/assets/icons/`, you can update the AppLayout to use them:

**Before (using inline SVG):**
```tsx
function HomeIcon() {
  return (
    <svg>...</svg>
  );
}
```

**After (using asset):**
```tsx
function HomeIcon() {
  return <img src="/assets/icons/home.svg" alt="Home" className="h-6 w-6" />;
}
```

Or import them in Vite:
```tsx
import homeIcon from '@/../../public/assets/icons/home.svg';
```

## Current Placeholder

The sidebar currently uses inline SVG icons. Once you add your custom icons to this folder, we'll update the components to use them.

## Per-Hospital Customization

Hospitals can upload their own logo via the admin panel. The logo will be stored in:
```
public/assets/logos/hospital-{id}/logo.svg
```

The `--primary` CSS variable will also be updated to match their brand color.

---

**Ready to use!** Just drop your icons and logos into the appropriate folders.
