import { useState, useEffect, useCallback } from 'react';
import type { MediaElementData, Media } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
    Image, 
    Upload, 
    X, 
    Film, 
    Music, 
    FileText, 
    PenTool, 
    ChevronDown,
    FolderOpen,
    Loader2,
    Check,
    RefreshCw,
    Search,
} from 'lucide-react';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../SchemaContext';
import { MetaFieldsEditor } from '../MetaFieldsEditor';
import { ThumbnailImage } from '@/components/ui/thumbnail-image';
import { DocumentPreview, isDocumentMimeType } from '@/components/media/DocumentPreview';

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
    const [showMetadata, setShowMetadata] = useState(false);
    
    const currentType = mediaData.media_type || allowedMediaTypes[0] || 'image';
    
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
                {mediaData.file_id && mediaData.url ? (
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
                        ) : currentType === 'document' && mediaData.mime_type && isDocumentMimeType(mediaData.mime_type) ? (
                            <div className="min-h-[200px] max-h-[300px] w-full">
                                <DocumentPreview
                                    url={mediaData.url}
                                    mimeType={mediaData.mime_type}
                                    className="w-full h-full"
                                />
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
                    <button 
                        type="button"
                        onClick={() => setIsPickerOpen(true)}
                        className="w-full flex flex-col items-center justify-center py-8 hover:bg-muted/50 rounded transition-colors"
                    >
                        <Upload className="size-10 text-muted-foreground/50 mb-2" />
                        <span className="text-sm text-muted-foreground">
                            Click to select media
                        </span>
                    </button>
                )}
            </div>

            {/* Media Picker Dialog */}
            <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Select {mediaTypeLabels[currentType] || 'Media'}</DialogTitle>
                        <DialogDescription>
                            Choose from your media library or upload a new file
                        </DialogDescription>
                    </DialogHeader>
                    <MediaPicker 
                        type={currentType}
                        collectionId={collectionId}
                        contentId={contentId}
                        onSelect={(media) => {
                            handleChange({
                                file_id: media._id,
                                url: media.url,
                                mime_type: media.mime_type,
                            });
                            setIsPickerOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

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

// Media Picker with Library and Upload tabs
function MediaPicker({ 
    type, 
    collectionId,
    contentId,
    onSelect 
}: { 
    type?: string; 
    collectionId?: string | null;
    contentId?: string | null;
    onSelect: (media: Media) => void;
}) {
    const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
    const [mediaItems, setMediaItems] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch media from library
    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (type && type !== 'canvas') {
                params.append('type', type);
            }
            if (debouncedSearch) {
                params.append('search', debouncedSearch);
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
                console.error('Failed to fetch media:', response.status, response.statusText);
                setMediaItems([]);
            }
        } catch (error) {
            console.error('Failed to fetch media:', error);
            setMediaItems([]);
        } finally {
            setLoading(false);
        }
    }, [type, debouncedSearch]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const getAcceptType = () => {
        switch (type) {
            case 'image': return 'image/*';
            case 'video': return 'video/*';
            case 'audio': return 'audio/*';
            case 'canvas': return 'image/*';
            default: return '*/*';
        }
    };

    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleUpload = async (file: File) => {
        setUploading(true);
        setUploadError(null);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Pass collection and content context for automatic folder organization
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
                    onSelect(result.data);
                } else {
                    console.error('Invalid response format:', result);
                    setUploadError('Upload succeeded but received invalid response format');
                }
            } else {
                const errorText = await response.text();
                console.error('Upload failed:', response.status, response.statusText, errorText);
                
                // Try to parse JSON error
                try {
                    const errorJson = JSON.parse(errorText);
                    setUploadError(errorJson.message || `Upload failed: ${response.statusText}`);
                } catch {
                    setUploadError(`Upload failed: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleSelect = () => {
        const selected = mediaItems.find(m => m._id === selectedId);
        if (selected) {
            onSelect(selected);
        }
    };

    const getMediaIcon = (mediaType: string) => {
        const Icon = mediaTypeIcons[mediaType] || FileText;
        return <Icon className="size-8 text-muted-foreground/50" />;
    };

    return (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'upload')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
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
                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search media by filename..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                ) : mediaItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <FolderOpen className="size-16 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground mb-2">
                            {debouncedSearch ? 'No matching media found' : 'No media found'}
                        </p>
                        <p className="text-sm text-muted-foreground/70 mb-4">
                            {debouncedSearch 
                                ? 'Try a different search term or upload a new file'
                                : `Upload your first ${type || 'file'} to get started`
                            }
                        </p>
                        <Button type="button" variant="outline" onClick={() => setActiveTab('upload')}>
                            <Upload className="size-4 mr-2" />
                            Upload
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-1">
                                {mediaItems.map((media) => (
                                    <button
                                        key={media._id}
                                        type="button"
                                        onClick={() => setSelectedId(media._id)}
                                        onDoubleClick={() => onSelect(media)}
                                        className={`
                                            relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                                            hover:border-primary/50
                                            ${selectedId === media._id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}
                                        `}
                                    >
                                        {media.media_type === 'image' ? (
                                            <ThumbnailImage
                                                thumbnailUrls={media.thumbnail_urls}
                                                fallbackUrl={media.url}
                                                alt={media.alt || media.original_filename}
                                                sizes="(min-width: 640px) 80px, 60px"
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
                                        {selectedId === media._id && (
                                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                                <Check className="size-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t mt-4">
                            <p className="text-sm text-muted-foreground">
                                {selectedId ? 'Double-click or press Select' : `${mediaItems.length} items`}
                            </p>
                            <Button
                                type="button"
                                onClick={handleSelect}
                                disabled={!selectedId}
                            >
                                Select
                            </Button>
                        </div>
                    </>
                )}
            </TabsContent>

            <TabsContent value="upload" className="flex-1 mt-4">
                <div 
                    className={`
                        border-2 border-dashed rounded-lg p-12 text-center transition-colors
                        ${dragOver ? 'border-primary bg-primary/5' : uploadError ? 'border-destructive/50' : 'border-muted-foreground/25'}
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        type="file"
                        accept={getAcceptType()}
                        onChange={handleFileChange}
                        className="hidden"
                        id="media-upload-input"
                        disabled={uploading}
                    />
                    <label 
                        htmlFor="media-upload-input" 
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
                    <p className="text-sm text-destructive text-center mt-2">
                        {uploadError}
                    </p>
                )}
                <p className="text-xs text-muted-foreground text-center mt-4">
                    Supported formats: {type === 'image' ? 'JPG, PNG, GIF, WebP, SVG' : 
                                        type === 'video' ? 'MP4, WebM, MOV' :
                                        type === 'audio' ? 'MP3, WAV, OGG' : 'All file types'}
                </p>
            </TabsContent>
        </Tabs>
    );
}
