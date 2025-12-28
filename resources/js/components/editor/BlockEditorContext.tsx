import { createContext, useContext } from 'react';
import type { CollectionSchema, WrapperPurpose } from '@/types';

interface BlockEditorContextValue {
    collectionSchema?: CollectionSchema | null;
    wrapperPurposes: WrapperPurpose[];
}

const BlockEditorContext = createContext<BlockEditorContextValue>({
    collectionSchema: null,
    wrapperPurposes: [],
});

export function BlockEditorProvider({
    children,
    collectionSchema,
    wrapperPurposes,
}: {
    children: React.ReactNode;
    collectionSchema?: CollectionSchema | null;
    wrapperPurposes: WrapperPurpose[];
}) {
    return (
        <BlockEditorContext.Provider value={{ collectionSchema, wrapperPurposes }}>
            {children}
        </BlockEditorContext.Provider>
    );
}

export function useBlockEditorContext() {
    return useContext(BlockEditorContext);
}

