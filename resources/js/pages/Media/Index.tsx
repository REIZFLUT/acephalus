import { useState, FormEvent, ChangeEvent, useEffect, useCallback } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Upload,
    Search,
    Trash2,
    Loader2,
    X,
    Pencil,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    LayoutGrid,
    List,
    Folder,
    FolderOpen,
    FolderPlus,
    ArrowUp,
    File,
} from 'lucide-react';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { FolderTree } from '@/components/media/FolderTree';
import { FolderSelectDialog } from '@/components/media/FolderSelectDialog';
import { MediaEditSheet, type FolderSelection } from '@/components/media/MediaEditSheet';
import { MediaDataTable } from '@/components/data-table';
import { ThumbnailImage } from '@/components/ui/thumbnail-image';
import type { PageProps, Media, PaginatedData, MediaMetaField } from '@/types';
import { getFileIcon, formatFileSize, getFileTypeLabel } from '@/utils/media';

interface Subfolder {
    id: string;
    name: string;
    type: string;
    is_system: boolean;
    children_count: number;
    media_count: number;
}

interface CurrentFolder {
    id: string;
    name: string;
    type: string;
    parent_id: string | null;
    can_create_subfolders: boolean;
}

interface MediaIndexProps extends PageProps {
    media: PaginatedData<Media>;
    filters: {
        search: string | null;
        type: string | null;
        folder: string | null;
        per_page: number;
    };
    metaFields?: MediaMetaField[];
    subfolders?: Subfolder[];
    currentFolder?: CurrentFolder | null;
    isGlobalSearch?: boolean;
}


