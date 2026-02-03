import { usePage } from '@inertiajs/react';
import {
    formatDate as formatDateUtil,
    formatTime as formatTimeUtil,
    formatDateTime as formatDateTimeUtil,
    formatDateWithRelative as formatDateWithRelativeUtil,
    formatDateFriendly,
    formatDateLong,
} from '@/Lib/format-date';

interface UserPreferences {
    language: string;
    date_format: string;
    time_format: string;
    accessibility: {
        text_size: number;
        high_contrast: boolean;
    };
}

interface PageProps {
    userPreferences?: UserPreferences | null;
    [key: string]: unknown;
}

/**
 * Hook to access user's formatting preferences and formatted date/time functions
 */
export function useFormatPreferences() {
    const { userPreferences } = usePage<PageProps>().props;

    const dateFormat = userPreferences?.date_format || 'DD/MM/YYYY';
    const timeFormat = userPreferences?.time_format || '12h';
    const use12Hour = timeFormat === '12h';

    /**
     * Format a date according to user preferences
     */
    const formatDate = (date: string | Date | null | undefined): string => {
        return formatDateUtil(date, dateFormat);
    };

    /**
     * Format a time according to user preferences
     */
    const formatTime = (date: string | Date | null | undefined): string => {
        return formatTimeUtil(date, use12Hour);
    };

    /**
     * Format both date and time according to user preferences
     */
    const formatDateTime = (date: string | Date | null | undefined): string => {
        return formatDateTimeUtil(date, dateFormat, timeFormat);
    };

    /**
     * Format a date with relative day names (Today, Tomorrow)
     */
    const formatDateWithRelative = (date: string | Date | null | undefined): string => {
        return formatDateWithRelativeUtil(date, dateFormat);
    };

    return {
        // User preferences
        dateFormat,
        timeFormat,
        use12Hour,

        // Formatting functions (pre-configured with user preferences)
        formatDate,
        formatTime,
        formatDateTime,
        formatDateWithRelative,

        // Static formatting functions (don't use user preferences)
        formatDateFriendly,
        formatDateLong,
    };
}
