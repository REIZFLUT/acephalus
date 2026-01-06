import { createContext, useContext } from 'react';
import type { ElementType, CollectionSchema, WrapperPurpose, Edition } from '@/types';
import { DEFAULT_ELEMENT_TYPES } from './constants';

// Schema context for nested components
export interface SchemaContextType {
    schema: CollectionSchema | null;
    allowedTypes: (ElementType | string)[];
    wrapperPurposes: WrapperPurpose[];
    editions: Edition[];
    previewEdition: string | null;
    contentEditions: string[];
    collectionId: string | null;
    contentId: string | null;
    getTextFormats: () => ('plain' | 'markdown' | 'html')[];
    getMediaTypes: () => ('image' | 'video' | 'audio' | 'document' | 'canvas')[];
    collapsedBlocks: Set<string>;
    toggleCollapse: (id: string) => void;
    collapseAll: () => void;
    expandAll: () => void;
}

export const SchemaContext = createContext<SchemaContextType>({
    schema: null,
    allowedTypes: DEFAULT_ELEMENT_TYPES,
    wrapperPurposes: [],
    editions: [],
    previewEdition: null,
    contentEditions: [],
    collectionId: null,
    contentId: null,
    getTextFormats: () => ['plain', 'markdown', 'html'],
    getMediaTypes: () => ['image', 'video', 'audio', 'document'],
    collapsedBlocks: new Set(),
    toggleCollapse: () => {},
    collapseAll: () => {},
    expandAll: () => {},
});

export const useSchema = () => useContext(SchemaContext);

