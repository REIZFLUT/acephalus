import { 
    Type, 
    Image, 
    Code, 
    FileJson, 
    FileCode2, 
    Layers, 
    Hash, 
    FileText,
    Link2,
} from 'lucide-react';
import type { 
    CollectionSchema, 
    ElementType, 
    MetaFieldDefinition, 
    MetaFieldType, 
    SelectInputStyle, 
    ListViewSettings, 
    ListViewColumn, 
    ListViewBaseColumn 
} from '@/types';

export interface ElementTypeInfo {
    type: ElementType | string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    isCustom?: boolean;
}

export const builtInElementTypes: ElementTypeInfo[] = [
    { type: 'text', label: 'Text', icon: Type, description: 'Rich text, Markdown, or plain text' },
    { type: 'media', label: 'Media', icon: Image, description: 'Images, videos, audio files' },
    { type: 'html', label: 'HTML', icon: Code, description: 'Custom HTML code' },
    { type: 'json', label: 'JSON', icon: FileJson, description: 'Structured JSON data' },
    { type: 'xml', label: 'XML', icon: FileCode2, description: 'XML content' },
    { type: 'svg', label: 'SVG', icon: FileText, description: 'Vector graphics' },
    { type: 'katex', label: 'KaTeX', icon: Hash, description: 'Mathematical formulas' },
    { type: 'wrapper', label: 'Wrapper', icon: Layers, description: 'Container for nested elements' },
    { type: 'reference', label: 'Reference', icon: Link2, description: 'Internal reference to other content' },
];

export const metaFieldTypes: { value: MetaFieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'time', label: 'Time' },
    { value: 'select', label: 'Select' },
    { value: 'multi_select', label: 'Multi-Select' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'color', label: 'Color' },
    { value: 'json', label: 'JSON' },
    { value: 'media', label: 'Attached Media' },
];

export const selectInputStyles: { value: SelectInputStyle; label: string; singleSelect: boolean; multiSelect: boolean }[] = [
    { value: 'dropdown', label: 'Dropdown', singleSelect: true, multiSelect: true },
    { value: 'combobox', label: 'Combobox (searchable)', singleSelect: true, multiSelect: true },
    { value: 'tags', label: 'Tag Input', singleSelect: false, multiSelect: true },
    { value: 'radio', label: 'Radio Buttons', singleSelect: true, multiSelect: false },
    { value: 'checkbox', label: 'Checkboxes', singleSelect: false, multiSelect: true },
    { value: 'toggle_group', label: 'Toggle Group', singleSelect: true, multiSelect: true },
];

export const defaultListViewColumns: ListViewColumn[] = [
    { id: 'title', label: 'Title', type: 'base', visible: true, toggleable: false, sortable: true },
    { id: 'status', label: 'Status', type: 'base', visible: true, toggleable: true, sortable: true },
    { id: 'is_locked', label: 'Lock', type: 'base', visible: false, toggleable: true, sortable: true },
    { id: 'current_version', label: 'Version', type: 'base', visible: true, toggleable: true, sortable: true },
    { id: 'updated_at', label: 'Updated', type: 'base', visible: true, toggleable: true, sortable: true },
    { id: 'slug', label: 'Slug', type: 'base', visible: false, toggleable: true, sortable: true },
    { id: 'created_at', label: 'Created', type: 'base', visible: false, toggleable: true, sortable: true },
    { id: 'editions', label: 'Editions', type: 'base', visible: false, toggleable: true, sortable: false },
];

export const defaultListViewSettings: ListViewSettings = {
    columns: defaultListViewColumns,
    default_per_page: 20,
    per_page_options: [10, 20, 50, 100],
    default_sort_column: 'updated_at',
    default_sort_direction: 'desc',
};

export const baseColumnDefinitions: { id: ListViewBaseColumn; label: string; description: string }[] = [
    { id: 'title', label: 'Title', description: 'Content title and slug path' },
    { id: 'slug', label: 'Slug', description: 'URL-friendly identifier' },
    { id: 'status', label: 'Status', description: 'Publication status (draft, published, archived)' },
    { id: 'is_locked', label: 'Lock', description: 'Shows if the content is locked' },
    { id: 'current_version', label: 'Version', description: 'Current version number' },
    { id: 'updated_at', label: 'Updated', description: 'Last modification date' },
    { id: 'created_at', label: 'Created', description: 'Creation date' },
    { id: 'editions', label: 'Editions', description: 'Associated edition tags' },
];

export const defaultSchema: CollectionSchema = {
    allowed_elements: ['text', 'media', 'html', 'json', 'xml', 'svg', 'katex', 'wrapper', 'reference'],
    element_configs: {
        text: { enabled: true, formats: ['plain', 'markdown', 'html'] },
        media: { enabled: true, types: ['image', 'video', 'audio', 'document'] },
        html: { enabled: true },
        json: { enabled: true },
        xml: { enabled: true },
        svg: { enabled: true },
        katex: { enabled: true },
        wrapper: { enabled: true },
        reference: { enabled: true },
    },
    content_meta_fields: [],
    element_meta_fields: {} as Record<ElementType, MetaFieldDefinition[]>,
    collection_meta_fields: [],
    allowed_wrapper_purposes: [],
    allowed_editions: undefined,
    meta_only_content: false,
    list_view_settings: defaultListViewSettings,
};

/**
 * Builds a complete schema by merging the provided schema with defaults
 */
export function buildCurrentSchema(schema: CollectionSchema | null): CollectionSchema {
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
            reference: { ...defaultSchema.element_configs.reference, ...schema?.element_configs?.reference },
            // Include any custom element configs
            ...Object.fromEntries(
                Object.entries(schema?.element_configs || {})
                    .filter(([key]) => key.startsWith('custom_'))
            ),
        },
        content_meta_fields: schema?.content_meta_fields || defaultSchema.content_meta_fields,
        element_meta_fields: schema?.element_meta_fields || defaultSchema.element_meta_fields,
        collection_meta_fields: schema?.collection_meta_fields || defaultSchema.collection_meta_fields,
        allowed_wrapper_purposes: schema?.allowed_wrapper_purposes || [],
        allowed_editions: schema?.allowed_editions,
        meta_only_content: schema?.meta_only_content ?? defaultSchema.meta_only_content,
        list_view_settings: schema?.list_view_settings ?? defaultSchema.list_view_settings,
    };
}

