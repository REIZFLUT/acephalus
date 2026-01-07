import { useState, useEffect, useCallback, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    ChevronRight,
    ChevronLeft,
    Folder,
    FileText,
    Box,
    Search,
    Loader2,
    Check,
    X,
    Link2,
    Eye,
    ExternalLink,
    Type,
    Image,
    Code,
    Hash,
    Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReferenceType = 'collection' | 'content' | 'element';

export interface ReferenceValue {
    reference_type: ReferenceType;
    collection_id?: string;
    content_id?: string;
    element_id?: string;
    filter_view_id?: string;
    display_title?: string;
}

interface ReferencePickerProps {
    value: ReferenceValue | null;
    onChange: (value: ReferenceValue | null) => void;
    minDepth?: ReferenceType; // Minimum selection depth required
    maxDepth?: ReferenceType; // Maximum selection depth allowed
    disabled?: boolean;
    placeholder?: string;
}

interface CollectionItem {
    _id: string;
    name: string;
    slug: string;
    description: string | null;
    has_contents: boolean;
}

interface ContentItem {
    _id: string;
    title: string;
    slug: string;
    status: string;
    has_elements: boolean;
    element_count: number;
}

interface ElementItem {
    id: string;
    type: string;
    depth: number;
    parent_id: string | null;
    order: number;
    preview: string;
    has_children: boolean;
}

interface BreadcrumbItem {
    type: 'root' | 'collection' | 'content';
    id?: string;
    name: string;
}

interface ContentPreviewData {
    type: 'content' | 'element';
    content: {
        _id: string;
        title: string;
        slug: string;
        status: string;
        collection_id: string;
        collection_slug?: string;
    };
    elements: Array<{
        id: string;
        type: string;
        data: Record<string, unknown>;
        children?: Array<unknown>;
    }>;
    targetElementId?: string;
}

interface CollectionPreviewData {
    type: 'collection';
    collection: {
        _id: string;
        name: string;
        slug: string;
        description: string | null;
    };
    contents: Array<{
        _id: string;
        title: string;
        slug: string;
        status: string;
        created_at: string | null;
    }>;
    total_count: number;
    filter_view?: {
        _id: string;
        name: string;
        slug: string;
    } | null;
}

type PreviewData = ContentPreviewData | CollectionPreviewData;

const depthOrder: ReferenceType[] = ['collection', 'content', 'element'];

function getDepthIndex(depth: ReferenceType): number {
    return depthOrder.indexOf(depth);
}

// Icons for element types
const elementTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    text: Type,
    media: Image,
    html: Code,
    json: FileText,
    xml: FileText,
    svg: FileText,
    katex: Hash,
    wrapper: Layers,
    reference: Link2,
};

// Preview element component
interface PreviewElementProps {
    element: {
        id: string;
        type: string;
        data: Record<string, unknown>;
        children?: Array<unknown>;
    };
    isTarget?: boolean;
    depth?: number;
}

