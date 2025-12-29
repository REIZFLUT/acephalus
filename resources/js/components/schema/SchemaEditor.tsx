import type { CollectionSchema, ElementType, MetaFieldDefinition, MetaFieldType, TextElementConfig, MediaElementConfig, WrapperPurpose, SelectInputStyle } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    Type, 
    Image, 
    Code, 
    FileJson, 
    FileCode2, 
    Layers, 
    Hash, 
    FileText,
    Plus,
    Trash2,
    GripVertical,
    FolderCog,
    FileStack,
    Blocks,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface SchemaEditorBaseProps {
    schema: CollectionSchema | null;
    onChange: (schema: CollectionSchema) => void;
}

interface SchemaEditorWrappersProps extends SchemaEditorBaseProps {
    wrapperPurposes?: WrapperPurpose[];
}

const elementTypes: { type: ElementType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { type: 'text', label: 'Text', icon: Type, description: 'Rich text, Markdown, or plain text' },
    { type: 'media', label: 'Media', icon: Image, description: 'Images, videos, audio files' },
    { type: 'html', label: 'HTML', icon: Code, description: 'Custom HTML code' },
    { type: 'json', label: 'JSON', icon: FileJson, description: 'Structured JSON data' },
    { type: 'xml', label: 'XML', icon: FileCode2, description: 'XML content' },
    { type: 'svg', label: 'SVG', icon: FileText, description: 'Vector graphics' },
    { type: 'katex', label: 'KaTeX', icon: Hash, description: 'Mathematical formulas' },
    { type: 'wrapper', label: 'Wrapper', icon: Layers, description: 'Container for nested elements' },
];

const metaFieldTypes: { value: MetaFieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'select', label: 'Select' },
    { value: 'multi_select', label: 'Multi-Select' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'color', label: 'Color' },
    { value: 'json', label: 'JSON' },
];

// Input styles for select fields
const selectInputStyles: { value: SelectInputStyle; label: string; singleSelect: boolean; multiSelect: boolean }[] = [
    { value: 'dropdown', label: 'Dropdown', singleSelect: true, multiSelect: true },
    { value: 'combobox', label: 'Combobox (searchable)', singleSelect: true, multiSelect: true },
    { value: 'tags', label: 'Tag Input', singleSelect: false, multiSelect: true },
    { value: 'radio', label: 'Radio Buttons', singleSelect: true, multiSelect: false },
    { value: 'checkbox', label: 'Checkboxes', singleSelect: false, multiSelect: true },
    { value: 'toggle_group', label: 'Toggle Group', singleSelect: true, multiSelect: true },
];

const defaultSchema: CollectionSchema = {
    allowed_elements: ['text', 'media', 'html', 'json', 'xml', 'svg', 'katex', 'wrapper'],
    element_configs: {
        text: { enabled: true, formats: ['plain', 'markdown', 'html'] },
        media: { enabled: true, types: ['image', 'video', 'audio', 'document'] },
        html: { enabled: true },
        json: { enabled: true },
        xml: { enabled: true },
        svg: { enabled: true },
        katex: { enabled: true },
        wrapper: { enabled: true },
    },
    content_meta_fields: [],
    element_meta_fields: {} as Record<ElementType, MetaFieldDefinition[]>,
    collection_meta_fields: [],
    allowed_wrapper_purposes: [],
};

// Helper to build currentSchema from props
function buildCurrentSchema(schema: CollectionSchema | null): CollectionSchema {
    return {
        allowed_elements: schema?.allowed_elements || defaultSchema.allowed_elements,
        element_configs: {
            text: { ...defaultSchema.element_configs.text, ...schema?.element_configs?.text },
            media: { ...defaultSchema.element_configs.media, ...schema?.element_configs?.media },
            html: { ...defaultSchema.element_configs.html, ...schema?.element_configs?.html },
            json: { ...defaultSchema.element_configs.json, ...schema?.element_configs?.json },
            xml: { ...defaultSchema.element_configs.xml, ...schema?.element_configs?.xml },
            svg: { ...defaultSchema.element_configs.svg, ...schema?.element_configs?.svg },
            katex: { ...defaultSchema.element_configs.katex, ...schema?.element_configs?.katex },
            wrapper: { ...defaultSchema.element_configs.wrapper, ...schema?.element_configs?.wrapper },
        },
        content_meta_fields: schema?.content_meta_fields || defaultSchema.content_meta_fields,
        element_meta_fields: schema?.element_meta_fields || defaultSchema.element_meta_fields,
        collection_meta_fields: schema?.collection_meta_fields || defaultSchema.collection_meta_fields,
        allowed_wrapper_purposes: schema?.allowed_wrapper_purposes || [],
    };
}

