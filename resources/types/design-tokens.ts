/**
 * Design Token Types
 *
 * These types enforce design system constraints at the TypeScript level.
 * Components must only use values from these unions.
 *
 * DO NOT use arbitrary values. DO NOT bypass these types.
 */

// ==================== Color Tokens ====================

export type ColorToken =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'destructive-foreground'
  | 'border'
  | 'input'
  | 'ring'
  | 'success'
  | 'success-foreground'
  | 'warning'
  | 'warning-foreground'
  | 'info'
  | 'info-foreground';

// ==================== Spacing Tokens ====================

export type SpacingToken =
  | '0'
  | '0.5'
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '14'
  | '16'
  | '20'
  | '24'
  | '28'
  | '32'
  | '36'
  | '40'
  | '44'
  | '48'
  | '52'
  | '56'
  | '60'
  | '64'
  | '72'
  | '80'
  | '96';

// ==================== Typography Tokens ====================

export type FontSizeToken =
  | 'xs'    // 12px - captions, labels
  | 'sm'    // 14px - small body, muted
  | 'base'  // 16px - body text
  | 'lg'    // 18px - large body
  | 'xl'    // 20px - h4
  | '2xl'   // 24px - h3
  | '3xl'   // 30px - h2
  | '4xl';  // 36px - h1

export type FontWeightToken =
  | 'normal'    // 400
  | 'medium'    // 500
  | 'semibold'  // 600
  | 'bold';     // 700

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// ==================== Radius Tokens ====================

export type RadiusToken =
  | 'none'
  | 'sm'
  | 'md'
  | 'lg'
  | 'full';

// ==================== Border Tokens ====================

export type BorderWidthToken =
  | '0'
  | 'DEFAULT'  // 1px
  | '2';

// ==================== Semantic Typography Variants ====================

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'body-large'
  | 'body-small'
  | 'caption'
  | 'muted';

// Mapping of semantic variants to actual token values
export const typographyVariants: Record<
  TypographyVariant,
  { size: FontSizeToken; weight: FontWeightToken }
> = {
  h1: { size: '4xl', weight: 'bold' },
  h2: { size: '3xl', weight: 'semibold' },
  h3: { size: '2xl', weight: 'semibold' },
  h4: { size: 'xl', weight: 'semibold' },
  body: { size: 'base', weight: 'normal' },
  'body-large': { size: 'lg', weight: 'normal' },
  'body-small': { size: 'sm', weight: 'normal' },
  caption: { size: 'xs', weight: 'normal' },
  muted: { size: 'sm', weight: 'normal' },
};

// ==================== Component Size Variants ====================

export type ComponentSize = 'sm' | 'md' | 'lg';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'outline';
