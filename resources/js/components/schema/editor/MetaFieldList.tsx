import type { MetaFieldDefinition, MetaFieldType, SelectInputStyle } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { metaFieldTypes, selectInputStyles } from './constants';

interface MetaFieldListProps {
    fields: MetaFieldDefinition[];
    onUpdate: (index: number, updates: Partial<MetaFieldDefinition>) => void;
    onRemove: (index: number) => void;
}

export function MetaFieldList({ fields, onUpdate, onRemove }: MetaFieldListProps) {
    if (fields.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">
                No metadata fields defined
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {fields.map((field, index) => (
                <MetaFieldItem
                    key={index}
                    field={field}
                    index={index}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
}

interface MetaFieldItemProps {
    field: MetaFieldDefinition;
    index: number;
    onUpdate: (index: number, updates: Partial<MetaFieldDefinition>) => void;
    onRemove: (index: number) => void;
}

function MetaFieldItem({ field, index, onUpdate, onRemove }: MetaFieldItemProps) {
    return (
        <div className="flex items-start gap-2 p-3 border rounded-md bg-background">
            <GripVertical className="size-4 text-muted-foreground mt-2 cursor-move" />
            <div className="flex-1 space-y-3">
                <MetaFieldBasicFields field={field} index={index} onUpdate={onUpdate} onRemove={onRemove} />
                
                {/* Textarea-specific options */}
                {field.type === 'textarea' && (
                    <TextareaOptions field={field} index={index} onUpdate={onUpdate} />
                )}

                {/* Select/MultiSelect options */}
                {(field.type === 'select' || field.type === 'multi_select') && (
                    <SelectOptions field={field} index={index} onUpdate={onUpdate} />
                )}
            </div>
        </div>
    );
}

interface MetaFieldBasicFieldsProps {
    field: MetaFieldDefinition;
    index: number;
    onUpdate: (index: number, updates: Partial<MetaFieldDefinition>) => void;
    onRemove: (index: number) => void;
}

function MetaFieldBasicFields({ field, index, onUpdate, onRemove }: MetaFieldBasicFieldsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-4">
            <Input
                placeholder="Field name"
                value={field.name}
                onChange={(e) => onUpdate(index, { 
                    name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    label: field.label || e.target.value,
                })}
                className="h-8"
            />
            <Input
                placeholder="Label"
                value={field.label}
                onChange={(e) => onUpdate(index, { label: e.target.value })}
                className="h-8"
            />
            <Select
                value={field.type}
                onValueChange={(value: MetaFieldType) => {
                    const updates: Partial<MetaFieldDefinition> = { type: value };
                    // Reset editor-specific options when changing type
                    if (value !== 'textarea') {
                        updates.editor_type = undefined;
                        updates.target_format = undefined;
                    } else {
                        // Set defaults for textarea
                        updates.editor_type = 'textarea';
                        updates.target_format = 'plain';
                    }
                    // Reset options when changing from select types
                    if (value !== 'select' && value !== 'multi_select') {
                        updates.options = undefined;
                    } else if (!field.options) {
                        updates.options = [];
                    }
                    onUpdate(index, updates);
                }}
            >
                <SelectTrigger className="h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {metaFieldTypes.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs">
                    <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => onUpdate(index, { required: e.target.checked })}
                        className="rounded"
                    />
                    Required
                </label>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="size-8 text-destructive hover:text-destructive"
                >
                    <Trash2 className="size-4" />
                </Button>
            </div>
        </div>
    );
}

interface TextareaOptionsProps {
    field: MetaFieldDefinition;
    index: number;
    onUpdate: (index: number, updates: Partial<MetaFieldDefinition>) => void;
}

function TextareaOptions({ field, index, onUpdate }: TextareaOptionsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 ml-6 p-3 bg-muted/30 rounded-md">
            <div className="space-y-1.5">
                <Label className="text-xs">Editor Type</Label>
                <Select
                    value={field.editor_type || 'textarea'}
                    onValueChange={(value) => {
                        const updates: Partial<MetaFieldDefinition> = { 
                            editor_type: value as 'textarea' | 'tinymce' | 'codemirror'
                        };
                        // Reset target_format when changing editor
                        if (value === 'textarea') {
                            updates.target_format = 'plain';
                        } else if (value === 'tinymce') {
                            updates.target_format = 'html';
                        } else if (value === 'codemirror' && !field.target_format) {
                            updates.target_format = 'plain';
                        }
                        onUpdate(index, updates);
                    }}
                >
                    <SelectTrigger className="h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="textarea">Standard Textarea</SelectItem>
                        <SelectItem value="tinymce">TinyMCE</SelectItem>
                        <SelectItem value="codemirror">Code Mirror</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Target Format</Label>
                <Select
                    value={field.target_format || 'plain'}
                    onValueChange={(value) => onUpdate(index, { 
                        target_format: value as 'plain' | 'html' | 'css' | 'javascript' | 'markdown' | 'json' | 'xml'
                    })}
                    disabled={field.editor_type === 'textarea'}
                >
                    <SelectTrigger className="h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {field.editor_type === 'tinymce' ? (
                            <>
                                <SelectItem value="html">HTML</SelectItem>
                                <SelectItem value="plain">Plain Text</SelectItem>
                            </>
                        ) : field.editor_type === 'codemirror' ? (
                            <>
                                <SelectItem value="plain">Plain Text</SelectItem>
                                <SelectItem value="html">HTML</SelectItem>
                                <SelectItem value="css">CSS</SelectItem>
                                <SelectItem value="javascript">JavaScript</SelectItem>
                                <SelectItem value="markdown">Markdown</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                                <SelectItem value="xml">XML</SelectItem>
                            </>
                        ) : (
                            <SelectItem value="plain">Plain Text</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

interface SelectOptionsProps {
    field: MetaFieldDefinition;
    index: number;
    onUpdate: (index: number, updates: Partial<MetaFieldDefinition>) => void;
}

function SelectOptions({ field, index, onUpdate }: SelectOptionsProps) {
    return (
        <div className="ml-6 p-3 bg-muted/30 rounded-md space-y-4">
            {/* Input Style and Allow Custom */}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label className="text-xs">Input Style</Label>
                    <Select
                        value={field.input_style || 'dropdown'}
                        onValueChange={(value: SelectInputStyle) => onUpdate(index, { input_style: value })}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {selectInputStyles
                                .filter(style => 
                                    field.type === 'select' ? style.singleSelect : style.multiSelect
                                )
                                .map(({ value, label }) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                {(field.input_style === 'combobox' || field.input_style === 'tags') && (
                    <div className="flex items-center gap-2 pt-6">
                        <label className="flex items-center gap-1.5 text-xs">
                            <input
                                type="checkbox"
                                checked={field.allow_custom ?? false}
                                onChange={(e) => onUpdate(index, { allow_custom: e.target.checked })}
                                className="rounded"
                            />
                            Allow custom values
                        </label>
                    </div>
                )}
            </div>

            {/* Options */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Options</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const currentOptions = field.options || [];
                            onUpdate(index, {
                                options: [...currentOptions, { value: '', label: '' }]
                            });
                        }}
                        className="h-7 text-xs"
                    >
                        <Plus className="size-3 mr-1" />
                        Add Option
                    </Button>
                </div>
                <div className="space-y-2">
                    {(field.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                            <Input
                                placeholder="Value"
                                value={option.value}
                                onChange={(e) => {
                                    const options = [...(field.options || [])];
                                    options[optIndex] = { ...option, value: e.target.value };
                                    onUpdate(index, { options });
                                }}
                                className="h-8 text-xs"
                            />
                            <Input
                                placeholder="Label"
                                value={option.label}
                                onChange={(e) => {
                                    const options = [...(field.options || [])];
                                    options[optIndex] = { ...option, label: e.target.value };
                                    onUpdate(index, { options });
                                }}
                                className="h-8 text-xs"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    const options = (field.options || []).filter((_, i) => i !== optIndex);
                                    onUpdate(index, { options });
                                }}
                                className="size-8 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="size-3" />
                            </Button>
                        </div>
                    ))}
                    {(!field.options || field.options.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">
                            No options defined. Add at least one option.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

