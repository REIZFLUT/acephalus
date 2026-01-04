import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, BookCopy } from 'lucide-react';
import { EditionIcon } from '@/components/EditionIcon';
import type { Edition, BlockElement } from '@/types';

interface EditionPreviewFilterProps {
    editions: Edition[];
    contentEditions: string[];
    previewEdition: string | null;
    onPreviewEditionChange: (edition: string | null) => void;
}

export function EditionPreviewFilter({
    editions,
    contentEditions,
    previewEdition,
    onPreviewEditionChange,
}: EditionPreviewFilterProps) {
    if (editions.length === 0) {
        return null;
    }

    const isPreviewActive = previewEdition !== null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
            <Eye className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Preview:</span>
            <Select
                value={previewEdition || 'all'}
                onValueChange={(value) => onPreviewEditionChange(value === 'all' ? null : value)}
            >
                <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="All Editions" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <BookCopy className="size-4" />
                            All Editions
                        </div>
                    </SelectItem>
                    {editions.map((edition) => (
                        <SelectItem key={edition.slug} value={edition.slug}>
                            <div className="flex items-center gap-2">
                                <EditionIcon iconName={edition.icon} className="size-4" />
                                {edition.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isPreviewActive && (
                <Badge variant="secondary" className="gap-1">
                    <EyeOff className="size-3" />
                    Filtering
                </Badge>
            )}
        </div>
    );
}

/**
 * Checks if content is visible for a given edition based on hierarchical rules.
 * - Empty editions array means "all editions" (always visible)
 * - Content visibility takes precedence over element visibility
 */
export function isContentVisibleForEdition(
    contentEditions: string[],
    previewEdition: string | null
): boolean {
    // No filter active - everything visible
    if (previewEdition === null) {
        return true;
    }

    // No editions set on content - all editions (visible)
    if (!contentEditions || contentEditions.length === 0) {
        return true;
    }

    // Check if the edition matches
    return contentEditions.includes(previewEdition);
}

/**
 * Checks if an element is visible for a given edition.
 * - Content visibility takes precedence
 * - Empty editions array means "all editions" (follows content rule)
 */
export function isElementVisibleForEdition(
    elementEditions: string[] | undefined,
    contentEditions: string[],
    previewEdition: string | null
): boolean {
    // No filter active - everything visible
    if (previewEdition === null) {
        return true;
    }

    // First check if content is visible
    const contentVisible = isContentVisibleForEdition(contentEditions, previewEdition);
    if (!contentVisible) {
        return false;
    }

    // No editions set on element - follows content (visible)
    if (!elementEditions || elementEditions.length === 0) {
        return true;
    }

    // Check if the edition matches
    return elementEditions.includes(previewEdition);
}

/**
 * Filters elements based on edition visibility rules.
 * Returns elements with hidden elements marked or removed.
 */
export function filterElementsForPreview(
    elements: BlockElement[],
    contentEditions: string[],
    previewEdition: string | null
): BlockElement[] {
    if (previewEdition === null) {
        return elements;
    }

    // Content not visible - return empty
    if (!isContentVisibleForEdition(contentEditions, previewEdition)) {
        return [];
    }

    // Filter elements recursively
    return elements
        .filter((el) => isElementVisibleForEdition(el.editions, contentEditions, previewEdition))
        .map((el) => {
            if (el.children) {
                return {
                    ...el,
                    children: filterElementsForPreview(el.children, contentEditions, previewEdition),
                };
            }
            return el;
        });
}

/**
 * Get a set of element IDs that are hidden for the current preview edition.
 */
export function getHiddenElementIds(
    elements: BlockElement[],
    contentEditions: string[],
    previewEdition: string | null
): Set<string> {
    const hiddenIds = new Set<string>();

    if (previewEdition === null) {
        return hiddenIds;
    }

    const collectHiddenIds = (els: BlockElement[]) => {
        for (const el of els) {
            if (!isElementVisibleForEdition(el.editions, contentEditions, previewEdition)) {
                hiddenIds.add(el.id);
            }
            if (el.children) {
                collectHiddenIds(el.children);
            }
        }
    };

    collectHiddenIds(elements);
    return hiddenIds;
}

