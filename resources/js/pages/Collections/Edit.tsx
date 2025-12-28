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
import { Loader2, ArrowLeft, Trash2, Settings, Layers } from 'lucide-react';
import { SchemaEditor } from '@/components/schema/SchemaEditor';
import type { PageProps, Collection, CollectionSchema, WrapperPurpose } from '@/types';

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
    });

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
                    <TabsList>
                        <TabsTrigger value="general" className="gap-2">
                            <Settings className="size-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="schema" className="gap-2">
                            <Layers className="size-4" />
                            Schema
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

                    {/* Schema Tab */}
                    <TabsContent value="schema">
                        <SchemaEditor
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
