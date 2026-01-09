import { useLaravelReactI18n } from 'laravel-react-i18n';
import type { LocalizableString, TranslatableString } from '@/types';

/**
 * Check if a value is a TranslatableString object
 */
export function isTranslatableString(value: LocalizableString | undefined | null): value is TranslatableString {
    return typeof value === 'object' && value !== null && 'en' in value;
}

/**
 * Resolve a LocalizableString to a plain string based on current locale
 * Falls back to English if the current locale's translation is not available
 */
export function resolveTranslationStatic(value: LocalizableString | undefined | null, locale: string): string {
    if (value === undefined || value === null) {
        return '';
    }
    
    if (typeof value === 'string') {
        return value;
    }
    
    // It's a TranslatableString object
    return value[locale] ?? value.en ?? '';
}

/**
 * Create a TranslatableString from a plain string (sets it as English)
 */
export function createTranslatableString(value: string): TranslatableString {
    return { en: value };
}

/**
 * Normalize a LocalizableString to always be a TranslatableString
 * Useful when you need to edit translations
 */
export function normalizeToTranslatable(value: LocalizableString | undefined | null): TranslatableString {
    if (value === undefined || value === null || value === '') {
        return { en: '' };
    }
    
    if (typeof value === 'string') {
        return { en: value };
    }
    
    return value;
}

/**
 * Check if a TranslatableString has translations beyond English
 */
export function hasAdditionalTranslations(value: LocalizableString | undefined | null): boolean {
    if (!isTranslatableString(value)) {
        return false;
    }
    
    // Check if there are any non-empty translations besides English
    return Object.entries(value).some(([key, val]) => key !== 'en' && val && val.trim() !== '');
}

/**
 * Get a list of locales that have translations
 */
export function getTranslatedLocales(value: LocalizableString | undefined | null): string[] {
    if (!isTranslatableString(value)) {
        return [];
    }
    
    return Object.entries(value)
        .filter(([_, val]) => val && val.trim() !== '')
        .map(([key]) => key);
}

/**
 * Hook for resolving translatable strings based on current locale
 */
export function useTranslation() {
    const { currentLocale, t } = useLaravelReactI18n();
    
    /**
     * Resolve a LocalizableString to a plain string based on current locale
     */
    function resolveTranslation(value: LocalizableString | undefined | null): string {
        return resolveTranslationStatic(value, currentLocale());
    }
    
    /**
     * Resolve with fallback to a specific key if value is empty
     */
    function resolveOrDefault(value: LocalizableString | undefined | null, defaultKey: string): string {
        const resolved = resolveTranslation(value);
        return resolved || t(defaultKey);
    }
    
    return {
        resolveTranslation,
        resolveOrDefault,
        currentLocale,
        t,
        isTranslatableString,
        hasAdditionalTranslations,
        normalizeToTranslatable,
        createTranslatableString,
        getTranslatedLocales,
    };
}
