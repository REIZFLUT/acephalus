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
    created_at?: string;
    updated_at?: string;
    permissions?: Permission[];
    permissions_count?: number;
    users_count?: number;
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Translatable string - supports multiple locales
 * English (en) is always required, other locales are optional
 */
export interface TranslatableString {
    en: string;
    de?: string;
    [locale: string]: string | undefined;
}

/**
 * Utility type for fields that can be either a plain string or a TranslatableString
 * This allows backwards compatibility with existing string fields
 */
export type LocalizableString = string | TranslatableString;

/**
 * Helper to check if a value is a TranslatableString
 */
export function isTranslatableString(value: LocalizableString): value is TranslatableString {
    return typeof value === 'object' && value !== null && 'en' in value;
}

/**
 * Permission categories as defined in the seeder
 */
export type PermissionCategory = 
    | 'contents'
    | 'collections'
    | 'collections_schema'
    | 'media'
    | 'media_meta_fields'
    | 'editions'
    | 'wrapper_purposes'
    | 'pinned_navigation'
    | 'custom_elements'
    | 'users'
    | 'roles'
    | 'settings'
    | 'locking';

/**
 * All available permission names
 */
export type PermissionName =
    // Contents
    | 'contents.view'
    | 'contents.create'
    | 'contents.update'
    | 'contents.delete'
    | 'contents.publish'
    // Collections
    | 'collections.view'
    | 'collections.create'
    | 'collections.update'
    | 'collections.delete'
    | 'collections.schema.view'
    | 'collections.schema.update'
    // Media
    | 'media.view'
    | 'media.create'
    | 'media.update'
    | 'media.delete'
    // Media Meta Fields
    | 'media-meta-fields.view'
    | 'media-meta-fields.create'
    | 'media-meta-fields.update'
    | 'media-meta-fields.delete'
    // Editions
    | 'editions.view'
    | 'editions.create'
    | 'editions.update'
    | 'editions.delete'
    // Wrapper Purposes
    | 'wrapper-purposes.view'
    | 'wrapper-purposes.create'
    | 'wrapper-purposes.update'
    | 'wrapper-purposes.delete'
    // Pinned Navigation
    | 'pinned-navigation.view'
    | 'pinned-navigation.create'
    | 'pinned-navigation.update'
    | 'pinned-navigation.delete'
    // Custom Elements
    | 'custom-elements.view'
    | 'custom-elements.create'
    | 'custom-elements.update'
    | 'custom-elements.delete'
    // Users
    | 'users.view'
    | 'users.create'
    | 'users.update'
    | 'users.delete'
    // Roles
    | 'roles.view'
    | 'roles.create'
    | 'roles.update'
    | 'roles.delete'
    // Settings
    | 'settings.view'
    // Locking
    | 'collections.lock'
    | 'collections.unlock'
    | 'contents.lock'
    | 'contents.unlock'
    | 'elements.lock'
    | 'elements.unlock';

/**
 * Lock information for a resource
 */
export interface LockInfo {
    is_locked: boolean;
    locked_by: number | null;
    locked_at: string | null;
    lock_reason: string | null;
    locked_by_name?: string;
    source?: 'self' | 'collection' | 'content';
}

export interface Collection {
    _id: string;
    id: string; // MongoDB models serialize _id as 'id' in JSON
    name: string;
    slug: string;
    description: string | null;
    schema: Schema | null;
    settings: Record<string, unknown> | null;
    collection_meta: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    contents_count?: number;
    // Lock fields
    is_locked?: boolean;
    locked_by?: number | null;
    locked_at?: string | null;
    lock_reason?: string | null;
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
    | 'editions'
    | 'is_locked';

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
    label: LocalizableString;
    type: MetaFieldType;
    required: boolean;
    explanation?: LocalizableString; // Optional explanation shown via info icon
    default_value?: unknown;
    options?: MetaFieldOption[]; // For select/multi-select with static options
    placeholder?: LocalizableString;
    description?: LocalizableString;
    // For textarea fields
    editor_type?: 'textarea' | 'tinymce' | 'codemirror';
    target_format?: 'plain' | 'html' | 'css' | 'javascript' | 'markdown' | 'json' | 'xml';
    // For select/multi-select fields
    input_style?: SelectInputStyle;
    allow_custom?: boolean; // For tags/combobox: allow custom values
    options_source?: 'static' | 'collection'; // Source for select options
    collection_config?: SelectCollectionConfig; // Configuration when options_source is 'collection'
    // For media fields
    media_config?: MediaMetaFieldConfig;
}

