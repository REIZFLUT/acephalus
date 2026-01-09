import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import { Globe, Plus, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { normalizeToTranslatable } from '@/hooks/use-translation';
import type { PageProps, TranslatableString, LocalizableString } from '@/types';

const LOCALE_LABELS: Record<string, string> = {
    en: 'English',
    de: 'Deutsch',
};

interface TranslationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: LocalizableString | undefined | null;
    onChange: (value: TranslatableString) => void;
    title?: string;
    description?: string;
    multiline?: boolean;
    rows?: number;
}

export function TranslationModal({
    open,
    onOpenChange,
    value,
    onChange,
    title = 'Edit Translations',
    description = 'Add translations for different languages. English is required.',
    multiline = false,
    rows = 3,
}: TranslationModalProps) {
    const { t } = useLaravelReactI18n();
    const { availableLocales } = usePage<PageProps>().props;
    
    // Internal state for editing
    const [translations, setTranslations] = useState<TranslatableString>({ en: '' });
    const [additionalLocales, setAdditionalLocales] = useState<string[]>([]);
    
    // Initialize state when modal opens or value changes
    useEffect(() => {
        if (open) {
            const normalized = normalizeToTranslatable(value);
            setTranslations(normalized);
            
            // Find which additional locales have values
            const localesWithValues = Object.keys(normalized).filter(
                (key) => key !== 'en' && normalized[key]
            );
            setAdditionalLocales(localesWithValues);
        }
    }, [open, value]);
    
    // Get locales that can still be added
    const availableToAdd = availableLocales.filter(
        (locale) => locale !== 'en' && !additionalLocales.includes(locale)
    );
    
    const handleTranslationChange = (locale: string, newValue: string) => {
        setTranslations((prev) => ({
            ...prev,
            [locale]: newValue,
        }));
    };
    
    const handleAddLocale = (locale: string) => {
        if (!additionalLocales.includes(locale)) {
            setAdditionalLocales((prev) => [...prev, locale]);
            setTranslations((prev) => ({
                ...prev,
                [locale]: '',
            }));
        }
    };
    
    const handleRemoveLocale = (locale: string) => {
        setAdditionalLocales((prev) => prev.filter((l) => l !== locale));
        setTranslations((prev) => {
            const { [locale]: _, ...rest } = prev;
            return rest as TranslatableString;
        });
    };
    
    const handleSave = () => {
        // Clean up empty translations (except English)
        const cleaned: TranslatableString = { en: translations.en || '' };
        
        for (const locale of additionalLocales) {
            const val = translations[locale];
            if (val && val.trim() !== '') {
                cleaned[locale] = val;
            }
        }
        
        onChange(cleaned);
        onOpenChange(false);
    };
    
    const InputComponent = multiline ? Textarea : Input;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="size-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {/* English (required) */}
                    <div className="space-y-2">
                        <Label htmlFor="translation-en" className="flex items-center gap-2">
                            <span className="text-lg">🇬🇧</span>
                            {t('English (required)')}
                        </Label>
                        <InputComponent
                            id="translation-en"
                            value={translations.en || ''}
                            onChange={(e) => handleTranslationChange('en', e.target.value)}
                            placeholder="Enter English text..."
                            {...(multiline ? { rows } : {})}
                        />
                    </div>
                    
                    {/* Additional locales */}
                    {additionalLocales.map((locale) => (
                        <div key={locale} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`translation-${locale}`} className="flex items-center gap-2">
                                    <span className="text-lg">{locale === 'de' ? '🇩🇪' : locale.toUpperCase()}</span>
                                    {LOCALE_LABELS[locale] || locale}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveLocale(locale)}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                            <InputComponent
                                id={`translation-${locale}`}
                                value={translations[locale] || ''}
                                onChange={(e) => handleTranslationChange(locale, e.target.value)}
                                placeholder={`Enter ${LOCALE_LABELS[locale] || locale} text...`}
                                {...(multiline ? { rows } : {})}
                            />
                        </div>
                    ))}
                    
                    {/* Add language button */}
                    {availableToAdd.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Select onValueChange={handleAddLocale}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('Add Translation')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableToAdd.map((locale) => (
                                        <SelectItem key={locale} value={locale}>
                                            <span className="flex items-center gap-2">
                                                <span>{locale === 'de' ? '🇩🇪' : locale.toUpperCase()}</span>
                                                {LOCALE_LABELS[locale] || locale}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {t('Cancel')}
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        {t('Save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
