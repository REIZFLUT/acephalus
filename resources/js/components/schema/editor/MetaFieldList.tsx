import type { MetaFieldDefinition, MetaFieldType, SelectInputStyle, Collection, FilterView, TranslatableString, LocalizableString } from '@/types';
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TranslatableInput, TranslationButton } from '@/components/ui/translatable-input';
import { Plus, Trash2, GripVertical, ChevronDown, Info, Database, List } from 'lucide-react';
import { metaFieldTypes, selectInputStyles } from './constants';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { normalizeToTranslatable, hasAdditionalTranslations } from '@/hooks/use-translation';

interface MetaFieldListProps {
    fields: MetaFieldDefinition[];
    onUpdate: (index: number, updates: Partial<MetaFieldDefinition>) => void;
    onRemove: (index: number) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    collections?: Collection[];
    filterViews?: FilterView[];
}

export function MetaFieldList({ fields, onUpdate, onRemove, onReorder, collections, filterViews }: MetaFieldListProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    if (fields.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">
                No metadata fields defined
            </p>
        );
    }

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            onReorder(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    return (
        <div className="space-y-3">
            {fields.map((field, index) => (
                <MetaFieldItem
                    key={index}

                    field={field}
                    index={index}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    collections={collections}
                    filterViews={filterViews}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
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
    collections?: Collection[];
    filterViews?: FilterView[];
    isDragging: boolean;
    isDragOver: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
}

function MetaFieldItem({
    field,
    index,
    onUpdate,
    onRemove,
    collections,
    filterViews,
    isDragging,
    isDragOver,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
}: MetaFieldItemProps) {
    // Support legacy help_text field for backwards compatibility
    const descriptionValue = field.description || (field as any).help_text;
    const hasDescOrExpl = !!(descriptionValue || field.explanation);
    const [showAdvanced, setShowAdvanced] = useState(hasDescOrExpl);

    const getAdvancedLabel = () => {
        const parts = [];
        if (descriptionValue) parts.push('Description');
        if (field.explanation) parts.push('Explanation');

        if (parts.length > 0) {
            return (
                <span className="flex items-center gap-1">
                    <Info className="size-3" />
                    {parts.join(' & ')} set
                </span>
            );
        }
        return 'Add description & explanation';
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        onDragStart();
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.preventDefault();
        onDragEnd();
    };

    return (
        <div
            className={cn(
                "flex items-start gap-2 p-3 border rounded-md bg-background transition-all duration-200",
                isDragging && "opacity-50 scale-[0.98]",
                isDragOver && "border-primary border-2"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <div
                draggable="true"
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing mt-2"
            >
                <GripVertical className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-3">
                <MetaFieldBasicFields field={field} index={index} onUpdate={onUpdate} onRemove={onRemove} />

                {/* Textarea-specific options */}
                {field.type === 'textarea' && (
                    <TextareaOptions field={field} index={index} onUpdate={onUpdate} />
                )}

                {/* Select/MultiSelect options */}
                {(field.type === 'select' || field.type === 'multi_select') && (
                    <SelectOptions
                        field={field}
                        index={index}
                        onUpdate={onUpdate}
                        collections={collections}
                        filterViews={filterViews}
                    />
                )}

                {/* Advanced options (Description & Explanation) */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronDown className={`size-3 transition-transform ${showAdvanced ? '' : '-rotate-90'}`} />
                            {getAdvancedLabel()}
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                        <div className="ml-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Description (shown below the input)
                                </Label>
                                <TranslatableInput
                                    placeholder="Help text shown below the field..."
                                    value={field.description}
                                    onChange={(value) => onUpdate(index, { description: value.en ? value : undefined })}
                                    multiline
                                    rows={2}
                                    inputClassName="text-sm"
                                    modalTitle="Description Translations"
                                    modalDescription="Add translations for the field description."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Explanation (shown via info icon tooltip)
                                </Label>
                                <TranslatableInput
                                    placeholder="Detailed explanation shown when hovering the info icon..."
                                    value={field.explanation}
                                    onChange={(value) => onUpdate(index, { explanation: value.en ? value : undefined })}
                                    multiline
                                    rows={2}
                                    inputClassName="text-sm"
                                    modalTitle="Explanation Translations"
                                    modalDescription="Add translations for the field explanation tooltip."
                                />
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
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
    // Get the English value for display
    const labelEn = typeof field.label === 'string' ? field.label : (field.label?.en || '');

    return (
        <div className="grid gap-3 sm:grid-cols-4">
            <Input
                placeholder="Field name"
                value={field.name}
                onChange={(e) => {
                    const newName = e.target.value.toLowerCase().replace(/\s+/g, '_');
                    const updates: Partial<MetaFieldDefinition> = { name: newName };
                    // Auto-fill label if empty
                    if (!labelEn) {
                        updates.label = { en: e.target.value };
                    }
                    onUpdate(index, updates);
                }}
                className="h-8"
            />
            <TranslatableInput
                placeholder="Label"
                value={field.label}
                onChange={(value) => onUpdate(index, { label: value })}
                inputClassName="h-8"
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
    collections?: Collection[];
    filterViews?: FilterView[];
}

function SelectOptions({ field, index, onUpdate, collections, filterViews }: SelectOptionsProps) {
    const optionsSource = field.options_source || 'static';
    const selectedCollectionId = field.collection_config?.collection_id;

    // Filter views for the selected collection
    const collectionFilterViews = filterViews?.filter(
        fv => fv.collection_id === selectedCollectionId
    ) || [];

    const handleSourceChange = (source: 'static' | 'collection') => {
        const updates: Partial<MetaFieldDefinition> = {
            options_source: source
        };

        if (source === 'static') {
            // Clear collection config when switching to static
            updates.collection_config = undefined;
            if (!field.options) {
                updates.options = [];
            }
        } else {
            // Clear static options when switching to collection
            updates.options = undefined;
            // Disable allow_custom when using collection (values are UUIDs)
            updates.allow_custom = false;
        }

        onUpdate(index, updates);
    };

    const handleAllowCustomChange = (checked: boolean) => {
        const updates: Partial<MetaFieldDefinition> = {
            allow_custom: checked
        };

        // If enabling custom values and currently using collection, switch to static
        if (checked && optionsSource === 'collection') {
            updates.options_source = 'static';
            updates.collection_config = undefined;
            if (!field.options) {
                updates.options = [];
            }
        }

        onUpdate(index, updates);
    };

    const handleCollectionChange = (collectionId: string) => {
        if (collectionId === '__none__' || !collectionId) {
            onUpdate(index, {
                collection_config: undefined,
            });
        } else {
            onUpdate(index, {
                collection_config: {
                    collection_id: collectionId,
                    filter_view_id: undefined, // Reset filter view when collection changes
                }
            });
        }
    };

    const handleFilterViewChange = (filterViewId: string) => {
        onUpdate(index, {
            collection_config: {
                ...field.collection_config,
                collection_id: field.collection_config?.collection_id || '',
                filter_view_id: filterViewId === 'none' ? undefined : filterViewId,
            }
        });
    };

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
                                onChange={(e) => handleAllowCustomChange(e.target.checked)}
                                className="rounded"
                            />
                            Allow custom values
                        </label>
                    </div>
                )}
            </div>

            {/* Options Source */}
            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label className="text-xs">Options Source</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={optionsSource === 'static' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleSourceChange('static')}
                            className="h-8 text-xs flex-1"
                        >
                            <List className="size-3 mr-1.5" />
                            Static Options
                        </Button>
                        <Button
                            type="button"
                            variant={optionsSource === 'collection' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleSourceChange('collection')}
                            className="h-8 text-xs flex-1"
                            disabled={!collections || collections.length === 0 || field.allow_custom}
                            title={field.allow_custom ? 'Disable "Allow custom values" to use collection options' : undefined}
                        >
                            <Database className="size-3 mr-1.5" />
                            From Collection
                        </Button>
                    </div>
                </div>

                {/* Static Options */}
                {optionsSource === 'static' && (
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
                                        className="h-8 text-xs flex-1"
                                    />
                                    <TranslatableInput
                                        placeholder="Label"
                                        value={option.label}
                                        onChange={(value) => {
                                            const options = [...(field.options || [])];
                                            options[optIndex] = { ...option, label: value };
                                            onUpdate(index, { options });
                                        }}
                                        inputClassName="h-8 text-xs"
                                        className="flex-1"
                                        modalTitle="Option Label Translations"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            const options = (field.options || []).filter((_, i) => i !== optIndex);
                                            onUpdate(index, { options });
                                        }}
                                        className="size-8 text-destructive hover:text-destructive shrink-0"
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
                )}

                {/* Collection Options */}
                {optionsSource === 'collection' && (
                    <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Collection</Label>
                                <Select
                                    value={selectedCollectionId || '__none__'}
                                    onValueChange={handleCollectionChange}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select collection..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Select collection...</SelectItem>
                                        {(collections || []).map((collection) => {
                                            // Use _id or id (MongoDB serializes _id as id in JSON)
                                            const collectionId = String(collection._id || collection.id || '');
                                            if (!collectionId) {
                                                return null;
                                            }
                                            return (
                                                <SelectItem key={collectionId} value={collectionId}>
                                                    {collection.name}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedCollectionId && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Filter View (optional)</Label>
                                    <Select
                                        value={field.collection_config?.filter_view_id || 'none'}
                                        onValueChange={handleFilterViewChange}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="No filter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No filter</SelectItem>
                                            {collectionFilterViews.map((fv) => (
                                                <SelectItem key={fv._id} value={fv._id}>
                                                    {fv.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        {selectedCollectionId && (
                            <p className="text-xs text-muted-foreground">
                                Options will be loaded from contents in this collection.
                                Value: content UUID, Label: content title.
                            </p>
                        )}
                        {!selectedCollectionId && (
                            <p className="text-xs text-muted-foreground italic">
                                Select a collection to use its contents as options.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

