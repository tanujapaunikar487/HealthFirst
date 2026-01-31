/**
 * shadcn/ui Design System Rules
 *
 * ALWAYS follow these patterns for consistency.
 * Reference: https://ui.shadcn.com
 */

// ============================================
// SPACING (use Tailwind's default scale)
// ============================================
export const spacing = {
    // Component internal padding
    cardPadding: 'p-6',
    cardPaddingSm: 'p-4',

    // Gaps between elements
    gapXs: 'gap-1',
    gapSm: 'gap-2',
    gapMd: 'gap-3',
    gapLg: 'gap-4',
    gapXl: 'gap-6',

    // Stack spacing
    stackSm: 'space-y-1.5',
    stackMd: 'space-y-2',
    stackLg: 'space-y-4',
    stackXl: 'space-y-6',
} as const;

// ============================================
// TYPOGRAPHY (shadcn conventions)
// ============================================
export const typography = {
    // Headings
    h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
    h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
    h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
    h4: 'scroll-m-20 text-xl font-semibold tracking-tight',

    // Body text
    p: 'leading-7',
    pMuted: 'text-sm text-muted-foreground',

    // UI text (most common)
    label: 'text-sm font-medium leading-none',
    labelMuted: 'text-sm text-muted-foreground',

    // Emphasis
    lead: 'text-xl text-muted-foreground',
    large: 'text-lg font-semibold',
    small: 'text-sm font-medium leading-none',
    subtle: 'text-sm text-muted-foreground',
} as const;

// ============================================
// BORDERS & RADIUS
// ============================================
export const borders = {
    default: 'border border-border',
    radiusSm: 'rounded-sm',
    radiusMd: 'rounded-md',
    radiusLg: 'rounded-lg',
    radiusFull: 'rounded-full',
} as const;

// ============================================
// COMPONENT PATTERNS
// ============================================

export const card = {
    base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    header: 'flex flex-col space-y-1.5 p-6',
    title: 'text-2xl font-semibold leading-none tracking-tight',
    description: 'text-sm text-muted-foreground',
    content: 'p-6 pt-0',
    footer: 'flex items-center p-6 pt-0',
} as const;

export const listItem = {
    base: 'flex items-center gap-4 p-4',
    interactive: 'flex items-center gap-4 p-4 hover:bg-accent cursor-pointer transition-colors',
    selected: 'flex items-center gap-4 p-4 bg-accent',
    divider: 'border-b last:border-b-0',
} as const;

export const button = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
} as const;

export const badge = {
    default: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'text-foreground',
} as const;

export const avatar = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
} as const;

/*
 * ANTI-PATTERNS (NEVER DO THESE)
 * ❌ NEVER use arbitrary values: rounded-[12px], p-[18px]
 * ❌ NEVER mix padding conventions
 * ❌ NEVER use raw colors: text-gray-500, bg-blue-100
 * ❌ NEVER use custom shadows
 * ❌ NEVER skip the border on cards
 * ❌ NEVER use font-bold for UI text
 * ❌ NEVER use text-black or text-white
 *
 * CORRECT PATTERNS (ALWAYS DO THESE)
 * ✅ Use CSS variables: text-foreground, bg-background
 * ✅ Use Tailwind scale: p-4, p-6, gap-2, gap-4
 * ✅ Use semantic colors: text-primary, bg-secondary
 * ✅ Use standard radius: rounded-lg, rounded-md
 * ✅ Use shadcn components: <Card>, <Badge>, <Button>
 * ✅ Use consistent padding: p-6 for cards
 */
