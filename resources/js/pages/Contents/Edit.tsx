import { FormEvent, useCallback, useMemo, useState } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    Loader2,
    ArrowLeft,
    Save,
    Send,
    Archive,
    Trash2,
    RotateCcw,
    Clock,
    Eye,
    ChevronsUpDown,
    ChevronsDownUp,
    Plus,
    Minus,
    Pencil,
    User,
    Copy,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { PageProps, Content, ContentVersion, BlockElement, ElementType, CollectionSchema, WrapperPurpose, Edition, VersionDiffSummary } from '@/types';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { MetadataEditor } from '@/components/editor/MetadataEditor';
import { MetaFieldInput } from '@/components/editor/MetaFieldInput';
import { EditionSelector } from '@/components/editor/EditionSelector';
import { EditionPreviewFilter, getHiddenElementIds, isContentVisibleForEdition } from '@/components/editor/EditionPreviewFilter';
import { VersionPreviewModal } from '@/components/versions/VersionPreviewModal';
import { formatDate, formatDateTime } from '@/utils/date';

interface ContentsEditProps extends PageProps {
    content: Content & { 
        collection: { 
            name: string; 
            slug: string;
            schema?: CollectionSchema | null;
        }; 
        versions: ContentVersion[] 
    };
    elementTypes: Array<{ value: string; label: string }>;
    wrapperPurposes: WrapperPurpose[];
    editions: Edition[];
}

// Helper to ensure elements have client IDs
function ensureElementIds(elements: BlockElement[]): BlockElement[] {
    return elements.map((el, index) => ({
        ...el,
        id: el.id || el._id || `element-${index}-${Date.now()}`,
        children: el.children ? ensureElementIds(el.children) : undefined,
    }));
}

// Component to display diff summary badges
function DiffSummaryBadges({ diff }: { diff: VersionDiffSummary }) {
    if (diff.added === 0 && diff.removed === 0 && diff.modified === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1.5">
            {diff.added > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <Plus className="size-3" />
                    {diff.added}
                </Badge>
            )}
            {diff.removed > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                    <Minus className="size-3" />
                    {diff.removed}
                </Badge>
            )}
            {diff.modified > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                    <Pencil className="size-3" />
                    {diff.modified}
                </Badge>
            )}
        </div>
    );
}

