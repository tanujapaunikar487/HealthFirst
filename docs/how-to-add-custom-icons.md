# How to Add Custom Icons and Logos

## Quick Steps

### 1. Add Your Icon Files

Place your icon SVG files in:
```
/Users/tanujapaunikar/Desktop/Health Care/public/assets/icons/
```

**Recommended icons to add:**
- `home.svg`
- `appointments.svg` (calendar icon)
- `health-records.svg` (shield/heart icon)
- `insurance.svg` (card icon)
- `billing.svg` (document/receipt icon)
- `family-members.svg` (people icon)

### 2. Add Your Logo

Place your hospital logo in:
```
/Users/tanujapaunikar/Desktop/Health Care/public/assets/logos/
```

**File:** `hospital-logo.svg` or `hospital-logo.png`

### 3. Update AppLayout Component

Once you've added the icons, open:
```
/Users/tanujapaunikar/Desktop/Health Care/resources/js/Layouts/AppLayout.tsx
```

**Find the icon functions** (around line 120+) and replace them:

**Before:**
```tsx
function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" ...>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      ...
    </svg>
  );
}
```

**After:**
```tsx
function HomeIcon() {
  return <img src="/assets/icons/home.svg" alt="Home" className="h-6 w-6" />;
}
```

Do this for all 6 icon functions:
- `HomeIcon`
- `AppointmentsIcon`
- `HealthRecordsIcon`
- `InsuranceIcon`
- `BillingIcon`
- `FamilyMembersIcon`

### 4. Update Logo

**Find the logo div** (around line 140):

**Before:**
```tsx
<div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
  <span className="text-primary-foreground font-bold text-2xl">C</span>
</div>
```

**After:**
```tsx
<img
  src="/assets/logos/hospital-logo.svg"
  alt="Hospital Logo"
  className="h-14 w-14 object-contain"
/>
```

### 5. Refresh Browser

The changes will hot-reload automatically if Vite is running.

---

## Alternative: Keep Icons Inline

If you prefer to keep the inline SVG icons (for better control), you can:

1. Open your SVG file in a text editor
2. Copy the `<svg>` content
3. Replace the existing SVG code in the icon functions

This gives you full control over colors and styling with Tailwind classes.

---

## Icon Resources

**Free icon sets that match the design:**
- Lucide Icons: https://lucide.dev
- Heroicons: https://heroicons.com
- Bootstrap Icons: https://icons.getbootstrap.com
- Feather Icons: https://feathericons.com

All are MIT licensed and free to use.

---

## Example: Using Custom SVG

If you have `home.svg`:

```tsx
function HomeIcon() {
  return (
    <img
      src="/assets/icons/home.svg"
      alt="Home"
      className="h-6 w-6"
    />
  );
}
```

That's it! The icon will be visible in the sidebar.
