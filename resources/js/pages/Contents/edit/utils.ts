import type { BlockElement } from '@/types';

// Helper to ensure elements have client IDs
export function ensureElementIds(elements: BlockElement[]): BlockElement[] {
    return elements.map((el, index) => ({
        ...el,
        id: el.id || el._id || `element-${index}-${Date.now()}`,
        children: el.children ? ensureElementIds(el.children) : undefined,
    }));
}

// Helper to count all elements including nested ones
export function countElements(elements: BlockElement[]): number {
    return elements.reduce((count, el) => {
        return count + 1 + (el.children ? countElements(el.children) : 0);
    }, 0);
}

