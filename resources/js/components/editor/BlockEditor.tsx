import { useState, useCallback, createContext, useContext, useMemo, useEffect } from 'react';
import type { BlockElement, ElementType, CollectionSchema, TextElementConfig, MediaElementConfig, WrapperPurpose, Edition } from '@/types';
import { BlockList } from './BlockList';
import { AddBlockMenu } from './AddBlockMenu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { useCustomElements } from '@/hooks/use-custom-elements';

// Default built-in element types
const DEFAULT_ELEMENT_TYPES: ElementType[] = ['text', 'media', 'html', 'json', 'xml', 'svg', 'katex', 'wrapper', 'reference'];

// Schema context for nested components
interface SchemaContextType {
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

const SchemaContext = createContext<SchemaContextType>({
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

interface BlockEditorProps {
    elements: BlockElement[];
    onChange: (elements: BlockElement[]) => void;
    schema?: CollectionSchema | null;
    allowedTypes?: ElementType[];
    wrapperPurposes?: WrapperPurpose[];
    editions?: Edition[];
    previewEdition?: string | null;
    contentEditions?: string[];
    collectionId?: string | null;
    contentId?: string | null;
    collapsedBlocks?: Set<string>;
    onToggleCollapse?: (id: string) => void;
}

export function BlockEditor({ 
    elements, 
    onChange, 
    schema, 
    allowedTypes: propAllowedTypes, 
    wrapperPurposes = [],
    editions = [],
    previewEdition = null,
    contentEditions = [],
    collectionId = null,
    contentId = null,
    collapsedBlocks: externalCollapsedBlocks,
    onToggleCollapse: externalToggleCollapse,
}: BlockEditorProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [internalCollapsedBlocks, setInternalCollapsedBlocks] = useState<Set<string>>(new Set());

    // Use external or internal collapsed state
    const collapsedBlocks = externalCollapsedBlocks !== undefined ? externalCollapsedBlocks : internalCollapsedBlocks;

    // Get custom element types
    const { types: customElementTypes } = useCustomElements();

    // Determine allowed types from schema or props
    const allowedTypes = useMemo(() => {
        const baseTypes = propAllowedTypes || schema?.allowed_elements;
        
        // If explicit allowed types are defined (from props or schema), use only those
        if (baseTypes) {
            return baseTypes as ElementType[];
        }
        
        // No restrictions: include all default types plus all custom element types
        const allTypes = [...DEFAULT_ELEMENT_TYPES, ...customElementTypes] as (ElementType | string)[];
        return [...new Set(allTypes)] as ElementType[];
    }, [propAllowedTypes, schema?.allowed_elements, customElementTypes]);

    // Toggle collapse state for a block
    const toggleCollapse = useCallback((id: string) => {
        if (externalToggleCollapse) {
            externalToggleCollapse(id);
        } else {
            setInternalCollapsedBlocks(prev => {
                const next = new Set(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            });
        }
    }, [externalToggleCollapse]);

    // Check if all blocks are collapsed
    const allBlockIds = useMemo(() => getAllBlockIds(elements), [elements]);
    const allCollapsed = allBlockIds.length > 0 && allBlockIds.every(id => collapsedBlocks.has(id));

    // Setter for internal collapsed blocks
    const setCollapsedBlocks = useCallback((blocks: Set<string>) => {
        if (!externalCollapsedBlocks) {
            setInternalCollapsedBlocks(blocks);
        }
    }, [externalCollapsedBlocks]);

    // Scroll to element if URL contains a hash like #element-{id}
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#element-')) {
            const elementId = hash.replace('#element-', '');

            // Delay to ensure the DOM has rendered
            setTimeout(() => {
                // Try to find the block item element
                const blockElement = document.querySelector(`[data-block-id="${elementId}"]`);
                if (blockElement) {
                    // Expand the element if it's collapsed
                    if (collapsedBlocks.has(elementId)) {
                        toggleCollapse(elementId);
                    }

                    // Scroll to the element
                    blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Add a temporary highlight
                    blockElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                    setTimeout(() => {
                        blockElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                    }, 3000);
                }
            }, 500);
        }
    }, [elements, collapsedBlocks, toggleCollapse]);

    // Schema context value
    const schemaContextValue: SchemaContextType = {
        schema: schema || null,
        allowedTypes,
        wrapperPurposes,
        editions,
        previewEdition,
        contentEditions,
        collectionId,
        contentId,
        getTextFormats: () => {
            const config = schema?.element_configs?.text as TextElementConfig | undefined;
            return config?.formats || ['plain', 'markdown', 'html'];
        },
        getMediaTypes: () => {
            const config = schema?.element_configs?.media as MediaElementConfig | undefined;
            return config?.types || ['image', 'video', 'audio', 'document'];
        },
        collapsedBlocks,
        toggleCollapse,
        collapseAll: () => setCollapsedBlocks(new Set(allBlockIds)),
        expandAll: () => setCollapsedBlocks(new Set()),
    };

    // Generate unique ID for new elements
    const generateId = useCallback(() => {
        return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Add a new block at a specific position
    const addBlock = useCallback((type: ElementType, parentId?: string, position?: number) => {
        const newBlock: BlockElement = {
            id: generateId(),
            type,
            order: 0,
            data: getDefaultData(type),
            children: type === 'wrapper' ? [] : undefined,
        };

        if (parentId) {
            // Add to a wrapper
            onChange(addToParent(elements, parentId, newBlock, position));
        } else {
            // Add to root level
            const insertAt = position ?? elements.length;
            const updated = [...elements];
            updated.splice(insertAt, 0, newBlock);
            onChange(reorderElements(updated));
        }
    }, [elements, onChange, generateId]);

    // Update a block's data
    const updateBlock = useCallback((id: string, updates: Partial<BlockElement>) => {
        onChange(updateInTree(elements, id, updates));
    }, [elements, onChange]);

    // Remove a block
    const removeBlock = useCallback((id: string) => {
        onChange(removeFromTree(elements, id));
    }, [elements, onChange]);

    // Move a block (drag & drop or manual)
    const moveBlock = useCallback((id: string, targetParentId: string | null, newIndex: number) => {
        const block = findBlock(elements, id);
        if (!block) return;

        // Remove from current position
        let updated = removeFromTree(elements, id);
        
        // Add to new position
        if (targetParentId) {
            updated = addToParent(updated, targetParentId, block, newIndex);
        } else {
            updated = [...updated];
            updated.splice(newIndex, 0, block);
            updated = reorderElements(updated);
        }

        onChange(updated);
    }, [elements, onChange]);

    // Duplicate a block
    const duplicateBlock = useCallback((id: string) => {
        const block = findBlock(elements, id);
        if (!block) return;

        const duplicated = deepCloneBlock(block, generateId);
        const parent = findParentOf(elements, id);
        
        if (parent) {
            const index = parent.children?.findIndex(b => b.id === id) ?? -1;
            onChange(addToParent(elements, parent.id, duplicated, index + 1));
        } else {
            const index = elements.findIndex(b => b.id === id);
            const updated = [...elements];
            updated.splice(index + 1, 0, duplicated);
            onChange(reorderElements(updated));
        }
    }, [elements, onChange, generateId]);

    return (
        <SchemaContext.Provider value={schemaContextValue}>
            <div className="space-y-4">
                {elements.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Layers className="size-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                Start building your content
                            </h3>
                            <p className="text-sm text-muted-foreground/70 mb-6 text-center max-w-md">
                                Add blocks to create your content. Use wrappers to group and nest elements.
                            </p>
                            <AddBlockMenu 
                                onAdd={(type) => addBlock(type)} 
                                allowedTypes={allowedTypes}
                                variant="primary"
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <BlockList
                            blocks={elements}
                            onUpdate={updateBlock}
                            onRemove={removeBlock}
                            onMove={moveBlock}
                            onDuplicate={duplicateBlock}
                            onAddChild={(parentId, type) => addBlock(type, parentId)}
                            draggedId={draggedId}
                            onDragStart={setDraggedId}
                            onDragEnd={() => setDraggedId(null)}
                            allowedTypes={allowedTypes}
                            depth={0}
                        />
                        <AddBlockMenu 
                            onAdd={(type) => addBlock(type)} 
                            allowedTypes={allowedTypes}
                        />
                    </>
                )}
            </div>
        </SchemaContext.Provider>
    );
}

// Helper functions
function getDefaultData(type: ElementType): BlockElement['data'] {
    switch (type) {
        case 'text':
            return { content: '', format: 'plain' };
        case 'media':
            return { file_id: null, media_type: 'image', alt: '', caption: '' };
        case 'svg':
            return { content: '', viewBox: '0 0 100 100', title: '' };
        case 'katex':
            return { formula: '', display_mode: false };
        case 'html':
            return { content: '' };
        case 'json':
            return { data: {} };
        case 'xml':
            return { content: '', schema: '' };
        case 'wrapper':
            return { layout: 'vertical', gap: '1rem' };
        default:
            return {};
    }
}

function reorderElements(elements: BlockElement[]): BlockElement[] {
    return elements.map((el, index) => ({ ...el, order: index }));
}

function findBlock(elements: BlockElement[], id: string): BlockElement | null {
    for (const element of elements) {
        if (element.id === id) return element;
        if (element.children) {
            const found = findBlock(element.children, id);
            if (found) return found;
        }
    }
    return null;
}

function findParentOf(elements: BlockElement[], id: string): BlockElement | null {
    for (const element of elements) {
        if (element.children?.some(c => c.id === id)) {
            return element;
        }
        if (element.children) {
            const found = findParentOf(element.children, id);
            if (found) return found;
        }
    }
    return null;
}

function getAllBlockIds(elements: BlockElement[]): string[] {
    const ids: string[] = [];
    for (const element of elements) {
        ids.push(element.id);
        if (element.children) {
            ids.push(...getAllBlockIds(element.children));
        }
    }
    return ids;
}

function updateInTree(elements: BlockElement[], id: string, updates: Partial<BlockElement>): BlockElement[] {
    return elements.map(element => {
        if (element.id === id) {
            return { ...element, ...updates };
        }
        if (element.children) {
            return {
                ...element,
                children: updateInTree(element.children, id, updates),
            };
        }
        return element;
    });
}

function removeFromTree(elements: BlockElement[], id: string): BlockElement[] {
    return elements
        .filter(element => element.id !== id)
        .map(element => {
            if (element.children) {
                return {
                    ...element,
                    children: removeFromTree(element.children, id),
                };
            }
            return element;
        });
}

function addToParent(elements: BlockElement[], parentId: string, block: BlockElement, position?: number): BlockElement[] {
    return elements.map(element => {
        if (element.id === parentId && element.children !== undefined) {
            const children = [...element.children];
            const insertAt = position ?? children.length;
            children.splice(insertAt, 0, block);
            return {
                ...element,
                children: reorderElements(children),
            };
        }
        if (element.children) {
            return {
                ...element,
                children: addToParent(element.children, parentId, block, position),
            };
        }
        return element;
    });
}

function deepCloneBlock(block: BlockElement, generateId: () => string): BlockElement {
    return {
        ...block,
        id: generateId(),
        children: block.children?.map(child => deepCloneBlock(child, generateId)),
    };
}

