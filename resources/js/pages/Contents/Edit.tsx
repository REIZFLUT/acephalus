import { FormEvent, useCallback, useMemo, useState } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    ArrowLeft,
    Save,
    Send,
    Archive,
    ChevronsUpDown,
    ChevronsDownUp,
    Eye,
    Copy,
    ChevronDown,
    MessageSquare,
} from 'lucide-react';
import type { PageProps, Content, ContentVersion, BlockElement, CollectionSchema, WrapperPurpose, Edition, Collection } from '@/types';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { MetadataEditor } from '@/components/editor/MetadataEditor';
import { MetaFieldInput } from '@/components/editor/MetaFieldInput';
import { EditionSelector } from '@/components/editor/EditionSelector';
import { EditionPreviewFilter, isContentVisibleForEdition } from '@/components/editor/EditionPreviewFilter';
import { VersionPreviewModal } from '@/components/versions/VersionPreviewModal';
import { ensureElementIds } from './edit/utils';
import { Sidebar } from './edit/Sidebar';
import { SettingsTab } from './edit/SettingsTab';
import { VersionsTab } from './edit/VersionsTab';
import { DuplicateDialog } from './edit/DuplicateDialog';
import { LockBadge } from '@/components/ui/lock-badge';
import { LockButton } from '@/components/ui/lock-button';
import { usePermission } from '@/hooks/use-permission';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContentsEditProps extends PageProps {
    content: Content & { 
        collection: { 
            name: string; 
            slug: string;
            schema?: CollectionSchema | null;
            is_locked?: boolean;
            locked_at?: string | null;
            lock_reason?: string | null;
        }; 
        versions: ContentVersion[] 
    };
    elementTypes: Array<{ value: string; label: string }>;
    wrapperPurposes: WrapperPurpose[];
    editions: Edition[];
}