function PreviewElement({ element, isTarget = false, depth = 0 }: PreviewElementProps) {
    const Icon = elementTypeIcons[element.type] || Box;

    // Format content based on element type
    const renderContent = () => {
        const data = element.data || {};

        switch (element.type) {
            case 'text':
                return (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: String(data.content || '') }} />
                    </div>
                );

            case 'media':
                return (
                    <div className="space-y-2">
                        {data.url && (
                            <img
                                src={String(data.url)}
                                alt={String(data.alt || '')}
                                className="max-w-full max-h-48 object-contain rounded-md"
                            />
                        )}
                        {data.caption && (
                            <p className="text-sm text-muted-foreground italic">{String(data.caption)}</p>
                        )}
                    </div>
                );

            case 'html':
                return (
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                        <code>{String(data.content || '').slice(0, 500)}</code>
                    </pre>
                );

            case 'json':
                return (
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                        <code>{JSON.stringify(data.content, null, 2).slice(0, 500)}</code>
                    </pre>
                );

            case 'xml':
                return (
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                        <code>{String(data.content || '').slice(0, 500)}</code>
                    </pre>
                );

            case 'svg':
                return (
                    <div className="flex items-center gap-2">
                        <FileText className="size-4" />
                        <span className="text-sm">{String(data.title || 'SVG Element')}</span>
                    </div>
                );

            case 'katex':
                return (
                    <div className="font-mono text-sm bg-muted p-2 rounded-md">
                        {String(data.formula || '')}
                    </div>
                );

            case 'wrapper':
                return (
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                            {Array.isArray(element.children) ? element.children.length : 0} verschachtelte Elemente
                        </div>
                        {Array.isArray(element.children) && element.children.length > 0 && (
                            <div className="pl-4 border-l-2 border-muted space-y-2">
                                {(element.children as Array<PreviewElementProps['element']>).map((child, idx) => (
                                    <PreviewElement
                                        key={child.id || idx}
                                        element={child}
                                        depth={depth + 1}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'reference':
                return (
                    <div className="flex items-center gap-2 text-sm">
                        <Link2 className="size-4" />
                        <span>{String(data.display_title || 'Interne Referenz')}</span>
                    </div>
                );

            default:
                // For custom elements
                return (
                    <div className="text-sm">
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                            <code>{JSON.stringify(data, null, 2).slice(0, 300)}</code>
                        </pre>
                    </div>
                );
        }
    };

    return (
        <Card
            id={`preview-element-${element.id}`}
            className={cn(
                'transition-all',
                isTarget && 'ring-2 ring-primary bg-primary/5',
                depth > 0 && 'border-l-2 border-l-muted'
            )}
        >
            <CardHeader className="py-2 px-3">
                <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium capitalize">
                        {element.type}
                    </CardTitle>
                    {isTarget && (
                        <Badge variant="default" className="text-xs ml-auto">
                            Referenziertes Element
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="py-2 px-3">
                {renderContent()}
            </CardContent>
        </Card>
    );
}

export function ReferencePicker({
    value,
    onChange,
    minDepth = 'collection',
    maxDepth = 'element',
    disabled = false,
    placeholder = 'Select reference...',
}: ReferencePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Navigation state
    const [currentLevel, setCurrentLevel] = useState<'collections' | 'contents' | 'elements'>('collections');
    const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [selectedElement, setSelectedElement] = useState<ElementItem | null>(null);

    // Data
    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [elements, setElements] = useState<ElementItem[]>([]);

    // Resolved display value
    const [displayTitle, setDisplayTitle] = useState<string>('');

    // Preview state
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Determine what can be selected based on min/max depth
    const canSelectCollection = getDepthIndex('collection') >= getDepthIndex(minDepth);
    const canSelectContent = getDepthIndex('content') >= getDepthIndex(minDepth) && getDepthIndex('content') <= getDepthIndex(maxDepth);
    const canSelectElement = getDepthIndex('element') <= getDepthIndex(maxDepth);

    const canNavigateToContents = getDepthIndex(maxDepth) >= getDepthIndex('content');
    const canNavigateToElements = getDepthIndex(maxDepth) >= getDepthIndex('element');

    // Fetch collections
    const fetchCollections = useCallback(async (search = '') => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/references/collections?search=${encodeURIComponent(search)}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setCollections(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch contents for a collection
    const fetchContents = useCallback(async (collectionId: string, search = '') => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/references/collections/${collectionId}/contents?search=${encodeURIComponent(search)}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setContents(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch contents:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch elements for a content
    const fetchElements = useCallback(async (contentId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/references/contents/${contentId}/elements`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setElements(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch elements:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch preview data for a reference (collection, content, or element)
    const fetchPreview = useCallback(async () => {
        if (!value) return;

        setIsPreviewLoading(true);
        try {
            if (value.reference_type === 'collection' && value.collection_id) {
                // Fetch collection preview - include filter_view_id if set
                const params = new URLSearchParams();
                if (value.filter_view_id) {
                    params.set('filter_view', value.filter_view_id);
                }
                const queryString = params.toString();
                const url = `/api/v1/references/preview/collection/${value.collection_id}${queryString ? `?${queryString}` : ''}`;
                
                const response = await fetch(url, {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch collection preview');
                }

                const data = await response.json();

                setPreviewData({
                    type: 'collection',
                    collection: data.collection,
                    contents: data.contents || [],
                    total_count: data.total_count || 0,
                    filter_view: data.filter_view || null,
                });
                setIsPreviewOpen(true);
            } else if (value.content_id) {
                // Fetch content/element preview
                const response = await fetch(`/api/v1/references/preview/${value.content_id}`, {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch content preview');
                }

                const data = await response.json();

                // For element references, filter to only the target element
                let elements = data.elements || [];
                const targetElementId = value.reference_type === 'element' ? value.element_id : undefined;

                // If it's an element reference, find and show only that element
                if (value.reference_type === 'element' && value.element_id) {
                    const findElement = (elements: Array<{ id: string; type: string; data: Record<string, unknown>; children?: Array<unknown> }>, targetId: string): { id: string; type: string; data: Record<string, unknown>; children?: Array<unknown> } | null => {
                        for (const element of elements) {
                            if (element.id === targetId) {
                                return element;
                            }
                            if (element.children && Array.isArray(element.children)) {
                                const found = findElement(element.children as Array<{ id: string; type: string; data: Record<string, unknown>; children?: Array<unknown> }>, targetId);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    const targetElement = findElement(elements, value.element_id);
                    if (targetElement) {
                        elements = [targetElement];
                    }
                }

                setPreviewData({
                    type: value.reference_type === 'element' ? 'element' : 'content',
                    content: {
                        _id: data.content._id,
                        title: data.content.title,
                        slug: data.content.slug,
                        status: data.content.status,
                        collection_id: data.content.collection_id,
                        collection_slug: data.content.collection_slug,
                    },
                    elements,
                    targetElementId,
                });
                setIsPreviewOpen(true);
            }
        } catch (error) {
            console.error('Failed to fetch preview:', error);
        } finally {
            setIsPreviewLoading(false);
        }
    }, [value]);

    // Navigate to edit the original content (with optional element scroll)
    const openEditOriginal = useCallback(() => {
        if (!previewData?.content) return;

        const contentId = previewData.content._id;

        if (contentId) {
            // Build the edit URL - route is /contents/{content}/edit (uses _id as route key)
            let editUrl = `/contents/${contentId}/edit`;

            // If there's a target element, add a hash to scroll to it
            if (previewData.targetElementId) {
                editUrl += `#element-${previewData.targetElementId}`;
            }

            // Close the preview and navigate
            setIsPreviewOpen(false);
            router.visit(editUrl);
        }
    }, [previewData]);

    // Resolve current value to get display title
    useEffect(() => {
        if (!value || !value.reference_type) {
            setDisplayTitle('');
            return;
        }

        const resolveReference = async () => {
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                const response = await fetch('/api/v1/references/resolve', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    credentials: 'include',
                    body: JSON.stringify(value),
                });
                if (response.ok) {
                    const data = await response.json();
                    setDisplayTitle(data.display_title || '');
                }
            } catch (error) {
                console.error('Failed to resolve reference:', error);
            }
        };

        resolveReference();
    }, [value]);

    // Load initial data when dialog opens
    useEffect(() => {
        if (isOpen) {
            setCurrentLevel('collections');
            setSelectedCollection(null);
            setSelectedContent(null);
            setSelectedElement(null);
            setSearchQuery('');
            fetchCollections();
        }
    }, [isOpen, fetchCollections]);

    // Handle search
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (currentLevel === 'collections') {
                fetchCollections(searchQuery);
            } else if (currentLevel === 'contents' && selectedCollection) {
                fetchContents(selectedCollection._id, searchQuery);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, currentLevel, selectedCollection, fetchCollections, fetchContents, isOpen]);

    // Navigation handlers
    const navigateToCollection = useCallback((collection: CollectionItem) => {
        setSelectedCollection(collection);
        setSelectedContent(null);
        setSelectedElement(null);
        setSearchQuery('');
        
        if (canNavigateToContents && collection.has_contents) {
            setCurrentLevel('contents');
            fetchContents(collection._id);
        }
    }, [canNavigateToContents, fetchContents]);

    const navigateToContent = useCallback((content: ContentItem) => {
        setSelectedContent(content);
        setSelectedElement(null);
        
        if (canNavigateToElements && content.has_elements) {
            setCurrentLevel('elements');
            fetchElements(content._id);
        }
    }, [canNavigateToElements, fetchElements]);

    const navigateBack = useCallback(() => {
        if (currentLevel === 'elements') {
            setCurrentLevel('contents');
            setSelectedElement(null);
        } else if (currentLevel === 'contents') {
            setCurrentLevel('collections');
            setSelectedCollection(null);
            setSelectedContent(null);
            fetchCollections();
        }
        setSearchQuery('');
    }, [currentLevel, fetchCollections]);

    // Selection handlers
    const handleSelect = useCallback((type: ReferenceType, item: CollectionItem | ContentItem | ElementItem) => {
        let newValue: ReferenceValue;

        switch (type) {
            case 'collection':
                newValue = {
                    reference_type: 'collection',
                    collection_id: (item as CollectionItem)._id,
                    display_title: (item as CollectionItem).name,
                };
                break;
            case 'content':
                newValue = {
                    reference_type: 'content',
                    collection_id: selectedCollection?._id,
                    content_id: (item as ContentItem)._id,
                    display_title: (item as ContentItem).title,
                };
                break;
            case 'element':
                newValue = {
                    reference_type: 'element',
                    collection_id: selectedCollection?._id,
                    content_id: selectedContent?._id,
                    element_id: (item as ElementItem).id,
                    display_title: (item as ElementItem).preview,
                };
                break;
        }

        onChange(newValue);
        setIsOpen(false);
    }, [selectedCollection, selectedContent, onChange]);

    // Breadcrumb
    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
        const items: BreadcrumbItem[] = [{ type: 'root', name: 'Collections' }];
        if (selectedCollection) {
            items.push({ type: 'collection', id: selectedCollection._id, name: selectedCollection.name });
        }
        if (selectedContent) {
            items.push({ type: 'content', id: selectedContent._id, name: selectedContent.title });
        }
        return items;
    }, [selectedCollection, selectedContent]);

    return (
        <div className="space-y-2">
            {/* Display current value */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(true)}
                    disabled={disabled}
                    className="flex-1 min-w-0 justify-start text-left font-normal"
                >
                    <Link2 className="size-4 mr-2 shrink-0" />
                    {value && displayTitle ? (
                        <span className="truncate">{displayTitle}</span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </Button>
                {value && (
                    <div className="flex items-center shrink-0">
                        {/* Preview button - for all reference types */}
                        {((value.reference_type === 'collection' && value.collection_id) ||
                          (value.reference_type === 'content' && value.content_id) ||
                          (value.reference_type === 'element' && value.content_id)) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    fetchPreview();
                                }}
                                disabled={disabled || isPreviewLoading}
                                title="Preview"
                            >
                                {isPreviewLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange(null);
                            }}
                            disabled={disabled}
                            title="Clear"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Picker Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Select Reference</DialogTitle>
                    </DialogHeader>

                    {/* Breadcrumb Navigation */}
                    <div className="flex items-center gap-1 text-sm">
                        {currentLevel !== 'collections' && (
                            <Button variant="ghost" size="sm" onClick={navigateBack}>
                                <ChevronLeft className="size-4" />
                            </Button>
                        )}
                        {breadcrumbs.map((item, index) => (
                            <div key={index} className="flex items-center">
                                {index > 0 && <ChevronRight className="size-4 text-muted-foreground mx-1" />}
                                <span className={cn(
                                    index === breadcrumbs.length - 1 ? 'font-medium' : 'text-muted-foreground'
                                )}>
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    {/* Search */}
                    {currentLevel !== 'elements' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${currentLevel}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <ScrollArea className="flex-1 min-h-[300px] max-h-[400px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-1 p-1">
                                {/* Collections */}
                                {currentLevel === 'collections' && collections.map((collection) => (
                                    <div
                                        key={collection._id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer group"
                                        onClick={() => {
                                            // If we can navigate deeper, do that; otherwise select if possible
                                            if (canNavigateToContents && collection.has_contents) {
                                                navigateToCollection(collection);
                                            } else if (canSelectCollection && getDepthIndex(minDepth) <= getDepthIndex('collection')) {
                                                handleSelect('collection', collection);
                                            }
                                        }}
                                    >
                                        <Folder className="size-5 text-amber-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{collection.name}</div>
                                            {collection.description && (
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {collection.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {canSelectCollection && getDepthIndex(minDepth) <= getDepthIndex('collection') && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect('collection', collection);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100"
                                                >
                                                    <Check className="size-4 mr-1" />
                                                    Select
                                                </Button>
                                            )}
                                            {canNavigateToContents && collection.has_contents && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateToCollection(collection);
                                                    }}
                                                >
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Contents */}
                                {currentLevel === 'contents' && contents.map((content) => (
                                    <div
                                        key={content._id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer group"
                                        onClick={() => {
                                            // If we can navigate deeper, do that; otherwise select if possible
                                            if (canNavigateToElements && content.has_elements) {
                                                navigateToContent(content);
                                            } else if (canSelectContent) {
                                                handleSelect('content', content);
                                            }
                                        }}
                                    >
                                        <FileText className="size-5 text-blue-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{content.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {content.slug} • {content.element_count} elements
                                            </div>
                                        </div>
                                        <Badge variant={content.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                                            {content.status}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            {canSelectContent && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect('content', content);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100"
                                                >
                                                    <Check className="size-4 mr-1" />
                                                    Select
                                                </Button>
                                            )}
                                            {canNavigateToElements && content.has_elements && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateToContent(content);
                                                    }}
                                                >
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Elements */}
                                {currentLevel === 'elements' && elements.map((element) => (
                                    <div
                                        key={element.id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer group"
                                        style={{ paddingLeft: `${(element.depth * 20) + 12}px` }}
                                        onClick={() => {
                                            if (canSelectElement) {
                                                handleSelect('element', element);
                                            }
                                        }}
                                    >
                                        <Box className="size-5 text-purple-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm truncate">{element.preview}</div>
                                        </div>
                                        {canSelectElement && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelect('element', element);
                                                }}
                                                className="opacity-0 group-hover:opacity-100"
                                            >
                                                <Check className="size-4 mr-1" />
                                                Select
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                {/* Empty state */}
                                {!isLoading && (
                                    (currentLevel === 'collections' && collections.length === 0) ||
                                    (currentLevel === 'contents' && contents.length === 0) ||
                                    (currentLevel === 'elements' && elements.length === 0)
                                ) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No {currentLevel} found.
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
                    {previewData?.type === 'collection' ? (
                        // Collection Preview
                        <>
                            <DialogHeader className="shrink-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Folder className="size-5 text-amber-500" />
                                    <Badge variant="secondary" className="text-xs">Collection</Badge>
                                    {previewData.filter_view && (
                                        <Badge variant="outline" className="text-xs">
                                            Filter: {previewData.filter_view.name}
                                        </Badge>
                                    )}
                                </div>
                                <DialogTitle className="text-lg">
                                    {previewData.collection.name}
                                </DialogTitle>
                                {previewData.collection.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {previewData.collection.description}
                                    </p>
                                )}
                            </DialogHeader>

                            <Separator className="shrink-0" />

                            <div className="flex-1 overflow-y-auto min-h-0">
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-muted-foreground">
                                            {previewData.filter_view 
                                                ? 'Gefilterte Einträge' 
                                                : 'Neueste Einträge'}
                                        </h4>
                                        <Badge variant="outline" className="text-xs">
                                            {previewData.total_count} {previewData.total_count === 1 ? 'Eintrag' : 'Einträge'} {previewData.filter_view ? 'gefiltert' : 'gesamt'}
                                        </Badge>
                                    </div>
                                    {previewData.contents.length > 0 ? (
                                        <div className="space-y-2">
                                            {previewData.contents.map((content) => (
                                                <Card key={content._id} className="overflow-hidden">
                                                    <CardHeader className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="size-4 text-blue-500 shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <CardTitle className="text-sm font-medium truncate">
                                                                    {content.title}
                                                                </CardTitle>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {content.slug}
                                                                </p>
                                                            </div>
                                                            <Badge 
                                                                variant={content.status === 'published' ? 'default' : 'secondary'}
                                                                className="text-xs shrink-0"
                                                            >
                                                                {content.status}
                                                            </Badge>
                                                        </div>
                                                    </CardHeader>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            {previewData.filter_view 
                                                ? 'Keine Einträge entsprechen diesem Filter.'
                                                : 'Diese Collection hat keine Einträge.'}
                                        </div>
                                    )}
                                    {previewData.total_count > 3 && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            + {previewData.total_count - 3} weitere Einträge
                                        </p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="shrink-0">
                                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                                    Schließen
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        // Content or Element Preview
                        <>
                            <DialogHeader className="flex flex-row items-center justify-between gap-4 space-y-0 shrink-0">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {previewData?.type === 'element' ? (
                                            <Box className="size-4 text-purple-500" />
                                        ) : (
                                            <FileText className="size-4 text-blue-500" />
                                        )}
                                        <Badge variant="secondary" className="text-xs">
                                            {previewData?.type === 'element' ? 'Element' : 'Content'}
                                        </Badge>
                                    </div>
                                    <DialogTitle className="text-lg truncate">
                                        {previewData?.content.title || 'Preview'}
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                        <span className="truncate">{previewData?.content.slug}</span>
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={openEditOriginal}
                                    disabled={!previewData?.content._id}
                                    className="shrink-0"
                                >
                                    <ExternalLink className="size-4 mr-2" />
                                    Original bearbeiten
                                </Button>
                            </DialogHeader>

                            <Separator className="shrink-0" />

                            <div className="flex-1 overflow-y-auto min-h-0">
                                {previewData?.elements && previewData.elements.length > 0 ? (
                                    <div className="space-y-3 p-4">
                                        {previewData.elements.map((element, index) => (
                                            <PreviewElement
                                                key={element.id || index}
                                                element={element}
                                                isTarget={previewData.type === 'element'}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        {previewData?.type === 'element' 
                                            ? 'Element konnte nicht gefunden werden.'
                                            : 'Dieser Content hat keine Elemente.'}
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="shrink-0">
                                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                                    Schließen
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ReferencePicker;