function MediaCard({ 
    item, 
    onDelete,
    onEdit,
}: { 
    item: Media; 
    onDelete: (item: Media) => void;
    onEdit: (item: Media) => void;
}) {
    const Icon = getFileIcon(item.mime_type);
    const isImage = item.mime_type.startsWith('image/');
    const isPdf = item.mime_type === 'application/pdf';
    const hasThumbnail = item.thumbnail_urls && Object.keys(item.thumbnail_urls).length > 0;

    return (
        <Card className="group overflow-hidden">
            <div className="aspect-square relative bg-muted overflow-hidden">
                {isImage && (item.thumbnail_urls || item.url) ? (
                    <ThumbnailImage
                        thumbnailUrls={item.thumbnail_urls}
                        fallbackUrl={item.url}
                        alt={item.original_filename}
                        sizes="(min-width: 1280px) 200px, (min-width: 768px) 180px, 150px"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : isPdf && hasThumbnail ? (
                    <ThumbnailImage
                        thumbnailUrls={item.thumbnail_urls}
                        alt={item.original_filename}
                        sizes="(min-width: 1280px) 200px, (min-width: 768px) 180px, 150px"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="size-12 text-muted-foreground" />
                    </div>
                )}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" onClick={() => onEdit(item)}>
                        <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive">
                                <Trash2 className="size-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete File</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{item.original_filename}"? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete(item)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            <CardContent className="p-3">
                <p className="text-sm font-medium truncate" title={item.original_filename}>
                    {item.original_filename}
                </p>
                <p className="text-xs text-muted-foreground">
                    {getFileTypeLabel(item.original_filename, item.mime_type)} • {formatFileSize(item.size)}
                </p>
            </CardContent>
        </Card>
    );
}

function MediaListItem({ 
    item, 
    onDelete,
    onEdit,
}: { 
    item: Media; 
    onDelete: (item: Media) => void;
    onEdit: (item: Media) => void;
}) {
    const Icon = getFileIcon(item.mime_type);
    const isImage = item.mime_type.startsWith('image/');
    const isPdf = item.mime_type === 'application/pdf';
    const hasThumbnail = item.thumbnail_urls && Object.keys(item.thumbnail_urls).length > 0;

    return (
        <Card className="group">
            <div className="flex items-center gap-4 p-3">
                {/* Thumbnail */}
                <div className="size-14 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                    {isImage && (item.thumbnail_urls || item.url) ? (
                        <ThumbnailImage
                            thumbnailUrls={item.thumbnail_urls}
                            fallbackUrl={item.url}
                            alt={item.original_filename}
                            sizes="56px"
                            className="w-full h-full object-cover"
                        />
                    ) : isPdf && hasThumbnail ? (
                        <ThumbnailImage
                            thumbnailUrls={item.thumbnail_urls}
                            alt={item.original_filename}
                            sizes="56px"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Icon className="size-6 text-muted-foreground" />
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={item.original_filename}>
                        {item.original_filename}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatFileSize(item.size)}</span>
                        <span>{item.mime_type}</span>
                        {item.metadata?.alt && (
                            <span className="truncate max-w-[200px]" title={item.metadata.alt}>
                                Alt: {item.metadata.alt}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
                        <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="size-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete File</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{item.original_filename}"? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete(item)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </Card>
    );
}

function FolderCard({ 
    folder, 
    onNavigate,
}: { 
    folder: Subfolder; 
    onNavigate: (folderId: string) => void;
}) {
    return (
        <Card 
            className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors select-none"
            onDoubleClick={() => onNavigate(folder.id)}
        >
            <div className="aspect-square relative bg-muted flex flex-col items-center justify-center gap-2">
                <Folder className="size-16 text-amber-500" />
                <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-sm font-medium truncate text-center" title={folder.name}>
                        {folder.name}
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                        {folder.children_count > 0 && `${folder.children_count} folders`}
                        {folder.children_count > 0 && folder.media_count > 0 && ', '}
                        {folder.media_count > 0 && `${folder.media_count} files`}
                        {folder.children_count === 0 && folder.media_count === 0 && 'Empty'}
                    </p>
                </div>
            </div>
        </Card>
    );
}



export default function MediaIndex({ media, filters, metaFields = [], subfolders = [], currentFolder, isGlobalSearch = false }: MediaIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || 'all');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(filters.folder || null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Media | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        // Load from localStorage, default to 'grid'
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mediaLibraryViewMode');
            if (saved === 'list' || saved === 'grid') {
                return saved;
            }
        }
        return 'grid';
    });
    
    // Upload folder selection state
    const [uploadFolderDialogOpen, setUploadFolderDialogOpen] = useState(false);
    const [uploadFolderSelection, setUploadFolderSelection] = useState<FolderSelection | null>(null);
    const [globalFolderId, setGlobalFolderId] = useState<string | null>(null);
    
    // Create folder state
    const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm<{ file: File | null; folder_id: string | null }>({
        file: null,
        folder_id: null,
    });

    // Disable body scroll for this page to prevent double scrollbars
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Fetch global folder on mount for default upload location
    useEffect(() => {
        fetch('/media-folders/global-root', {
            headers: { 'Accept': 'application/json' },
        })
            .then(res => res.json())
            .then(folder => {
                // MongoDB models serialize id as 'id' (not '_id')
                const folderId = folder?.id || folder?._id;
                if (folder && folderId) {
                    setGlobalFolderId(folderId);
                    setUploadFolderSelection({ id: folderId, path: folder.name || 'Global' });
                    setData('folder_id', folderId);
                }
            })
            .catch(console.error);
    }, []);

    // Keep form folder_id in sync with upload folder selection
    const updateFolderId = useCallback((folderId: string | null) => {
        setData('folder_id', folderId);
    }, [setData]);

    useEffect(() => {
        updateFolderId(uploadFolderSelection?.id || globalFolderId);
    }, [uploadFolderSelection, globalFolderId, updateFolderId]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/media', {
            search: search || undefined,
            type: type !== 'all' ? type : undefined,
            folder: selectedFolderId || undefined,
        }, { preserveState: true });
    };

    const handleTypeChange = (newType: string) => {
        setType(newType);
        router.get('/media', {
            search: search || undefined,
            type: newType !== 'all' ? newType : undefined,
            folder: selectedFolderId || undefined,
        }, { preserveState: true });
    };

    const handleFolderChange = (folderId: string | null) => {
        setSelectedFolderId(folderId);
        router.get('/media', {
            search: search || undefined,
            type: type !== 'all' ? type : undefined,
            folder: folderId || undefined,
        }, { preserveState: true });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('file', file);
    };

    const handleUpload = (e: FormEvent) => {
        e.preventDefault();
        if (!data.file) return;

        post('/media', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setUploadDialogOpen(false);
                // Reset upload folder to global default
                if (globalFolderId) {
                    setUploadFolderSelection({ id: globalFolderId, path: 'Global' });
                }
            },
        });
    };

    const handleDelete = (item: Media) => {
        router.delete(`/media/${item._id}`);
    };

    const handleEditSave = () => {
        router.reload({ only: ['media'] });
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !selectedFolderId) return;

        setCreatingFolder(true);
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
                    parent_id: selectedFolderId,
                }),
            });

            if (response.ok) {
                setCreateFolderDialogOpen(false);
                setNewFolderName('');
                // Reload to show the new folder
                router.reload();
            } else {
                const data = await response.json();
                console.error('Failed to create folder:', data.message);
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
        } finally {
            setCreatingFolder(false);
        }
    };

    return (
        <AppLayout
            title="Media Library"
            breadcrumbs={[{ label: 'Media' }]}
            actions={
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Upload className="size-4 mr-2" />
                            Upload
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload File</DialogTitle>
                            <DialogDescription>
                                Upload a new file to the media library
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4 mt-4">
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {data.file ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <File className="size-8 text-primary" />
                                        <div className="text-left">
                                            <p className="font-medium">{data.file.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatFileSize(data.file.size)}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setData('file', null)}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload className="size-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">
                                            Click to select a file or drag and drop
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Max file size: 50MB
                                        </p>
                                    </label>
                                )}
                            </div>
                            {errors.file && (
                                <p className="text-sm text-destructive">{errors.file}</p>
                            )}
                            
                            {/* Upload folder selection */}
                            <div className="space-y-2">
                                <Label>Upload to folder</Label>
                                <button
                                    type="button"
                                    onClick={() => setUploadFolderDialogOpen(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors text-left"
                                >
                                    <Folder className="size-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">
                                        {uploadFolderSelection?.path || 'Global'}
                                    </span>
                                    <ChevronRight className="size-4 text-muted-foreground ml-auto shrink-0" />
                                </button>
                            </div>
                            
                            <FolderSelectDialog
                                open={uploadFolderDialogOpen}
                                onOpenChange={setUploadFolderDialogOpen}
                                selectedFolderId={uploadFolderSelection?.id || globalFolderId}
                                onSelect={(folder) => {
                                    if (folder) {
                                        setUploadFolderSelection(folder);
                                    } else if (globalFolderId) {
                                        // If user removes folder, reset to global
                                        setUploadFolderSelection({ id: globalFolderId, path: 'Global' });
                                    }
                                }}
                            />
                            
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setUploadDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!data.file || processing}>
                                    {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Upload
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            }
        >
            <div className="flex h-[90vh] -m-6">
                {/* Sidebar with Folder Tree - docked to the left edge */}
                <div className={`
                    shrink-0 h-full border-r bg-muted/30 transition-all duration-200
                    ${sidebarCollapsed ? 'w-10' : 'w-56'}
                `}>
                    <div className="flex items-center justify-between p-2 border-b">
                        {!sidebarCollapsed && (
                            <span className="text-sm font-medium px-2">Folders</span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        >
                            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                        </Button>
                    </div>
                    {!sidebarCollapsed && (
                        <ScrollArea className="h-[calc(100%-3rem)]">
                            <div className="p-2">
                                <FolderTree
                                    selectedFolderId={selectedFolderId}
                                    onSelectFolder={handleFolderChange}
                                />
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-6 flex flex-col h-full overflow-auto">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage your uploaded files and images
                        </p>
                    </div>

                    {/* Global Search & Filters */}
                    <div className="flex gap-4 mb-4">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Global search across all folders..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit" variant="secondary">Search</Button>
                            {isGlobalSearch && (
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/media', { 
                                            type: type !== 'all' ? type : undefined,
                                            folder: selectedFolderId || undefined,
                                        });
                                    }}
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </form>
                        <Select value={type} onValueChange={handleTypeChange}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                <SelectItem value="image">Images</SelectItem>
                                <SelectItem value="video">Videos</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="application">Documents</SelectItem>
                            </SelectContent>
                        </Select>
                        <ToggleGroup 
                            type="single" 
                            value={viewMode} 
                            onValueChange={(value) => {
                                if (value) {
                                    setViewMode(value as 'grid' | 'list');
                                    localStorage.setItem('mediaLibraryViewMode', value);
                                }
                            }}
                        >
                            <ToggleGroupItem value="grid" aria-label="Grid view">
                                <LayoutGrid className="size-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="list" aria-label="List view">
                                <List className="size-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    {/* Global Search Results Indicator */}
                    {isGlobalSearch && (
                        <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary" className="gap-1">
                                <Search className="size-3" />
                                Searching all folders for "{filters.search}"
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {media.total} {media.total === 1 ? 'result' : 'results'}
                            </span>
                        </div>
                    )}

                    {/* Current Path & Navigate Up */}
                    {currentFolder && (
                        <div className="flex items-center gap-2 mb-4 text-sm">
                            {currentFolder.parent_id && (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleFolderChange(currentFolder.parent_id)}
                                    className="gap-1"
                                >
                                    <ArrowUp className="size-4" />
                                    Up
                                </Button>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <Folder className="size-4" />
                                <span>{currentFolder.name}</span>
                            </div>
                            {currentFolder.can_create_subfolders && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setCreateFolderDialogOpen(true)}
                                    className="ml-auto gap-1"
                                >
                                    <FolderPlus className="size-4" />
                                    New Folder
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Content Grid - Folders and Files */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        {subfolders.length === 0 && media.data.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <FolderOpen className="size-16 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">
                                        {selectedFolderId ? 'This folder is empty' : 'No files yet'}
                                    </h3>
                                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                                        {selectedFolderId 
                                            ? 'Upload files or create subfolders to organize your media.'
                                            : 'Select a folder from the sidebar or upload your first file.'
                                        }
                                    </p>
                                    {selectedFolderId && (
                                        <div className="flex gap-3">
                                            <Button onClick={() => {
                                                // Set the current folder as upload destination
                                                if (currentFolder) {
                                                    setUploadFolderSelection({ 
                                                        id: currentFolder.id, 
                                                        path: currentFolder.name 
                                                    });
                                                }
                                                setUploadDialogOpen(true);
                                            }}>
                                                <Upload className="size-4 mr-2" />
                                                Upload file
                                            </Button>
                                            {currentFolder?.can_create_subfolders && (
                                                <Button variant="outline" onClick={() => setCreateFolderDialogOpen(true)}>
                                                    <FolderPlus className="size-4 mr-2" />
                                                    Create folder
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {viewMode === 'grid' ? (
                                    <div className="flex flex-col flex-1 min-h-0">
                                        <div className="overflow-auto flex-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
                                                {/* Subfolders */}
                                                {subfolders.map((folder) => (
                                                    <FolderCard 
                                                        key={folder.id} 
                                                        folder={folder} 
                                                        onNavigate={handleFolderChange}
                                                    />
                                                ))}
                                                {/* Media Files */}
                                                {media.data.map((item) => (
                                                    <MediaCard 
                                                        key={item._id} 
                                                        item={item} 
                                                        onDelete={handleDelete}
                                                        onEdit={setEditingItem}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pagination for Grid View */}
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {media.total} {media.total === 1 ? 'item' : 'items'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Items per page</span>
                                                    <Select 
                                                        value={String(filters.per_page)} 
                                                        onValueChange={(value) => router.get('/media', {
                                                            search: search || undefined,
                                                            type: type !== 'all' ? type : undefined,
                                                            folder: selectedFolderId || undefined,
                                                            per_page: value,
                                                            page: 1,
                                                        })}
                                                    >
                                                        <SelectTrigger className="w-20 h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="12">12</SelectItem>
                                                            <SelectItem value="24">24</SelectItem>
                                                            <SelectItem value="48">48</SelectItem>
                                                            <SelectItem value="96">96</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    Page {media.current_page} of {media.last_page}
                                                </span>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled={media.current_page <= 1}
                                                        onClick={() => router.get('/media', { 
                                                            page: 1, 
                                                            search: search || undefined, 
                                                            type: type !== 'all' ? type : undefined,
                                                            folder: selectedFolderId || undefined,
                                                            per_page: filters.per_page,
                                                        })}
                                                    >
                                                        <ChevronsLeft className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled={media.current_page <= 1}
                                                        onClick={() => router.get('/media', { 
                                                            page: media.current_page - 1, 
                                                            search: search || undefined, 
                                                            type: type !== 'all' ? type : undefined,
                                                            folder: selectedFolderId || undefined,
                                                            per_page: filters.per_page,
                                                        })}
                                                    >
                                                        <ChevronLeft className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled={media.current_page >= media.last_page}
                                                        onClick={() => router.get('/media', { 
                                                            page: media.current_page + 1, 
                                                            search: search || undefined, 
                                                            type: type !== 'all' ? type : undefined,
                                                            folder: selectedFolderId || undefined,
                                                            per_page: filters.per_page,
                                                        })}
                                                    >
                                                        <ChevronRight className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled={media.current_page >= media.last_page}
                                                        onClick={() => router.get('/media', { 
                                                            page: media.last_page, 
                                                            search: search || undefined, 
                                                            type: type !== 'all' ? type : undefined,
                                                            folder: selectedFolderId || undefined,
                                                            per_page: filters.per_page,
                                                        })}
                                                    >
                                                        <ChevronsRight className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Unified List View with folders and files */
                                    <div className="flex flex-col flex-1 min-h-0">
                                        <MediaDataTable
                                            media={media.data}
                                            metaFields={metaFields}
                                            subfolders={subfolders}
                                            onEdit={setEditingItem}
                                            onDelete={handleDelete}
                                            onFolderNavigate={handleFolderChange}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    </div>
                </div>
            </div>

            {/* Edit Sheet */}
            <MediaEditSheet
                item={editingItem}
                metaFields={metaFields}
                open={editingItem !== null}
                onOpenChange={(open) => !open && setEditingItem(null)}
                onSave={handleEditSave}
            />

            {/* Create Folder Dialog */}
            <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Create a new folder in "{currentFolder?.name || 'current location'}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="folder-name">Folder name</Label>
                            <Input
                                id="folder-name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Enter folder name..."
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setCreateFolderDialogOpen(false);
                                setNewFolderName('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreateFolder} 
                            disabled={!newFolderName.trim() || creatingFolder}
                        >
                            {creatingFolder && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Create Folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
