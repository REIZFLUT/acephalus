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

export interface CollectionEdition {
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
    current_edition?: string;
    editions?: CollectionEdition[];
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
}

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
    | 'wrapper';

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

export type ElementData = 
    | TextElementData
    | MediaElementData
    | SvgElementData
    | KatexElementData
    | HtmlElementData
    | JsonElementData
    | XmlElementData
    | WrapperElementData
    | Record<string, unknown>;

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
    edition?: string;
    is_edition_end?: boolean;
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
