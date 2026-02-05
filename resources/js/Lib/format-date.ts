import { format, parseISO } from 'date-fns';

/**
 * Map user-friendly date format strings to date-fns format patterns
 */
const dateFormatMap: Record<string, string> = {
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd',
    'DD Mon YYYY': 'dd MMM yyyy',
};

/**
 * Format a date according to user preferences
 * @param date - Date string (ISO format) or Date object
 * @param userFormat - User's preferred format ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export function formatDate(
    date: string | Date | null | undefined,
    userFormat: string = 'DD/MM/YYYY'
): string {
    if (!date) return '';

    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        const formatPattern = dateFormatMap[userFormat] || 'dd/MM/yyyy';
        return format(d, formatPattern);
    } catch {
        return typeof date === 'string' ? date : '';
    }
}

/**
 * Format a time according to user preferences
 * @param date - Date string (ISO format) or Date object
 * @param use12Hour - Whether to use 12-hour format (true) or 24-hour format (false)
 * @returns Formatted time string
 */
export function formatTime(
    date: string | Date | null | undefined,
    use12Hour: boolean = true
): string {
    if (!date) return '';

    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        return format(d, use12Hour ? 'h:mm a' : 'HH:mm');
    } catch {
        return '';
    }
}

/**
 * Format both date and time according to user preferences
 * @param date - Date string (ISO format) or Date object
 * @param dateFormat - User's preferred date format
 * @param timeFormat - User's preferred time format ('12h' or '24h')
 * @returns Formatted date and time string
 */
export function formatDateTime(
    date: string | Date | null | undefined,
    dateFormat: string = 'DD/MM/YYYY',
    timeFormat: string = '12h'
): string {
    if (!date) return '';

    const formattedDate = formatDate(date, dateFormat);
    const formattedTime = formatTime(date, timeFormat === '12h');

    return `${formattedDate} ${formattedTime}`.trim();
}

/**
 * Format a date for display with relative day names (Today, Tomorrow)
 * @param date - Date string (ISO format) or Date object
 * @param userFormat - User's preferred format
 * @returns Formatted date string with "Today" or "Tomorrow" if applicable
 */
export function formatDateWithRelative(
    date: string | Date | null | undefined,
    userFormat: string = 'DD/MM/YYYY'
): string {
    if (!date) return '';

    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if same day
        if (
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
        ) {
            return 'Today';
        }

        // Check if tomorrow
        if (
            d.getDate() === tomorrow.getDate() &&
            d.getMonth() === tomorrow.getMonth() &&
            d.getFullYear() === tomorrow.getFullYear()
        ) {
            return 'Tomorrow';
        }

        return formatDate(date, userFormat);
    } catch {
        return formatDate(date, userFormat);
    }
}

/**
 * Format a date for display in a friendly format (e.g., "Mon, Jan 15")
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string
 */
export function formatDateFriendly(date: string | Date | null | undefined): string {
    if (!date) return '';

    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        return format(d, 'EEE, MMM d');
    } catch {
        return '';
    }
}

/**
 * Format a date for display in a long format (e.g., "Monday, January 15, 2026")
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string
 */
export function formatDateLong(date: string | Date | null | undefined): string {
    if (!date) return '';

    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        return format(d, 'EEEE, MMMM d, yyyy');
    } catch {
        return '';
    }
}
