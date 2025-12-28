import { useState, FormEvent, ChangeEvent } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    Image as ImageIcon,
    File,
    Video,
    Music,
    FileText,
    Trash2,
    Download,
    Eye,
    Loader2,
    X,
} from 'lucide-react';
import type { PageProps, Media, PaginatedData } from '@/types';
import { formatDateTime } from '@/utils/date';

interface MediaIndexProps extends PageProps {
    media: PaginatedData<Media>;
    filters: {
        search: string | null;
        type: string | null;
    };
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

function MediaCard({ item, onDelete }: { item: Media; onDelete: (item: Media) => void }) {
    const Icon = getFileIcon(item.mime_type);
    const isImage = item.mime_type.startsWith('image/');

    return (
        <Card className="group overflow-hidden">
            <div className="aspect-square relative bg-muted flex items-center justify-center">
                {isImage && item.url ? (
                    <img
                        src={item.url}
                        alt={item.original_filename}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Icon className="size-12 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="secondary">
                                <Eye className="size-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>{item.original_filename}</DialogTitle>
                                <DialogDescription>
                                    {item.mime_type} • {formatFileSize(item.size)}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                                {isImage && item.url ? (
                                    <img
                                        src={item.url}
                                        alt={item.original_filename}
                                        className="w-full max-h-[60vh] object-contain rounded-lg"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 bg-muted rounded-lg">
                                        <Icon className="size-24 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">{item.mime_type}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Uploaded: {formatDateTime(item.created_at)}
                                </div>
                                {item.url && (
                                    <Button variant="outline" asChild>
                                        <a href={item.url} download={item.original_filename}>
                                            <Download className="size-4 mr-2" />
                                            Download
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
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

export default function MediaIndex({ media, filters }: MediaIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || 'all');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm<{ file: File | null }>({
        file: null,
    });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/media', {
            search: search || undefined,
            type: type !== 'all' ? type : undefined,
        }, { preserveState: true });
    };

    const handleTypeChange = (newType: string) => {
        setType(newType);
        router.get('/media', {
            search: search || undefined,
            type: newType !== 'all' ? newType : undefined,
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
            },
        });
    };

    const handleDelete = (item: Media) => {
        router.delete(`/media/${item._id}`);
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
                            <div className="flex justify-end gap-2">
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
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            }
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your uploaded files and images
                    </p>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">Search</Button>
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
                </div>

                {/* Media Grid */}
                {media.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <ImageIcon className="size-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No files yet</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                Upload your first file to get started with the media library.
                            </p>
                            <Button onClick={() => setUploadDialogOpen(true)}>
                                <Upload className="size-4 mr-2" />
                                Upload your first file
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {media.data.map((item) => (
                                <MediaCard key={item._id} item={item} onDelete={handleDelete} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {media.last_page > 1 && (
                            <div className="flex justify-center gap-2">
                                {Array.from({ length: media.last_page }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === media.current_page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => router.get('/media', { page, search, type: type !== 'all' ? type : undefined })}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

