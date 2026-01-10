import { useState, useEffect, useCallback } from 'react';
import type { Media, MediaFolderTree, MediaMetaFieldValue, MediaMetaFieldConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Image, 
    Film, 
    Music, 
    FileText, 
    Folder,
    FolderOpen,
    Globe,
    Library,
    Loader2,
    Check,
    ChevronRight,
    Search,
    X,
    Paperclip,
    Upload,
} from 'lucide-react';
import { ThumbnailImage } from '@/components/ui/thumbnail-image';

const mediaTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    image: Image,
    video: Film,
    audio: Music,
    document: FileText,
    folder: Folder,
};

interface MediaPickerInputProps {
    value: MediaMetaFieldValue | null;
    onChange: (value: MediaMetaFieldValue | null) => void;
    config?: MediaMetaFieldConfig;
    compact?: boolean;
    placeholder?: string;
}

export function MediaPickerInput({ 
    value, 
    onChange, 
    config,
    compact = false,
    placeholder = 'Select media...',
}: MediaPickerInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Default: allow both files and folders
    const allowFolders = config?.allow_folders !== false;

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    const handleSelectMedia = (media: Media) => {
        onChange({
            type: 'file',
            id: media._id,
            name: media.original_filename,
            media_type: media.media_type,
            mime_type: media.mime_type,
            url: media.url,
            thumbnail_urls: media.thumbnail_urls,
        });
        setIsOpen(false);
    };

    const handleSelectFolder = (folder: MediaFolderTree) => {
        onChange({
            type: 'folder',
            id: folder.id,
            name: folder.name,
            path: folder.path,
        });
        setIsOpen(false);
    };

    const getIcon = () => {
        if (!value) return Paperclip;
        if (value.type === 'folder') return Folder;
        return value.media_type ? (mediaTypeIcons[value.media_type] || FileText) : FileText;
    };

    const MediaIcon = getIcon();

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`
                    w-full flex items-center gap-2 border rounded-md bg-background text-left
                    hover:bg-muted/50 transition-colors
                    ${compact ? 'px-2 py-1.5 h-8' : 'px-3 py-2'}
                    ${value ? 'text-foreground' : 'text-muted-foreground'}
                `}
            >
                {value ? (
                    <>
                        {value.type === 'file' && value.media_type === 'image' && value.thumbnail_urls?.small ? (
                            <ThumbnailImage
                                thumbnailUrls={value.thumbnail_urls}
                                fallbackUrl={value.url}
                                alt={value.name || 'Media'}
                                className={`${compact ? 'size-5' : 'size-6'} rounded object-cover`}
                            />
                        ) : (
                            <MediaIcon className={`${compact ? 'size-4' : 'size-5'} text-muted-foreground shrink-0`} />
                        )}
                        <span className={`truncate flex-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                            {value.name || 'Selected item'}
                        </span>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 rounded hover:bg-muted"
                        >
                            <X className="size-3.5 text-muted-foreground" />
                        </button>
                    </>
                ) : (
                    <>
                        <Paperclip className={`${compact ? 'size-3.5' : 'size-4'} shrink-0`} />
                        <span className={`${compact ? 'text-xs' : 'text-sm'}`}>{placeholder}</span>
                    </>
                )}
            </button>

            <MediaPickerDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                onSelectMedia={handleSelectMedia}
                onSelectFolder={handleSelectFolder}
                selectedId={value?.id}
                allowedTypes={config?.allowed_types}
                allowFolders={allowFolders}
            />
        </>
    );
}

// Folder Tree for Dialog - exported for reuse
export interface SimpleFolderNodeProps {
    folder: MediaFolderTree;
    level: number;
    selectedFolderId: string | null;
    onNavigate: (folderId: string | null) => void;
    onSelectFolder: (folder: MediaFolderTree) => void;
    expandedFolders: Set<string>;
    onToggleExpand: (folderId: string) => void;
    allowFolderSelection: boolean;
    selectedForAttachment: string | null;
}

export function SimpleFolderNode({
    folder,
    level,
    selectedFolderId,
    onNavigate,
    onSelectFolder,
    expandedFolders,
    onToggleExpand,
    allowFolderSelection,
    selectedForAttachment,
}: SimpleFolderNodeProps) {
    const hasChildren = folder.children && folder.children.length > 0;
    const isNavigated = selectedFolderId === folder.id;
    const isSelectedForAttachment = selectedForAttachment === folder.id;
    const isExpanded = expandedFolders.has(folder.id);

    const getFolderIcon = () => {
        if (folder.type === 'root_global') return Globe;
        if (folder.type === 'root_collections') return Library;
        return isExpanded ? FolderOpen : Folder;
    };

    const Icon = getFolderIcon();

    const handleClick = () => {
        onNavigate(folder.id);
    };

    const handleDoubleClick = () => {
        if (allowFolderSelection) {
            onSelectFolder(folder);
        }
    };

    return (
        <div>
            <div
                className={`
                    flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition-colors
                    ${isNavigated ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                    ${isSelectedForAttachment ? 'ring-2 ring-primary' : ''}
                `}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        className="p-0.5 hover:bg-muted rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(folder.id);
                        }}
                    >
                        <ChevronRight 
                            className={`size-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                    </button>
                ) : (
                    <span className="w-4" />
                )}
                <Icon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs truncate flex-1">{folder.name}</span>
                {isSelectedForAttachment && (
                    <Check className="size-3 text-primary shrink-0" />
                )}
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {folder.children.map((child) => (
                        <SimpleFolderNode
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            selectedFolderId={selectedFolderId}
                            onNavigate={onNavigate}
                            onSelectFolder={onSelectFolder}
                            expandedFolders={expandedFolders}
                            onToggleExpand={onToggleExpand}
                            allowFolderSelection={allowFolderSelection}
                            selectedForAttachment={selectedForAttachment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Library Content Component - shared between tabs and non-tabs mode
interface LibraryContentProps {
    loadingFolders: boolean;
    folders: MediaFolderTree[];
    navigatedFolderId: string | null;
    expandedFolders: Set<string>;
    selectedFolderForAttachment: MediaFolderTree | null;
    allowFolders: boolean;
    mediaItems: Media[];
    loadingMedia: boolean;
    searchQuery: string;
    debouncedSearch: string;
    currentFolderName: string;
    selectedId?: string;
    onSelectAll: () => void;
    onNavigate: (folderId: string | null) => void;
    onSelectFolder: (folder: MediaFolderTree) => void;
    onToggleExpand: (folderId: string) => void;
    onConfirmFolderSelection: () => void;
    onSearchChange: (query: string) => void;
    onSelectMedia: (media: Media) => void;
    getMediaIcon: (mediaType: string) => React.ReactNode;
}

function LibraryContent({
    loadingFolders,
    folders,
    navigatedFolderId,
    expandedFolders,
    selectedFolderForAttachment,
    allowFolders,
    mediaItems,
    loadingMedia,
    searchQuery,
    debouncedSearch,
    currentFolderName,
    selectedId,
    onSelectAll,
    onNavigate,
    onSelectFolder,
    onToggleExpand,
    onConfirmFolderSelection,
    onSearchChange,
    onSelectMedia,
    getMediaIcon,
}: LibraryContentProps) {
    return (
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
            {/* Folder Tree Sidebar */}
            <div className="w-52 shrink-0 flex flex-col border-r pr-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">Folders</div>
                <ScrollArea className="flex-1">
                    {loadingFolders ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {/* All Files Option */}
                            <div
                                className={`
                                    flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors
                                    ${navigatedFolderId === null ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                                `}
                                onClick={onSelectAll}
                            >
                                <Folder className="size-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">All Files</span>
                            </div>
                            
                            {folders.map((folder) => (
                                <SimpleFolderNode
                                    key={folder.id}
                                    folder={folder}
                                    level={0}
                                    selectedFolderId={navigatedFolderId}
                                    onNavigate={onNavigate}
                                    onSelectFolder={onSelectFolder}
                                    expandedFolders={expandedFolders}
                                    onToggleExpand={onToggleExpand}
                                    allowFolderSelection={allowFolders}
                                    selectedForAttachment={selectedFolderForAttachment?.id || null}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Select Folder Button */}
                {allowFolders && selectedFolderForAttachment && (
                    <div className="pt-3 border-t mt-3">
                        <Button 
                            size="sm" 
                            className="w-full"
                            onClick={onConfirmFolderSelection}
                        >
                            <Folder className="size-4 mr-2" />
                            Select "{selectedFolderForAttachment.name}"
                        </Button>
                    </div>
                )}
            </div>

            {/* Media Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search and current folder */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search media..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                        in: <span className="font-medium text-foreground">{currentFolderName}</span>
                    </div>
                </div>

                {/* Media Items */}
                <ScrollArea className="flex-1">
                    {loadingMedia ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : mediaItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="size-12 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground">
                                {debouncedSearch ? 'No matching media found' : 'No media in this folder'}
                            </p>
                            {allowFolders && navigatedFolderId && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Double-click a folder in the sidebar to select it
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 p-1">
                            {mediaItems.map((media) => (
                                <button
                                    key={media._id}
                                    type="button"
                                    onClick={() => onSelectMedia(media)}
                                    className={`
                                        relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                                        hover:border-primary/50 group
                                        ${selectedId === media._id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}
                                    `}
                                >
                                    {media.media_type === 'image' ? (
                                        <ThumbnailImage
                                            thumbnailUrls={media.thumbnail_urls}
                                            fallbackUrl={media.url}
                                            alt={media.alt || media.original_filename}
                                            sizes="120px"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : media.media_type === 'document' && media.thumbnail_urls && Object.keys(media.thumbnail_urls).length > 0 ? (
                                        <ThumbnailImage
                                            thumbnailUrls={media.thumbnail_urls}
                                            alt={media.alt || media.original_filename}
                                            sizes="120px"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-1 p-2">
                                            {getMediaIcon(media.media_type)}
                                            <span className="text-xs text-muted-foreground truncate w-full text-center">
                                                {media.original_filename}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Hover overlay with filename */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-xs text-white truncate">
                                            {media.original_filename}
                                        </p>
                                    </div>

                                    {selectedId === media._id && (
                                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                            <Check className="size-3" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}

// Media Picker Dialog with Folder Tree and Search - exported for reuse
export interface MediaPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectMedia: (media: Media) => void;
    onSelectFolder?: (folder: MediaFolderTree) => void;
    selectedId?: string;
    allowedTypes?: ('image' | 'video' | 'audio' | 'document')[];
    allowFolders?: boolean;
    /** Show upload tab */
    showUpload?: boolean;
    /** Collection context for upload organization */
    collectionId?: string | null;
    /** Content context for upload organization */
    contentId?: string | null;
    /** Dialog title */
    title?: string;
    /** Dialog description */
    description?: string;
}

export function MediaPickerDialog({
    open,
    onOpenChange,
    onSelectMedia,
    onSelectFolder,
    selectedId,
    allowedTypes,
    allowFolders = false,
    showUpload = false,
    collectionId,
    contentId,
    title,
    description,
}: MediaPickerDialogProps) {
    const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
    const [folders, setFolders] = useState<MediaFolderTree[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [navigatedFolderId, setNavigatedFolderId] = useState<string | null>(null);
    const [selectedFolderForAttachment, setSelectedFolderForAttachment] = useState<MediaFolderTree | null>(null);
    const [mediaItems, setMediaItems] = useState<Media[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch folders
    const fetchFolders = useCallback(async () => {
        try {
            setLoadingFolders(true);
            const response = await fetch('/media-folders/tree', {
                headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                const foldersList: MediaFolderTree[] = data.folders || data;
                setFolders(foldersList);
                
                // Auto-expand root folders
                const initialExpanded = new Set<string>();
                foldersList.forEach((f: MediaFolderTree) => initialExpanded.add(f.id));
                setExpandedFolders(initialExpanded);
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        } finally {
            setLoadingFolders(false);
        }
    }, []);

    // Fetch media
    const fetchMedia = useCallback(async () => {
        try {
            setLoadingMedia(true);
            const params = new URLSearchParams();
            
            // Use 'folder' parameter as expected by the backend
            if (navigatedFolderId) {
                params.append('folder', navigatedFolderId);
            }
            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }
            if (allowedTypes && allowedTypes.length > 0 && allowedTypes.length < 4) {
                // Only add type filter if not all types are allowed
                allowedTypes.forEach(t => params.append('type', t));
            }
            
            const response = await fetch(`/media?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            if (response.ok) {
                const result = await response.json();
                setMediaItems(result.data || []);
            } else {
                setMediaItems([]);
            }
        } catch (error) {
            console.error('Failed to fetch media:', error);
            setMediaItems([]);
        } finally {
            setLoadingMedia(false);
        }
    }, [navigatedFolderId, debouncedSearch, allowedTypes]);

    // Load data when dialog opens
    useEffect(() => {
        if (open) {
            fetchFolders();
            setSearchQuery('');
            setNavigatedFolderId(null);
            setSelectedFolderForAttachment(null);
        }
    }, [open, fetchFolders]);

    // Fetch media when folder or search changes
    useEffect(() => {
        if (open) {
            fetchMedia();
        }
    }, [open, navigatedFolderId, debouncedSearch, fetchMedia]);

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

    const handleNavigateToFolder = (folderId: string | null) => {
        setNavigatedFolderId(folderId);
        // Also expand the folder
        if (folderId) {
            setExpandedFolders(prev => new Set([...prev, folderId]));
        }
        // Clear folder selection when navigating
        setSelectedFolderForAttachment(null);
    };

    const handleSelectFolderForAttachment = (folder: MediaFolderTree) => {
        setSelectedFolderForAttachment(folder);
    };

    const handleConfirmFolderSelection = () => {
        if (selectedFolderForAttachment && onSelectFolder) {
            onSelectFolder(selectedFolderForAttachment);
        }
    };

    const handleSelectAll = () => {
        setNavigatedFolderId(null);
        setSelectedFolderForAttachment(null);
    };

    // Find folder by ID in tree
    const findFolderById = (folderId: string, folderList: MediaFolderTree[]): MediaFolderTree | null => {
        for (const folder of folderList) {
            if (folder.id === folderId) return folder;
            if (folder.children) {
                const found = findFolderById(folderId, folder.children);
                if (found) return found;
            }
        }
        return null;
    };

    // Get current folder name
    const currentFolderName = navigatedFolderId 
        ? findFolderById(navigatedFolderId, folders)?.name || 'Folder'
        : 'All Files';

    const getMediaIcon = (mediaType: string) => {
        const Icon = mediaTypeIcons[mediaType] || FileText;
        return <Icon className="size-8 text-muted-foreground/50" />;
    };

    // Upload functions
    const getAcceptType = () => {
        if (allowedTypes && allowedTypes.length > 0) {
            return allowedTypes.map(t => {
                switch(t) {
                    case 'image': return 'image/*';
                    case 'video': return 'video/*';
                    case 'audio': return 'audio/*';
                    default: return '*/*';
                }
            }).join(',');
        }
        return '*/*';
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        setUploadError(null);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            if (collectionId) {
                formData.append('collection_id', collectionId);
            }
            if (contentId) {
                formData.append('content_id', contentId);
            }

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch('/media', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.data && result.data._id && result.data.url) {
                    onSelectMedia(result.data);
                } else {
                    setUploadError('Upload succeeded but received invalid response format');
                }
            } else {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    setUploadError(errorJson.message || `Upload failed: ${response.statusText}`);
                } catch {
                    setUploadError(`Upload failed: ${response.statusText}`);
                }
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
    };

    const dialogTitle = title || (allowFolders ? 'Select Media or Folder' : 'Select Media');
    const dialogDescription = description || (allowFolders 
        ? 'Choose a file or folder from your library. Double-click a folder to select it.'
        : 'Choose a file from your library');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>

                {showUpload ? (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'upload')} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="grid w-full grid-cols-2 shrink-0">
                            <TabsTrigger value="library" className="gap-2">
                                <FolderOpen className="size-4" />
                                Media Library
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="gap-2">
                                <Upload className="size-4" />
                                Upload New
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col mt-4">
                            <LibraryContent
                                loadingFolders={loadingFolders}
                                folders={folders}
                                navigatedFolderId={navigatedFolderId}
                                expandedFolders={expandedFolders}
                                selectedFolderForAttachment={selectedFolderForAttachment}
                                allowFolders={allowFolders}
                                mediaItems={mediaItems}
                                loadingMedia={loadingMedia}
                                searchQuery={searchQuery}
                                debouncedSearch={debouncedSearch}
                                currentFolderName={currentFolderName}
                                selectedId={selectedId}
                                onSelectAll={handleSelectAll}
                                onNavigate={handleNavigateToFolder}
                                onSelectFolder={handleSelectFolderForAttachment}
                                onToggleExpand={handleToggleExpand}
                                onConfirmFolderSelection={handleConfirmFolderSelection}
                                onSearchChange={setSearchQuery}
                                onSelectMedia={onSelectMedia}
                                getMediaIcon={getMediaIcon}
                            />
                        </TabsContent>

                        <TabsContent value="upload" className="flex-1 mt-4">
                            <div 
                                className={`
                                    border-2 border-dashed rounded-lg p-12 text-center transition-colors h-full flex flex-col items-center justify-center
                                    ${dragOver ? 'border-primary bg-primary/5' : uploadError ? 'border-destructive/50' : 'border-muted-foreground/25'}
                                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                                `}
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                            >
                                <input
                                    type="file"
                                    accept={getAcceptType()}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="media-picker-upload-input"
                                    disabled={uploading}
                                />
                                <label 
                                    htmlFor="media-picker-upload-input" 
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    {uploading ? (
                                        <Loader2 className="size-12 text-primary animate-spin mb-4" />
                                    ) : (
                                        <Upload className="size-12 text-muted-foreground/50 mb-4" />
                                    )}
                                    <span className="text-lg font-medium mb-1">
                                        {uploading ? 'Uploading...' : 'Drop file here'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        or <span className="text-primary hover:underline">browse</span> to select
                                    </span>
                                </label>
                            </div>
                            {uploadError && (
                                <p className="text-sm text-destructive text-center mt-2">{uploadError}</p>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                    <LibraryContent
                        loadingFolders={loadingFolders}
                        folders={folders}
                        navigatedFolderId={navigatedFolderId}
                        expandedFolders={expandedFolders}
                        selectedFolderForAttachment={selectedFolderForAttachment}
                        allowFolders={allowFolders}
                        mediaItems={mediaItems}
                        loadingMedia={loadingMedia}
                        searchQuery={searchQuery}
                        debouncedSearch={debouncedSearch}
                        currentFolderName={currentFolderName}
                        selectedId={selectedId}
                        onSelectAll={handleSelectAll}
                        onNavigate={handleNavigateToFolder}
                        onSelectFolder={handleSelectFolderForAttachment}
                        onToggleExpand={handleToggleExpand}
                        onConfirmFolderSelection={handleConfirmFolderSelection}
                        onSearchChange={setSearchQuery}
                        onSelectMedia={onSelectMedia}
                        getMediaIcon={getMediaIcon}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
