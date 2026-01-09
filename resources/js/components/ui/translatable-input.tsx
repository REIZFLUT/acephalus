import { useState } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { TranslationModal } from '@/components/ui/translation-modal';
import {
    normalizeToTranslatable,
    hasAdditionalTranslations,
    getTranslatedLocales,
} from '@/hooks/use-translation';
import type { LocalizableString, TranslatableString } from '@/types';

interface TranslatableInputProps {
    value: LocalizableString | undefined | null;
    onChange: (value: TranslatableString) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
    multiline?: boolean;
    rows?: number;
    modalTitle?: string;
    modalDescription?: string;
}

export function TranslatableInput({
    value,
    onChange,
    placeholder,
    className,
    inputClassName,
    disabled = false,
    multiline = false,
    rows = 3,
    modalTitle,
    modalDescription,
}: TranslatableInputProps) {
    const [modalOpen, setModalOpen] = useState(false);
    
    // Normalize value for display and editing
    const normalized = normalizeToTranslatable(value);
    const hasTranslations = hasAdditionalTranslations(value);
    const translatedLocales = getTranslatedLocales(value);
    
    // Handle direct input change (updates English value)
    const handleInputChange = (newValue: string) => {
        onChange({
            ...normalized,
            en: newValue,
        });
    };
    
    const InputComponent = multiline ? Textarea : Input;
    
    return (
        <div className={cn('relative flex items-start gap-1', className)}>
            <div className="flex-1 relative">
                <InputComponent
                    value={normalized.en || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        'pr-8',
                        hasTranslations && 'border-blue-300 dark:border-blue-700',
                        inputClassName
                    )}
                    {...(multiline ? { rows } : {})}
                />
                {hasTranslations && (
                    <Badge
                        variant="secondary"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1 py-0 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    >
                        +{translatedLocales.length - 1}
                    </Badge>
                )}
            </div>
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={cn(
                                'size-8 shrink-0',
                                hasTranslations && 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400'
                            )}
                            onClick={() => setModalOpen(true)}
                            disabled={disabled}
                        >
                            <Globe className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {hasTranslations
                            ? `Translations: ${translatedLocales.join(', ')}`
                            : 'Add translations'
                        }
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <TranslationModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                value={value}
                onChange={onChange}
                title={modalTitle}
                description={modalDescription}
                multiline={multiline}
                rows={rows}
            />
        </div>
    );
}

/**
 * Simpler variant that just shows a button to open translations
 * Useful when you want more control over the layout
 */
interface TranslationButtonProps {
    value: LocalizableString | undefined | null;
    onChange: (value: TranslatableString) => void;
    disabled?: boolean;
    multiline?: boolean;
    rows?: number;
    modalTitle?: string;
    modalDescription?: string;
    className?: string;
}

export function TranslationButton({
    value,
    onChange,
    disabled = false,
    multiline = false,
    rows = 3,
    modalTitle,
    modalDescription,
    className,
}: TranslationButtonProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const hasTranslations = hasAdditionalTranslations(value);
    const translatedLocales = getTranslatedLocales(value);
    
    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'size-7',
                                hasTranslations && 'text-blue-600 dark:text-blue-400',
                                className
                            )}
                            onClick={() => setModalOpen(true)}
                            disabled={disabled}
                        >
                            <Globe className="size-3.5" />
                            {hasTranslations && (
                                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-blue-500" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {hasTranslations
                            ? `Translations: ${translatedLocales.join(', ')}`
                            : 'Add translations'
                        }
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <TranslationModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                value={value}
                onChange={onChange}
                title={modalTitle}
                description={modalDescription}
                multiline={multiline}
                rows={rows}
            />
        </>
    );
}
