import { useState, type ReactNode, useEffect } from 'react';
import type { BlockElement } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useSchema } from './BlockEditor';

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
    const { collapsedBlocks, toggleCollapse } = useSchema();
    const isCollapsed = collapsedBlocks.has(block.id);

    const toggleExpand = () => {
        toggleCollapse(block.id);
    };
    const Icon = blockIcons[block.type] || Type;

    const handleDataChange = (data: BlockElement['data']) => {
        onUpdate({ data });
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
            default:
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
            className={cn(
                'relative transition-all duration-200 border-l-4 py-2 gap-2',
                blockColors[block.type] || 'border-l-gray-500',
                isDragging && 'opacity-50 scale-[0.98]',
                depth > 0 && 'bg-muted/30'
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
                            {blockLabels[block.type] || block.type}
                        </span>
                        {block.type === 'wrapper' && block.children && (
                            <span className="text-xs text-muted-foreground">
                                ({block.children.length} {block.children.length === 1 ? 'item' : 'items'})
                            </span>
                        )}
                    </div>

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

