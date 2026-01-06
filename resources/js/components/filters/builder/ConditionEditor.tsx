import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FilterCondition, FilterField, FilterOperator } from '@/types';
import {
    operatorLabels,
    operatorsForType,
    operatorsRequiringNoValue,
    operatorsRequiringArrayValue
} from './constants';

interface ConditionEditorProps {
    condition: FilterCondition;
    availableFields: FilterField[];
    onChange: (condition: FilterCondition) => void;
    onRemove: () => void;
}

export function ConditionEditor({ condition, availableFields, onChange, onRemove }: ConditionEditorProps) {
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

