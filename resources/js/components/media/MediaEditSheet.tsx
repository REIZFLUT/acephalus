import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Download,
    Loader2,
    X,
    ChevronRight,
    Folder,
    Eye,
} from 'lucide-react';
import { FolderSelectDialog } from '@/components/media/FolderSelectDialog';
import { FocusAreaSelector, type FocusArea } from '@/components/media/FocusAreaSelector';
import { DocumentPreview, isDocumentMimeType, getDocumentTypeLabel } from '@/components/media/DocumentPreview';
import type { Media, MediaMetaField } from '@/types';
import { formatDateTime } from '@/utils/date';
import { getFileIcon, formatFileSize } from '@/utils/media';

export interface FolderSelection {
    id: string;
    path: string;
}

interface MediaEditSheetProps {
    item: Media | null;
    metaFields: MediaMetaField[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: () => void;
}

export function MediaEditSheet({
    item,
    metaFields,
    open,
    onOpenChange,
    onSave,
}: MediaEditSheetProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [focusArea, setFocusArea] = useState<FocusArea | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [folderSelection, setFolderSelection] = useState<FolderSelection | null>(null);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);

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
            setDocumentPreviewOpen(false);
            if (item.folder_id && item.folder_path) {
                setFolderSelection({ id: item.folder_id, path: item.folder_path });
            } else {
                setFolderSelection(null);
            }
        }
    }, [item]);

    if (!item) return null;

    const isImage = item.mime_type.startsWith('image/');
    const isDocument = isDocumentMimeType(item.mime_type);

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

    const Icon = getFileIcon(item.mime_type);

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
                    <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center aspect-video">
                        {isImage && item.url ? (
                            <img
                                src={item.url}
                                alt={item.original_filename}
                                className="w-full h-full object-contain"
                            />
                        ) : isDocument && item.url ? (
                            <div className="flex flex-col items-center gap-4 p-6">
                                <Icon className="size-16 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="text-sm font-medium">{getDocumentTypeLabel(item.mime_type) || 'Dokument'}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{item.original_filename}</p>
                                </div>
                                <Button variant="secondary" onClick={() => setDocumentPreviewOpen(true)}>
                                    <Eye className="size-4 mr-2" />
                                    Preview
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Icon className="size-16 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">{item.mime_type}</p>
                            </div>
                        )}
                    </div>

                    {/* Document Preview Modal */}
                    {isDocument && item.url && (
                        <Dialog open={documentPreviewOpen} onOpenChange={setDocumentPreviewOpen}>
                            <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
                                <DialogHeader className="px-6 py-4 border-b shrink-0">
                                    <DialogTitle className="flex items-center gap-2">
                                        <Icon className="size-5" />
                                        {item.original_filename}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {getDocumentTypeLabel(item.mime_type)} • {formatFileSize(item.size)}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-hidden">
                                    <DocumentPreview
                                        url={item.url}
                                        mimeType={item.mime_type}
                                        filename={item.original_filename}
                                        className="w-full h-full"
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

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
