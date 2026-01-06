import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    ChevronRight, 
    Folder, 
    FolderOpen, 
    Globe,
    Library,
    Loader2,
    Check,
} from 'lucide-react';
import type { MediaFolderTree } from '@/types';

interface FolderSelectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedFolderId: string | null;
    onSelect: (folder: { id: string; path: string } | null) => void;
}

interface FolderNodeProps {
    folder: MediaFolderTree;
    level: number;
    selectedFolderId: string | null;
    onSelect: (folder: MediaFolderTree) => void;
    expandedFolders: Set<string>;
    onToggleExpand: (folderId: string) => void;
}

function FolderNode({ 
    folder, 
    level, 
    selectedFolderId, 
    onSelect,
    expandedFolders,
    onToggleExpand,
}: FolderNodeProps) {
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;
    const isExpanded = expandedFolders.has(folder.id);

    const getFolderIcon = () => {
        if (folder.type === 'root_global') return Globe;
        if (folder.type === 'root_collections') return Library;
        return isExpanded ? FolderOpen : Folder;
    };

    const Icon = getFolderIcon();

    return (
        <div>
            <div
                className={`
                    flex items-center gap-2 py-2 px-3 rounded cursor-pointer transition-colors
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                `}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
                onClick={() => onSelect(folder)}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        className={`p-0.5 rounded ${isSelected ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted-foreground/20'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(folder.id);
                        }}
                    >
                        <ChevronRight 
                            className={`size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                    </button>
                ) : (
                    <span className="w-5" />
                )}
                <Icon className={`size-4 shrink-0 ${isSelected ? '' : 'text-muted-foreground'}`} />
                <span className="text-sm truncate flex-1">{folder.name}</span>
                {isSelected && <Check className="size-4 shrink-0" />}
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {folder.children.map((child) => (
                        <FolderNode
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            selectedFolderId={selectedFolderId}
                            onSelect={onSelect}
                            expandedFolders={expandedFolders}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FolderSelectDialog({ 
    open, 
    onOpenChange, 
    selectedFolderId,
    onSelect,
}: FolderSelectDialogProps) {
    const [folders, setFolders] = useState<MediaFolderTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [tempSelection, setTempSelection] = useState<MediaFolderTree | null>(null);

    const fetchFolders = useCallback(async () => {
        try {
            const response = await fetch('/media-folders/tree', {
                headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                // Handle new response format with { folders: [...] }
                const foldersList: MediaFolderTree[] = data.folders || data;
                setFolders(foldersList);
                
                // Auto-expand root folders and path to selected folder
                const initialExpanded = new Set<string>();
                foldersList.forEach((f: MediaFolderTree) => initialExpanded.add(f.id));
                
                // Expand path to currently selected folder
                if (selectedFolderId) {
                    const expandPath = (items: MediaFolderTree[], target: string): boolean => {
                        for (const item of items) {
                            if (item.id === target) {
                                return true;
                            }
                            if (item.children && item.children.length > 0) {
                                if (expandPath(item.children, target)) {
                                    initialExpanded.add(item.id);
                                    return true;
                                }
                            }
                        }
                        return false;
                    };
                    expandPath(foldersList, selectedFolderId);
                }
                
                setExpandedFolders(initialExpanded);
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedFolderId]);

    useEffect(() => {
        if (open) {
            fetchFolders();
            setTempSelection(null);
        }
    }, [open, fetchFolders]);

    const handleToggleExpand = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const handleSelect = (folder: MediaFolderTree) => {
        setTempSelection(folder);
    };

    const handleConfirm = () => {
        if (tempSelection) {
            onSelect({ id: tempSelection.id, path: tempSelection.path });
        } else {
            onSelect(null);
        }
        onOpenChange(false);
    };

    const handleRemoveFolder = () => {
        onSelect(null);
        onOpenChange(false);
    };

    // Build the display path for the current selection
    const getDisplayPath = (folder: MediaFolderTree): string => {
        // Convert path like "global/my-folder" to "Global / My Folder"
        const pathParts = folder.path.split('/');
        return pathParts
            .map(part => part.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '))
            .join(' / ');
    };

    const effectiveSelectedId = tempSelection?.id || selectedFolderId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Select Folder</DialogTitle>
                    <DialogDescription>
                        Choose a folder to move this media item to
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] border rounded-md">
                        <div className="p-2">
                            {folders.map((folder) => (
                                <FolderNode
                                    key={folder.id}
                                    folder={folder}
                                    level={0}
                                    selectedFolderId={effectiveSelectedId}
                                    onSelect={handleSelect}
                                    expandedFolders={expandedFolders}
                                    onToggleExpand={handleToggleExpand}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {tempSelection && (
                    <div className="text-sm text-muted-foreground">
                        Selected: <span className="font-medium text-foreground">{getDisplayPath(tempSelection)}</span>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={handleRemoveFolder} className="mr-auto">
                        Remove from folder
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>
                        Select
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

