import type { CollectionSchema, WrapperPurpose, Edition, Collection, FilterView } from '@/types';

export interface SchemaEditorBaseProps {
    schema: CollectionSchema | null;
    onChange: (schema: CollectionSchema) => void;
    collections?: Collection[];
    filterViews?: FilterView[];
}

export interface SchemaEditorWrappersProps extends SchemaEditorBaseProps {
    wrapperPurposes?: WrapperPurpose[];
}

export interface SchemaEditorEditionsProps extends SchemaEditorBaseProps {
    editions?: Edition[];
}

