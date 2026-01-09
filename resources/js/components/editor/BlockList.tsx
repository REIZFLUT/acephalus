import { useState, useRef } from 'react';
import type { BlockElement, ElementType } from '@/types';
import { BlockItem } from './BlockItem';
import { AddBlockMenu } from './AddBlockMenu';
import { cn } from '@/lib/utils';
import { Layers, Plus } from 'lucide-react';

interface BlockListProps {
    blocks: BlockElement[];
    onUpdate: (id: string, updates: Partial<BlockElement>) => void;
    onRemove: (id: string) => void;
    onMove: (id: string, targetParentId: string | null, newIndex: number) => void;
    onDuplicate: (id: string) => void;
    onAddChild: (parentId: string, type: ElementType) => void;
    draggedId: string | null;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
    allowedTypes?: ElementType[];
    depth: number;
    parentId?: string;
    onLockElement?: (block: BlockElement, reason?: string) => void;
    onUnlockElement?: (block: BlockElement) => void;
    isContentLocked?: boolean;
    isCollectionLocked?: boolean;
}

export function BlockList({
    blocks,
    onUpdate,
    onRemove,
    onMove,
    onDuplicate,
    onAddChild,
    draggedId,
    onDragStart,
    onDragEnd,
    allowedTypes,
    depth,
    parentId,
    onLockElement,
    onUnlockElement,
    isContentLocked = false,
    isCollectionLocked = false,
}: BlockListProps) {
    const [dropIndicator, setDropIndicator] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropIndicator(index);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Only clear if leaving the container completely
        if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
            setDropIndicator(null);
        }
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDropIndicator(null);
        
        if (draggedId) {
            // Don't allow dropping on itself
            const draggedBlock = blocks.find(b => b.id === draggedId);
            if (draggedBlock && blocks.indexOf(draggedBlock) === index) {
                return;
            }
            
            onMove(draggedId, parentId ?? null, index);
        }
        onDragEnd();
    };

    const isDragActive = draggedId !== null;

    return (
        <div 
            ref={containerRef}
            className={cn(
                'space-y-1',
                depth > 0 && 'pl-4 border-l-2 border-dashed border-muted-foreground/20'
            )}
        >
            {blocks.map((block, index) => (
                <div key={block.id}>
                    {/* Drop zone before this block */}
                    <DropZone
                        isActive={dropIndicator === index}
                        isDragActive={isDragActive && draggedId !== block.id}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                    />
                    
                    <BlockItem
                        block={block}
                        onUpdate={(updates) => onUpdate(block.id, updates)}
                        onRemove={() => onRemove(block.id)}
                        onDuplicate={() => onDuplicate(block.id)}
                        onDragStart={() => onDragStart(block.id)}
                        onDragEnd={onDragEnd}
                        isDragging={draggedId === block.id}
                        depth={depth}
                        onLock={onLockElement}
                        onUnlock={onUnlockElement}
                        isContentLocked={isContentLocked}
                        isCollectionLocked={isCollectionLocked}
                    >
                        {/* Render children for wrapper elements */}
                        {block.type === 'wrapper' && block.children !== undefined && (
                            <WrapperContent
                                block={block}
                                blocks={block.children}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                                onMove={onMove}
                                onDuplicate={onDuplicate}
                                onAddChild={onAddChild}
                                draggedId={draggedId}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                                allowedTypes={allowedTypes}
                                depth={depth}
                                onLockElement={onLockElement}
                                onUnlockElement={onUnlockElement}
                                isContentLocked={isContentLocked}
                                isCollectionLocked={isCollectionLocked}
                            />
                        )}
                    </BlockItem>
                </div>
            ))}
            
            {/* Drop zone at the end */}
            <DropZone
                isActive={dropIndicator === blocks.length}
                isDragActive={isDragActive}
                onDragOver={(e) => handleDragOver(e, blocks.length)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, blocks.length)}
            />
        </div>
    );
}

// Drop zone indicator component
interface DropZoneProps {
    isActive: boolean;
    isDragActive: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}

