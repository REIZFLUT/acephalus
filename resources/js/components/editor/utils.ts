import type { BlockElement, ElementType } from '@/types';

export function getDefaultData(type: ElementType): BlockElement['data'] {
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
            return {};
        default:
            return {};
    }
}

export function reorderElements(elements: BlockElement[]): BlockElement[] {
    return elements.map((el, index) => ({ ...el, order: index }));
}

export function findBlock(elements: BlockElement[], id: string): BlockElement | null {
    for (const element of elements) {
        if (element.id === id) return element;
        if (element.children) {
            const found = findBlock(element.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function findParentOf(elements: BlockElement[], id: string): BlockElement | null {
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

export function getAllBlockIds(elements: BlockElement[]): string[] {
    const ids: string[] = [];
    for (const element of elements) {
        ids.push(element.id);
        if (element.children) {
            ids.push(...getAllBlockIds(element.children));
        }
    }
    return ids;
}

export function updateInTree(elements: BlockElement[], id: string, updates: Partial<BlockElement>): BlockElement[] {
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

export function removeFromTree(elements: BlockElement[], id: string): BlockElement[] {
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

export function addToParent(elements: BlockElement[], parentId: string, block: BlockElement, position?: number): BlockElement[] {
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

export function deepCloneBlock(block: BlockElement, generateId: () => string): BlockElement {
    return {
        ...block,
        id: generateId(),
        children: block.children?.map(child => deepCloneBlock(child, generateId)),
    };
}

