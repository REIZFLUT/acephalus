import { useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type {
    FilterCondition,
    FilterConditionGroup,
    FilterField,
    FilterOperator,
    FilterSortRule,
} from '@/types';

interface FilterBuilderProps {
    conditions: FilterConditionGroup;
    sort: FilterSortRule[];
    availableFields: FilterField[];
    rawQuery?: Record<string, unknown> | null;
    onChange: (conditions: FilterConditionGroup, sort: FilterSortRule[], rawQuery?: Record<string, unknown> | null) => void;
    showRawQueryMode?: boolean;
}

const operatorLabels: Record<FilterOperator, string> = {
    equals: 'Equals',
    not_equals: 'Not equals',
    contains: 'Contains',
    not_contains: 'Does not contain',
    starts_with: 'Starts with',
    ends_with: 'Ends with',
    in: 'Is one of',
    not_in: 'Is not one of',
    gt: 'Greater than',
    gte: 'Greater than or equal',
    lt: 'Less than',
    lte: 'Less than or equal',
    exists: 'Exists',
    not_exists: 'Does not exist',
    regex: 'Matches regex',
    is_empty: 'Is empty',
    is_not_empty: 'Is not empty',
};

const operatorsForType: Record<string, FilterOperator[]> = {
    text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'in', 'not_in', 'regex', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    textarea: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    number: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'exists', 'not_exists'],
    boolean: ['equals', 'not_equals', 'exists', 'not_exists'],
    date: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists'],
    datetime: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists'],
    time: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists'],
    select: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    multi_select: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    email: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
    url: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
};

const operatorsRequiringNoValue: FilterOperator[] = ['exists', 'not_exists', 'is_empty', 'is_not_empty'];
const operatorsRequiringArrayValue: FilterOperator[] = ['in', 'not_in'];

function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

interface ConditionEditorProps {
    condition: FilterCondition;
    availableFields: FilterField[];
    onChange: (condition: FilterCondition) => void;
    onRemove: () => void;
}

function ConditionEditor({ condition, availableFields, onChange, onRemove }: ConditionEditorProps) {
    const selectedField = availableFields.find(f => f.field === condition.field);
    const fieldType = selectedField?.type || 'text';
    const operators = operatorsForType[fieldType] || operatorsForType.text;
    const needsValue = !operatorsRequiringNoValue.includes(condition.operator);
    const needsArrayValue = operatorsRequiringArrayValue.includes(condition.operator);

    const handleFieldChange = (field: string) => {
        const newField = availableFields.find(f => f.field === field);
        const newType = newField?.type || 'text';
        const validOperators = operatorsForType[newType] || operatorsForType.text;
        const newOperator = validOperators.includes(condition.operator) ? condition.operator : validOperators[0];
        
        onChange({
            ...condition,
            field,
            operator: newOperator,
            value: needsArrayValue ? [] : '',
        });
    };

    const handleOperatorChange = (operator: FilterOperator) => {
        const newNeedsArrayValue = operatorsRequiringArrayValue.includes(operator);
        onChange({
            ...condition,
            operator,
            value: newNeedsArrayValue ? (Array.isArray(condition.value) ? condition.value : []) : (Array.isArray(condition.value) ? '' : condition.value),
        });
    };

    const handleValueChange = (value: unknown) => {
        onChange({ ...condition, value });
    };

    return (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <GripVertical className="size-4 text-muted-foreground mt-2.5 cursor-move shrink-0" />
            
            {/* Field Select */}
            <div className="flex-1 min-w-[140px]">
                <Select value={condition.field} onValueChange={handleFieldChange}>
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

            {/* Operator Select */}
            <div className="flex-1 min-w-[160px]">
                <Select value={condition.operator} onValueChange={handleOperatorChange}>
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                        {operators.map((op) => (
                            <SelectItem key={op} value={op}>
                                {operatorLabels[op]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Value Input */}
            {needsValue && (
                <div className="flex-1 min-w-[180px]">
                    {selectedField?.options && selectedField.options.length > 0 ? (
                        <Select 
                            value={String(condition.value || '')} 
                            onValueChange={handleValueChange}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedField.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : fieldType === 'boolean' ? (
                        <Select 
                            value={String(condition.value)} 
                            onValueChange={(v) => handleValueChange(v === 'true')}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : fieldType === 'number' ? (
                        <Input
                            type="number"
                            value={String(condition.value || '')}
                            onChange={(e) => handleValueChange(Number(e.target.value))}
                            placeholder="Value"
                            className="h-9"
                        />
                    ) : fieldType === 'date' || fieldType === 'datetime' ? (
                        <Input
                            type={fieldType === 'datetime' ? 'datetime-local' : 'date'}
                            value={String(condition.value || '')}
                            onChange={(e) => handleValueChange(e.target.value)}
                            className="h-9"
                        />
                    ) : needsArrayValue ? (
                        <Input
                            value={Array.isArray(condition.value) ? condition.value.join(', ') : ''}
                            onChange={(e) => handleValueChange(e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
                            placeholder="value1, value2, ..."
                            className="h-9"
                        />
                    ) : (
                        <Input
                            value={String(condition.value || '')}
                            onChange={(e) => handleValueChange(e.target.value)}
                            placeholder="Value"
                            className="h-9"
                        />
                    )}
                </div>
            )}

            <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="size-9 text-muted-foreground hover:text-destructive shrink-0"
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

interface ConditionGroupEditorProps {
    group: FilterConditionGroup;
    availableFields: FilterField[];
    onChange: (group: FilterConditionGroup) => void;
    onRemove?: () => void;
    depth?: number;
}

function ConditionGroupEditor({ group, availableFields, onChange, onRemove, depth = 0 }: ConditionGroupEditorProps) {
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

interface SortEditorProps {
    sort: FilterSortRule[];
    availableFields: FilterField[];
    onChange: (sort: FilterSortRule[]) => void;
}

function SortEditor({ sort, availableFields, onChange }: SortEditorProps) {
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

