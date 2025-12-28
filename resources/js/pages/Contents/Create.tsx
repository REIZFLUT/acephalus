import { FormEvent, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { PageProps, Collection } from '@/types';

interface ContentsCreateProps extends PageProps {
    collection: Collection;
    elementTypes: Array<{ value: string; label: string }>;
}

export default function ContentsCreate({ collection }: ContentsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        elements: [] as Array<{ type: string; order: number; data: Record<string, unknown> }>,
        metadata: {} as Record<string, unknown>,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/collections/${collection.slug}/contents`);
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleTitleChange = (title: string) => {
        setData((prev) => ({
            ...prev,
            title,
            slug: prev.slug === '' || prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug,
        }));
    };

    return (
        <AppLayout
            title="Create Content"
            breadcrumbs={[
                { label: 'Collections', href: '/collections' },
                { label: collection.name, href: `/collections/${collection.slug}` },
                { label: 'Create Content' },
            ]}
        >
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href={`/collections/${collection.slug}`}>
                            <ArrowLeft className="size-4 mr-2" />
                            Back to {collection.name}
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Content</CardTitle>
                        <CardDescription>
                            Add a new content entry to {collection.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter content title"
                                    value={data.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    autoFocus
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive">{errors.title}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    placeholder="content-slug"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                    URL path: /{collection.slug}/{data.slug || 'your-slug'}
                                </p>
                                {errors.slug && (
                                    <p className="text-sm text-destructive">{errors.slug}</p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Create Content
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={`/collections/${collection.slug}`}>Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