/**
 * Configuration for select fields that source options from a collection
 */
export interface SelectCollectionConfig {
    collection_id: string; // The collection to fetch options from
    filter_view_id?: string; // Optional filter view to apply
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
    label: LocalizableString;
}

/**
 * Value structure for media meta field type
 */
export interface MediaMetaFieldValue {
    // Common fields
    type: 'file' | 'folder';
    id: string;
    name: string;
    path?: string;
    // File-specific fields
    media_type?: 'image' | 'video' | 'audio' | 'document';
    mime_type?: string;
    url?: string;
    thumbnail_urls?: {
        small?: string;
        medium?: string;
        large?: string;
    };
}

/**
 * Configuration options for media meta field
 */
export interface MediaMetaFieldConfig {
    allowed_types?: ('image' | 'video' | 'audio' | 'document')[];
    allow_folders?: boolean; // If true, can also select folders (default: true)
}

export type MetaFieldType = 
    | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'time'
    | 'select'
    | 'multi_select'
    | 'url'
    | 'email'
    | 'color'
    | 'json'
    | 'media';

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
    // Lock fields
    is_locked?: boolean;
    locked_by?: number | null;
    locked_at?: string | null;
    lock_reason?: string | null;
    // Effective lock info (includes parent hierarchy)
    is_effectively_locked?: boolean;
    effective_lock_source?: 'self' | 'collection' | null;
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
    // Lock fields
    is_locked?: boolean;
    locked_by?: number | null;
    locked_at?: string | null;
    lock_reason?: string | null;
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
    mime_type?: string;
    alt: string;
    caption: string;
    url?: string;
    /** If a folder is selected instead of a file */
    folder_id?: string;
    folder_path?: string;
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
    name: LocalizableString;
    description: LocalizableString | null;
    icon: string | null;
    css_class: string | null;
    is_system: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Edition {
    _id: string;
    slug: string;
    name: LocalizableString;
    description: LocalizableString | null;
    icon: string | null;
    is_system: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Custom Element Model (MongoDB)
 * Represents a custom element definition stored in the database
 */
export interface CustomElementModel {
    _id: string;
    type: string;
    label: LocalizableString;
    description: LocalizableString | null;
    icon: string | null;
    category: 'content' | 'data' | 'layout' | 'interactive' | 'media';
    can_have_children: boolean;
    fields: CustomElementField[];
    default_data: Record<string, unknown>;
    preview_template: string | null;
    css_class: string | null;
    is_system: boolean;
    order: number;
    created_at?: string;
    updated_at?: string;
}

/**
 * Custom Element categories
 */
export type CustomElementCategory = 'content' | 'data' | 'layout' | 'interactive' | 'media';

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
    label: LocalizableString;
    description?: LocalizableString;
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
    label: LocalizableString;
    inputType: CustomElementInputType;
    placeholder?: LocalizableString;
    helpText?: LocalizableString;
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
    label: LocalizableString;
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
    tags: string[] | null;
    metadata: Record<string, unknown> | null;
    thumbnails?: Record<string, string> | null;
    folder_id: string | null;
    folder_path?: string;
    folder_name?: string;
    created_at: string;
    updated_at: string;
    url: string;
    /** @deprecated Use thumbnail_urls instead */
    thumbnail_url?: string;
    /** Thumbnail URLs for different sizes (small: 80px, medium: 300px, large: 800px) */
    thumbnail_urls?: {
        small?: string;
        medium?: string;
        large?: string;
    };
}

