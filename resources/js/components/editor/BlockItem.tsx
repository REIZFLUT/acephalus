import { useState, type ReactNode, useEffect } from 'react';
import type { BlockElement, Edition } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as LucideIcons from 'lucide-react';
import { 
    GripVertical, 
    MoreHorizontal, 
    Copy, 
    Trash2, 
    ChevronDown, 
    ChevronRight,
    Type,
    Image,
    Code,
    FileJson,
    FileCode2,
    Layers,
    Hash,
    FileText,
    Link2,
    Box,
    BookCopy,
    EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TextBlockEditor from './blocks/TextBlockEditor';
import MediaBlockEditor from './blocks/MediaBlockEditor';
import HtmlBlockEditor from './blocks/HtmlBlockEditor';
import JsonBlockEditor from './blocks/JsonBlockEditor';
import XmlBlockEditor from './blocks/XmlBlockEditor';
import SvgBlockEditor from './blocks/SvgBlockEditor';
import KatexBlockEditor from './blocks/KatexBlockEditor';
import WrapperBlockEditor from './blocks/WrapperBlockEditor';
import ReferenceBlockEditor from './blocks/ReferenceBlockEditor';
import CustomBlockEditor from './blocks/CustomBlockEditor';
import { useSchema } from './BlockEditor';
import { useCustomElements, isCustomElementType } from '@/hooks/use-custom-elements';
import { EditionBadges } from './EditionSelector';
import { isElementVisibleForEdition } from './EditionPreviewFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EditionIcon } from '@/components/EditionIcon';

interface BlockItemProps {
    block: BlockElement;
    onUpdate: (updates: Partial<BlockElement>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    isDragging: boolean;
    depth: number;
    children?: ReactNode;
}

// Export this interface for block editors to use
export interface BlockEditorProps {
    block: BlockElement;
    onUpdate: (data: BlockElement['data']) => void;
}

const blockIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    text: Type,
    media: Image,
    html: Code,
    json: FileJson,
    xml: FileCode2,
    svg: FileText,
    katex: Hash,
    wrapper: Layers,
    reference: Link2,
};

const blockLabels: Record<string, string> = {
    text: 'Text',
    media: 'Media',
    html: 'HTML',
    json: 'JSON Data',
    xml: 'XML',
    svg: 'SVG',
    katex: 'KaTeX Formula',
    wrapper: 'Wrapper',
    reference: 'Internal Reference',
};

const blockColors: Record<string, string> = {
    text: 'border-l-blue-500',
    media: 'border-l-green-500',
    html: 'border-l-orange-500',
    json: 'border-l-purple-500',
    xml: 'border-l-pink-500',
    svg: 'border-l-cyan-500',
    katex: 'border-l-amber-500',
    wrapper: 'border-l-indigo-500',
    reference: 'border-l-rose-500',
};

export function BlockItem({
    block,
    onUpdate,
    onRemove,
    onDuplicate,
    onDragStart,
    onDragEnd,
    isDragging,
    depth,
    children,
}: BlockItemProps) {
    const { collapsedBlocks, toggleCollapse, editions, previewEdition, contentEditions } = useSchema();
    const { getDefinition } = useCustomElements();
    const isCollapsed = collapsedBlocks.has(block.id);
    
    // Get element editions
    const elementEditions = block.editions || [];
    const hasEditions = elementEditions.length > 0;
    
    // Check if element is hidden in current preview
    const isHiddenInPreview = previewEdition !== null && 
        !isElementVisibleForEdition(elementEditions, contentEditions, previewEdition);
    
    // Get custom element definition if applicable
    const customDefinition = isCustomElementType(block.type) ? getDefinition(block.type) : null;

    const toggleExpand = () => {
        toggleCollapse(block.id);
    };
    
    // Get icon - check custom definition first, then fallback to default
    const getBlockIcon = () => {
        if (customDefinition?.icon) {
            // Convert kebab-case to PascalCase for Lucide icons
            const pascalName = customDefinition.icon
                .split('-')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
            const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalName];
            if (IconComponent) return IconComponent;
            return Box; // Fallback if icon not found
        }
        return blockIcons[block.type] || Type;
    };
    const Icon = getBlockIcon();
    
    // Get label - check custom definition first, then fallback to default
    const blockLabel = customDefinition?.label || blockLabels[block.type] || block.type;
    
    // Get color class - use custom category color or default
    const getBlockColorClass = () => {
        if (customDefinition) {
            const categoryColors: Record<string, string> = {
                content: 'border-l-blue-500',
                data: 'border-l-purple-500',
                layout: 'border-l-indigo-500',
                interactive: 'border-l-emerald-500',
                media: 'border-l-green-500',
            };
            return categoryColors[customDefinition.category] || 'border-l-slate-500';
        }
        return blockColors[block.type] || 'border-l-gray-500';
    };

    const handleDataChange = (data: BlockElement['data']) => {
        onUpdate({ data });
    };

    // Handle edition toggle
    const toggleEdition = (slug: string) => {
        const currentEditions = block.editions || [];
        if (currentEditions.includes(slug)) {
            onUpdate({ editions: currentEditions.filter(e => e !== slug) });
        } else {
            onUpdate({ editions: [...currentEditions, slug] });
        }
    };

    // Ensure block.data exists
    const safeBlock = {
        ...block,
        data: block.data || {},
    };

    const renderEditor = () => {
        if (isCollapsed) return null;

        const editorProps: BlockEditorProps = {
            block: safeBlock,
            onUpdate: handleDataChange,
        };

        switch (block.type) {
            case 'text':
                return <TextBlockEditor {...editorProps} />;
            case 'media':
                return <MediaBlockEditor {...editorProps} />;
            case 'html':
                return <HtmlBlockEditor {...editorProps} />;
            case 'json':
                return <JsonBlockEditor {...editorProps} />;
            case 'xml':
                return <XmlBlockEditor {...editorProps} />;
            case 'svg':
                return <SvgBlockEditor {...editorProps} />;
            case 'katex':
                return <KatexBlockEditor {...editorProps} />;
            case 'wrapper':
                return <WrapperBlockEditor {...editorProps} />;
            case 'reference':
                return <ReferenceBlockEditor {...editorProps} />;
            default:
                // Check if this is a custom element type
                if (isCustomElementType(block.type)) {
                    return <CustomBlockEditor {...editorProps} definition={customDefinition || undefined} />;
                }
                return (
                    <div className="text-sm text-muted-foreground italic">
                        Editor for "{block.type}" is not available.
                    </div>
                );
        }
    };

    // Handle drag start from the drag handle
    const handleDragStart = (e: React.DragEvent) => {
        console.log('Drag started for block:', block.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', block.id);
        // Set a drag image
        if (e.currentTarget instanceof HTMLElement) {
            e.dataTransfer.setDragImage(e.currentTarget, 10, 10);
        }
        onDragStart();
    };

    const handleDragEnd = (e: React.DragEvent) => {
        console.log('Drag ended for block:', block.id);
        e.preventDefault();
        onDragEnd();
    };

    return (
        <Card 
            data-block-id={block.id}
            className={cn(
                'relative transition-all duration-200 border-l-4 py-2 gap-2',
                getBlockColorClass(),
                isDragging && 'opacity-50 scale-[0.98]',
                depth > 0 && 'bg-muted/30',
                isHiddenInPreview && 'opacity-40 border-dashed bg-muted/20'
            )}
        >
            {/* Drag handle area - use native div for reliable drag behavior */}
            <div 
                draggable="true"
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className="py-1 px-3 cursor-grab active:cursor-grabbing select-none"
            >
                <div className="flex items-center gap-2">
                    {/* Drag Handle Icon */}
                    <div className="p-1.5 -ml-1 rounded hover:bg-muted/80 transition-colors">
                        <GripVertical className="size-4 text-muted-foreground" />
                    </div>

                    {/* Collapse Toggle for all blocks */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand();
                        }}
                        draggable={false}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="size-4" />
                        ) : (
                            <ChevronDown className="size-4" />
                        )}
                    </Button>

                    {/* Block Icon & Label */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">
                            {blockLabel}
                        </span>
                        {block.type === 'wrapper' && block.children && (
                            <span className="text-xs text-muted-foreground">
                                ({block.children.length} {block.children.length === 1 ? 'item' : 'items'})
                            </span>
                        )}
                        {/* Hidden indicator for preview mode */}
                        {isHiddenInPreview && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <EyeOff className="size-3" />
                                Hidden
                            </span>
                        )}
                        {/* Edition badges */}
                        {hasEditions && !isHiddenInPreview && (
                            <EditionBadges 
                                editions={elementEditions} 
                                allEditions={editions}
                            />
                        )}
                    </div>

                    {/* Editions Selector (if editions available) */}
                    {editions.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn("size-7", hasEditions && "text-primary")}
                                    draggable={false}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <BookCopy className="size-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3" align="end">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Editions</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {hasEditions 
                                            ? 'Only visible in selected editions.'
                                            : 'Visible in all editions.'
                                        }
                                    </p>
                                    <div className="space-y-2">
                                        {editions.map((edition) => (
                                            <label
                                                key={edition.slug}
                                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={elementEditions.includes(edition.slug)}
                                                    onCheckedChange={() => toggleEdition(edition.slug)}
                                                />
                                                <EditionIcon iconName={edition.icon} className="size-4 text-muted-foreground" />
                                                <span className="text-sm">{edition.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-7"
                                draggable={false}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onDuplicate}>
                                <Copy className="size-4 mr-2" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={onRemove}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {!isCollapsed && (
                <CardContent className="pt-0 pb-2 px-3">
                    {renderEditor()}
                    {children}
                </CardContent>
            )}
        </Card>
    );
}

