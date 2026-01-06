/**
 * Schema Editor Components
 * 
 * This file re-exports all schema editor components from the editor subfolder.
 * The components have been split for better maintainability:
 * 
 * - SchemaEditorMeta: Collection-level metadata fields
 * - SchemaEditorContents: Content metadata fields and meta-only mode
 * - SchemaEditorElements: Element type configuration and element metadata
 * - SchemaEditorWrappers: Wrapper purpose restrictions
 * - SchemaEditorEditions: Edition restrictions
 * - SchemaEditorListView: Data table column configuration
 * - MetaFieldList: Shared component for metadata field lists
 */

export {
    SchemaEditorMeta,
    SchemaEditorContents,
    SchemaEditorElements,
    SchemaEditorWrappers,
    SchemaEditorEditions,
    SchemaEditorListView,
    MetaFieldList,
} from './editor';

// Re-export types for backwards compatibility
export type { SchemaEditorBaseProps, SchemaEditorWrappersProps, SchemaEditorEditionsProps } from './editor';
