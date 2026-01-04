import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Target, X, Move } from 'lucide-react';

export interface FocusArea {
    x: number;      // Percentage from left (0-100)
    y: number;      // Percentage from top (0-100)
    width: number;  // Percentage of image width (0-100)
    height: number; // Percentage of image height (0-100)
}

interface FocusAreaSelectorProps {
    imageUrl: string;
    focusArea?: FocusArea | null;
    onChange: (focusArea: FocusArea | null) => void;
    disabled?: boolean;
}

export function FocusAreaSelector({ 
    imageUrl, 
    focusArea, 
    onChange, 
    disabled = false 
}: FocusAreaSelectorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentArea, setCurrentArea] = useState<FocusArea | null>(focusArea || null);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Update current area when prop changes
    useEffect(() => {
        setCurrentArea(focusArea || null);
    }, [focusArea]);

    const getRelativePosition = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        return {
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
        };
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (disabled) return;
        
        // Check if clicking on existing selection
        if (currentArea) {
            const pos = getRelativePosition(e);
            const inX = pos.x >= currentArea.x && pos.x <= currentArea.x + currentArea.width;
            const inY = pos.y >= currentArea.y && pos.y <= currentArea.y + currentArea.height;
            
            if (inX && inY) {
                // Start dragging
                setIsDragging(true);
                setStartPos(pos);
                return;
            }
        }
        
        // Start new selection
        const pos = getRelativePosition(e);
        setIsSelecting(true);
        setStartPos(pos);
        setCurrentArea({
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
        });
    }, [disabled, currentArea, getRelativePosition]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;
        
        const pos = getRelativePosition(e);
        
        if (isSelecting) {
            const width = pos.x - startPos.x;
            const height = pos.y - startPos.y;
            
            setCurrentArea({
                x: width >= 0 ? startPos.x : pos.x,
                y: height >= 0 ? startPos.y : pos.y,
                width: Math.abs(width),
                height: Math.abs(height),
            });
        } else if (isDragging && currentArea) {
            const deltaX = pos.x - startPos.x;
            const deltaY = pos.y - startPos.y;
            
            let newX = currentArea.x + deltaX;
            let newY = currentArea.y + deltaY;
            
            // Keep within bounds
            newX = Math.max(0, Math.min(100 - currentArea.width, newX));
            newY = Math.max(0, Math.min(100 - currentArea.height, newY));
            
            setCurrentArea({
                ...currentArea,
                x: newX,
                y: newY,
            });
            setStartPos(pos);
        } else if (isResizing && currentArea && resizeHandle) {
            let { x, y, width, height } = currentArea;
            
            if (resizeHandle.includes('e')) {
                width = Math.max(5, Math.min(100 - x, pos.x - x));
            }
            if (resizeHandle.includes('w')) {
                const newX = Math.max(0, Math.min(x + width - 5, pos.x));
                width = width + (x - newX);
                x = newX;
            }
            if (resizeHandle.includes('s')) {
                height = Math.max(5, Math.min(100 - y, pos.y - y));
            }
            if (resizeHandle.includes('n')) {
                const newY = Math.max(0, Math.min(y + height - 5, pos.y));
                height = height + (y - newY);
                y = newY;
            }
            
            setCurrentArea({ x, y, width, height });
        }
    }, [isSelecting, isDragging, isResizing, startPos, currentArea, resizeHandle, getRelativePosition]);

    const handleMouseUp = useCallback(() => {
        if (isSelecting || isDragging || isResizing) {
            setIsSelecting(false);
            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle(null);
            
            // Only save if area is meaningful (at least 5% in both dimensions)
            if (currentArea && currentArea.width >= 5 && currentArea.height >= 5) {
                onChange(currentArea);
            } else if (isSelecting) {
                // Reset if selection was too small
                setCurrentArea(focusArea || null);
            }
        }
    }, [isSelecting, isDragging, isResizing, currentArea, focusArea, onChange]);

    // Add global mouse event listeners
    useEffect(() => {
        if (isSelecting || isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isSelecting, isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        if (disabled) return;
        
        setIsResizing(true);
        setResizeHandle(handle);
        setStartPos(getRelativePosition(e));
    };

    const handleClear = () => {
        setCurrentArea(null);
        onChange(null);
    };

    const handleSetCenter = () => {
        const newArea: FocusArea = {
            x: 25,
            y: 25,
            width: 50,
            height: 50,
        };
        setCurrentArea(newArea);
        onChange(newArea);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                    Focus Area
                </label>
                <div className="flex gap-1">
                    {!currentArea && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSetCenter}
                            disabled={disabled || !imageLoaded}
                            className="h-6 px-2 text-xs"
                        >
                            <Target className="size-3 mr-1" />
                            Set Center
                        </Button>
                    )}
                    {currentArea && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            disabled={disabled}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                        >
                            <X className="size-3 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>
            
            <div 
                ref={containerRef}
                className={`
                    relative rounded-lg overflow-hidden border
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}
                    ${!imageLoaded ? 'bg-muted animate-pulse min-h-32' : ''}
                `}
                onMouseDown={handleMouseDown}
            >
                <img 
                    src={imageUrl} 
                    alt="Focus area selection" 
                    className="w-full h-auto"
                    onLoad={() => setImageLoaded(true)}
                    draggable={false}
                />
                
                {/* Darkened overlay for areas outside focus */}
                {currentArea && imageLoaded && (
                    <>
                        {/* Top */}
                        <div 
                            className="absolute inset-x-0 top-0 bg-black/50 pointer-events-none"
                            style={{ height: `${currentArea.y}%` }}
                        />
                        {/* Bottom */}
                        <div 
                            className="absolute inset-x-0 bottom-0 bg-black/50 pointer-events-none"
                            style={{ height: `${100 - currentArea.y - currentArea.height}%` }}
                        />
                        {/* Left */}
                        <div 
                            className="absolute left-0 bg-black/50 pointer-events-none"
                            style={{ 
                                top: `${currentArea.y}%`,
                                height: `${currentArea.height}%`,
                                width: `${currentArea.x}%`,
                            }}
                        />
                        {/* Right */}
                        <div 
                            className="absolute right-0 bg-black/50 pointer-events-none"
                            style={{ 
                                top: `${currentArea.y}%`,
                                height: `${currentArea.height}%`,
                                width: `${100 - currentArea.x - currentArea.width}%`,
                            }}
                        />
                        
                        {/* Focus area border and handles */}
                        <div
                            className={`
                                absolute border-2 border-primary
                                ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                            `}
                            style={{
                                left: `${currentArea.x}%`,
                                top: `${currentArea.y}%`,
                                width: `${currentArea.width}%`,
                                height: `${currentArea.height}%`,
                            }}
                        >
                            {/* Center move indicator */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-primary/80 text-primary-foreground rounded p-1">
                                    <Move className="size-4" />
                                </div>
                            </div>
                            
                            {/* Resize handles */}
                            {!disabled && (
                                <>
                                    {/* Corners */}
                                    <div 
                                        className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-sm cursor-nw-resize"
                                        onMouseDown={(e) => handleResizeStart(e, 'nw')}
                                    />
                                    <div 
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-ne-resize"
                                        onMouseDown={(e) => handleResizeStart(e, 'ne')}
                                    />
                                    <div 
                                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-sm cursor-sw-resize"
                                        onMouseDown={(e) => handleResizeStart(e, 'sw')}
                                    />
                                    <div 
                                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize"
                                        onMouseDown={(e) => handleResizeStart(e, 'se')}
                                    />
                                    
                                    {/* Edges */}
                                    <div 
                                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-primary rounded-sm cursor-n-resize"
                                        onMouseDown={(e) => handleResizeStart(e, 'n')}
                                    />
                                    <div 
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-primary rounded-sm cursor-s-resize"
                                        onMouseDown={(e) => handleResizeStart(e, 's')}
                                    />
                                    <div 
                                        className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-6 bg-primary rounded-sm cursor-w-resize"
                                        onMouseDown={(e) => handleResizeStart(e, 'w')}
                                    />
                                    <div 
                                        className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-6 bg-primary rounded-sm cursor-e-resize"
                                        onMouseDown={(e) => handleResizeStart(e, 'e')}
                                    />
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {currentArea && (
                <p className="text-xs text-muted-foreground">
                    Position: {Math.round(currentArea.x)}%, {Math.round(currentArea.y)}% | 
                    Size: {Math.round(currentArea.width)}% × {Math.round(currentArea.height)}%
                </p>
            )}
            
            {!currentArea && imageLoaded && (
                <p className="text-xs text-muted-foreground">
                    Click and drag to select the important area of this image
                </p>
            )}
        </div>
    );
}