function DropZone({ isActive, isDragActive, onDragOver, onDragLeave, onDrop }: DropZoneProps) {
    return (
        <div
            className={cn(
                'transition-all duration-200 rounded',
                // When not dragging, minimal height
                !isDragActive && 'h-1',
                // When dragging, show drop zone
                isDragActive && !isActive && 'h-8 border-2 border-dashed border-muted-foreground/30 bg-muted/20',
                // When hovering over the drop zone
                isDragActive && isActive && 'h-12 border-2 border-dashed border-primary bg-primary/10'
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {isDragActive && isActive && (
                <div className="h-full flex items-center justify-center text-primary text-sm font-medium">
                    Drop here
                </div>
            )}
        </div>
    );
}

// Wrapper content with nested BlockList and drop handling
interface WrapperContentProps {
    block: BlockElement;
    blocks: BlockElement[];
    onUpdate: (id: string, updates: Partial<BlockElement>) => void;
    onRemove: (id: string) => void;
    onMove: (id: string, targetParentId: string | null, newIndex: number) => void;
    onDuplicate: (id: string) => void;
    onAddChild: (parentId: string, type: ElementType) => void;
    draggedId: string | null;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
    allowedTypes?: ElementType[];
    depth: number;
    onLockElement?: (block: BlockElement, reason?: string) => void;
    onUnlockElement?: (block: BlockElement) => void;
    isContentLocked?: boolean;
    isCollectionLocked?: boolean;
}

function WrapperContent({
    block,
    blocks,
    onUpdate,
    onRemove,
    onMove,
    onDuplicate,
    onAddChild,
    draggedId,
    onDragStart,
    onDragEnd,
    allowedTypes,
    depth,
    onLockElement,
    onUnlockElement,
    isContentLocked = false,
    isCollectionLocked = false,
}: WrapperContentProps) {
    const [isDropTarget, setIsDropTarget] = useState(false);
    const isDragActive = draggedId !== null;

    // Check if the dragged item is this wrapper or a child of this wrapper
    const isValidDropTarget = isDragActive && draggedId !== block.id && !isChildOf(block, draggedId);

    const handleDragOver = (e: React.DragEvent) => {
        if (!isValidDropTarget) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDropTarget(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropTarget(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropTarget(false);
        
        if (draggedId && isValidDropTarget) {
            onMove(draggedId, block.id, blocks.length);
        }
        onDragEnd();
    };

    return (
        <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/20">
            {blocks.length > 0 ? (
                <>
                    <BlockList
                        blocks={blocks}
                        onUpdate={onUpdate}
                        onRemove={onRemove}
                        onMove={onMove}
                        onDuplicate={onDuplicate}
                        onAddChild={onAddChild}
                        draggedId={draggedId}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        allowedTypes={allowedTypes}
                        depth={depth + 1}
                        parentId={block.id}
                        onLockElement={onLockElement}
                        onUnlockElement={onUnlockElement}
                        isContentLocked={isContentLocked}
                        isCollectionLocked={isCollectionLocked}
                    />
                    
                    {/* Additional drop zone at the bottom of non-empty wrapper */}
                    {isValidDropTarget && (
                        <div
                            className={cn(
                                'mt-2 py-3 rounded-lg border-2 border-dashed transition-all duration-200 flex items-center justify-center',
                                isDropTarget 
                                    ? 'border-primary bg-primary/10' 
                                    : 'border-primary/30 bg-primary/5'
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <span className={cn(
                                'text-sm transition-colors',
                                isDropTarget ? 'text-primary font-medium' : 'text-primary/50'
                            )}>
                                Drop here to add to wrapper
                            </span>
                        </div>
                    )}
                </>
            ) : (
                <div
                    className={cn(
                        'flex flex-col items-center justify-center py-6 rounded-lg border-2 border-dashed transition-all duration-200',
                        isDropTarget 
                            ? 'border-primary bg-primary/10' 
                            : isValidDropTarget 
                                ? 'border-primary/50 bg-primary/5' 
                                : 'border-muted-foreground/20'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Layers className={cn(
                        'size-8 mb-2 transition-colors',
                        isDropTarget ? 'text-primary' : 'text-muted-foreground/30'
                    )} />
                    <span className={cn(
                        'text-sm transition-colors',
                        isDropTarget ? 'text-primary' : 'text-muted-foreground/50'
                    )}>
                        {isValidDropTarget ? 'Drop here to add to wrapper' : 'Drag blocks here or add new ones'}
                    </span>
                </div>
            )}
            <div className="mt-3">
                <AddBlockMenu 
                    onAdd={(type) => onAddChild(block.id, type)}
                    allowedTypes={allowedTypes}
                    size="sm"
                />
            </div>
        </div>
    );
}

// Helper to check if a block is a child of another
function isChildOf(parent: BlockElement, childId: string): boolean {
    if (!parent.children) return false;
    for (const child of parent.children) {
        if (child.id === childId) return true;
        if (isChildOf(child, childId)) return true;
    }
    return false;
}
