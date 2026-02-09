import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

interface AccessibilitySettings {
    text_size: number;
    high_contrast: boolean;
}

interface UserPreferences {
    language: string;
    date_format: string;
    time_format: string;
    accessibility: AccessibilitySettings;
}

interface PageProps {
    userPreferences: UserPreferences | null;
}

/**
 * Hook to apply user accessibility preferences (text size and high contrast mode).
 * Reads from global Inertia props and applies to document root.
 * Used across all layouts to ensure consistent accessibility support.
 */
export function useAccessibilityPreferences() {
    const { props } = usePage<PageProps>();

    useEffect(() => {
        const prefs = props.userPreferences;
        if (prefs?.accessibility) {
            // Apply text size via CSS zoom (fixed pixel sizes don't respond to root fontSize)
            const textSize = prefs.accessibility.text_size || 14;
            const scale = textSize / 14;
            document.documentElement.style.zoom = String(scale);

            // Apply high contrast mode
            if (prefs.accessibility.high_contrast) {
                document.documentElement.classList.add('high-contrast');
            } else {
                document.documentElement.classList.remove('high-contrast');
            }
        }

        // Cleanup on unmount
        return () => {
            document.documentElement.style.zoom = '';
            document.documentElement.classList.remove('high-contrast');
        };
    }, [props.userPreferences]);
}