export default function ContentsEdit({ content, elementTypes, wrapperPurposes, editions }: ContentsEditProps) {
    const { can } = usePermission();
    
    // Initialize elements with IDs
    const initialElements = useMemo(() => 
        ensureElementIds(content.elements || []),
        [content.elements]
    );

    // Lock state
    const isContentLocked = content.is_locked ?? false;
    const isCollectionLocked = content.collection?.is_locked ?? false;
    const isEffectivelyLocked = isContentLocked || isCollectionLocked;
    const effectiveLockSource = isContentLocked ? 'self' : isCollectionLocked ? 'collection' : null;

    const { data, setData, errors, isDirty } = useForm({
        title: content.title,
        slug: content.slug,
        elements: initialElements,
        metadata: content.metadata || {},
        editions: content.editions || [],
    });

    // Saving state (since we use router.put instead of useForm's put)
    const [isSaving, setIsSaving] = useState(false);

    // Collapse state for block editor
    const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
    
    // Change note dialog state
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [pendingNote, setPendingNote] = useState('');
    
    // Edition preview filter state
    const [previewEdition, setPreviewEdition] = useState<string | null>(null);
    
    // Version preview modal state
    const [previewVersion, setPreviewVersion] = useState<ContentVersion | null>(null);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    
    // Duplicate dialog state
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);

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

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault();
        setIsSaving(true);
        // Ensure change_note is empty for regular save
        router.put(`/contents/${content._id}`, {
            ...data,
            change_note: '',
        }, {
            preserveScroll: true,
            onFinish: () => setIsSaving(false),
        });
    };

    const handleSaveWithNote = () => {
        setIsNoteDialogOpen(true);
        setPendingNote('');
    };

    const handleConfirmSaveWithNote = () => {
        setIsNoteDialogOpen(false);
        setIsSaving(true);
        // Use router.put directly with the note included
        router.put(`/contents/${content._id}`, {
            ...data,
            change_note: pendingNote,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsSaving(false);
                setPendingNote('');
            },
        });
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

    const handleElementsChange = useCallback((elements: BlockElement[]) => {
        setData('elements', elements);
    }, [setData]);

    // Element lock/unlock handlers (via web routes)
    const handleLockElement = useCallback((block: BlockElement, reason?: string) => {
        // Use the element's id (client-side) or _id (MongoDB) to identify it
        const elementId = block.id || block._id;
        if (!elementId) {
            console.warn('Cannot lock element: no id found');
            return;
        }
        
        router.post(`/contents/${content._id}/elements/${elementId}/lock`, { reason }, {
            preserveScroll: true,
            preserveState: false, // Force full state reset to reflect lock status
        });
    }, [content._id]);

    const handleUnlockElement = useCallback((block: BlockElement) => {
        const elementId = block.id || block._id;
        if (!elementId) {
            console.warn('Cannot unlock element: no id found');
            return;
        }
        
        router.delete(`/contents/${content._id}/elements/${elementId}/lock`, {
            preserveScroll: true,
            preserveState: false, // Force full state reset to reflect lock status
        });
    }, [content._id]);

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
                    <LockBadge
                        isLocked={isEffectivelyLocked}
                        lockedAt={isContentLocked ? content.locked_at : content.collection?.locked_at}
                        lockReason={isContentLocked ? content.lock_reason : content.collection?.lock_reason}
                        source={effectiveLockSource}
                    />
                    {editions.length > 0 && (
                        <EditionSelector
                            editions={editions}
                            selectedEditions={data.editions}
                            onChange={(editions) => setData('editions', editions)}
                            compact
                            disabled={isEffectivelyLocked}
                        />
                    )}
                    <div className="flex gap-2">
                        <LockButton
                            isLocked={isContentLocked}
                            lockRoute={`/contents/${content._id}/lock`}
                            unlockRoute={`/contents/${content._id}/lock`}
                            resourceType="content"
                            resourceName={content.title}
                            canLock={can('contents.lock') && !isCollectionLocked}
                            canUnlock={can('contents.unlock')}
                        />
                        <Button onClick={() => setIsDuplicateDialogOpen(true)} variant="outline" size="sm">
                            <Copy className="size-4 mr-2" />
                            Duplicate
                        </Button>
                        {content.status === 'draft' ? (
                            <Button onClick={handlePublish} variant="outline" size="sm" disabled={isEffectivelyLocked}>
                                <Send className="size-4 mr-2" />
                                Publish
                            </Button>
                        ) : content.status === 'published' ? (
                            <Button onClick={handleUnpublish} variant="outline" size="sm" disabled={isEffectivelyLocked}>
                                <Archive className="size-4 mr-2" />
                                Unpublish
                            </Button>
                        ) : null}
                        <div className="flex items-center">
                            <Button 
                                onClick={handleSubmit} 
                                disabled={isSaving || !isDirty || isEffectivelyLocked} 
                                size="sm"
                                className="rounded-r-none"
                            >
                                {isSaving ? (
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="size-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        size="sm" 
                                        className="rounded-l-none border-l border-primary-foreground/20 px-2"
                                        disabled={isSaving || !isDirty || isEffectivelyLocked}
                                    >
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleSaveWithNote}>
                                        <MessageSquare className="size-4 mr-2" />
                                        Save with Note
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
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

                    {isEffectivelyLocked && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                                {effectiveLockSource === 'collection' ? (
                                    <>This content cannot be edited because the collection "{content.collection.name}" is locked.</>
                                ) : (
                                    <>This content is locked and cannot be edited.</>
                                )}
                                {(isContentLocked ? content.lock_reason : content.collection?.lock_reason) && (
                                    <span className="block mt-1 text-sm opacity-80">
                                        Reason: {isContentLocked ? content.lock_reason : content.collection?.lock_reason}
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

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
                                        onLockElement={handleLockElement}
                                        onUnlockElement={handleUnlockElement}
                                        isContentLocked={isContentLocked}
                                        isCollectionLocked={isCollectionLocked}
                                    />
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="settings">
                            <SettingsTab 
                                content={content} 
                                data={data} 
                                setData={setData} 
                                errors={errors} 
                                onDelete={handleDelete} 
                            />
                        </TabsContent>

                        <TabsContent value="versions" className="space-y-4">
                            <VersionsTab 
                                content={content} 
                                onVersionClick={handleVersionClick}
                                onRestoreVersion={handleRestoreVersion}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <Sidebar 
                    content={content}
                    data={data}
                    schema={schema}
                    isMetaOnlyContent={isMetaOnlyContent}
                    isDirty={isDirty}
                    onMetadataChange={handleMetadataChange}
                />
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
            <DuplicateDialog
                open={isDuplicateDialogOpen}
                onOpenChange={setIsDuplicateDialogOpen}
                content={content}
                initialSlug={`${content.slug}-copy`}
            />

            {/* Save with Note Dialog */}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save with Note</DialogTitle>
                        <DialogDescription>
                            Add a note to describe the changes you made. This will be visible in the version history.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="change-note">Change Note</Label>
                            <Textarea
                                id="change-note"
                                placeholder="e.g., Fixed typo in introduction, Updated pricing information..."
                                value={pendingNote}
                                onChange={(e) => setPendingNote(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmSaveWithNote} disabled={isSaving}>
                            {isSaving ? (
                                <Loader2 className="size-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="size-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
