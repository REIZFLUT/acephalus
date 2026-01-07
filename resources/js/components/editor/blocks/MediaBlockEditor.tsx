import { useState, useEffect, useCallback } from 'react';
import type { MediaElementData, Media } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    Image, 
    Upload, 
    X, 
    Film, 
    Music, 
    FileText, 
    PenTool, 
    ChevronDown,
    Folder,
    RefreshCw,
    Eye,
} from 'lucide-react';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../SchemaContext';
import { MetaFieldsEditor } from '../MetaFieldsEditor';
import { ThumbnailImage } from '@/components/ui/thumbnail-image';
import { DocumentPreview, isDocumentMimeType } from '@/components/media/DocumentPreview';
import { MediaPickerDialog } from '../MediaPickerInput';

const mediaTypeLabels: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    document: 'Document',
    canvas: 'Canvas',
};

const mediaTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    image: Image,
    video: Film,
    audio: Music,
    document: FileText,
    canvas: PenTool,
};

export default function MediaBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { getMediaTypes, schema, collectionId, contentId } = useSchema();
    const allowedMediaTypes = getMediaTypes();
    
    const mediaData = block.data as MediaElementData;
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [showMetadata, setShowMetadata] = useState(false);
    const [folderItems, setFolderItems] = useState<Media[]>([]);
    const [loadingFolderItems, setLoadingFolderItems] = useState(false);
    
    const currentType = mediaData.media_type || allowedMediaTypes[0] || 'image';

    // Fetch folder items when folder_id changes
    const fetchFolderItems = useCallback(async () => {
        if (!mediaData.folder_id) {
            setFolderItems([]);
            return;
        }
        
        setLoadingFolderItems(true);
        try {
            const params = new URLSearchParams();
            params.append('folder', mediaData.folder_id);
            params.append('type', currentType);
            params.append('per_page', '25');
            
            const response = await fetch(`/media?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            if (response.ok) {
                const result = await response.json();
                setFolderItems(result.data || []);
            } else {
                setFolderItems([]);
            }
        } catch (error) {
            console.error('Failed to fetch folder items:', error);
            setFolderItems([]);
        } finally {
            setLoadingFolderItems(false);
        }
    }, [mediaData.folder_id, currentType]);

    useEffect(() => {
        fetchFolderItems();
    }, [fetchFolderItems]);
    
    // Get custom fields for media element from schema
    const customFields = schema?.element_meta_fields?.media;
    const hasCustomFields = Array.isArray(customFields) && customFields.length > 0;

    // Check if there's any metadata filled (standard or custom)
    const hasStandardMetadata = Boolean(mediaData.alt || mediaData.caption);
    const hasCustomMetadata = hasCustomFields && customFields.some(field => 
        mediaData[field.name as keyof MediaElementData] !== undefined && 
        mediaData[field.name as keyof MediaElementData] !== null && 
        mediaData[field.name as keyof MediaElementData] !== ''
    );
    const hasMetadata = hasCustomFields ? hasCustomMetadata : hasStandardMetadata;
    
    // If current type is not allowed, switch to the first allowed type
    useEffect(() => {
        if (!allowedMediaTypes.includes(currentType as any)) {
            onUpdate({ ...mediaData, media_type: allowedMediaTypes[0] as any });
        }
    }, [allowedMediaTypes, currentType, mediaData, onUpdate]);
    
    const handleChange = (updates: Partial<MediaElementData>) => {
        onUpdate({ ...mediaData, ...updates });
    };

    const MediaIcon = mediaTypeIcons[currentType] || Image;

    // Show type selector only if there are multiple options
    const showTypeSelector = allowedMediaTypes.length > 1;

    return (
        <div className="space-y-4">
            {/* Media Type Selection */}
            {showTypeSelector && (
                <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground shrink-0">Type</Label>
                    <Select
                        value={currentType}
                        onValueChange={(value) => handleChange({ 
                            media_type: value as MediaElementData['media_type'] 
                        })}
                    >
                        <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {allowedMediaTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {mediaTypeLabels[type] || type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {!showTypeSelector && (
                <p className="text-xs text-muted-foreground">
                    Type: {mediaTypeLabels[currentType] || currentType}
                </p>
            )}

            {/* Media Preview / Upload */}
            <div className="border-2 border-dashed rounded-lg p-4">
                {mediaData.folder_id ? (
                    // Folder selected - show folder badge and item previews
                    <div className="space-y-3">
                        {/* Folder Badge - clickable to change */}
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setIsPickerOpen(true)}
                                className="group"
                            >
                                <Badge 
                                    variant="secondary" 
                                    className="gap-1.5 hover:bg-secondary/80 cursor-pointer transition-colors"
                                >
                                    <Folder className="size-3" />
                                    {mediaData.folder_path || 'Selected folder'}
                                    <RefreshCw className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Badge>
                            </button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleChange({ 
                                    folder_id: undefined,
                                    folder_path: undefined 
                                })}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        {/* Folder Items Preview */}
                        {loadingFolderItems ? (
                            <div className="flex items-center justify-center py-6">
                                <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : folderItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                <Folder className="size-10 mb-2 opacity-50" />
                                <p className="text-sm">No {mediaTypeLabels[currentType]?.toLowerCase() || 'items'} in this folder</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-1.5">
                                {folderItems.slice(0, 25).map((item) => (
                                    <div 
                                        key={item._id}
                                        className="aspect-square rounded overflow-hidden bg-muted flex items-center justify-center"
                                        title={item.original_filename}
                                    >
                                        {currentType === 'image' && item.thumbnail_urls?.small ? (
                                            <ThumbnailImage
                                                thumbnailUrls={item.thumbnail_urls}
                                                fallbackUrl={item.url}
                                                alt={item.alt || item.original_filename}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <MediaIcon className="size-6 text-muted-foreground/50" />
                                        )}
                                    </div>
                                ))}
                                {folderItems.length > 25 && (
                                    <div className="aspect-square rounded bg-muted/50 flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">+{folderItems.length - 25}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : mediaData.file_id && mediaData.url ? (
                    // File selected
                    <div className="relative">
                        {currentType === 'image' ? (
                            <img 
                                src={mediaData.url} 
                                alt={mediaData.alt || ''} 
                                className="max-h-48 mx-auto rounded object-contain"
                            />
                        ) : currentType === 'video' ? (
                            <video 
                                src={mediaData.url}
                                className="max-h-48 mx-auto rounded"
                                controls
                            />
                        ) : currentType === 'audio' ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <Music className="size-12 text-muted-foreground/50" />
                                <audio src={mediaData.url} controls className="w-full max-w-md" />
                            </div>
                        ) : currentType === 'document' ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-3">
                                <FileText className="size-12 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground text-center max-w-[200px] truncate">
                                    {mediaData.url?.split('/').pop() || 'Document'}
                                </p>
                                {mediaData.mime_type && isDocumentMimeType(mediaData.mime_type) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsPreviewOpen(true)}
                                    >
                                        <Eye className="size-4 mr-2" />
                                        Preview
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <MediaIcon className="size-16 text-muted-foreground/50" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="size-7"
                                onClick={() => setIsPickerOpen(true)}
                            >
                                <RefreshCw className="size-3" />
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="size-7"
                                onClick={() => handleChange({ 
                                    file_id: null,
                                    url: undefined 
                                })}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Nothing selected
                    <button 
                        type="button"
                        onClick={() => setIsPickerOpen(true)}
                        className="w-full flex flex-col items-center justify-center py-8 hover:bg-muted/50 rounded transition-colors"
                    >
                        <Upload className="size-10 text-muted-foreground/50 mb-2" />
                        <span className="text-sm text-muted-foreground">
                            Click to select media or folder
                        </span>
                    </button>
                )}
            </div>

            {/* Media Picker Dialog */}
            <MediaPickerDialog
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                onSelectMedia={(media) => {
                    handleChange({
                        file_id: media._id,
                        url: media.url,
                        mime_type: media.mime_type,
                        folder_id: undefined,
                        folder_path: undefined,
                    });
                    setIsPickerOpen(false);
                }}
                onSelectFolder={(folder) => {
                    handleChange({
                        file_id: null,
                        url: undefined,
                        mime_type: undefined,
                        folder_id: folder.id,
                        folder_path: folder.path,
                    });
                    setIsPickerOpen(false);
                }}
                allowedTypes={currentType !== 'canvas' ? [currentType as 'image' | 'video' | 'audio' | 'document'] : undefined}
                allowFolders={true}
                showUpload={true}
                collectionId={collectionId}
                contentId={contentId}
                title={`Select ${mediaTypeLabels[currentType] || 'Media'}`}
                description="Choose from your media library or upload a new file"
            />

            {/* Document Preview Modal */}
            {currentType === 'document' && mediaData.url && mediaData.mime_type && isDocumentMimeType(mediaData.mime_type) && (
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Document Preview</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 min-h-0 overflow-auto">
                            <DocumentPreview
                                url={mediaData.url}
                                mimeType={mediaData.mime_type}
                                className="w-full h-full min-h-[60vh]"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Metadata (Custom or Standard) */}
            {mediaData.file_id && (
                <Collapsible open={showMetadata || hasMetadata} onOpenChange={setShowMetadata}>
                    <CollapsibleTrigger asChild>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-between text-muted-foreground hover:text-foreground"
                        >
                            <span className="text-xs">
                                {hasMetadata ? 'Edit metadata' : 'Add metadata'}
                            </span>
                            <ChevronDown className={`size-4 transition-transform ${showMetadata || hasMetadata ? 'rotate-180' : ''}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                        {hasCustomFields ? (
                            <MetaFieldsEditor 
                                fields={customFields} 
                                data={mediaData} 
                                onChange={handleChange} 
                            />
                        ) : (
                            currentType === 'image' && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="alt" className="text-xs">Alt Text</Label>
                                        <Input
                                            id="alt"
                                            value={mediaData.alt || ''}
                                            onChange={(e) => handleChange({ alt: e.target.value })}
                                            placeholder="Describe the image for accessibility..."
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="caption" className="text-xs">Caption</Label>
                                        <Input
                                            id="caption"
                                            value={mediaData.caption || ''}
                                            onChange={(e) => handleChange({ caption: e.target.value })}
                                            placeholder="Optional visible caption..."
                                            className="h-8"
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    );
}

