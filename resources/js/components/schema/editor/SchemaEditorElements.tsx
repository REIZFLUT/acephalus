import { useMemo } from 'react';
import type { ElementType, MetaFieldDefinition, TextElementConfig, MediaElementConfig } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Blocks, ChevronDown } from 'lucide-react';
import { useCustomElements } from '@/hooks/use-custom-elements';
import { MetaFieldList } from './MetaFieldList';
import { buildCurrentSchema, builtInElementTypes, type ElementTypeInfo } from './constants';
import { getLucideIcon } from './utils';
import type { SchemaEditorBaseProps } from './types';

export function SchemaEditorElements({ schema, onChange, collections, filterViews }: SchemaEditorBaseProps) {
    const currentSchema = buildCurrentSchema(schema);
    const textConfig = currentSchema.element_configs.text as TextElementConfig | undefined;
    const mediaConfig = currentSchema.element_configs.media as MediaElementConfig | undefined;

    // Get custom elements
    const { definitions: customElements } = useCustomElements();

    // Combine built-in and custom element types
    const allElementTypes = useMemo((): ElementTypeInfo[] => {
        const customTypes: ElementTypeInfo[] = customElements.map(ce => ({
            type: ce.type,
            label: ce.label,
            icon: getLucideIcon(ce.icon || 'box'),
            description: ce.description || '',
            isCustom: true,
        }));
        return [...builtInElementTypes, ...customTypes];
    }, [customElements]);

    const toggleElement = (type: ElementType | string) => {
        const allowed = currentSchema.allowed_elements.includes(type as ElementType)
            ? currentSchema.allowed_elements.filter(t => t !== type)
            : [...currentSchema.allowed_elements, type as ElementType];
        
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
                {allElementTypes.map(({ type, label, icon: Icon, description, isCustom }) => {
                    const isEnabled = currentSchema.allowed_elements.includes(type as ElementType);
                    const metaFields = currentSchema.element_meta_fields[type as ElementType] || [];
                    const hasMetaFields = metaFields.length > 0;

                    return (
                        <Collapsible key={type} defaultOpen={isEnabled && hasMetaFields}>
                            <div className={`border rounded-lg ${isCustom ? 'border-dashed border-primary/30' : ''}`}>
                                {/* Element header with toggle */}
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <Icon className="size-5 text-muted-foreground" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm font-medium">{label}</Label>
                                                {isCustom && (
                                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
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
                                        {isEnabled && !isCustom && (
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                                                </Button>
                                            </CollapsibleTrigger>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded content with configs and meta fields */}
                                {isEnabled && !isCustom && (
                                    <CollapsibleContent>
                                        <div className="border-t p-4 space-y-4 bg-muted/20">
                                            {/* Text-specific config */}
                                            {type === 'text' && (
                                                <TextElementSettings 
                                                    textConfig={textConfig} 
                                                    onUpdate={updateTextConfig} 
                                                />
                                            )}

                                            {/* Media-specific config */}
                                            {type === 'media' && (
                                                <MediaElementSettings 
                                                    mediaConfig={mediaConfig} 
                                                    onUpdate={updateMediaConfig} 
                                                />
                                            )}

                                            {/* Element metadata fields */}
                                            <div className="space-y-3">
                                                <Label className="text-xs font-medium">Metadata Fields</Label>
                                                <MetaFieldList
                                                    fields={metaFields}
                                                    onUpdate={(index, updates) => updateMetaField(type as ElementType, index, updates)}
                                                    onRemove={(index) => removeMetaField(type as ElementType, index)}
                                                    collections={collections}
                                                    filterViews={filterViews}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => addMetaField(type as ElementType)}
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

interface TextElementSettingsProps {
    textConfig: TextElementConfig | undefined;
    onUpdate: (formats: ('plain' | 'markdown' | 'html')[]) => void;
}

function TextElementSettings({ textConfig, onUpdate }: TextElementSettingsProps) {
    return (
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
                                onUpdate(
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
    );
}

interface MediaElementSettingsProps {
    mediaConfig: MediaElementConfig | undefined;
    onUpdate: (types: ('image' | 'video' | 'audio' | 'document' | 'canvas')[]) => void;
}

function MediaElementSettings({ mediaConfig, onUpdate }: MediaElementSettingsProps) {
    return (
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
                                onUpdate(
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
    );
}

