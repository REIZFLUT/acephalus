import { useState, useEffect, useCallback } from 'react';
import type { CustomElementDefinition } from '@/types';

interface CustomElementsState {
    definitions: CustomElementDefinition[];
    types: string[];
    categories: string[];
    isLoading: boolean;
    error: string | null;
}

interface UseCustomElementsReturn extends CustomElementsState {
    getDefinition: (type: string) => CustomElementDefinition | undefined;
    isCustomType: (type: string) => boolean;
    getByCategory: (category: string) => CustomElementDefinition[];
    getDefaultData: (type: string) => Record<string, unknown>;
    refresh: () => Promise<void>;
}

// Cache for custom element definitions
let cachedDefinitions: CustomElementDefinition[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCustomElements(): UseCustomElementsReturn {
    const [state, setState] = useState<CustomElementsState>({
        definitions: cachedDefinitions || [],
        types: cachedDefinitions?.map(d => d.type) || [],
        categories: [],
        isLoading: !cachedDefinitions,
        error: null,
    });

    const fetchDefinitions = useCallback(async (forceRefresh = false) => {
        // Use cache if available and not expired
        if (!forceRefresh && cachedDefinitions && Date.now() - cacheTimestamp < CACHE_DURATION) {
            setState({
                definitions: cachedDefinitions,
                types: cachedDefinitions.map(d => d.type),
                categories: [...new Set(cachedDefinitions.map(d => d.category))],
                isLoading: false,
                error: null,
            });
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await fetch('/api/v1/custom-elements', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch custom elements: ${response.statusText}`);
            }

            const result = await response.json();
            const definitions = result.data as CustomElementDefinition[];

            // Update cache
            cachedDefinitions = definitions;
            cacheTimestamp = Date.now();

            setState({
                definitions,
                types: result.types || definitions.map((d: CustomElementDefinition) => d.type),
                categories: result.categories || [...new Set(definitions.map((d: CustomElementDefinition) => d.category))],
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error('Failed to load custom elements:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }));
        }
    }, []);

    useEffect(() => {
        fetchDefinitions();
    }, [fetchDefinitions]);

    const getDefinition = useCallback((type: string): CustomElementDefinition | undefined => {
        return state.definitions.find(d => d.type === type);
    }, [state.definitions]);

    const isCustomType = useCallback((type: string): boolean => {
        return type.startsWith('custom_');
    }, []);

    const getByCategory = useCallback((category: string): CustomElementDefinition[] => {
        return state.definitions.filter(d => d.category === category);
    }, [state.definitions]);

    const getDefaultData = useCallback((type: string): Record<string, unknown> => {
        const definition = getDefinition(type);
        if (!definition) return {};

        const defaults: Record<string, unknown> = { ...(definition.defaultData || {}) };

        // Fill in defaults from field definitions
        for (const field of definition.fields) {
            if (!(field.name in defaults) && field.defaultValue !== undefined) {
                defaults[field.name] = field.defaultValue;
            }
        }

        return defaults;
    }, [getDefinition]);

    const refresh = useCallback(async () => {
        await fetchDefinitions(true);
    }, [fetchDefinitions]);

    return {
        ...state,
        getDefinition,
        isCustomType,
        getByCategory,
        getDefaultData,
        refresh,
    };
}

// Utility to check if a type is custom (can be used without the hook)
export function isCustomElementType(type: string): boolean {
    return type.startsWith('custom_');
}

// Get cached definitions synchronously (useful for initial render)
export function getCachedCustomElements(): CustomElementDefinition[] {
    return cachedDefinitions || [];
}

