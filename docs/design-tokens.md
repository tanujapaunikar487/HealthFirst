# Design Token System

**Status:** Locked
**Authority:** This document is the single source of truth for all visual decisions.
**Enforcement:** TypeScript types, Tailwind config, and code review.

---

## Principles

1. **No arbitrary values.** All styling decisions come from tokens.
2. **No hardcoded colors.** Use semantic color tokens only.
3. **No custom spacing.** Use the defined spacing scale only.
4. **No custom typography.** Use semantic typography variants only.
5. **Tokens are non-negotiable.** Components consume tokens, never override them.

---

## Color Tokens

### Neutral Grey Palette (Base)
The foundation of the UI is a neutral grey palette. This ensures clinical clarity and accessibility.

- `background` - Page background
- `foreground` - Primary text color
- `card` - Card background
- `card-foreground` - Card text color
- `muted` - Muted background
- `muted-foreground` - Secondary/muted text
- `border` - All borders
- `input` - Input field borders
- `ring` - Focus rings

### Per-Hospital Configurable
Each hospital can configure:
- Logo
- **One accent color** (`primary` token)

The accent color is applied **sparingly** through the `primary` token only.

### Semantic UI States
- `secondary` - Secondary actions
- `destructive` - Destructive/delete actions
- `accent` - Highlights and callouts

### Clinical Semantic Colors
Read-only status indicators:
- `success` - Completed, confirmed, healthy
- `warning` - Attention needed, caution
- `info` - Informational, neutral status

**Usage:** Only for status badges, alerts, and indicators. Never for interactive elements.

---

## Spacing Tokens

Use **only** Tailwind's default spacing scale:

```
0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10,
11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56,
60, 64, 72, 80, 96
```

**Examples:**
- `p-4` ✅
- `p-[18px]` ❌ (arbitrary value - forbidden)
- `gap-6` ✅
- `gap-[25px]` ❌ (arbitrary value - forbidden)

---

## Typography Tokens

### Semantic Variants
Use semantic typography variants, not raw sizes:

| Variant       | Size  | Weight     | Use Case                          |
|---------------|-------|------------|-----------------------------------|
| `h1`          | 4xl   | bold       | Page titles                       |
| `h2`          | 3xl   | semibold   | Section titles                    |
| `h3`          | 2xl   | semibold   | Subsection titles                 |
| `h4`          | xl    | semibold   | Card/component titles             |
| `body`        | base  | normal     | Default body text                 |
| `body-large`  | lg    | normal     | Emphasized body text              |
| `body-small`  | sm    | normal     | Compact body text                 |
| `caption`     | xs    | normal     | Labels, timestamps, metadata      |
| `muted`       | sm    | normal     | Secondary/de-emphasized text      |

**Examples:**
- `text-base` ✅ (body text)
- `text-xl font-semibold` ✅ (h4)
- `text-[15px]` ❌ (arbitrary - forbidden)
- `text-sm text-muted-foreground` ✅ (muted text)

### Font Family
**Inter** is the only font. Defined globally in [tailwind.config.js](../tailwind.config.js). Never redefine it.

### Tailwind Typography
Use `@tailwindcss/typography` for rich text content:
- AI-generated explanations
- Clinical notes
- Instructions and descriptions

Apply with the `prose` class.

---

## Border Radius Tokens

Use **only** predefined radius values:

- `rounded-none` - No rounding
- `rounded-sm` - Subtle rounding
- `rounded-md` - Default rounding
- `rounded-lg` - Larger rounding
- `rounded-full` - Circular (pills, avatars)

**Examples:**
- `rounded-md` ✅
- `rounded-[12px]` ❌ (arbitrary - forbidden)

---

## Border Tokens

Use **only** predefined border widths:

- `border-0` - No border
- `border` - Default 1px border
- `border-2` - 2px border

**Color:** Always use `border` color token.

**Examples:**
- `border border-border` ✅
- `border-[1.5px]` ❌ (arbitrary - forbidden)
- `border-gray-300` ❌ (hardcoded color - forbidden)

---

## Enforcement

### TypeScript
All design tokens are defined as TypeScript types in [resources/types/design-tokens.ts](../resources/types/design-tokens.ts).

Components must use these types for props.

### Tailwind Config
All tokens are defined in [tailwind.config.js](../tailwind.config.js).

### CSS Variables
Dynamic values (e.g., per-hospital accent color) are defined as CSS variables in [resources/css/app.css](../resources/css/app.css).

### Code Review
Any arbitrary values (`[...]` syntax in Tailwind) are **rejected** during code review.

---

## Per-Hospital Customization

Hospitals can customize **only**:
1. Logo (uploaded via admin panel)
2. Primary accent color (configured via admin panel)

The accent color updates the `--primary` CSS variable. All components automatically reflect the change.

**No other visual customization is allowed.**

---

## Examples

### ✅ Correct Usage

```tsx
// Semantic color tokens
<Button variant="default">Save</Button>
<Badge variant="success">Confirmed</Badge>
<p className="text-muted-foreground">Last updated 2 hours ago</p>

// Spacing tokens
<div className="p-6 gap-4">...</div>

// Typography tokens
<h2 className="text-3xl font-semibold">Patient Records</h2>
<p className="text-base">Body text content here.</p>

// Border tokens
<Card className="border border-border rounded-lg">...</Card>
```

### ❌ Incorrect Usage

```tsx
// Arbitrary spacing - FORBIDDEN
<div className="p-[18px]">...</div>

// Hardcoded color - FORBIDDEN
<p className="text-gray-600">Text</p>

// Arbitrary typography - FORBIDDEN
<h2 className="text-[28px]">Title</h2>

// Arbitrary radius - FORBIDDEN
<Card className="rounded-[10px]">...</Card>

// Raw color values - FORBIDDEN
<div style={{ color: '#666' }}>Text</div>
```

---

## Summary

**All visual decisions are tokenized.**
**No exceptions.**
**Tokens are the contract between design and engineering.**
**This system is built for stability, consistency, and long-term maintenance.**
