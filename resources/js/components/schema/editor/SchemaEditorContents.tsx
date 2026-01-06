import type { MetaFieldDefinition } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, FileStack } from 'lucide-react';
import { MetaFieldList } from './MetaFieldList';
import { buildCurrentSchema } from './constants';
import type { SchemaEditorBaseProps } from './types';

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
        
        // If the field name changed, update the corresponding list view column
        const oldField = currentSchema.content_meta_fields[index];
        if (updates.name && oldField.name !== updates.name) {
            const listViewSettings = currentSchema.list_view_settings;
            if (listViewSettings?.columns) {
                const oldColumnId = `meta_${oldField.name}`;
                const newColumnId = `meta_${updates.name}`;
                const updatedColumns = listViewSettings.columns.map(col => 
                    col.id === oldColumnId 
                        ? { ...col, id: newColumnId, meta_field: updates.name, label: updates.label || col.label }
                        : col
                );
                onChange({
                    ...currentSchema,
                    content_meta_fields: fields,
                    list_view_settings: {
                        ...listViewSettings,
                        columns: updatedColumns,
                    },
                });
                return;
            }
        }
        
        // If the label changed, update the corresponding list view column label
        if (updates.label) {
            const listViewSettings = currentSchema.list_view_settings;
            if (listViewSettings?.columns) {
                const columnId = `meta_${currentSchema.content_meta_fields[index].name}`;
                const updatedColumns = listViewSettings.columns.map(col => 
                    col.id === columnId ? { ...col, label: updates.label } : col
                );
                onChange({
                    ...currentSchema,
                    content_meta_fields: fields,
                    list_view_settings: {
                        ...listViewSettings,
                        columns: updatedColumns,
                    },
                });
                return;
            }
        }
        
        onChange({
            ...currentSchema,
            content_meta_fields: fields,
        });
    };

    const removeMetaField = (index: number) => {
        const fieldToRemove = currentSchema.content_meta_fields[index];
        const columnIdToRemove = `meta_${fieldToRemove.name}`;
        
        // Also remove the corresponding column from list_view_settings
        const listViewSettings = currentSchema.list_view_settings;
        let updatedListViewSettings = listViewSettings;
        
        if (listViewSettings?.columns) {
            const updatedColumns = listViewSettings.columns.filter(col => col.id !== columnIdToRemove);
            
            // Also check if default_sort_column references the removed field
            let defaultSortColumn = listViewSettings.default_sort_column;
            if (defaultSortColumn === columnIdToRemove) {
                defaultSortColumn = 'updated_at'; // Reset to default
            }
            
            updatedListViewSettings = {
                ...listViewSettings,
                columns: updatedColumns,
                default_sort_column: defaultSortColumn,
            };
        }
        
        onChange({
            ...currentSchema,
            content_meta_fields: currentSchema.content_meta_fields.filter((_, i) => i !== index),
            list_view_settings: updatedListViewSettings,
        });
    };

    const toggleMetaOnlyContent = (enabled: boolean) => {
        onChange({
            ...currentSchema,
            meta_only_content: enabled,
        });
    };

    return (
        <div className="space-y-6">
            {/* Meta Only Content Option */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileStack className="size-5" />
                        Content Mode
                    </CardTitle>
                    <CardDescription>
                        Configure how content items in this collection are structured
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <Label className="text-sm font-medium">Meta Only Content</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                When enabled, contents only display metadata fields without the block editor.
                                <br />
                                Ideal for collections with a fixed set of content types defined via metadata.
                            </p>
                        </div>
                        <Switch
                            checked={currentSchema.meta_only_content ?? false}
                            onCheckedChange={toggleMetaOnlyContent}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Content Metadata Fields */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileStack className="size-5" />
                        Content Metadata Fields
                    </CardTitle>
                    <CardDescription>
                        Define additional metadata fields for each content item in this collection
                        {currentSchema.meta_only_content && (
                            <span className="block mt-1 text-primary font-medium">
                                These fields will be displayed prominently in the content editor.
                            </span>
                        )}
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
        </div>
    );
}

