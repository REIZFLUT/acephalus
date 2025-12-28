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
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = getLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString(locale, options);
}

/**
 * Format a date and time according to the application's locale
 */
export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = getLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleString(locale, options);
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

