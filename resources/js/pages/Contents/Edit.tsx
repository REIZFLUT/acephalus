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
} from 'lucide-react';
import type { PageProps, Content, ContentVersion, BlockElement, ElementType, CollectionSchema, WrapperPurpose } from '@/types';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { MetadataEditor } from '@/components/editor/MetadataEditor';
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
}

// Helper to ensure elements have client IDs
function ensureElementIds(elements: BlockElement[]): BlockElement[] {
    return elements.map((el, index) => ({
        ...el,
        id: el.id || el._id || `element-${index}-${Date.now()}`,
        children: el.children ? ensureElementIds(el.children) : undefined,
    }));
}

export default function ContentsEdit({ content, elementTypes, wrapperPurposes }: ContentsEditProps) {
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
    });

    // Collapse state for block editor
    const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
    
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
        router.post(`/api/v1/contents/${content._id}/versions/${versionNumber}/restore`);
    };

    const handleElementsChange = useCallback((elements: BlockElement[]) => {
        setData('elements', elements);
    }, [setData]);

    // Get schema from collection
    const schema = content.collection?.schema as CollectionSchema | null;
    
    // Get content metadata fields from schema
    const contentMetaFields = schema?.content_meta_fields || [];

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
                    <div className="flex gap-2">
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
                                {data.elements.length > 0 && (
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
                            
                            {/* Block Editor */}
                            <BlockEditor
                                elements={data.elements}
                                onChange={handleElementsChange}
                                schema={schema}
                                wrapperPurposes={wrapperPurposes}
                                collapsedBlocks={collapsedBlocks}
                                onToggleCollapse={toggleCollapseBlock}
                            />
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
                                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-muted rounded-md">
                                                            <Clock className="size-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    Version {version.version_number}
                                                                </span>
                                                                {version.version_number === content.current_version && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Current
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatDateTime(version.created_at)}
                                                            </p>
                                                            {version.change_note && (
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    "{version.change_note}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {version.version_number !== content.current_version && (
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
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Elements</span>
                                <span>{countElements(data.elements)}</span>
                            </div>
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

                    {/* Content Metadata - Desktop only */}
                    {contentMetaFields.length > 0 && (
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
        </AppLayout>
    );
}

// Helper to count all elements including nested ones
function countElements(elements: BlockElement[]): number {
    return elements.reduce((count, el) => {
        return count + 1 + (el.children ? countElements(el.children) : 0);
    }, 0);
}
