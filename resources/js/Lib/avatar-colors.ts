/**
 * Shared avatar color palette using dedicated identity tokens (not semantic status colors).
 * These are neutral colors for distinguishing people, not for communicating state.
 * Automatically adapts to light/dark/high-contrast modes.
 */
export const avatarColors = [
  { bg: 'hsl(var(--avatar-1-bg))', text: 'hsl(var(--avatar-1))' },      // Cyan
  { bg: 'hsl(var(--avatar-2-bg))', text: 'hsl(var(--avatar-2))' },      // Purple
  { bg: 'hsl(var(--avatar-3-bg))', text: 'hsl(var(--avatar-3))' },      // Indigo
  { bg: 'hsl(var(--avatar-4-bg))', text: 'hsl(var(--avatar-4))' },      // Pink
  { bg: 'hsl(var(--avatar-5-bg))', text: 'hsl(var(--avatar-5))' },      // Emerald
  { bg: 'hsl(var(--avatar-6-bg))', text: 'hsl(var(--avatar-6))' },      // Orange
  { bg: 'hsl(var(--avatar-7-bg))', text: 'hsl(var(--avatar-7))' },      // Amber
];

/**
 * Get avatar color pair by index (cycles through the palette).
 */
export function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

/**
 * Get avatar color pair by name (deterministic color based on name string).
 */
export function getAvatarColorByName(name: string) {
  // Simple hash function to convert name to index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);
  return avatarColors[index % avatarColors.length];
}
