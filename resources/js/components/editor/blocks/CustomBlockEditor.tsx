import { useMemo, useCallback } from 'react';
import type { 
    CustomElementDefinition, 
    CustomElementField,
    CustomElementOption,
    LocalizableString,
} from '@/types';
import { BlockEditorProps } from '../BlockItem';
import { useCustomElements } from '@/hooks/use-custom-elements';
import { useTranslation } from '@/hooks/use-translation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CodeEditor } from '../CodeEditor';
import { WysiwygEditor } from '../WysiwygEditor';
import { ReferencePicker, ReferenceValue } from '../ReferencePicker';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface CustomBlockEditorProps extends BlockEditorProps {
    definition?: CustomElementDefinition;
}

export default function CustomBlockEditor({ block, onUpdate, definition: propDefinition }: CustomBlockEditorProps) {
    const { getDefinition, isLoading } = useCustomElements();
    const { resolveTranslation } = useTranslation();
    
    // Get definition from prop or from hook
    const definition = propDefinition || getDefinition(block.type);

    const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
        onUpdate({
            ...block.data,
            [fieldName]: value,
        });
    }, [block.data, onUpdate]);

    // Evaluate conditional visibility
    const isFieldVisible = useCallback((field: CustomElementField): boolean => {
        if (!field.conditional) return true;

        const { field: condField, operator, value: condValue } = field.conditional;
        const fieldValue = block.data[condField];

        switch (operator) {
            case 'equals':
                return fieldValue === condValue;
            case 'notEquals':
                return fieldValue !== condValue;
            case 'contains':
                return typeof fieldValue === 'string' && fieldValue.includes(String(condValue));
            case 'notContains':
                return typeof fieldValue === 'string' && !fieldValue.includes(String(condValue));
            case 'isEmpty':
                return fieldValue === null || fieldValue === undefined || fieldValue === '' || 
                       (Array.isArray(fieldValue) && fieldValue.length === 0);
            case 'isNotEmpty':
                return fieldValue !== null && fieldValue !== undefined && fieldValue !== '' &&
                       !(Array.isArray(fieldValue) && fieldValue.length === 0);
            case 'greaterThan':
                return typeof fieldValue === 'number' && typeof condValue === 'number' && fieldValue > condValue;
            case 'lessThan':
                return typeof fieldValue === 'number' && typeof condValue === 'number' && fieldValue < condValue;
            default:
                return true;
        }
    }, [block.data]);

    // Get visible fields
    const visibleFields = useMemo(() => {
        if (!definition) return [];
        return definition.fields.filter(isFieldVisible);
    }, [definition, isFieldVisible]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 mr-2 animate-spin" />
                <span>Loading element configuration...</span>
            </div>
        );
    }

    if (!definition) {
        return (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-md text-destructive">
                <AlertCircle className="size-5" />
                <span>Custom element definition not found: {block.type}</span>
            </div>
        );
    }

    // Resolve description
    const descriptionText = resolveTranslation(definition.description);

    return (
        <div className="space-y-4">
            {/* Description if available */}
            {descriptionText && (
                <p className="text-sm text-muted-foreground">{descriptionText}</p>
            )}

            {/* Fields Grid */}
            <div className="grid grid-cols-4 gap-4">
                {visibleFields.map((field) => {
                    const gridClass = getGridClass(field.grid);
                    const value = block.data[field.name];

                    return (
                        <div key={field.name} className={cn('space-y-2', gridClass)}>
                            <FieldRenderer
                                field={field}
                                value={value}
                                onChange={(newValue) => handleFieldChange(field.name, newValue)}
                                resolveTranslation={resolveTranslation}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface FieldRendererProps {
    field: CustomElementField;
    value: unknown;
    onChange: (value: unknown) => void;
    resolveTranslation: (value: LocalizableString | undefined | null) => string;
}

function FieldRenderer({ field, value, onChange, resolveTranslation }: FieldRendererProps) {
    const { inputType, required, options = [] } = field;
    
    // Resolve translatable strings
    const label = resolveTranslation(field.label);
    const placeholder = resolveTranslation(field.placeholder);
    const helpText = resolveTranslation(field.helpText);
    
    // Resolve option labels
    const resolvedOptions = options.map(opt => ({
        ...opt,
        label: resolveTranslation(opt.label),
    }));

    // Render label with optional required indicator
    const renderLabel = () => (
        <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
        </Label>
    );

    // Render help text
    const renderHelpText = () => helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
    );

    switch (inputType) {
        case 'text':
        case 'email':
        case 'url':
        case 'tel':
        case 'password':
            return (
                <>
                    {renderLabel()}
                    <Input
                        type={inputType}
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        required={required}
                    />
                    {renderHelpText()}
                </>
            );

        case 'number':
            return (
                <>
                    {renderLabel()}
                    <Input
                        type="number"
                        value={(value as number) ?? ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder={placeholder}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        step={field.validation?.step}
                        required={required}
                    />
                    {renderHelpText()}
                </>
            );

        case 'textarea':
            return (
                <>
                    {renderLabel()}
                    <Textarea
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        required={required}
                        rows={4}
                    />
                    {renderHelpText()}
                </>
            );

        case 'color':
            return (
                <>
                    {renderLabel()}
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={(value as string) ?? '#000000'}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                            type="text"
                            value={(value as string) ?? ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="#000000"
                            className="flex-1"
                        />
                    </div>
                    {renderHelpText()}
                </>
            );

        case 'date':
        case 'datetime':
        case 'time':
            return (
                <>
                    {renderLabel()}
                    <Input
                        type={inputType === 'datetime' ? 'datetime-local' : inputType}
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={required}
                    />
                    {renderHelpText()}
                </>
            );

        case 'checkbox':
            return (
                <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                        id={field.name}
                        checked={(value as boolean) ?? false}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                    <Label htmlFor={field.name} className="text-sm cursor-pointer">
                        {label}
                    </Label>
                    {renderHelpText()}
                </div>
            );

        case 'switch':
            return (
                <div className="flex items-center justify-between gap-2 pt-6">
                    <div>
                        <Label className="text-sm font-medium">{label}</Label>
                        {helpText && <p className="text-xs text-muted-foreground mt-1">{helpText}</p>}
                    </div>
                    <Switch
                        checked={(value as boolean) ?? false}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                </div>
            );

        case 'toggle':
            return (
                <>
                    {renderLabel()}
                    <ToggleGroup
                        type="single"
                        value={(value as string) ?? ''}
                        onValueChange={(val) => val && onChange(val)}
                        className="justify-start"
                    >
                        {resolvedOptions.map((option) => (
                            <ToggleGroupItem
                                key={String(option.value)}
                                value={String(option.value)}
                                disabled={option.disabled}
                                className="gap-1.5"
                            >
                                {option.icon && renderIcon(option.icon)}
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                    {renderHelpText()}
                </>
            );

        case 'radio':
            return (
                <>
                    {renderLabel()}
                    <RadioGroup
                        value={(value as string) ?? ''}
                        onValueChange={(val) => onChange(val)}
                        className="flex flex-wrap gap-4"
                    >
                        {resolvedOptions.map((option) => (
                            <div key={String(option.value)} className="flex items-center gap-2">
                                <RadioGroupItem
                                    value={String(option.value)}
                                    id={`${field.name}-${option.value}`}
                                    disabled={option.disabled}
                                />
                                <Label 
                                    htmlFor={`${field.name}-${option.value}`}
                                    className="text-sm cursor-pointer flex items-center gap-1.5"
                                >
                                    {option.icon && renderIcon(option.icon)}
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                    {renderHelpText()}
                </>
            );

        case 'select':
        case 'combobox':
            return (
                <>
                    {renderLabel()}
                    <Select
                        value={(value as string) ?? ''}
                        onValueChange={(val) => onChange(val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={placeholder || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {resolvedOptions.map((option) => (
                                <SelectItem 
                                    key={String(option.value)} 
                                    value={String(option.value)}
                                    disabled={option.disabled}
                                >
                                    <span className="flex items-center gap-2">
                                        {option.icon && renderIcon(option.icon)}
                                        {option.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {renderHelpText()}
                </>
            );

        case 'slider':
            const sliderConfig = field.sliderConfig || {};
            const sliderValue = (value as number) ?? sliderConfig.min ?? 0;
            return (
                <>
                    {renderLabel()}
                    <div className="flex items-center gap-4">
                        <Slider
                            value={[sliderValue]}
                            onValueChange={([val]) => onChange(val)}
                            min={sliderConfig.min ?? 0}
                            max={sliderConfig.max ?? 100}
                            step={sliderConfig.step ?? 1}
                            className="flex-1"
                        />
                        {sliderConfig.showValue !== false && (
                            <span className="text-sm font-mono min-w-[4rem] text-right">
                                {sliderValue}{sliderConfig.unit ?? ''}
                            </span>
                        )}
                    </div>
                    {renderHelpText()}
                </>
            );

        case 'editor':
        case 'code':
            const editorConfig = field.editorConfig || {};
            return (
                <>
                    {renderLabel()}
                    <CodeEditor
                        value={(value as string) ?? ''}
                        onChange={(val) => onChange(val)}
                        language={editorConfig.language || 'plain'}
                        minHeight={editorConfig.minHeight || '150px'}
                        placeholder={placeholder}
                    />
                    {renderHelpText()}
                </>
            );

        case 'markdown':
            return (
                <>
                    {renderLabel()}
                    <CodeEditor
                        value={(value as string) ?? ''}
                        onChange={(val) => onChange(val)}
                        language="markdown"
                        minHeight={field.editorConfig?.minHeight || '200px'}
                        placeholder={placeholder}
                    />
                    {renderHelpText()}
                </>
            );

        case 'json':
            return (
                <>
                    {renderLabel()}
                    <CodeEditor
                        value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
                        onChange={(val) => {
                            try {
                                onChange(JSON.parse(val));
                            } catch {
                                onChange(val); // Keep as string if invalid JSON
                            }
                        }}
                        language="json"
                        minHeight={field.editorConfig?.minHeight || '150px'}
                        placeholder='{\n  "key": "value"\n}'
                    />
                    {renderHelpText()}
                </>
            );

        case 'reference':
            const referenceConfig = field.referenceConfig || {};
            const refValue = value as ReferenceValue | null;
            return (
                <>
                    {renderLabel()}
                    <ReferencePicker
                        value={refValue}
                        onChange={(newValue) => onChange(newValue)}
                        minDepth={referenceConfig.minDepth || 'collection'}
                        maxDepth={referenceConfig.maxDepth || 'element'}
                        placeholder={placeholder || 'Select reference...'}
                    />
                    {renderHelpText()}
                </>
            );

        case 'hidden':
            return null;

        default:
            return (
                <>
                    {renderLabel()}
                    <Input
                        type="text"
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                    />
                    {renderHelpText()}
                    <p className="text-xs text-muted-foreground italic">
                        (Unknown input type: {inputType})
                    </p>
                </>
            );
    }
}

function getGridClass(grid?: string): string {
    switch (grid) {
        case 'half':
            return 'col-span-2';
        case 'third':
            return 'col-span-1';
        case 'quarter':
            return 'col-span-1';
        case 'full':
        default:
            return 'col-span-4';
    }
}

function renderIcon(iconName: string): React.ReactNode {
    // Convert kebab-case to PascalCase for Lucide icons
    const pascalName = iconName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalName];
    
    if (IconComponent) {
        return <IconComponent className="size-4" />;
    }
    
    return null;
}

