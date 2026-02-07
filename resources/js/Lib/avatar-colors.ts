/**
 * Shared avatar color palette using Tailwind v4 semantic tokens.
 * Uses -subtle backgrounds and -subtle-foreground text for consistency with Badge/Alert components.
 * Cycles through multiple colors for visual variety across family members, insurance members, etc.
 */
export const avatarColors = [
  { bg: 'hsl(var(--primary-subtle))', text: 'hsl(var(--primary-subtle-foreground))' },
  { bg: 'hsl(var(--success-subtle))', text: 'hsl(var(--success-subtle-foreground))' },
  { bg: 'hsl(var(--warning-subtle))', text: 'hsl(var(--warning-subtle-foreground))' },
  { bg: 'hsl(var(--destructive-subtle))', text: 'hsl(var(--destructive-subtle-foreground))' },
  { bg: 'hsl(var(--info-subtle))', text: 'hsl(var(--info-subtle-foreground))' },
  { bg: 'hsl(var(--muted))', text: 'hsl(var(--foreground))' },
  { bg: 'hsl(var(--accent))', text: 'hsl(var(--accent-foreground))' },
  { bg: 'hsl(var(--icon-bg))', text: 'hsl(var(--icon))' },
];

/**
 * Get avatar color pair by index (cycles through the palette).
 */
export function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}
