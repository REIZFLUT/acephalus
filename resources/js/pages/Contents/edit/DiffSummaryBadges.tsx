import { Plus, Minus, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { VersionDiffSummary } from '@/types';

interface DiffSummaryBadgesProps {
    diff: VersionDiffSummary;
}

export function DiffSummaryBadges({ diff }: DiffSummaryBadgesProps) {
    if (diff.added === 0 && diff.removed === 0 && diff.modified === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1.5">
            {diff.added > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <Plus className="size-3" />
                    {diff.added}
                </Badge>
            )}
            {diff.removed > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                    <Minus className="size-3" />
                    {diff.removed}
                </Badge>
            )}
            {diff.modified > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                    <Pencil className="size-3" />
                    {diff.modified}
                </Badge>
            )}
        </div>
    );
}

