import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    ChevronDown,
    Folder, 
    FolderOpen, 
    Plus, 
    Pencil, 
    Trash2,
    Globe,
    Library,
    Loader2,
    MoreHorizontal,
    Search,
    X,
} from 'lucide-react';
import type { MediaFolderTree } from '@/types';

const FOLDERS_PER_PAGE = 50;

interface FolderTreeProps {
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
}

interface FolderNodeProps {
    folder: MediaFolderTree;
    level: number;
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onCreateFolder: (parentId: string) => void;
    onRenameFolder: (folderId: string, currentName: string) => void;
    onDeleteFolder: (folderId: string, name: string) => void;
}

function FolderNode({ 
    folder, 
    level, 
    selectedFolderId, 
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
}: FolderNodeProps) {
    const [isOpen, setIsOpen] = useState(level === 0);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;

    const getFolderIcon = () => {
        if (folder.type === 'root_global') return Globe;
        if (folder.type === 'root_collections') return Library;
        return isOpen ? FolderOpen : Folder;
    };

    const Icon = getFolderIcon();

    const showMenu = folder.can_create_subfolders || (!folder.is_system && folder.can_delete);

    return (
        <div>
            <div
                className={`
                    flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition-colors group
                    ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                `}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onSelectFolder(folder.id)}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        className="p-0.5 hover:bg-muted rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                    >
                        <ChevronRight 
                            className={`size-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
                        />
                    </button>
                ) : (
                    <span className="w-4" />
                )}
                <Icon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">{folder.name}</span>
                
                {showMenu && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20">
                                <MoreHorizontal className="size-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {folder.can_create_subfolders && (
                                <DropdownMenuItem onClick={() => onCreateFolder(folder.id)}>
                                    <Plus className="size-4 mr-2" />
                                    New Subfolder
                                </DropdownMenuItem>
                            )}
                            {!folder.is_system && (
                                <>
                                    <DropdownMenuItem onClick={() => onRenameFolder(folder.id, folder.name)}>
                                        <Pencil className="size-4 mr-2" />
                                        Rename
                                    </DropdownMenuItem>
                                    {folder.can_delete && (
                                        <DropdownMenuItem 
                                            onClick={() => onDeleteFolder(folder.id, folder.name)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="size-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {hasChildren && isOpen && (
                <div>
                    {folder.children.map((child) => (
                        <FolderNode
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            onCreateFolder={onCreateFolder}
                            onRenameFolder={onRenameFolder}
                            onDeleteFolder={onDeleteFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface FolderTreeResponse {
    folders: MediaFolderTree[];
    total: number;
    shown: number;
    has_more: boolean;
    remaining: number;
}

interface SearchResponse {
    folders: MediaFolderTree[];
    total: number;
    has_more: boolean;
    remaining: number;
}

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
    const [folders, setFolders] = useState<MediaFolderTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [folderToRename, setFolderToRename] = useState<{ id: string; name: string } | null>(null);
    const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
    
    // Search and pagination state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MediaFolderTree[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [totalFolders, setTotalFolders] = useState(0);

    const fetchFolders = useCallback(async (currentOffset = 0, append = false) => {
        try {
            if (currentOffset === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            
            const params = new URLSearchParams({
                limit: FOLDERS_PER_PAGE.toString(),
                offset: currentOffset.toString(),
            });
            
            const response = await fetch(`/media-folders/tree?${params}`, {
                headers: { 'Accept': 'application/json' },
            });
            
            if (response.ok) {
                const data: FolderTreeResponse = await response.json();
                
                if (append && currentOffset > 0) {
                    // Append new folders to the Global folder's children
                    setFolders(prev => {
                        return prev.map(folder => {
                            if (folder.type === 'root_global') {
                                return {
                                    ...folder,
                                    children: [...folder.children, ...data.folders.find(f => f.type === 'root_global')?.children || []],
                                };
                            }
                            return folder;
                        });
                    });
                } else {
                    setFolders(data.folders);
                }
                
                setHasMore(data.has_more);
                setRemaining(data.remaining);
                setTotalFolders(data.total);
                setOffset(currentOffset);
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    const searchFolders = useCallback(async (query: string, currentOffset = 0, append = false) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        
        try {
            setIsSearching(true);
            if (currentOffset === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            
            const params = new URLSearchParams({
                search: query,
                limit: FOLDERS_PER_PAGE.toString(),
                offset: currentOffset.toString(),
            });
            
            const response = await fetch(`/media-folders/tree?${params}`, {
                headers: { 'Accept': 'application/json' },
            });
            
            if (response.ok) {
                const data: SearchResponse = await response.json();
                
                if (append && currentOffset > 0) {
                    setSearchResults(prev => [...prev, ...data.folders]);
                } else {
                    setSearchResults(data.folders);
                }
                
                setHasMore(data.has_more);
                setRemaining(data.remaining);
                setTotalFolders(data.total);
                setOffset(currentOffset);
            }
        } catch (error) {
            console.error('Failed to search folders:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchFolders(0);
    }, [fetchFolders]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                searchFolders(searchQuery, 0);
            } else {
                setSearchResults([]);
                setIsSearching(false);
                // Reset to initial folder view
                fetchFolders(0);
            }
        }, 300);
        
        return () => clearTimeout(timer);
    }, [searchQuery, searchFolders, fetchFolders]);

    const handleLoadMore = () => {
        const newOffset = offset + FOLDERS_PER_PAGE;
        if (isSearching) {
            searchFolders(searchQuery, newOffset, true);
        } else {
            fetchFolders(newOffset, true);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
        setOffset(0);
        fetchFolders(0);
    };

    const handleCreateFolder = (parentId: string) => {
        setSelectedParentId(parentId);
        setNewFolderName('');
        setCreateDialogOpen(true);
    };

    const handleRenameFolder = (folderId: string, currentName: string) => {
        setFolderToRename({ id: folderId, name: currentName });
        setNewFolderName(currentName);
        setRenameDialogOpen(true);
    };

    const handleDeleteFolder = (folderId: string, name: string) => {
        setFolderToDelete({ id: folderId, name });
        setDeleteDialogOpen(true);
    };

    const submitCreateFolder = async () => {
        if (!newFolderName.trim() || !selectedParentId) return;

        setDialogLoading(true);
        try {
            const response = await fetch('/media-folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: newFolderName.trim(),
                    parent_id: selectedParentId,
                }),
            });

            if (response.ok) {
                await fetchFolders();
                setCreateDialogOpen(false);
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
        } finally {
            setDialogLoading(false);
        }
    };

    const submitRenameFolder = async () => {
        if (!newFolderName.trim() || !folderToRename) return;

        setDialogLoading(true);
        try {
            const response = await fetch(`/media-folders/${folderToRename.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: newFolderName.trim(),
                }),
            });

            if (response.ok) {
                await fetchFolders();
                setRenameDialogOpen(false);
            }
        } catch (error) {
            console.error('Failed to rename folder:', error);
        } finally {
            setDialogLoading(false);
        }
    };

    const submitDeleteFolder = async () => {
        if (!folderToDelete) return;

        setDialogLoading(true);
        try {
            const response = await fetch(`/media-folders/${folderToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                if (selectedFolderId === folderToDelete.id) {
                    onSelectFolder(null);
                }
                await fetchFolders();
                setDeleteDialogOpen(false);
            }
        } catch (error) {
            console.error('Failed to delete folder:', error);
        } finally {
            setDialogLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Ordner suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-7 pr-7 text-sm"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
                    >
                        <X className="size-3.5 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty Search Results */}
            {!loading && isSearching && searchResults.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                    Keine Ordner gefunden
                </div>
            )}

            {/* Search Results (flat list) */}
            {!loading && isSearching && searchResults.length > 0 && (
                <div className="space-y-0.5">
                    {searchResults.map((folder) => (
                        <div
                            key={folder.id}
                            className={`
                                flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors
                                ${selectedFolderId === folder.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                            `}
                            onClick={() => {
                                onSelectFolder(folder.id);
                                clearSearch();
                            }}
                        >
                            <Folder className="size-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{folder.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{folder.path}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Folder Tree (normal view) */}
            {!loading && !isSearching && folders.map((folder) => (
                <FolderNode
                    key={folder.id}
                    folder={folder}
                    level={0}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={handleCreateFolder}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                />
            ))}

            {/* Load More Button */}
            {!loading && hasMore && (
                <div className="pt-2 pb-1">
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Laden...
                            </>
                        ) : (
                            <>
                                <ChevronDown className="size-3.5" />
                                {remaining} weitere Ordner laden
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Create Folder Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Enter a name for the new folder
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && submitCreateFolder()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitCreateFolder} disabled={dialogLoading || !newFolderName.trim()}>
                            {dialogLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Folder Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Folder</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the folder
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && submitRenameFolder()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitRenameFolder} disabled={dialogLoading || !newFolderName.trim()}>
                            {dialogLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Folder Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Folder</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{folderToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={submitDeleteFolder} disabled={dialogLoading}>
                            {dialogLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

