import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BookCopy, X } from 'lucide-react';
import { EditionIcon } from '@/components/EditionIcon';
import { useTranslation } from '@/hooks/use-translation';
import type { Edition } from '@/types';

interface EditionSelectorProps {
    editions: Edition[];
    selectedEditions: string[];
    onChange: (editions: string[]) => void;
    allowedEditions?: string[]; // If provided, only show these editions
    compact?: boolean;
}

export function EditionSelector({
    editions,
    selectedEditions,
    onChange,
    allowedEditions,
    compact = false,
}: EditionSelectorProps) {
    const { resolveTranslation } = useTranslation();
    
    // Filter editions based on allowed list
    const availableEditions = useMemo(() => {
        if (!allowedEditions || allowedEditions.length === 0) {
            return editions;
        }
        return editions.filter(e => allowedEditions.includes(e.slug));
    }, [editions, allowedEditions]);

    const isAllEditions = selectedEditions.length === 0;

    const toggleEdition = (slug: string) => {
        if (selectedEditions.includes(slug)) {
            onChange(selectedEditions.filter(e => e !== slug));
        } else {
            onChange([...selectedEditions, slug]);
        }
    };

    const clearAll = () => {
        onChange([]);
    };

    // Get display text
    const displayText = useMemo(() => {
        if (isAllEditions) {
            return 'All Editions';
        }
        if (selectedEditions.length === 1) {
            const edition = availableEditions.find(e => e.slug === selectedEditions[0]);
            return resolveTranslation(edition?.name) || selectedEditions[0];
        }
        return `${selectedEditions.length} Editions`;
    }, [isAllEditions, selectedEditions, availableEditions, resolveTranslation]);

    if (availableEditions.length === 0) {
        return null;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size={compact ? 'sm' : 'default'}
                    className={`gap-2 ${!isAllEditions ? 'border-primary/50 bg-primary/5' : ''}`}
                >
                    <BookCopy className="size-4" />
                    <span className={compact ? 'sr-only sm:not-sr-only' : ''}>
                        {displayText}
                    </span>
                    {!isAllEditions && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                            {selectedEditions.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Editions</Label>
                        {!isAllEditions && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAll}
                                className="h-6 px-2 text-xs"
                            >
                                <X className="size-3 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                        {isAllEditions 
                            ? 'Visible in all editions. Select specific editions to restrict.'
                            : 'Only visible in selected editions.'
                        }
                    </p>

                    <div className="space-y-2">
                        {availableEditions.map((edition) => (
                            <label
                                key={edition.slug}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                            >
                                <Checkbox
                                    checked={selectedEditions.includes(edition.slug)}
                                    onCheckedChange={() => toggleEdition(edition.slug)}
                                />
                                <EditionIcon iconName={edition.icon} className="size-4 text-muted-foreground" />
                                <span className="text-sm">{resolveTranslation(edition.name)}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Compact badge display for showing editions on blocks
interface EditionBadgesProps {
    editions: string[];
    allEditions: Edition[];
    onRemove?: (slug: string) => void;
}

export function EditionBadges({ editions, allEditions, onRemove }: EditionBadgesProps) {
    const { resolveTranslation } = useTranslation();
    
    if (editions.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {editions.map((slug) => {
                const edition = allEditions.find(e => e.slug === slug);
                return (
                    <Badge
                        key={slug}
                        variant="secondary"
                        className="gap-1 text-xs"
                    >
                        <EditionIcon iconName={edition?.icon} className="size-3" />
                        {resolveTranslation(edition?.name) || slug}
                        {onRemove && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(slug);
                                }}
                                className="ml-0.5 hover:text-destructive"
                            >
                                <X className="size-3" />
                            </button>
                        )}
                    </Badge>
                );
            })}
        </div>
    );
}

