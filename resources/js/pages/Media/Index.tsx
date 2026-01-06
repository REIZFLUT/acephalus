import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
    DialogTrigger,
    DialogFooter,
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Upload,
    Search,
    Image as ImageIcon,
    File,
    Video,
    Music,
    FileText,
    Trash2,
    Download,
    Loader2,
    X,
    Pencil,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    Folder,
    FolderOpen,
    ArrowUp,
} from 'lucide-react';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { FolderTree } from '@/components/media/FolderTree';
import { FolderSelectDialog } from '@/components/media/FolderSelectDialog';
import { FocusAreaSelector, type FocusArea } from '@/components/media/FocusAreaSelector';
import { MediaDataTable } from '@/components/data-table';
import { ThumbnailImage } from '@/components/ui/thumbnail-image';
import type { PageProps, Media, PaginatedData, MediaMetaField } from '@/types';
import { formatDateTime } from '@/utils/date';

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
}

interface MediaIndexProps extends PageProps {
    media: PaginatedData<Media>;
    filters: {
        search: string | null;
        type: string | null;
        folder: string | null;
    };
    metaFields?: MediaMetaField[];
    subfolders?: Subfolder[];
    currentFolder?: CurrentFolder | null;
    isGlobalSearch?: boolean;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.startsWith('text/') || mimeType.includes('pdf')) return FileText;
    return File;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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

    return (
        <Card className="group overflow-hidden">
            <div className="aspect-square relative bg-muted flex items-center justify-center">
                {isImage && (item.thumbnail_urls || item.url) ? (
                    <ThumbnailImage
                        thumbnailUrls={item.thumbnail_urls}
                        fallbackUrl={item.url}
                        alt={item.original_filename}
                        sizes="(min-width: 1280px) 200px, (min-width: 768px) 180px, 150px"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Icon className="size-12 text-muted-foreground" />
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
                    {formatFileSize(item.size)}
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
            className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
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

function FolderListItem({ 
    folder, 
    onNavigate,
}: { 
    folder: Subfolder; 
    onNavigate: (folderId: string) => void;
}) {
    return (
        <Card 
            className="group cursor-pointer hover:border-primary/50 transition-colors"
            onDoubleClick={() => onNavigate(folder.id)}
        >
            <div className="flex items-center gap-4 p-3">
                {/* Folder Icon */}
                <div className="size-14 shrink-0 rounded-md bg-muted flex items-center justify-center">
                    <Folder className="size-8 text-amber-500" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={folder.name}>
                        {folder.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {folder.children_count > 0 && `${folder.children_count} folders`}
                        {folder.children_count > 0 && folder.media_count > 0 && ', '}
                        {folder.media_count > 0 && `${folder.media_count} files`}
                        {folder.children_count === 0 && folder.media_count === 0 && 'Empty'}
                    </p>
                </div>

                {/* Navigate hint */}
                <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Double-click to open
                </div>
            </div>
        </Card>
    );
}

interface FolderSelection {
    id: string;
    path: string;
}

function MediaEditSheet({
    item,
    metaFields,
    open,
    onOpenChange,
    onSave,
}: {
    item: Media | null;
    metaFields: MediaMetaField[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [focusArea, setFocusArea] = useState<FocusArea | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [folderSelection, setFolderSelection] = useState<FolderSelection | null>(null);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);

    useEffect(() => {
        if (item) {
            const metadata = item.metadata || {};
            setFormData({
                alt: item.alt || '',
                caption: item.caption || '',
                ...metadata,
            });
            setFocusArea((metadata.focus_area as FocusArea) || null);
            setTags(item.tags || []);
            setTagInput('');
            // Initialize folder selection from item data
            if (item.folder_id && item.folder_path) {
                setFolderSelection({ id: item.folder_id, path: item.folder_path });
            } else {
                setFolderSelection(null);
            }
        }
    }, [item]);

    if (!item) return null;

    const isImage = item.mime_type.startsWith('image/');

    const handleAddTag = () => {
        const newTag = tagInput.trim().toLowerCase();
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        } else if (e.key === ',' || e.key === ' ') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Extract custom metadata fields (exclude alt and caption which are top-level)
            const { alt, caption, ...customMetadata } = formData;
            
            const updateData: Record<string, unknown> = {
                alt: alt as string,
                caption: caption as string,
                tags: tags,
                folder_id: folderSelection?.id || null,
                metadata: {
                    ...customMetadata,
                },
            };

            if (isImage && focusArea) {
                updateData.metadata = {
                    ...(updateData.metadata as Record<string, unknown>),
                    focus_area: focusArea,
                };
            }

            const response = await fetch(`/media/${item._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                onSave();
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (slug: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [slug]: value }));
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto p-0">
                <div className="px-6 pt-6">
                    <SheetHeader>
                        <SheetTitle>Edit Media</SheetTitle>
                        <SheetDescription>
                            {item.original_filename}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Preview */}
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {isImage && item.url ? (
                            <img
                                src={item.url}
                                alt={item.original_filename}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                {(() => {
                                    const Icon = getFileIcon(item.mime_type);
                                    return <Icon className="size-16 text-muted-foreground" />;
                                })()}
                                <p className="text-sm text-muted-foreground">{item.mime_type}</p>
                            </div>
                        )}
                    </div>

                    {/* File Info */}
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>Size: {formatFileSize(item.size)}</p>
                        <p>Uploaded: {formatDateTime(item.created_at)}</p>
                        {item.url && (
                            <Button variant="outline" size="sm" asChild className="mt-2">
                                <a href={item.url} download={item.original_filename}>
                                    <Download className="size-4 mr-2" />
                                    Download
                                </a>
                            </Button>
                        )}
                    </div>

                    <Separator />

                    {/* Standard Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="alt">Alt Text</Label>
                            <Input
                                id="alt"
                                value={(formData.alt as string) || ''}
                                onChange={(e) => handleFieldChange('alt', e.target.value)}
                                placeholder="Describe the image for accessibility..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="caption">Caption</Label>
                            <Input
                                id="caption"
                                value={(formData.caption as string) || ''}
                                onChange={(e) => handleFieldChange('caption', e.target.value)}
                                placeholder="Optional visible caption..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags / Keywords</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagInputKeyDown}
                                    placeholder="Add tag and press Enter..."
                                    className="flex-1"
                                />
                                <Button type="button" variant="secondary" size="sm" onClick={handleAddTag}>
                                    Add
                                </Button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Press Enter, Space, or Comma to add a tag. Tags help with searching.
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Folder Location */}
                    <div className="space-y-2">
                        <Label>Folder</Label>
                        <button
                            type="button"
                            onClick={() => setFolderDialogOpen(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors text-left"
                        >
                            <Folder className="size-4 text-muted-foreground shrink-0" />
                            {folderSelection ? (
                                <span className="truncate">{folderSelection.path}</span>
                            ) : (
                                <span className="text-muted-foreground">No folder selected</span>
                            )}
                            <ChevronRight className="size-4 text-muted-foreground ml-auto shrink-0" />
                        </button>
                        <p className="text-xs text-muted-foreground">
                            Click to move this file to a different folder.
                        </p>
                    </div>

                    <FolderSelectDialog
                        open={folderDialogOpen}
                        onOpenChange={setFolderDialogOpen}
                        selectedFolderId={folderSelection?.id || null}
                        onSelect={setFolderSelection}
                    />

                    {/* Custom Meta Fields */}
                    {metaFields.filter(f => !f.is_system).length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Additional Metadata</h4>
                                {metaFields.filter(f => !f.is_system).map((field) => (
                                    <div key={field.slug} className="space-y-2">
                                        <Label htmlFor={field.slug}>
                                            {field.name}
                                            {field.required && <span className="text-destructive ml-1">*</span>}
                                        </Label>
                                        {field.field_type === 'textarea' ? (
                                            <Textarea
                                                id={field.slug}
                                                value={(formData[field.slug] as string) || ''}
                                                onChange={(e) => handleFieldChange(field.slug, e.target.value)}
                                                placeholder={field.placeholder || ''}
                                                rows={3}
                                            />
                                        ) : field.field_type === 'select' && field.options ? (
                                            <Select
                                                value={(formData[field.slug] as string) || ''}
                                                onValueChange={(value) => handleFieldChange(field.slug, value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={field.placeholder || 'Select...'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.options.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                id={field.slug}
                                                type={field.field_type === 'number' ? 'number' : 
                                                      field.field_type === 'email' ? 'email' :
                                                      field.field_type === 'url' ? 'url' :
                                                      field.field_type === 'date' ? 'date' : 'text'}
                                                value={(formData[field.slug] as string) || ''}
                                                onChange={(e) => handleFieldChange(field.slug, e.target.value)}
                                                placeholder={field.placeholder || ''}
                                            />
                                        )}
                                        {field.description && (
                                            <p className="text-xs text-muted-foreground">{field.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Focus Area Selector (only for images) */}
                    {isImage && item.url && (
                        <>
                            <Separator />
                            <FocusAreaSelector
                                imageUrl={item.url}
                                focusArea={focusArea}
                                onChange={setFocusArea}
                            />
                        </>
                    )}

                    {/* Save Button */}
                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-background pb-6">
                        <Button onClick={handleSave} disabled={saving} className="flex-1">
                            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
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

    const { data, setData, post, processing, reset, errors } = useForm<{ file: File | null; folder_id: string | null }>({
        file: null,
        folder_id: null,
    });

    // Fetch global folder on mount for default upload location
    useEffect(() => {
        fetch('/media-folders/global-root', {
            headers: { 'Accept': 'application/json' },
        })
            .then(res => res.json())
            .then(folder => {
                if (folder && folder._id) {
                    const folderId = folder._id;
                    setGlobalFolderId(folderId);
                    setUploadFolderSelection({ id: folderId, path: 'Global' });
                    setData('folder_id', folderId);
                }
            })
            .catch(console.error);
    }, []);

    // Keep form folder_id in sync with upload folder selection
    useEffect(() => {
        setData('folder_id', uploadFolderSelection?.id || globalFolderId);
    }, [uploadFolderSelection, globalFolderId]);

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
            <div className="flex h-[calc(100vh-4rem)] -ml-6 -mt-6 -mr-6 -mb-6">
                {/* Sidebar with Folder Tree - docked to the left edge */}
                <div className={`
                    shrink-0 border-r bg-muted/30 transition-all duration-200
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
                <div className="flex-1 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1">
                        <div className="p-6">
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
                        </div>
                    )}

                    {/* Content Grid - Folders and Files */}
                    <div>
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
                                        <Button onClick={() => setUploadDialogOpen(true)}>
                                            <Upload className="size-4 mr-2" />
                                            Upload file
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {viewMode === 'grid' ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                                        {/* Pagination for Grid View */}
                                        {media.last_page > 1 && (
                                            <div className="flex justify-center gap-2 mt-6 pb-4">
                                                {Array.from({ length: media.last_page }, (_, i) => i + 1).map((page) => (
                                                    <Button
                                                        key={page}
                                                        variant={page === media.current_page ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => router.get('/media', { 
                                                            page, 
                                                            search: search || undefined, 
                                                            type: type !== 'all' ? type : undefined,
                                                            folder: selectedFolderId || undefined,
                                                        })}
                                                    >
                                                        {page}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Subfolders in List View */}
                                        {subfolders.length > 0 && (
                                            <div className="space-y-2">
                                                {subfolders.map((folder) => (
                                                    <FolderListItem 
                                                        key={folder.id} 
                                                        folder={folder} 
                                                        onNavigate={handleFolderChange}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Media Files DataTable */}
                                        {media.data.length > 0 && (
                                            <MediaDataTable
                                                media={media.data}
                                                metaFields={metaFields}
                                                onEdit={setEditingItem}
                                                onDelete={handleDelete}
                                            />
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                        </div>
                    </ScrollArea>
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
        </AppLayout>
    );
}
