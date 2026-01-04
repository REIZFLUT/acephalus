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
    Folder, 
    FolderOpen, 
    Plus, 
    Pencil, 
    Trash2,
    Globe,
    Library,
    Loader2,
    MoreHorizontal,
} from 'lucide-react';
import type { MediaFolderTree } from '@/types';

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

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
    const [folders, setFolders] = useState<MediaFolderTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [folderToRename, setFolderToRename] = useState<{ id: string; name: string } | null>(null);
    const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);

    const fetchFolders = useCallback(async () => {
        try {
            const response = await fetch('/media-folders/tree', {
                headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                setFolders(data);
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {/* Folder Tree - Global and Collections as root items */}
            {folders.map((folder) => (
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

