import type { MetaFieldDefinition, SelectInputStyle } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Combobox, MultiCombobox } from '@/components/ui/combobox';
import { TagInput } from '@/components/ui/tag-input';
import { CodeEditor } from './CodeEditor';
import { WysiwygEditor } from './WysiwygEditor';

interface MetaFieldInputProps {
    field: MetaFieldDefinition;
    value: unknown;
    onChange: (value: unknown) => void;
    compact?: boolean;
}

export function MetaFieldInput({ field, value, onChange, compact = false }: MetaFieldInputProps) {
    const { name, label, type, required, placeholder, help_text, options, default_value, editor_type, target_format, input_style, allow_custom } = field;
    
    // Use default value if no value is set
    const currentValue = value ?? default_value;

    const renderInput = () => {
        switch (type) {
            case 'text':
            case 'url':
            case 'email':
                return (
                    <Input
                        id={name}
                        type={type === 'url' ? 'url' : type === 'email' ? 'email' : 'text'}
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={compact ? 'h-8' : undefined}
                    />
                );

            case 'textarea':
                const editorType = editor_type || 'textarea';
                const format = target_format || 'plain';
                
                // Standard Textarea
                if (editorType === 'textarea') {
                    return (
                        <Textarea
                            id={name}
                            value={(currentValue as string) || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            rows={compact ? 2 : 3}
                        />
                    );
                }
                
                // TinyMCE (using TipTap WysiwygEditor)
                if (editorType === 'tinymce') {
                    return (
                        <div className="border rounded-md">
                            <WysiwygEditor
                                content={(currentValue as string) || ''}
                                onChange={(content) => onChange(content)}
                                placeholder={placeholder || 'Start writing...'}
                            />
                        </div>
                    );
                }
                
                // CodeMirror
                if (editorType === 'codemirror') {
                    // Map target_format to CodeMirror language
                    const languageMap: Record<string, 'text' | 'html' | 'json' | 'xml' | 'markdown' | 'javascript' | 'css'> = {
                        'plain': 'text',
                        'html': 'html',
                        'css': 'css',
                        'javascript': 'javascript',
                        'markdown': 'markdown',
                        'json': 'json',
                        'xml': 'xml',
                    };
                    
                    const language = languageMap[format] || 'text';
                    
                    return (
                        <CodeEditor
                            value={(currentValue as string) || ''}
                            onChange={(content) => onChange(content)}
                            language={language}
                            placeholder={placeholder}
                            minHeight={compact ? '150px' : '200px'}
                        />
                    );
                }
                
                // Fallback to standard textarea
                return (
                    <Textarea
                        id={name}
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={compact ? 2 : 3}
                    />
                );

            case 'number':
                return (
                    <Input
                        id={name}
                        type="number"
                        value={currentValue !== undefined ? String(currentValue) : ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder={placeholder}
                        className={compact ? 'h-8' : undefined}
                    />
                );

            case 'boolean':
                return (
                    <Switch
                        id={name}
                        checked={Boolean(currentValue)}
                        onCheckedChange={onChange}
                    />
                );

            case 'date':
                return (
                    <Input
                        id={name}
                        type="date"
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={compact ? 'h-8' : undefined}
                    />
                );

            case 'datetime':
                return (
                    <Input
                        id={name}
                        type="datetime-local"
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={compact ? 'h-8' : undefined}
                    />
                );

            case 'color':
                return (
                    <div className="flex items-center gap-2">
                        <Input
                            id={name}
                            type="color"
                            value={(currentValue as string) || '#000000'}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-10 h-8 p-1"
                        />
                        <Input
                            value={(currentValue as string) || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="#000000"
                            className={`flex-1 ${compact ? 'h-8' : ''}`}
                        />
                    </div>
                );

            case 'select':
                return renderSelectInput(
                    input_style || 'dropdown',
                    options || [],
                    (currentValue as string) || '',
                    (val) => onChange(val),
                    placeholder,
                    compact,
                    allow_custom
                );

            case 'multi_select':
                return renderMultiSelectInput(
                    input_style || 'dropdown',
                    options || [],
                    (currentValue as string[]) || [],
                    (vals) => onChange(vals),
                    placeholder,
                    compact,
                    allow_custom
                );

            case 'json':
                const jsonValue = typeof currentValue === 'string'
                    ? currentValue
                    : JSON.stringify(currentValue || {}, null, 2);
                
                return (
                    <CodeEditor
                        value={jsonValue}
                        onChange={(content) => {
                            try {
                                onChange(JSON.parse(content));
                            } catch {
                                // Keep as string if invalid JSON
                                onChange(content);
                            }
                        }}
                        language="json"
                        placeholder="{}"
                        minHeight={compact ? '120px' : '180px'}
                    />
                );

            default:
                return (
                    <Input
                        id={name}
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={compact ? 'h-8' : undefined}
                    />
                );
        }
    };

    // Render single select input based on input_style
    const renderSelectInput = (
        style: SelectInputStyle,
        fieldOptions: { value: string; label: string }[],
        currentVal: string,
        onChangeVal: (val: string) => void,
        placeholderText?: string,
        isCompact?: boolean,
        allowCustom?: boolean
    ) => {
        switch (style) {
            case 'combobox':
                return (
                    <Combobox
                        options={fieldOptions}
                        value={currentVal}
                        onValueChange={onChangeVal}
                        placeholder={placeholderText || 'Select...'}
                        allowCustom={allowCustom}
                        className={isCompact ? 'h-8' : undefined}
                    />
                );

            case 'radio':
                return (
                    <RadioGroup
                        value={currentVal}
                        onValueChange={onChangeVal}
                        className="flex flex-wrap gap-4"
                    >
                        {fieldOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                                <Label htmlFor={`${name}-${option.value}`} className="text-sm font-normal cursor-pointer">
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'toggle_group':
                return (
                    <ToggleGroup
                        type="single"
                        value={currentVal}
                        onValueChange={(val) => val && onChangeVal(val)}
                        className="justify-start"
                    >
                        {fieldOptions.map((option) => (
                            <ToggleGroupItem
                                key={option.value}
                                value={option.value}
                                aria-label={option.label}
                                className={isCompact ? 'h-8 px-3 text-xs' : undefined}
                            >
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                );

            case 'dropdown':
            default:
                return (
                    <Select value={currentVal} onValueChange={onChangeVal}>
                        <SelectTrigger className={isCompact ? 'h-8' : undefined}>
                            <SelectValue placeholder={placeholderText || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {fieldOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
        }
    };

    // Render multi select input based on input_style
    const renderMultiSelectInput = (
        style: SelectInputStyle,
        fieldOptions: { value: string; label: string }[],
        selectedVals: string[],
        onChangeVals: (vals: string[]) => void,
        placeholderText?: string,
        isCompact?: boolean,
        allowCustom?: boolean
    ) => {
        switch (style) {
            case 'combobox':
                return (
                    <MultiCombobox
                        options={fieldOptions}
                        value={selectedVals}
                        onValueChange={onChangeVals}
                        placeholder={placeholderText || 'Select...'}
                        allowCustom={allowCustom}
                        className={isCompact ? 'min-h-8' : undefined}
                    />
                );

            case 'tags':
                return (
                    <TagInput
                        options={fieldOptions}
                        value={selectedVals}
                        onValueChange={onChangeVals}
                        placeholder={placeholderText || 'Add tag...'}
                        allowCustom={allowCustom ?? true}
                    />
                );

            case 'checkbox':
                return (
                    <div className="flex flex-wrap gap-4">
                        {fieldOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${name}-${option.value}`}
                                    checked={selectedVals.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            onChangeVals([...selectedVals, option.value]);
                                        } else {
                                            onChangeVals(selectedVals.filter((v) => v !== option.value));
                                        }
                                    }}
                                />
                                <Label htmlFor={`${name}-${option.value}`} className="text-sm font-normal cursor-pointer">
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                );

            case 'toggle_group':
                return (
                    <ToggleGroup
                        type="multiple"
                        value={selectedVals}
                        onValueChange={onChangeVals}
                        className="justify-start flex-wrap"
                    >
                        {fieldOptions.map((option) => (
                            <ToggleGroupItem
                                key={option.value}
                                value={option.value}
                                aria-label={option.label}
                                className={isCompact ? 'h-8 px-3 text-xs' : undefined}
                            >
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                );

            case 'dropdown':
            default:
                return (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                            {selectedVals.map((val) => {
                                const option = fieldOptions.find((o) => o.value === val);
                                return (
                                    <Badge
                                        key={val}
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => onChangeVals(selectedVals.filter((v) => v !== val))}
                                    >
                                        {option?.label || val}
                                        <span className="ml-1">×</span>
                                    </Badge>
                                );
                            })}
                        </div>
                        <Select
                            value=""
                            onValueChange={(val) => {
                                if (!selectedVals.includes(val)) {
                                    onChangeVals([...selectedVals, val]);
                                }
                            }}
                        >
                            <SelectTrigger className={isCompact ? 'h-8' : undefined}>
                                <SelectValue placeholder="Add..." />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions
                                    .filter((o) => !selectedVals.includes(o.value))
                                    .map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
        }
    };

    // For boolean type in compact mode, render inline
    if (type === 'boolean' && compact) {
        return (
            <div className="flex items-center justify-between">
                <Label htmlFor={name} className="text-xs text-muted-foreground">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderInput()}
            </div>
        );
    }

    // Compact inline layout for simple fields
    if (compact && (type === 'text' || type === 'number' || type === 'select')) {
        return (
            <div className="flex items-center gap-2">
                <Label htmlFor={name} className="text-xs text-muted-foreground shrink-0">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="flex-1">
                    {renderInput()}
                </div>
            </div>
        );
    }

    return (
        <div className={compact ? 'space-y-1' : 'space-y-2'}>
            <div className="flex items-center gap-2">
                <Label htmlFor={name} className={compact ? 'text-xs text-muted-foreground' : undefined}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            </div>
            {renderInput()}
            {help_text && !compact && (
                <p className="text-xs text-muted-foreground">{help_text}</p>
            )}
        </div>
    );
}


