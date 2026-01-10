import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TranslatableInput } from '@/components/ui/translatable-input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
    Plus, 
    Trash2, 
    GripVertical, 
    ChevronDown, 
    ChevronRight,
    Copy,
    Settings2,
} from 'lucide-react';
import type { 
    CustomElementField, 
    CustomElementInputType, 
    TranslatableString,
    CustomElementOption,
} from '@/types';
import { normalizeToTranslatable, useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

interface FieldDesignerProps {
    fields: CustomElementField[];
    onChange: (fields: CustomElementField[]) => void;
    inputTypes: CustomElementInputType[];
    gridSizes: string[];
}

const inputTypeLabels: Record<CustomElementInputType, string> = {
    text: 'Text',
    textarea: 'Textarea',
    number: 'Number',
    email: 'Email',
    url: 'URL',
    tel: 'Phone',
    password: 'Password',
    color: 'Color Picker',
    date: 'Date',
    datetime: 'Date & Time',
    time: 'Time',
    checkbox: 'Checkbox',
    switch: 'Switch',
    toggle: 'Toggle Group',
    radio: 'Radio Buttons',
    select: 'Select Dropdown',
    combobox: 'Combobox',
    multi_select: 'Multi Select',
    tags: 'Tags',
    slider: 'Slider',
    range: 'Range',
    editor: 'Code Editor',
    code: 'Code',
    markdown: 'Markdown',
    json: 'JSON',
    media: 'Media Picker',
    reference: 'Reference',
    hidden: 'Hidden',
};

const inputTypeCategories: Record<string, CustomElementInputType[]> = {
    'Text': ['text', 'textarea', 'email', 'url', 'tel', 'password'],
    'Numbers': ['number', 'slider', 'range'],
    'Selection': ['select', 'combobox', 'multi_select', 'radio', 'toggle', 'tags'],
    'Boolean': ['checkbox', 'switch'],
    'Date/Time': ['date', 'datetime', 'time'],
    'Rich Content': ['editor', 'code', 'markdown', 'json'],
    'Media': ['media', 'reference'],
    'Other': ['color', 'hidden'],
};

const gridSizeLabels: Record<string, string> = {
    full: 'Full Width',
    half: 'Half',
    third: 'Third',
    quarter: 'Quarter',
};

const needsOptions = ['select', 'combobox', 'multi_select', 'radio', 'toggle'];

export function FieldDesigner({ fields, onChange, inputTypes, gridSizes }: FieldDesignerProps) {
    const { resolveTranslation } = useTranslation();
    const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const createEmptyField = useCallback((): CustomElementField => ({
        name: `field_${Date.now()}`,
        label: { en: 'New Field' },
        inputType: 'text',
        required: false,
        grid: 'full',
    }), []);

    const addField = useCallback(() => {
        const newField = createEmptyField();
        onChange([...fields, newField]);
        setExpandedFields((prev) => new Set([...prev, newField.name]));
    }, [fields, onChange, createEmptyField]);

    const removeField = useCallback((index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        onChange(newFields);
    }, [fields, onChange]);

    const duplicateField = useCallback((index: number) => {
        const fieldToDuplicate = fields[index];
        const newField: CustomElementField = {
            ...fieldToDuplicate,
            name: `${fieldToDuplicate.name}_copy`,
            label: typeof fieldToDuplicate.label === 'string' 
                ? `${fieldToDuplicate.label} (Copy)`
                : { ...fieldToDuplicate.label, en: `${fieldToDuplicate.label.en} (Copy)` },
        };
        const newFields = [...fields];
        newFields.splice(index + 1, 0, newField);
        onChange(newFields);
        setExpandedFields((prev) => new Set([...prev, newField.name]));
    }, [fields, onChange]);

    const updateField = useCallback((index: number, updates: Partial<CustomElementField>) => {
        const newFields = fields.map((field, i) => 
            i === index ? { ...field, ...updates } : field
        );
        onChange(newFields);
    }, [fields, onChange]);

    const toggleExpanded = useCallback((fieldName: string) => {
        setExpandedFields((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(fieldName)) {
                newSet.delete(fieldName);
            } else {
                newSet.add(fieldName);
            }
            return newSet;
        });
    }, []);

    // Drag and drop handlers
    const handleDragStart = useCallback((index: number) => {
        setDraggedIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newFields = [...fields];
        const [removed] = newFields.splice(draggedIndex, 1);
        newFields.splice(index, 0, removed);
        onChange(newFields);
        setDraggedIndex(index);
    }, [draggedIndex, fields, onChange]);

    const handleDragEnd = useCallback(() => {
        setDraggedIndex(null);
    }, []);

    return (
        <div className="space-y-4">
            {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">
                        No fields defined. Add your first field to get started.
                    </p>
                    <Button onClick={addField} variant="outline">
                        <Plus className="size-4 mr-2" />
                        Add Field
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <FieldEditor
                            key={`${field.name}-${index}`}
                            field={field}
                            index={index}
                            isExpanded={expandedFields.has(field.name)}
                            onToggleExpanded={() => toggleExpanded(field.name)}
                            onUpdate={(updates) => updateField(index, updates)}
                            onRemove={() => removeField(index)}
                            onDuplicate={() => duplicateField(index)}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedIndex === index}
                            inputTypes={inputTypes}
                            gridSizes={gridSizes}
                            resolveTranslation={resolveTranslation}
                        />
                    ))}
                </div>
            )}

            <Button onClick={addField} variant="outline" className="w-full">
                <Plus className="size-4 mr-2" />
                Add Field
            </Button>
        </div>
    );
}

