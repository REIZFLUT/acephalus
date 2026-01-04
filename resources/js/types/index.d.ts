export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    permissions?: Permission[];
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

export interface CollectionRelease {
    name: string;
    created_at: string;
    created_by?: number;
}

export interface Collection {
    _id: string;
    name: string;
    slug: string;
    description: string | null;
    schema: Schema | null;
    settings: Record<string, unknown> | null;
    collection_meta: Record<string, unknown> | null;
    current_release?: string;
    releases?: CollectionRelease[];
    created_at: string;
    updated_at: string;
    contents_count?: number;
}

// Collection Schema - defines what's allowed in a collection
export interface CollectionSchema {
    allowed_elements: ElementType[];
    element_configs: ElementConfigs;
    content_meta_fields: MetaFieldDefinition[];
    element_meta_fields: Record<ElementType, MetaFieldDefinition[]>;
    collection_meta_fields: MetaFieldDefinition[];
    allowed_wrapper_purposes?: string[]; // Array of WrapperPurpose slugs
    allowed_editions?: string[]; // Array of Edition slugs (null/undefined = all editions)
    meta_only_content?: boolean; // When true, contents only show meta fields without block editor
    list_view_settings?: ListViewSettings; // Configuration for content list view
}

// List View Settings - configuration for the content data table
export interface ListViewSettings {
    // Column configurations
    columns: ListViewColumn[];
    // Default number of results per page
    default_per_page: number;
    // Available options for results per page dropdown (empty = no dropdown)
    per_page_options: number[];
    // Default sort column (column id)
    default_sort_column?: string;
    // Default sort direction
    default_sort_direction?: 'asc' | 'desc';
}

// Individual column configuration
export interface ListViewColumn {
    // Unique identifier for the column
    id: string;
    // Display label for the column header
    label: string;
    // Field type: 'base' for model fields, 'meta' for custom metadata fields
    type: 'base' | 'meta';
    // For 'meta' type: the name of the metadata field
    meta_field?: string;
    // Whether the column is visible by default
    visible: boolean;
    // Whether the column can be toggled by the user
    toggleable: boolean;
    // Whether the column is sortable
    sortable: boolean;
    // Column width class (optional)
    width?: 'auto' | 'narrow' | 'medium' | 'wide';
}

// Available base columns for content list view
export type ListViewBaseColumn = 
    | 'title'
    | 'slug'
    | 'status'
    | 'current_version'
    | 'updated_at'
    | 'created_at'
    | 'current_release'
    | 'editions';

// Element-specific configurations
export interface ElementConfigs {
    text?: TextElementConfig;
    media?: MediaElementConfig;
    html?: BaseElementConfig;
    json?: BaseElementConfig;
    xml?: BaseElementConfig;
    svg?: BaseElementConfig;
    katex?: BaseElementConfig;
    wrapper?: BaseElementConfig;
}

export interface BaseElementConfig {
    enabled: boolean;
}

export interface TextElementConfig extends BaseElementConfig {
    formats: ('plain' | 'markdown' | 'html')[];
}

export interface MediaElementConfig extends BaseElementConfig {
    types: ('image' | 'video' | 'audio' | 'document' | 'canvas')[];
    max_size?: number | null;
}

// Metadata field definition
export interface MetaFieldDefinition {
    name: string;
    label: string;
    type: MetaFieldType;
    required: boolean;
    default_value?: unknown;
    options?: MetaFieldOption[]; // For select/multi-select
    placeholder?: string;
    help_text?: string;
    // For textarea fields
    editor_type?: 'textarea' | 'tinymce' | 'codemirror';
    target_format?: 'plain' | 'html' | 'css' | 'javascript' | 'markdown' | 'json' | 'xml';
    // For select/multi-select fields
    input_style?: SelectInputStyle;
    allow_custom?: boolean; // For tags/combobox: allow custom values
}

// Input styles for select/multi-select fields
export type SelectInputStyle = 
    | 'dropdown'    // Standard ShadCN Select
    | 'combobox'    // Searchable dropdown with Command
    | 'tags'        // Tag input with suggestions (multi-select only)
    | 'radio'       // Radio button group (single select only)
    | 'checkbox'    // Checkbox group (multi-select only)
    | 'toggle_group'; // Button toggle group

export interface MetaFieldOption {
    value: string;
    label: string;
}

export type MetaFieldType = 
    | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'select'
    | 'multi_select'
    | 'url'
    | 'email'
    | 'color'
    | 'json';

// Legacy Schema interface (deprecated, use CollectionSchema)
export interface Schema {
    allowed_element_types?: string[];
    required_fields?: Record<string, string>;
    min_elements?: number;
    max_elements?: number | null;
}

export interface Content {
    _id: string;
    collection_id: string;
    title: string;
    slug: string;
    status: ContentStatus;
    current_version: number;
    published_version_id: string | null;
    elements: BlockElement[];
    metadata: Record<string, unknown> | null;
    editions?: string[]; // Array of Edition slugs (empty/undefined = all editions)
    created_at: string;
    updated_at: string;
    collection?: Collection;
    versions_count?: number;
}

export type ContentStatus = 'draft' | 'published' | 'archived';

// Block Element with nested children support
export interface BlockElement {
    _id?: string;
    id: string; // Client-side ID for tracking
    type: ElementType;
    order: number;
    data: ElementData;
    editions?: string[]; // Array of Edition slugs (empty/undefined = all editions)
    children?: BlockElement[]; // For wrapper elements
}

