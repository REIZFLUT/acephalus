import { useState, useCallback, useEffect } from 'react';
import { Code } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type {
    FilterConditionGroup,
    FilterField,
    FilterSortRule,
} from '@/types';
import { ConditionGroupEditor } from './builder/ConditionGroupEditor';
import { SortEditor } from './builder/SortEditor';

interface FilterBuilderProps {
    conditions: FilterConditionGroup;
    sort: FilterSortRule[];
    availableFields: FilterField[];
    rawQuery?: Record<string, unknown> | null;
    onChange: (conditions: FilterConditionGroup, sort: FilterSortRule[], rawQuery?: Record<string, unknown> | null) => void;
    showRawQueryMode?: boolean;
}

export function FilterBuilder({
    conditions,
    sort,
    availableFields,
    rawQuery,
    onChange,
    showRawQueryMode = false,
}: FilterBuilderProps) {
    const [isRawMode, setIsRawMode] = useState(!!rawQuery);
    const [rawQueryText, setRawQueryText] = useState(
        rawQuery ? JSON.stringify(rawQuery, null, 2) : ''
    );
    const [rawQueryError, setRawQueryError] = useState<string | null>(null);

    // Sync isRawMode when rawQuery prop changes (e.g., when dialog opens with different filter)
    useEffect(() => {
        const hasRawQuery = rawQuery !== null && rawQuery !== undefined && Object.keys(rawQuery).length > 0;
        setIsRawMode(hasRawQuery);
        setRawQueryText(hasRawQuery ? JSON.stringify(rawQuery, null, 2) : '');
        setRawQueryError(null);
    }, [rawQuery]);

    const handleConditionsChange = useCallback((newConditions: FilterConditionGroup) => {
        onChange(newConditions, sort, rawQuery);
    }, [sort, rawQuery, onChange]);

    const handleSortChange = useCallback((newSort: FilterSortRule[]) => {
        onChange(conditions, newSort, rawQuery);
    }, [conditions, rawQuery, onChange]);

    const handleRawQueryChange = useCallback((text: string) => {
        setRawQueryText(text);
        setRawQueryError(null);
        
        if (!text.trim()) {
            onChange(conditions, sort, null);
            return;
        }

        try {
            const parsed = JSON.parse(text);
            onChange(conditions, sort, parsed);
        } catch {
            setRawQueryError('Invalid JSON');
        }
    }, [conditions, sort, onChange]);

    const toggleRawMode = () => {
        if (isRawMode) {
            // Switching to visual mode - clear raw query
            onChange(conditions, sort, null);
            setRawQueryText('');
            setRawQueryError(null);
        }
        setIsRawMode(!isRawMode);
    };

    return (
        <div className="space-y-4">
            {showRawQueryMode && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="raw-mode"
                            checked={isRawMode}
                            onCheckedChange={toggleRawMode}
                        />
                        <Label htmlFor="raw-mode" className="flex items-center gap-2 cursor-pointer">
                            <Code className="size-4" />
                            Raw MongoDB Query
                        </Label>
                    </div>
                    {isRawMode && (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Advanced Mode
                        </Badge>
                    )}
                </div>
            )}

            {isRawMode ? (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">MongoDB Query</CardTitle>
                        <CardDescription>
                            Write a raw MongoDB find query. Only read operations are allowed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={rawQueryText}
                            onChange={(e) => handleRawQueryChange(e.target.value)}
                            placeholder={'{\n  "status": "published",\n  "metadata.category": { "$in": ["news", "blog"] }\n}'}
                            className="font-mono text-sm min-h-[200px]"
                        />
                        {rawQueryError && (
                            <p className="text-sm text-destructive mt-2">{rawQueryError}</p>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Conditions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Filter Conditions</CardTitle>
                            <CardDescription>
                                Define conditions to filter content
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ConditionGroupEditor
                                group={conditions}
                                availableFields={availableFields}
                                onChange={handleConditionsChange}
                            />
                        </CardContent>
                    </Card>

                    {/* Sorting */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Sort Order</CardTitle>
                            <CardDescription>
                                Define how results should be sorted
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SortEditor
                                sort={sort}
                                availableFields={availableFields}
                                onChange={handleSortChange}
                            />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

export default FilterBuilder;
