import type { MetaFieldDefinition, SelectInputStyle, MediaMetaFieldValue, MetaFieldOption } from '@/types';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Combobox, MultiCombobox } from '@/components/ui/combobox';
import { TagInput } from '@/components/ui/tag-input';
import { CodeEditor } from './CodeEditor';
import { WysiwygEditor } from './WysiwygEditor';
import { MediaPickerInput } from './MediaPickerInput';
import { Info, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MetaFieldInputProps {
    field: MetaFieldDefinition;
    value: unknown;
    onChange: (value: unknown) => void;
    compact?: boolean;
}

export function MetaFieldInput({ field, value, onChange, compact = false }: MetaFieldInputProps) {
    const { name, label, type, required, placeholder, description, explanation, options, default_value, editor_type, target_format, input_style, allow_custom, options_source, collection_config } = field;
    
    // Support legacy help_text field for backwards compatibility
    const descriptionText = description || (field as any).help_text;

    // State for dynamically loaded collection options
    const [collectionOptions, setCollectionOptions] = useState<MetaFieldOption[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [optionsError, setOptionsError] = useState<string | null>(null);

    // Load options from collection when options_source is 'collection'
    useEffect(() => {
        if (options_source === 'collection' && collection_config?.collection_id) {
            setIsLoadingOptions(true);
            setOptionsError(null);

            const params = new URLSearchParams({
                collection_id: collection_config.collection_id,
            });
            if (collection_config.filter_view_id) {
                params.set('filter_view_id', collection_config.filter_view_id);
            }

            fetch(`/api/select-options?${params.toString()}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Failed to load options');
                    }
                    return res.json();
                })
                .then(data => {
                    setCollectionOptions(data.options || []);
                })
                .catch(err => {
                    setOptionsError(err.message);
                    setCollectionOptions([]);
                })
                .finally(() => {
                    setIsLoadingOptions(false);
                });
        } else {
            setCollectionOptions([]);
        }
    }, [options_source, collection_config?.collection_id, collection_config?.filter_view_id]);

    // Determine which options to use
    const effectiveOptions = options_source === 'collection' ? collectionOptions : (options || []);
    
    // Helper component to render label with optional info icon
    const FieldLabel = ({ htmlFor, className }: { htmlFor?: string; className?: string }) => (
        <span className={`flex items-center gap-1.5 ${className || ''}`}>
            <Label htmlFor={htmlFor} className={compact ? 'text-xs text-muted-foreground' : undefined}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {explanation && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="size-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm whitespace-pre-wrap">{explanation}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </span>
    );
    
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

            case 'time':
                return (
                    <Input
                        id={name}
                        type="time"
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
                if (isLoadingOptions) {
                    return (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Loading options...
                        </div>
                    );
                }
                if (optionsError) {
                    return (
                        <div className="text-sm text-destructive">
                            Error loading options: {optionsError}
                        </div>
                    );
                }
                return renderSelectInput(
                    input_style || 'dropdown',
                    effectiveOptions,
                    (currentValue as string) || '',
                    (val) => onChange(val),
                    placeholder,
                    compact,
                    allow_custom
                );

            case 'multi_select':
                // Ensure value is always an array
                const multiSelectValue = Array.isArray(currentValue) ? currentValue : [];
                if (isLoadingOptions) {
                    return (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Loading options...
                        </div>
                    );
                }
                if (optionsError) {
                    return (
                        <div className="text-sm text-destructive">
                            Error loading options: {optionsError}
                        </div>
                    );
                }
                return renderMultiSelectInput(
                    input_style || 'dropdown',
                    effectiveOptions,
                    multiSelectValue,
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

            case 'media':
                return (
                    <MediaPickerInput
                        value={currentValue as MediaMetaFieldValue | null}
                        onChange={onChange}
                        config={field.media_config}
                        compact={compact}
                        placeholder={placeholder || 'Select media...'}
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

    // Helper to render description text (shown in both compact and normal mode)
    const DescriptionText = () => descriptionText ? (
        <p className="text-xs text-muted-foreground">{descriptionText}</p>
    ) : null;

    // For boolean type in compact mode, render inline
    if (type === 'boolean' && compact) {
        return (
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={name} />
                    {renderInput()}
                </div>
                <DescriptionText />
            </div>
        );
    }

    // Compact inline layout for simple fields
    if (compact && (type === 'text' || type === 'number' || type === 'select')) {
        return (
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <FieldLabel htmlFor={name} className="shrink-0" />
                    <div className="flex-1">
                        {renderInput()}
                    </div>
                </div>
                <DescriptionText />
            </div>
        );
    }

    return (
        <div className={compact ? 'space-y-1' : 'space-y-2'}>
            <FieldLabel htmlFor={name} />
            {renderInput()}
            <DescriptionText />
        </div>
    );
}


