import type { CollectionSchema, WrapperPurpose, Edition } from '@/types';

export interface SchemaEditorBaseProps {
    schema: CollectionSchema | null;
    onChange: (schema: CollectionSchema) => void;
}

export interface SchemaEditorWrappersProps extends SchemaEditorBaseProps {
    wrapperPurposes?: WrapperPurpose[];
}

export interface SchemaEditorEditionsProps extends SchemaEditorBaseProps {
    editions?: Edition[];
}

