import { FormEvent, useState } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, ArrowLeft, Trash2, Settings, Layers, FolderCog, FileStack, Blocks } from 'lucide-react';
import { SchemaEditorMeta, SchemaEditorContents, SchemaEditorElements, SchemaEditorWrappers } from '@/components/schema/SchemaEditor';
import { MetaFieldInput } from '@/components/editor/MetaFieldInput';
import type { PageProps, Collection, CollectionSchema, WrapperPurpose, MetaFieldDefinition } from '@/types';

interface CollectionsEditProps extends PageProps {
    collection: Collection;
    wrapperPurposes: WrapperPurpose[];
}

export default function CollectionsEdit({ collection, wrapperPurposes }: CollectionsEditProps) {
    const [activeTab, setActiveTab] = useState('general');
    
    const { data, setData, put, processing, errors, isDirty } = useForm({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || '',
        schema: (collection.schema as CollectionSchema | null) || null,
        collection_meta: (collection.collection_meta as Record<string, unknown> | null) || {},
    });

    // Get collection metadata fields from schema
    const collectionMetaFields: MetaFieldDefinition[] = data.schema?.collection_meta_fields || [];
    const hasCollectionMetaFields = collectionMetaFields.length > 0;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/collections/${collection.slug}`);
    };

    const handleDelete = () => {
        router.delete(`/collections/${collection.slug}`);
    };

    const handleSchemaChange = (schema: CollectionSchema) => {
        setData('schema', schema);
    };

    const handleMetaChange = (fieldName: string, value: unknown) => {
        setData('collection_meta', {
            ...data.collection_meta,
            [fieldName]: value,
        });
    };

    return (
        <AppLayout
            title={`Edit ${collection.name}`}
            breadcrumbs={[
                { label: 'Collections', href: '/collections' },
                { label: collection.name, href: `/collections/${collection.slug}` },
                { label: 'Edit' },
            ]}
            actions={
                <div className="flex items-center gap-2">
                    {isDirty && (
                        <span className="text-sm text-muted-foreground">Unsaved changes</span>
                    )}
                    <Button 
                        onClick={handleSubmit} 
                        disabled={processing || !isDirty}
                    >
                        {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            }
        >
            <div className="mb-6">
                <Button variant="ghost" asChild className="-ml-4">
                    <Link href={`/collections/${collection.slug}`}>
                        <ArrowLeft className="size-4 mr-2" />
                        Back to {collection.name}
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="general" className="gap-2">
                            <Settings className="size-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="meta" className="gap-2">
                            <FolderCog className="size-4" />
                            Meta
                        </TabsTrigger>
                        <TabsTrigger value="contents" className="gap-2">
                            <FileStack className="size-4" />
                            Contents
                        </TabsTrigger>
                        <TabsTrigger value="elements" className="gap-2">
                            <Blocks className="size-4" />
                            Elements
                        </TabsTrigger>
                        <TabsTrigger value="wrappers" className="gap-2">
                            <Layers className="size-4" />
                            Wrappers
                        </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Collection Details</CardTitle>
                                <CardDescription>
                                    Basic information about this collection
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
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
                                        Changing the slug will affect all API URLs for this collection.
                                    </p>
                                    {errors.slug && (
                                        <p className="text-sm text-destructive">{errors.slug}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                <CardDescription>
                                    Irreversible actions for this collection
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" type="button">
                                            <Trash2 className="size-4 mr-2" />
                                            Delete Collection
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{collection.name}"? This will permanently delete the collection and all its content. This action cannot be undone.
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

                    {/* Meta Tab - Collection Metadata Fields Definition + Values */}
                    <TabsContent value="meta" className="space-y-6">
                        {/* Collection metadata values (if fields are defined) */}
                        {hasCollectionMetaFields && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FolderCog className="size-5" />
                                        Collection Metadata Values
                                    </CardTitle>
                                    <CardDescription>
                                        Current metadata values for this collection
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {collectionMetaFields.map((field) => (
                                        <MetaFieldInput
                                            key={field.name}
                                            field={field}
                                            value={data.collection_meta?.[field.name]}
                                            onChange={(value) => handleMetaChange(field.name, value)}
                                        />
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Collection metadata field definitions */}
                        <SchemaEditorMeta
                            schema={data.schema}
                            onChange={handleSchemaChange}
                        />
                    </TabsContent>

                    {/* Contents Tab - Content Metadata Fields */}
                    <TabsContent value="contents">
                        <SchemaEditorContents
                            schema={data.schema}
                            onChange={handleSchemaChange}
                        />
                    </TabsContent>

                    {/* Elements Tab - Element Types + Element Meta */}
                    <TabsContent value="elements">
                        <SchemaEditorElements
                            schema={data.schema}
                            onChange={handleSchemaChange}
                        />
                    </TabsContent>

                    {/* Wrappers Tab - Wrapper Purposes */}
                    <TabsContent value="wrappers">
                        <SchemaEditorWrappers
                            schema={data.schema}
                            onChange={handleSchemaChange}
                            wrapperPurposes={wrapperPurposes}
                        />
                    </TabsContent>
                </Tabs>
            </form>
        </AppLayout>
    );
}
