import { useState } from 'react';
import type { CollectionSchema, ElementType, MetaFieldDefinition, MetaFieldType, TextElementConfig, MediaElementConfig, WrapperPurpose } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';

interface SchemaEditorProps {
    schema: CollectionSchema | null;
    onChange: (schema: CollectionSchema) => void;
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
    allowed_wrapper_purposes: [], // Empty means all are allowed
};

export function SchemaEditor({ schema, onChange, wrapperPurposes = [] }: SchemaEditorProps) {
    // Merge incoming schema with defaults to ensure all properties exist
    const currentSchema: CollectionSchema = {
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
        allowed_wrapper_purposes: schema?.allowed_wrapper_purposes || [],
    };

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

    const addMetaField = (target: 'content' | ElementType) => {
        const newField: MetaFieldDefinition = {
            name: '',
            label: '',
            type: 'text',
            required: false,
        };

        if (target === 'content') {
            onChange({
                ...currentSchema,
                content_meta_fields: [...currentSchema.content_meta_fields, newField],
            });
        } else {
            const elementFields = currentSchema.element_meta_fields[target] || [];
            onChange({
                ...currentSchema,
                element_meta_fields: {
                    ...currentSchema.element_meta_fields,
                    [target]: [...elementFields, newField],
                },
            });
        }
    };

    const updateMetaField = (
        target: 'content' | ElementType,
        index: number,
        updates: Partial<MetaFieldDefinition>
    ) => {
        if (target === 'content') {
            const fields = [...currentSchema.content_meta_fields];
            fields[index] = { ...fields[index], ...updates };
            onChange({
                ...currentSchema,
                content_meta_fields: fields,
            });
        } else {
            const elementFields = [...(currentSchema.element_meta_fields[target] || [])];
            elementFields[index] = { ...elementFields[index], ...updates };
            onChange({
                ...currentSchema,
                element_meta_fields: {
                    ...currentSchema.element_meta_fields,
                    [target]: elementFields,
                },
            });
        }
    };

    const removeMetaField = (target: 'content' | ElementType, index: number) => {
        if (target === 'content') {
            onChange({
                ...currentSchema,
                content_meta_fields: currentSchema.content_meta_fields.filter((_, i) => i !== index),
            });
        } else {
            const elementFields = currentSchema.element_meta_fields[target] || [];
            onChange({
                ...currentSchema,
                element_meta_fields: {
                    ...currentSchema.element_meta_fields,
                    [target]: elementFields.filter((_, i) => i !== index),
                },
            });
        }
    };

    const textConfig = currentSchema.element_configs.text as TextElementConfig | undefined;
    const mediaConfig = currentSchema.element_configs.media as MediaElementConfig | undefined;

    return (
        <div className="space-y-6">
            <Tabs defaultValue="elements">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="elements">Element Types</TabsTrigger>
                    <TabsTrigger value="wrapper-purposes">Wrapper Purposes</TabsTrigger>
                    <TabsTrigger value="content-meta">Content Metadata</TabsTrigger>
                    <TabsTrigger value="element-meta">Element Metadata</TabsTrigger>
                </TabsList>

                {/* Element Types Tab */}
                <TabsContent value="elements" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Allowed Element Types</CardTitle>
                            <CardDescription>
                                Select which element types can be used in this collection
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {elementTypes.map(({ type, label, icon: Icon, description }) => (
                                <div key={type} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Icon className="size-5 text-muted-foreground" />
                                            <div>
                                                <Label className="text-sm font-medium">{label}</Label>
                                                <p className="text-xs text-muted-foreground">{description}</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={currentSchema.allowed_elements.includes(type)}
                                            onCheckedChange={() => toggleElement(type)}
                                            disabled={type === 'wrapper'} // Wrapper is always enabled
                                        />
                                    </div>

                                    {/* Text-specific config */}
                                    {type === 'text' && currentSchema.allowed_elements.includes('text') && (
                                        <div className="ml-8 p-3 bg-muted/30 rounded-md space-y-2">
                                            <Label className="text-xs">Allowed Formats</Label>
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
                                    {type === 'media' && currentSchema.allowed_elements.includes('media') && (
                                        <div className="ml-8 p-3 bg-muted/30 rounded-md space-y-2">
                                            <Label className="text-xs">Allowed Media Types</Label>
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
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Wrapper Purposes Tab */}
                <TabsContent value="wrapper-purposes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Allowed Wrapper Purposes</CardTitle>
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
                                                    // When disabling "all", select the system purpose by default
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
                                                                // Don't allow removing the last purpose
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
                </TabsContent>

                {/* Content Metadata Tab */}
                <TabsContent value="content-meta" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Metadata Fields</CardTitle>
                            <CardDescription>
                                Define additional metadata fields for each content item
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MetaFieldList
                                fields={currentSchema.content_meta_fields}
                                onUpdate={(index, updates) => updateMetaField('content', index, updates)}
                                onRemove={(index) => removeMetaField('content', index)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addMetaField('content')}
                                className="w-full"
                            >
                                <Plus className="size-4 mr-2" />
                                Add Metadata Field
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Element Metadata Tab */}
                <TabsContent value="element-meta" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Element Metadata Fields</CardTitle>
                            <CardDescription>
                                Define additional metadata fields per element type
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {elementTypes
                                .filter(({ type }) => currentSchema.allowed_elements.includes(type) && type !== 'wrapper')
                                .map(({ type, label, icon: Icon }) => (
                                    <div key={type} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className="size-4 text-muted-foreground" />
                                            <Label className="text-sm font-medium">{label} Element</Label>
                                        </div>
                                        <div className="ml-6 space-y-3">
                                            <MetaFieldList
                                                fields={currentSchema.element_meta_fields[type] || []}
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
                                                Add Field
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                            {/* Wrapper element config */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-muted rounded-md">
                                        <Layers className="size-4" />
                                    </div>
                                    <div>
                                        <Label className="text-base">Wrapper</Label>
                                        <p className="text-sm text-muted-foreground">Container element for grouping other blocks</p>
                                    </div>
                                </div>

                                <div className="ml-6 space-y-3">
                                    <MetaFieldList
                                        fields={currentSchema.element_meta_fields['wrapper'] || []}
                                        onUpdate={(index, updates) => updateMetaField('wrapper', index, updates)}
                                        onRemove={(index) => removeMetaField('wrapper', index)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addMetaField('wrapper')}
                                    >
                                        <Plus className="size-3 mr-1" />
                                        Add Field
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Meta Field List Component
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
                    <div className="flex-1 grid gap-3 sm:grid-cols-4">
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
                            onValueChange={(value: MetaFieldType) => onUpdate(index, { type: value })}
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
                </div>
            ))}
        </div>
    );
}

