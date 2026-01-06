import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { FilterCondition, FilterConditionGroup, FilterField } from '@/types';
import { ConditionEditor } from './ConditionEditor';

interface ConditionGroupEditorProps {
    group: FilterConditionGroup;
    availableFields: FilterField[];
    onChange: (group: FilterConditionGroup) => void;
    onRemove?: () => void;
    depth?: number;
}

export function ConditionGroupEditor({ group, availableFields, onChange, onRemove, depth = 0 }: ConditionGroupEditorProps) {
    const [isOpen, setIsOpen] = useState(true);

    const addCondition = () => {
        const defaultField = availableFields[0]?.field || 'title';
        const newCondition: FilterCondition = {
            type: 'condition',
            field: defaultField,
            operator: 'equals',
            value: '',
        };
        onChange({
            ...group,
            children: [...group.children, newCondition],
        });
    };

    const addGroup = () => {
        const newGroup: FilterConditionGroup = {
            type: 'group',
            operator: group.operator === 'and' ? 'or' : 'and',
            children: [],
        };
        onChange({
            ...group,
            children: [...group.children, newGroup],
        });
    };

    const updateChild = (index: number, child: FilterCondition | FilterConditionGroup) => {
        const newChildren = [...group.children];
        newChildren[index] = child;
        onChange({ ...group, children: newChildren });
    };

    const removeChild = (index: number) => {
        onChange({
            ...group,
            children: group.children.filter((_, i) => i !== index),
        });
    };

    const toggleOperator = () => {
        onChange({
            ...group,
            operator: group.operator === 'and' ? 'or' : 'and',
        });
    };

    return (
        <div className={cn(
            "border rounded-lg",
            depth === 0 ? "border-border" : "border-dashed border-muted-foreground/30"
        )}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="flex items-center justify-between p-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-6">
                                {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <span className="text-sm font-medium">Match</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleOperator}
                            className="h-7 px-2"
                        >
                            <Badge variant={group.operator === 'and' ? 'default' : 'secondary'}>
                                {group.operator.toUpperCase()}
                            </Badge>
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            of the following conditions
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {group.children.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {group.children.length} {group.children.length === 1 ? 'rule' : 'rules'}
                            </Badge>
                        )}
                        {onRemove && depth > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onRemove}
                                className="size-7 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                </div>

                <CollapsibleContent>
                    <div className="p-3 space-y-2">
                        {group.children.map((child, index) => (
                            <div key={index}>
                                {child.type === 'condition' ? (
                                    <ConditionEditor
                                        condition={child}
                                        availableFields={availableFields}
                                        onChange={(c) => updateChild(index, c)}
                                        onRemove={() => removeChild(index)}
                                    />
                                ) : (
                                    <ConditionGroupEditor
                                        group={child}
                                        availableFields={availableFields}
                                        onChange={(g) => updateChild(index, g)}
                                        onRemove={() => removeChild(index)}
                                        depth={depth + 1}
                                    />
                                )}
                            </div>
                        ))}

                        {group.children.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                                No conditions yet. Add a condition or group to start filtering.
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addCondition}
                            >
                                <Plus className="size-4 mr-1" />
                                Add Condition
                            </Button>
                            {depth < 2 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addGroup}
                                >
                                    <Plus className="size-4 mr-1" />
                                    Add Group
                                </Button>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

