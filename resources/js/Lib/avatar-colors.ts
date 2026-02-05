/**
 * Shared avatar color palette using CSS variables for high contrast mode support.
 * Used across Dashboard, Insurance, FamilyMembers pages.
 */
export const avatarColors = [
  { bg: 'hsl(var(--primary) / 0.15)', text: 'hsl(var(--primary))' },
  { bg: 'hsl(var(--destructive) / 0.15)', text: 'hsl(var(--destructive))' },
  { bg: 'hsl(var(--success) / 0.15)', text: 'hsl(var(--success))' },
  { bg: 'hsl(var(--warning) / 0.15)', text: 'hsl(var(--warning))' },
  { bg: 'hsl(var(--info) / 0.15)', text: 'hsl(var(--info))' },
];

/**
 * Get avatar color pair by index (cycles through the palette).
 */
export function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}
