import type { MetaFieldDefinition } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderCog } from 'lucide-react';
import { MetaFieldList } from './MetaFieldList';
import { buildCurrentSchema } from './constants';
import type { SchemaEditorBaseProps } from './types';

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

