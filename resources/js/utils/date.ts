import { usePage } from '@inertiajs/react';

/**
 * Get the application locale from Inertia props (safe version)
 */
function getLocale(): string {
    try {
        // Try to access Inertia page props from window
        if (typeof window !== 'undefined') {
            const pageEl = document.getElementById('app');
            if (pageEl && pageEl.dataset.page) {
                const page = JSON.parse(pageEl.dataset.page);
                if (page.props?.locale) {
                    return page.props.locale;
                }
            }
        }
    } catch (e) {
        // Fallback to 'en' if anything goes wrong
        console.warn('Could not get locale from Inertia props, using default', e);
    }
    return 'en';
}

/**
 * Format a date according to the application's locale
 * Uses 2-digit day and month by default (e.g., 01.01.2000 instead of 1.1.2000)
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = getLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    
    return dateObj.toLocaleDateString(locale, { ...defaultOptions, ...options });
}

/**
 * Format a date and time according to the application's locale
 * Uses 2-digit day, month, hour, and minute by default
 */
export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = getLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    
    return dateObj.toLocaleString(locale, { ...defaultOptions, ...options });
}

/**
 * Get the application locale (React Hook version)
 */
export function useLocale(): string {
    const { locale } = usePage().props as { locale?: string };
    return locale || 'en';
}

/**
 * Get the application timezone (React Hook version)
 */
export function useTimezone(): string {
    const { timezone } = usePage().props as { timezone?: string };
    return timezone || 'UTC';
}