export interface MediaFolder {
    _id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    path: string;
    type: 'root_collections' | 'root_global' | 'collection' | 'content' | 'custom';
    is_system: boolean;
    collection_id: string | null;
    content_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface MediaFolderTree {
    id: string;
    name: string;
    slug: string;
    path: string;
    type: string;
    is_system: boolean;
    can_create_subfolders: boolean;
    can_delete: boolean;
    children: MediaFolderTree[];
}

export interface MediaMetaField {
    _id: string;
    slug: string;
    name: string;
    description: string | null;
    field_type: string;
    options: { value: string; label: string }[] | null;
    is_system: boolean;
    required: boolean;
    placeholder: string | null;
    order: number;
}

export interface FocusArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Diff summary for a version compared to its predecessor
export interface VersionDiffSummary {
    added: number;
    removed: number;
    modified: number;
    title_changed: boolean;
}

// Version snapshot containing the content state at that point in time
export interface VersionSnapshot {
    title: string;
    slug: string;
    status: string;
    metadata?: Record<string, unknown>;
}

export interface ContentVersion {
    _id: string;
    content_id: string;
    version_number: number;
    elements: BlockElement[];
    created_by: number | null;
    change_note: string | null;
    snapshot?: VersionSnapshot;
    created_at: string;
    // Enhanced fields provided by the backend
    creator_name?: string | null;
    diff_summary?: VersionDiffSummary;
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

// Filter Types

/**
 * Available filter operators
 */
export type FilterOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'starts_with'
    | 'ends_with'
    | 'in'
    | 'not_in'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'exists'
    | 'not_exists'
    | 'regex'
    | 'is_empty'
    | 'is_not_empty';

/**
 * A single filter condition
 */
export interface FilterCondition {
    type: 'condition';
    field: string;
    operator: FilterOperator;
    value: unknown;
}

/**
 * A group of filter conditions (AND/OR)
 */
export interface FilterConditionGroup {
    type: 'group';
    operator: 'and' | 'or';
    children: (FilterCondition | FilterConditionGroup)[];
}

/**
 * Sort rule for filter views
 */
export interface FilterSortRule {
    field: string;
    direction: 'asc' | 'desc';
}

/**
 * Filter view model
 */
export interface FilterView {
    _id: string;
    name: string;
    slug: string;
    description: string | null;
    collection_id: string | null;
    is_system: boolean;
    conditions: FilterConditionGroup;
    sort: FilterSortRule[];
    raw_query: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

/**
 * Available field for filtering
 */
export interface FilterField {
    field: string;
    label: LocalizableString;
    type: string;
    options?: MetaFieldOption[];
}

/**
 * Operator option for UI
 */
export interface FilterOperatorOption {
    value: FilterOperator;
    label: string;
}

/**
 * Filter definition in collection settings
 */
export interface CollectionFilterDefinition {
    id: string;
    name: string;
    field: string;
    type: 'single' | 'multiple';
    source: 'meta_field' | 'manual';
    meta_field_name?: string;
    options?: MetaFieldOption[];
}

/**
 * Pinned navigation item for the sidebar
 */
export interface PinnedNavigationItem {
    _id: string;
    name: string;
    collection_id: string;
    filter_view_id: string | null;
    icon: string | null;
    order: number;
    is_active: boolean;
    collection?: Pick<Collection, '_id' | 'name' | 'slug'>;
    filter_view?: Pick<FilterView, '_id' | 'name' | 'slug'>;
}

/**
 * Pinned navigation item as shared via Inertia (simplified for sidebar)
 */
export interface PinnedNavigationItemShared {
    _id: string;
    name: string;
    icon: string | null;
    url: string;
    collection_slug: string | null;
    filter_view_id: string | null;
}

/**
 * Auth data shared via Inertia
 */
export interface AuthData {
    user: (Pick<User, 'id' | 'name' | 'email' | 'email_verified_at'> & {
        roles: string[];
        permissions: string[];
        is_super_admin: boolean;
    }) | null;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: AuthData;
    flash: {
        success?: string;
        error?: string;
    };
    pinnedNavigation: PinnedNavigationItemShared[];
    locale: string;
    availableLocales: string[];
};

declare module '@inertiajs/react' {
    export function usePage<T extends PageProps = PageProps>(): {
        props: T;
        url: string;
        component: string;
        version: string | null;
    };
}