interface FieldEditorProps {
    field: CustomElementField;
    index: number;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    onUpdate: (updates: Partial<CustomElementField>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    inputTypes: CustomElementInputType[];
    gridSizes: string[];
    resolveTranslation: (value: any) => string;
}

function FieldEditor({
    field,
    index,
    isExpanded,
    onToggleExpanded,
    onUpdate,
    onRemove,
    onDuplicate,
    onDragStart,
    onDragOver,
    onDragEnd,
    isDragging,
    inputTypes,
    gridSizes,
    resolveTranslation,
}: FieldEditorProps) {
    const showOptions = needsOptions.includes(field.inputType);

    return (
        <Card 
            className={cn(
                'transition-opacity',
                isDragging && 'opacity-50'
            )}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
                <CardHeader className="p-3">
                    <div className="flex items-center gap-2">
                        <div className="cursor-grab">
                            <GripVertical className="size-4 text-muted-foreground" />
                        </div>
                        
                        <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                            {isExpanded ? (
                                <ChevronDown className="size-4" />
                            ) : (
                                <ChevronRight className="size-4" />
                            )}
                            <span className="font-medium">
                                {resolveTranslation(field.label)}
                            </span>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {field.name}
                            </code>
                        </CollapsibleTrigger>

                        <Badge variant="outline" className="text-xs">
                            {inputTypeLabels[field.inputType] || field.inputType}
                        </Badge>

                        {field.required && (
                            <Badge variant="default" className="text-xs">Required</Badge>
                        )}

                        <Button variant="ghost" size="icon" className="size-8" onClick={onDuplicate}>
                            <Copy className="size-3.5" />
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="size-8 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Field</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete "{resolveTranslation(field.label)}"?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onRemove}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="p-3 pt-0 space-y-4">
                        {/* Basic Settings */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Label *</Label>
                                <TranslatableInput
                                    value={normalizeToTranslatable(field.label)}
                                    onChange={(value) => onUpdate({ label: value })}
                                    placeholder="Field label"
                                    modalTitle="Label Translations"
                                    modalDescription="Add translations for the field label."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Field Name *</Label>
                                <Input
                                    value={field.name}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9_]/g, '')
                                            .replace(/^[0-9]/, '');
                                        onUpdate({ name: value });
                                    }}
                                    placeholder="field_name"
                                    className="font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Lowercase letters, numbers, underscores. Used as data key.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Input Type *</Label>
                                <Select
                                    value={field.inputType}
                                    onValueChange={(value: CustomElementInputType) => onUpdate({ inputType: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(inputTypeCategories).map(([category, types]) => (
                                            <div key={category}>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                    {category}
                                                </div>
                                                {types.filter(t => inputTypes.includes(t)).map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {inputTypeLabels[type]}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Width</Label>
                                <Select
                                    value={field.grid || 'full'}
                                    onValueChange={(value) => onUpdate({ grid: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {gridSizes.map((size) => (
                                            <SelectItem key={size} value={size}>
                                                {gridSizeLabels[size] || size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between pt-6">
                                <Label>Required</Label>
                                <Switch
                                    checked={field.required || false}
                                    onCheckedChange={(checked) => onUpdate({ required: checked })}
                                />
                            </div>
                        </div>

                        {/* Placeholder & Help Text */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Placeholder</Label>
                                <TranslatableInput
                                    value={normalizeToTranslatable(field.placeholder)}
                                    onChange={(value) => onUpdate({ placeholder: value })}
                                    placeholder="Placeholder text"
                                    modalTitle="Placeholder Translations"
                                    modalDescription="Add translations for the placeholder text."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Help Text</Label>
                                <TranslatableInput
                                    value={normalizeToTranslatable(field.helpText)}
                                    onChange={(value) => onUpdate({ helpText: value })}
                                    placeholder="Help text shown below the field"
                                    modalTitle="Help Text Translations"
                                    modalDescription="Add translations for the help text."
                                />
                            </div>
                        </div>

                        {/* Options for select-type fields */}
                        {showOptions && (
                            <OptionsEditor
                                options={field.options || []}
                                onChange={(options) => onUpdate({ options })}
                                resolveTranslation={resolveTranslation}
                            />
                        )}

                        {/* Default Value */}
                        <div className="space-y-2">
                            <Label>Default Value</Label>
                            <Input
                                value={
                                    typeof field.defaultValue === 'string' 
                                        ? field.defaultValue 
                                        : field.defaultValue !== undefined 
                                            ? JSON.stringify(field.defaultValue) 
                                            : ''
                                }
                                onChange={(e) => {
                                    let value: unknown = e.target.value;
                                    // Try to parse JSON for complex types
                                    if (field.inputType === 'json' || field.inputType === 'multi_select' || field.inputType === 'tags') {
                                        try {
                                            value = JSON.parse(e.target.value);
                                        } catch {
                                            // Keep as string if not valid JSON
                                        }
                                    }
                                    onUpdate({ defaultValue: value });
                                }}
                                placeholder="Default value (optional)"
                            />
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

interface OptionsEditorProps {
    options: CustomElementOption[];
    onChange: (options: CustomElementOption[]) => void;
    resolveTranslation: (value: any) => string;
}

function OptionsEditor({ options, onChange, resolveTranslation }: OptionsEditorProps) {
    const addOption = () => {
        onChange([
            ...options,
            { value: `option_${options.length + 1}`, label: { en: `Option ${options.length + 1}` } },
        ]);
    };

    const removeOption = (index: number) => {
        onChange(options.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, updates: Partial<CustomElementOption>) => {
        onChange(options.map((opt, i) => i === index ? { ...opt, ...updates } : opt));
    };

    return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                    <Settings2 className="size-4" />
                    Options
                </Label>
                <Button onClick={addOption} variant="outline" size="sm">
                    <Plus className="size-3 mr-1" />
                    Add Option
                </Button>
            </div>

            {options.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                    No options defined. Add options for users to select from.
                </p>
            ) : (
                <div className="space-y-2">
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                value={String(option.value)}
                                onChange={(e) => updateOption(index, { value: e.target.value })}
                                placeholder="Value"
                                className="w-32 font-mono text-sm"
                            />
                            <TranslatableInput
                                value={normalizeToTranslatable(option.label)}
                                onChange={(value) => updateOption(index, { label: value })}
                                placeholder="Label"
                                className="flex-1"
                                modalTitle="Option Label Translations"
                                modalDescription="Add translations for this option's label."
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => removeOption(index)}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
