import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { PageProps } from '@/types';

export default function CollectionsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/collections');
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleNameChange = (name: string) => {
        setData((prev) => ({
            ...prev,
            name,
            slug: prev.slug === '' || prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug,
        }));
    };

    return (
        <AppLayout
            title="Create Collection"
            breadcrumbs={[
                { label: 'Collections', href: '/collections' },
                { label: 'Create' },
            ]}
        >
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/collections">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Collections
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Collection</CardTitle>
                        <CardDescription>
                            Collections define the structure for your content entries
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Blog Posts"
                                    value={data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
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
                                    placeholder="e.g., blog-posts"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Used in API URLs. Only lowercase letters, numbers, and hyphens.
                                </p>
                                {errors.slug && (
                                    <p className="text-sm text-destructive">{errors.slug}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what this collection is for..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Create Collection
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/collections">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

