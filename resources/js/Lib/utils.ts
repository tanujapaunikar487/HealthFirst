import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-display', 'text-page-title', 'text-detail-title',
        'text-banner-heading', 'text-section-title', 'text-step-title',
        'text-subheading', 'text-card-title', 'text-label', 'text-body',
        'text-caption', 'text-overline', 'text-micro',
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date for table display
 * Format: "03 Feb 2026"
 */
export function formatTableDate(date: string | null): string {
  if (!date) return '—';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format time for table display
 * Format: "2:30 PM"
 */
export function formatTableTime(date: string | null): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
