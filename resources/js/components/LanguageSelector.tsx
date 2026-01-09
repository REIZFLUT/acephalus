import { useLaravelReactI18n } from 'laravel-react-i18n';
import { usePage } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

const LOCALE_LABELS: Record<string, string> = {
    en: 'English',
    de: 'Deutsch',
};

const LOCALE_FLAGS: Record<string, string> = {
    en: '🇬🇧',
    de: '🇩🇪',
};

interface LanguageSelectorProps {
    className?: string;
    showLabel?: boolean;
    variant?: 'buttons' | 'dropdown';
}

export function LanguageSelector({ className, showLabel = true, variant = 'buttons' }: LanguageSelectorProps) {
    const { currentLocale, setLocale, loading } = useLaravelReactI18n();
    const { availableLocales } = usePage<PageProps>().props;

    const handleLocaleChange = async (locale: string) => {
        if (locale === currentLocale() || loading) return;

        try {
            // Persist to backend first
            await fetch('/api/locale', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ locale }),
            });

            // Update locale in the i18n provider (this loads the translation files)
            await setLocale(locale);
        } catch (error) {
            console.error('Failed to update locale:', error);
        }
    };

    if (variant === 'buttons') {
        return (
            <div className={cn('flex items-center gap-1', className)}>
                {showLabel && (
                    <Globe className="size-3.5 text-muted-foreground mr-1" />
                )}
                {availableLocales.map((locale) => (
                    <button
                        key={locale}
                        onClick={() => handleLocaleChange(locale)}
                        disabled={loading}
                        className={cn(
                            'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors',
                            currentLocale() === locale
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-accent/50',
                            loading && 'opacity-50 cursor-not-allowed'
                        )}
                        title={LOCALE_LABELS[locale] || locale}
                    >
                        <span>{LOCALE_FLAGS[locale] || locale.toUpperCase()}</span>
                        {showLabel && <span>{LOCALE_LABELS[locale] || locale}</span>}
                    </button>
                ))}
            </div>
        );
    }

    // Dropdown variant could be added here if needed
    return null;
}
