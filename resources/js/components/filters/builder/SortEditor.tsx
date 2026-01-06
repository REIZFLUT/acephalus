import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FilterField, FilterSortRule } from '@/types';

interface SortEditorProps {
    sort: FilterSortRule[];
    availableFields: FilterField[];
    onChange: (sort: FilterSortRule[]) => void;
}

export function SortEditor({ sort, availableFields, onChange }: SortEditorProps) {
    const addSort = () => {
        const usedFields = sort.map(s => s.field);
        const availableForSort = availableFields.filter(f => !usedFields.includes(f.field));
        if (availableForSort.length === 0) return;
        
        onChange([...sort, { field: availableForSort[0].field, direction: 'asc' }]);
    };

    const updateSort = (index: number, rule: FilterSortRule) => {
        const newSort = [...sort];
        newSort[index] = rule;
        onChange(newSort);
    };

    const removeSort = (index: number) => {
        onChange(sort.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            {sort.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <GripVertical className="size-4 text-muted-foreground cursor-move shrink-0" />
                    
                    <div className="flex-1 min-w-[160px]">
                        <Select value={rule.field} onValueChange={(field) => updateSort(index, { ...rule, field })}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableFields.map((field) => (
                                    <SelectItem key={field.field} value={field.field}>
                                        {field.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[140px]">
                        <Select 
                            value={rule.direction} 
                            onValueChange={(direction: 'asc' | 'desc') => updateSort(index, { ...rule, direction })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Ascending</SelectItem>
                                <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSort(index)}
                        className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ))}

            {sort.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                    No custom sorting. Results will use default order.
                </div>
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={addSort}
                disabled={sort.length >= availableFields.length}
            >
                <Plus className="size-4 mr-1" />
                Add Sort Rule
            </Button>
        </div>
    );
}