// ============================================================
// Collection Metadata Tab (Meta)
// ============================================================
export function SchemaEditorMeta({ schema, onChange }: SchemaEditorBaseProps) {
    const currentSchema = buildCurrentSchema(schema);

    const addMetaField = () => {
        const newField: MetaFieldDefinition = {
            name: '',
            label: '',
            type: 'text',
            required: false,
        };
        onChange({
            ...currentSchema,
            collection_meta_fields: [...currentSchema.collection_meta_fields, newField],
        });
    };

    const updateMetaField = (index: number, updates: Partial<MetaFieldDefinition>) => {
        const fields = [...currentSchema.collection_meta_fields];
        fields[index] = { ...fields[index], ...updates };
        onChange({
            ...currentSchema,
            collection_meta_fields: fields,
        });
    };

    const removeMetaField = (index: number) => {
        onChange({
            ...currentSchema,
            collection_meta_fields: currentSchema.collection_meta_fields.filter((_, i) => i !== index),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FolderCog className="size-5" />
                    Collection Metadata Fields
                </CardTitle>
                <CardDescription>
                    Define metadata fields for the collection itself (not for individual contents).
                    These fields describe properties of the collection as a whole.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <MetaFieldList
                    fields={currentSchema.collection_meta_fields}
                    onUpdate={updateMetaField}
                    onRemove={removeMetaField}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMetaField}
                    className="w-full"
                >
                    <Plus className="size-4 mr-2" />
                    Add Collection Metadata Field
                </Button>
            </CardContent>
        </Card>
    );
}

// ============================================================
// Content Metadata Tab (Contents)
// ============================================================
export function SchemaEditorContents({ schema, onChange }: SchemaEditorBaseProps) {
    const currentSchema = buildCurrentSchema(schema);

    const addMetaField = () => {
        const newField: MetaFieldDefinition = {
            name: '',
            label: '',
            type: 'text',
            required: false,
        };
        onChange({
            ...currentSchema,
            content_meta_fields: [...currentSchema.content_meta_fields, newField],
        });
    };

    const updateMetaField = (index: number, updates: Partial<MetaFieldDefinition>) => {
        const fields = [...currentSchema.content_meta_fields];
        fields[index] = { ...fields[index], ...updates };
        onChange({
            ...currentSchema,
            content_meta_fields: fields,
        });
    };

    const removeMetaField = (index: number) => {
        onChange({
            ...currentSchema,
            content_meta_fields: currentSchema.content_meta_fields.filter((_, i) => i !== index),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileStack className="size-5" />
                    Content Metadata Fields
                </CardTitle>
                <CardDescription>
                    Define additional metadata fields for each content item in this collection
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <MetaFieldList
                    fields={currentSchema.content_meta_fields}
                    onUpdate={updateMetaField}
                    onRemove={removeMetaField}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMetaField}
                    className="w-full"
                >
                    <Plus className="size-4 mr-2" />
                    Add Content Metadata Field
                </Button>
            </CardContent>
        </Card>
    );
}

// ============================================================
// Elements Tab (Element Types + Element Meta)
// ============================================================
export function SchemaEditorElements({ schema, onChange }: SchemaEditorBaseProps) {
    const currentSchema = buildCurrentSchema(schema);
    const textConfig = currentSchema.element_configs.text as TextElementConfig | undefined;
    const mediaConfig = currentSchema.element_configs.media as MediaElementConfig | undefined;

    const toggleElement = (type: ElementType) => {
        const allowed = currentSchema.allowed_elements.includes(type)
            ? currentSchema.allowed_elements.filter(t => t !== type)
            : [...currentSchema.allowed_elements, type];
        
        onChange({
            ...currentSchema,
            allowed_elements: allowed,
        });
    };

    const updateTextConfig = (formats: ('plain' | 'markdown' | 'html')[]) => {
        onChange({
            ...currentSchema,
            element_configs: {
                ...currentSchema.element_configs,
                text: { 
                    ...(currentSchema.element_configs.text || { enabled: true }),
                    formats 
                } as TextElementConfig,
            },
        });
    };

    const updateMediaConfig = (types: ('image' | 'video' | 'audio' | 'document' | 'canvas')[]) => {
        onChange({
            ...currentSchema,
            element_configs: {
                ...currentSchema.element_configs,
                media: { 
                    ...(currentSchema.element_configs.media || { enabled: true }),
                    types 
                } as MediaElementConfig,
            },
        });
    };

    const addMetaField = (type: ElementType) => {
        const newField: MetaFieldDefinition = {
            name: '',
            label: '',
            type: 'text',
            required: false,
        };
        const elementFields = currentSchema.element_meta_fields[type] || [];
        onChange({
            ...currentSchema,
            element_meta_fields: {
                ...currentSchema.element_meta_fields,
                [type]: [...elementFields, newField],
            },
        });
    };

    const updateMetaField = (type: ElementType, index: number, updates: Partial<MetaFieldDefinition>) => {
        const elementFields = [...(currentSchema.element_meta_fields[type] || [])];
        elementFields[index] = { ...elementFields[index], ...updates };
        onChange({
            ...currentSchema,
            element_meta_fields: {
                ...currentSchema.element_meta_fields,
                [type]: elementFields,
            },
        });
    };

    const removeMetaField = (type: ElementType, index: number) => {
        const elementFields = currentSchema.element_meta_fields[type] || [];
        onChange({
            ...currentSchema,
            element_meta_fields: {
                ...currentSchema.element_meta_fields,
                [type]: elementFields.filter((_, i) => i !== index),
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Blocks className="size-5" />
                    Element Configuration
                </CardTitle>
                <CardDescription>
                    Configure which element types are allowed and define metadata fields for each type
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {elementTypes.map(({ type, label, icon: Icon, description }) => {
                    const isEnabled = currentSchema.allowed_elements.includes(type);
                    const metaFields = currentSchema.element_meta_fields[type] || [];
                    const hasMetaFields = metaFields.length > 0;

                    return (
                        <Collapsible key={type} defaultOpen={isEnabled && hasMetaFields}>
                            <div className="border rounded-lg">
                                {/* Element header with toggle */}
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <Icon className="size-5 text-muted-foreground" />
                                        <div>
                                            <Label className="text-sm font-medium">{label}</Label>
                                            <p className="text-xs text-muted-foreground">{description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasMetaFields && (
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                {metaFields.length} field{metaFields.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <Switch
                                            checked={isEnabled}
                                            onCheckedChange={() => toggleElement(type)}
                                            disabled={type === 'wrapper'}
                                        />
                                        {isEnabled && (
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                                                </Button>
                                            </CollapsibleTrigger>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded content with configs and meta fields */}
                                {isEnabled && (
                                    <CollapsibleContent>
                                        <div className="border-t p-4 space-y-4 bg-muted/20">
                                            {/* Text-specific config */}
                                            {type === 'text' && (
                                                <div className="p-3 bg-background rounded-md border space-y-2">
                                                    <Label className="text-xs font-medium">Allowed Formats</Label>
                                                    <div className="flex gap-4">
                                                        {(['plain', 'markdown', 'html'] as const).map(format => (
                                                            <label key={format} className="flex items-center gap-2 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={textConfig?.formats?.includes(format) ?? true}
                                                                    onChange={(e) => {
                                                                        const formats = textConfig?.formats || ['plain', 'markdown', 'html'];
                                                                        updateTextConfig(
                                                                            e.target.checked
                                                                                ? [...formats, format]
                                                                                : formats.filter(f => f !== format)
                                                                        );
                                                                    }}
                                                                    className="rounded"
                                                                />
                                                                {format === 'html' ? 'Rich Text' : format.charAt(0).toUpperCase() + format.slice(1)}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Media-specific config */}
                                            {type === 'media' && (
                                                <div className="p-3 bg-background rounded-md border space-y-2">
                                                    <Label className="text-xs font-medium">Allowed Media Types</Label>
                                                    <div className="flex flex-wrap gap-4">
                                                        {(['image', 'video', 'audio', 'document', 'canvas'] as const).map(mediaType => (
                                                            <label key={mediaType} className="flex items-center gap-2 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={mediaConfig?.types?.includes(mediaType) ?? mediaType !== 'canvas'}
                                                                    onChange={(e) => {
                                                                        const types = mediaConfig?.types || ['image', 'video', 'audio', 'document'];
                                                                        updateMediaConfig(
                                                                            e.target.checked
                                                                                ? [...types, mediaType]
                                                                                : types.filter(t => t !== mediaType)
                                                                        );
                                                                    }}
                                                                    className="rounded"
                                                                />
                                                                {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Element metadata fields */}
                                            <div className="space-y-3">
                                                <Label className="text-xs font-medium">Metadata Fields</Label>
                                                <MetaFieldList
                                                    fields={metaFields}
                                                    onUpdate={(index, updates) => updateMetaField(type, index, updates)}
                                                    onRemove={(index) => removeMetaField(type, index)}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => addMetaField(type)}
                                                >
                                                    <Plus className="size-3 mr-1" />
                                                    Add Metadata Field
                                                </Button>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                )}
                            </div>
                        </Collapsible>
                    );
                })}
            </CardContent>
        </Card>
    );
}

// ============================================================
// Wrappers Tab (Wrapper Purposes)
// ============================================================
export function SchemaEditorWrappers({ schema, onChange, wrapperPurposes = [] }: SchemaEditorWrappersProps) {
    const currentSchema = buildCurrentSchema(schema);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="size-5" />
                    Allowed Wrapper Purposes
                </CardTitle>
                <CardDescription>
                    Select which wrapper purposes can be used in this collection.
                    If none are selected, all purposes are allowed.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {wrapperPurposes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Layers className="size-12 mx-auto mb-4 opacity-50" />
                        <p>No wrapper purposes defined yet.</p>
                        <p className="text-sm">
                            <a href="/settings/wrapper-purposes" className="text-primary hover:underline">
                                Create wrapper purposes
                            </a> to configure them here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-md">
                            <div>
                                <Label className="text-sm font-medium">Allow all purposes</Label>
                                <p className="text-xs text-muted-foreground">
                                    When enabled, all wrapper purposes are available
                                </p>
                            </div>
                            <Switch
                                checked={!currentSchema.allowed_wrapper_purposes || currentSchema.allowed_wrapper_purposes.length === 0}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        onChange({
                                            ...currentSchema,
                                            allowed_wrapper_purposes: [],
                                        });
                                    } else {
                                        const systemPurpose = wrapperPurposes.find(p => p.is_system);
                                        onChange({
                                            ...currentSchema,
                                            allowed_wrapper_purposes: systemPurpose ? [systemPurpose.slug] : [],
                                        });
                                    }
                                }}
                            />
                        </div>
                        
                        {currentSchema.allowed_wrapper_purposes && currentSchema.allowed_wrapper_purposes.length > 0 && (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {wrapperPurposes.map((purpose) => (
                                    <label
                                        key={purpose.slug}
                                        className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                                            currentSchema.allowed_wrapper_purposes?.includes(purpose.slug)
                                                ? 'bg-primary/5 border-primary/50'
                                                : 'hover:bg-muted/50'
                                        } ${purpose.is_system ? 'opacity-75' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={currentSchema.allowed_wrapper_purposes?.includes(purpose.slug) || false}
                                            onChange={(e) => {
                                                const purposes = currentSchema.allowed_wrapper_purposes || [];
                                                if (e.target.checked) {
                                                    onChange({
                                                        ...currentSchema,
                                                        allowed_wrapper_purposes: [...purposes, purpose.slug],
                                                    });
                                                } else {
                                                    if (purposes.length > 1) {
                                                        onChange({
                                                            ...currentSchema,
                                                            allowed_wrapper_purposes: purposes.filter(p => p !== purpose.slug),
                                                        });
                                                    }
                                                }
                                            }}
                                            disabled={purpose.is_system && currentSchema.allowed_wrapper_purposes?.length === 1}
                                            className="mt-1 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{purpose.name}</span>
                                                {purpose.is_system && (
                                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">System</span>
                                                )}
                                            </div>
                                            {purpose.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {purpose.description}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================
// Meta Field List Component (Shared)
// ============================================================
interface MetaFieldListProps {
    fields: MetaFieldDefinition[];
    onUpdate: (index: number, updates: Partial<MetaFieldDefinition>) => void;
    onRemove: (index: number) => void;
}

function MetaFieldList({ fields, onUpdate, onRemove }: MetaFieldListProps) {
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
                <div key={index} className="flex items-start gap-2 p-3 border rounded-md bg-background">
                    <GripVertical className="size-4 text-muted-foreground mt-2 cursor-move" />
                    <div className="flex-1 space-y-3">
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

                        {/* Textarea-specific options */}
                        {field.type === 'textarea' && (
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
                        )}

                        {/* Select/MultiSelect options */}
                        {(field.type === 'select' || field.type === 'multi_select') && (
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
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