export default function ContentsEdit({ content, elementTypes, wrapperPurposes, editions }: ContentsEditProps) {
    // Initialize elements with IDs
    const initialElements = useMemo(() => 
        ensureElementIds(content.elements || []),
        [content.elements]
    );

    const { data, setData, put, processing, errors, isDirty } = useForm({
        title: content.title,
        slug: content.slug,
        elements: initialElements,
        metadata: content.metadata || {},
        editions: content.editions || [],
    });

    // Collapse state for block editor
    const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
    
    // Edition preview filter state
    const [previewEdition, setPreviewEdition] = useState<string | null>(null);
    
    // Version preview modal state
    const [previewVersion, setPreviewVersion] = useState<ContentVersion | null>(null);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    
    // Duplicate dialog state
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
    const [duplicateSlug, setDuplicateSlug] = useState('');
    const [duplicateError, setDuplicateError] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleVersionClick = (version: ContentVersion) => {
        setPreviewVersion(version);
        setIsVersionModalOpen(true);
    };
    
    // Get all block IDs recursively
    const getAllBlockIds = (elements: BlockElement[]): string[] => {
        const ids: string[] = [];
        for (const element of elements) {
            ids.push(element.id);
            if (element.children) {
                ids.push(...getAllBlockIds(element.children));
            }
        }
        return ids;
    };

    const allBlockIds = useMemo(() => getAllBlockIds(data.elements), [data.elements]);
    const allCollapsed = allBlockIds.length > 0 && allBlockIds.every(id => collapsedBlocks.has(id));

    const toggleAllBlocks = useCallback(() => {
        if (allCollapsed) {
            setCollapsedBlocks(new Set());
        } else {
            setCollapsedBlocks(new Set(allBlockIds));
        }
    }, [allCollapsed, allBlockIds]);

    const toggleCollapseBlock = useCallback((id: string) => {
        setCollapsedBlocks(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/contents/${content._id}`);
    };

    const handlePublish = () => {
        router.post(`/contents/${content._id}/publish`);
    };

    const handleUnpublish = () => {
        router.post(`/contents/${content._id}/unpublish`);
    };

    const handleDelete = () => {
        router.delete(`/contents/${content._id}`);
    };

    const handleRestoreVersion = (versionNumber: number) => {
        router.post(`/contents/${content._id}/versions/${versionNumber}/restore`);
    };

    const handleDuplicate = () => {
        if (!duplicateSlug.trim()) {
            setDuplicateError('Please enter a slug.');
            return;
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(duplicateSlug)) {
            setDuplicateError('Slug must only contain lowercase letters, numbers, and hyphens.');
            return;
        }

        setIsDuplicating(true);
        setDuplicateError(null);

        router.post(
            `/contents/${content._id}/duplicate`,
            { slug: duplicateSlug },
            {
                onError: (errors) => {
                    setDuplicateError(errors.slug || 'Failed to duplicate content.');
                    setIsDuplicating(false);
                },
                onSuccess: () => {
                    setIsDuplicateDialogOpen(false);
                    setDuplicateSlug('');
                    setIsDuplicating(false);
                },
            }
        );
    };

    const openDuplicateDialog = () => {
        // Pre-populate with current slug + "-copy"
        setDuplicateSlug(`${content.slug}-copy`);
        setDuplicateError(null);
        setIsDuplicateDialogOpen(true);
    };

    const handleElementsChange = useCallback((elements: BlockElement[]) => {
        setData('elements', elements);
    }, [setData]);

    // Get schema from collection
    const schema = content.collection?.schema as CollectionSchema | null;
    
    // Get content metadata fields from schema
    const contentMetaFields = schema?.content_meta_fields || [];
    
    // Check if this collection uses meta only content mode
    const isMetaOnlyContent = schema?.meta_only_content ?? false;

    const handleMetadataChange = useCallback((metadata: Record<string, unknown>) => {
        setData('metadata', metadata);
    }, [setData]);

    const handlePreview = () => {
        window.open(`/contents/${content._id}/preview`, '_blank');
    };

    const getStatusBadge = () => {
        switch (content.status) {
            case 'published':
                return <Badge className="bg-green-600 text-white">Published</Badge>;
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'archived':
                return <Badge variant="outline">Archived</Badge>;
            default:
                return <Badge variant="secondary">{content.status}</Badge>;
        }
    };

    return (
        <AppLayout
            title={`Edit: ${content.title}`}
            breadcrumbs={[
                { label: 'Collections', href: '/collections' },
                { label: content.collection.name, href: `/collections/${content.collection.slug}` },
                { label: content.title },
            ]}
            actions={
                <div className="flex items-center gap-2">
                    {getStatusBadge()}
                    {editions.length > 0 && (
                        <EditionSelector
                            editions={editions}
                            selectedEditions={data.editions}
                            onChange={(editions) => setData('editions', editions)}
                            compact
                        />
                    )}
                    <div className="flex gap-2">
                        <Button onClick={openDuplicateDialog} variant="outline" size="sm">
                            <Copy className="size-4 mr-2" />
                            Duplicate
                        </Button>
                        {content.status === 'draft' ? (
                            <Button onClick={handlePublish} variant="outline" size="sm">
                                <Send className="size-4 mr-2" />
                                Publish
                            </Button>
                        ) : content.status === 'published' ? (
                            <Button onClick={handleUnpublish} variant="outline" size="sm">
                                <Archive className="size-4 mr-2" />
                                Unpublish
                            </Button>
                        ) : null}
                        <Button onClick={handleSubmit} disabled={processing || !isDirty} size="sm">
                            {processing ? (
                                <Loader2 className="size-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="size-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="grid gap-6 lg:grid-cols-4">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="mb-4">
                        <Button variant="ghost" asChild className="-ml-4">
                            <Link href={`/collections/${content.collection.slug}`}>
                                <ArrowLeft className="size-4 mr-2" />
                                Back to {content.collection.name}
                            </Link>
                        </Button>
                    </div>

                    <Tabs defaultValue="content" className="space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <TabsList>
                                <TabsTrigger value="content">Content</TabsTrigger>
                                <TabsTrigger value="settings">Settings</TabsTrigger>
                                <TabsTrigger value="versions">
                                    Versions ({content.versions?.length || 0})
                                </TabsTrigger>
                            </TabsList>
                            
                            <div className="flex items-center gap-2">
                                {!isMetaOnlyContent && data.elements.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleAllBlocks}
                                        className="h-8 text-xs"
                                    >
                                        {allCollapsed ? (
                                            <>
                                                <ChevronsUpDown className="size-3 mr-1.5" />
                                                Expand All
                                            </>
                                        ) : (
                                            <>
                                                <ChevronsDownUp className="size-3 mr-1.5" />
                                                Collapse All
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreview}
                                    className="h-8"
                                >
                                    <Eye className="size-4 mr-2" />
                                    Preview
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="content" className="space-y-4">
                            {isMetaOnlyContent ? (
                                /* Meta Only Content Mode - Full width metadata editor */
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Content Data</CardTitle>
                                        <CardDescription>
                                            Define the content using the metadata fields configured for this collection.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {contentMetaFields.length > 0 ? (
                                            <div className="grid gap-6 md:grid-cols-2">
                                                {contentMetaFields.map((field) => (
                                                    <div 
                                                        key={field.name}
                                                        className={
                                                            field.type === 'textarea' || field.type === 'json'
                                                                ? 'md:col-span-2'
                                                                : ''
                                                        }
                                                    >
                                                        <MetaFieldInput
                                                            field={field}
                                                            value={data.metadata[field.name]}
                                                            onChange={(value) => handleMetadataChange({
                                                                ...data.metadata,
                                                                [field.name]: value,
                                                            })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p>No metadata fields configured.</p>
                                                <p className="text-sm mt-1">
                                                    Add content metadata fields in the collection settings.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                /* Standard Block Editor Mode */
                                <>
                                    {/* Content Metadata - Mobile only */}
                                    {contentMetaFields.length > 0 && (
                                        <div className="lg:hidden">
                                            <MetadataEditor
                                                fields={contentMetaFields}
                                                values={data.metadata}
                                                onChange={handleMetadataChange}
                                                title="Content Metadata"
                                                description="Additional information for this content"
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Edition Preview Filter */}
                                    {editions.length > 0 && (
                                        <EditionPreviewFilter
                                            editions={editions}
                                            contentEditions={data.editions}
                                            previewEdition={previewEdition}
                                            onPreviewEditionChange={setPreviewEdition}
                                        />
                                    )}

                                    {/* Content visibility warning when filtering */}
                                    {previewEdition && !isContentVisibleForEdition(data.editions, previewEdition) && (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200">
                                            <p className="text-sm font-medium">
                                                This content is not visible in the "{editions.find(e => e.slug === previewEdition)?.name || previewEdition}" edition.
                                            </p>
                                            <p className="text-xs mt-1 opacity-80">
                                                The content is restricted to: {data.editions.length > 0 ? data.editions.join(', ') : 'All Editions'}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {/* Block Editor */}
                                    <BlockEditor
                                        elements={data.elements}
                                        onChange={handleElementsChange}
                                        schema={schema}
                                        wrapperPurposes={wrapperPurposes}
                                        editions={editions}
                                        previewEdition={previewEdition}
                                        contentEditions={data.editions}
                                        collectionId={content.collection_id}
                                        contentId={content._id}
                                        collapsedBlocks={collapsedBlocks}
                                        onToggleCollapse={toggleCollapseBlock}
                                    />
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Content Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-destructive">{errors.title}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug</Label>
                                        <Input
                                            id="slug"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            URL: /{content.collection.slug}/{data.slug}
                                        </p>
                                        {errors.slug && (
                                            <p className="text-sm text-destructive">{errors.slug}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Danger Zone */}
                            <Card className="border-destructive/50">
                                <CardHeader>
                                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive">
                                                <Trash2 className="size-4 mr-2" />
                                                Delete Content
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete "{content.title}"? 
                                                    This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDelete}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="versions" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Version History</CardTitle>
                                    <CardDescription>
                                        All previous versions of this content. 
                                        Restore any version to revert changes.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {content.versions?.length > 0 ? (
                                        <div className="space-y-2">
                                            {content.versions.map((version) => (
                                                <div
                                                    key={version._id}
                                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                                                    onClick={() => handleVersionClick(version)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 transition-colors">
                                                            <Clock className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium group-hover:text-primary transition-colors">
                                                                    Version {version.version_number}
                                                                </span>
                                                                {Number(version.version_number) === Number(content.current_version) && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Current
                                                                    </Badge>
                                                                )}
                                                                {/* Show title if it differs from current content title */}
                                                                {version.snapshot?.title && version.snapshot.title !== content.title && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        "{version.snapshot.title}"
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <span>{formatDateTime(version.created_at)}</span>
                                                                {version.creator_name && (
                                                                    <span className="flex items-center gap-1">
                                                                        <User className="size-3" />
                                                                        {version.creator_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {version.change_note && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    "{version.change_note}"
                                                                </p>
                                                            )}
                                                            {/* Diff Summary */}
                                                            {version.diff_summary && (
                                                                <DiffSummaryBadges diff={version.diff_summary} />
                                                            )}
                                                            <p className="text-xs text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                Click to preview
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleVersionClick(version)}
                                                        >
                                                            <Eye className="size-4 mr-2" />
                                                            Preview
                                                        </Button>
                                                        {Number(version.version_number) !== Number(content.current_version) && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="outline" size="sm">
                                                                        <RotateCcw className="size-4 mr-2" />
                                                                        Restore
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>
                                                                            Restore Version {version.version_number}
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will restore the content to version {version.version_number}.
                                                                            A new version will be created with the restored content.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleRestoreVersion(version.version_number)}
                                                                        >
                                                                            Restore
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Clock className="size-12 mx-auto mb-4 opacity-50" />
                                            <p>No version history yet</p>
                                            <p className="text-sm">
                                                Versions are created when you save changes
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Content Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                {getStatusBadge()}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Version</span>
                                <span className="font-mono">v{content.versions?.length || content.current_version || 1}</span>
                            </div>
                            {!isMetaOnlyContent && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Elements</span>
                                    <span>{countElements(data.elements)}</span>
                                </div>
                            )}
                            <hr className="my-2" />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span>{formatDate(content.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Updated</span>
                                <span>{formatDate(content.updated_at)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Metadata - Desktop only (hidden in meta-only mode since it's shown in main area) */}
                    {!isMetaOnlyContent && contentMetaFields.length > 0 && (
                        <div className="hidden lg:block">
                            <MetadataEditor
                                fields={contentMetaFields}
                                values={data.metadata}
                                onChange={handleMetadataChange}
                                title="Content Metadata"
                                compact
                            />
                        </div>
                    )}

                    {isDirty && (
                        <Card className="border-amber-500/50 bg-amber-500/5">
                            <CardContent className="py-4">
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    You have unsaved changes
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Version Preview Modal */}
            <VersionPreviewModal
                isOpen={isVersionModalOpen}
                onClose={() => setIsVersionModalOpen(false)}
                version={previewVersion}
                allVersions={content.versions || []}
                contentId={content._id}
                currentVersionNumber={content.current_version}
                onRestore={handleRestoreVersion}
            />

            {/* Duplicate Dialog */}
            <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Duplicate Content</DialogTitle>
                        <DialogDescription>
                            Create a copy of "{content.title}" with a new unique slug.
                            All elements, metadata, and editions will be copied.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="duplicate-slug">New Slug</Label>
                            <Input
                                id="duplicate-slug"
                                value={duplicateSlug}
                                onChange={(e) => {
                                    setDuplicateSlug(e.target.value);
                                    setDuplicateError(null);
                                }}
                                placeholder="new-content-slug"
                            />
                            <p className="text-sm text-muted-foreground">
                                URL: /{content.collection.slug}/{duplicateSlug || 'new-slug'}
                            </p>
                            {duplicateError && (
                                <p className="text-sm text-destructive">{duplicateError}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDuplicateDialogOpen(false)}
                            disabled={isDuplicating}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleDuplicate} disabled={isDuplicating}>
                            {isDuplicating ? (
                                <Loader2 className="size-4 mr-2 animate-spin" />
                            ) : (
                                <Copy className="size-4 mr-2" />
                            )}
                            Duplicate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// Helper to count all elements including nested ones
function countElements(elements: BlockElement[]): number {
    return elements.reduce((count, el) => {
        return count + 1 + (el.children ? countElements(el.children) : 0);
    }, 0);
}