export type ElementType = 
    | 'text'
    | 'media'
    | 'svg'
    | 'katex'
    | 'html'
    | 'json'
    | 'xml'
    | 'wrapper'
    | 'reference';

// Element data types
export interface TextElementData {
    content: string;
    format: 'plain' | 'markdown' | 'html';
}

export interface MediaElementData {
    file_id: string | null;
    media_type: 'image' | 'video' | 'audio' | 'document';
    alt: string;
    caption: string;
    url?: string;
}

export interface SvgElementData {
    content: string;
    viewBox: string;
    title: string;
}

export interface KatexElementData {
    formula: string;
    display_mode: boolean;
}

export interface HtmlElementData {
    content: string;
}

export interface JsonElementData {
    data: Record<string, unknown>;
}

export interface XmlElementData {
    content: string;
    schema: string;
}

export interface WrapperElementData {
    purpose: string; // Now references WrapperPurpose slug
    custom_css_class?: string;
}

export interface ReferenceElementData {
    reference_type: 'collection' | 'content' | 'element';
    collection_id?: string;
    content_id?: string;
    element_id?: string;
    display_title?: string;
}

export interface WrapperPurpose {
    _id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    css_class: string | null;
    is_system: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Edition {
    _id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    is_system: boolean;
    created_at?: string;
    updated_at?: string;
}

export type ElementData = 
    | TextElementData
    | MediaElementData
    | SvgElementData
    | KatexElementData
    | HtmlElementData
    | JsonElementData
    | XmlElementData
    | WrapperElementData
    | ReferenceElementData
    | CustomElementData
    | Record<string, unknown>;

// Custom Element Data (dynamic based on JSON definition)
export type CustomElementData = Record<string, unknown>;

// Custom Element Definition (loaded from JSON files)
export interface CustomElementDefinition {
    type: string;
    label: string;
    description?: string;
    icon?: string;
    category: 'content' | 'data' | 'layout' | 'interactive' | 'media';
    canHaveChildren?: boolean;
    fields: CustomElementField[];
    defaultData?: Record<string, unknown>;
    previewTemplate?: string;
    cssClass?: string;
}

export interface CustomElementField {
    name: string;
    label: string;
    inputType: CustomElementInputType;
    placeholder?: string;
    helpText?: string;
    required?: boolean;
    defaultValue?: unknown;
    validation?: CustomElementValidation;
    options?: CustomElementOption[];
    editorConfig?: CustomElementEditorConfig;
    sliderConfig?: CustomElementSliderConfig;
    mediaConfig?: CustomElementMediaConfig;
    referenceConfig?: CustomElementReferenceConfig;
    conditional?: CustomElementConditional;
    grid?: 'full' | 'half' | 'third' | 'quarter';
}

export type CustomElementInputType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'email'
    | 'url'
    | 'tel'
    | 'password'
    | 'color'
    | 'date'
    | 'datetime'
    | 'time'
    | 'checkbox'
    | 'switch'
    | 'toggle'
    | 'radio'
    | 'select'
    | 'combobox'
    | 'multi_select'
    | 'tags'
    | 'slider'
    | 'range'
    | 'editor'
    | 'code'
    | 'markdown'
    | 'json'
    | 'media'
    | 'reference'
    | 'hidden';

export interface CustomElementOption {
    value: string | number | boolean;
    label: string;
    icon?: string;
    disabled?: boolean;
}

export interface CustomElementValidation {
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
    step?: number;
    minLength?: number;
    maxLength?: number;
    minItems?: number;
    maxItems?: number;
}

export interface CustomElementEditorConfig {
    language?: 'html' | 'css' | 'javascript' | 'json' | 'xml' | 'markdown' | 'php' | 'plain';
    minHeight?: string;
    maxHeight?: string;
    enablePreview?: boolean;
}

export interface CustomElementSliderConfig {
    min?: number;
    max?: number;
    step?: number;
    showValue?: boolean;
    unit?: string;
}

export interface CustomElementMediaConfig {
    allowedTypes?: ('image' | 'video' | 'audio' | 'document')[];
    multiple?: boolean;
    maxFiles?: number;
}

export interface CustomElementReferenceConfig {
    minDepth?: 'collection' | 'content' | 'element';
    maxDepth?: 'collection' | 'content' | 'element';
}

export interface CustomElementConditional {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan';
    value?: unknown;
}

// Legacy Element interface for API compatibility
export interface Element {
    _id: string;
    content_id: string;
    type: ElementType;
    order: number;
    data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Media {
    _id: string;
    filename: string;
    original_filename: string;
    mime_type: string;
    media_type: 'image' | 'video' | 'audio' | 'document';
    size: number;
    size_human: string;
    alt: string | null;
    caption: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    url: string;
}

export interface ContentVersion {
    _id: string;
    content_id: string;
    version_number: number;
    title: string;
    slug: string;
    elements: BlockElement[];
    metadata: Record<string, unknown> | null;
    created_by: number | null;
    change_note: string | null;
    release?: string;
    is_release_end?: boolean;
    created_at: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
};

declare module '@inertiajs/react' {
    export function usePage<T extends PageProps = PageProps>(): {
        props: T;
        url: string;
        component: string;
        version: string | null;
    };
}
