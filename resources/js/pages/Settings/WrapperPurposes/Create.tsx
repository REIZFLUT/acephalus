import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { PageProps } from '@/types';

export default function WrapperPurposesCreate({}: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        icon: '',
        css_class: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/settings/wrapper-purposes');
    };

    const handleNameChange = (name: string) => {
        setData((prev) => ({
            ...prev,
            name,
            slug: prev.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        }));
    };

    return (
        <AppLayout
            title="Create Wrapper Purpose"
            breadcrumbs={[
                { label: 'Settings', href: '/settings/wrapper-purposes' },
                { label: 'Wrapper Purposes', href: '/settings/wrapper-purposes' },
                { label: 'Create' },
            ]}
        >
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/settings/wrapper-purposes">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Wrapper Purposes
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Wrapper Purpose</CardTitle>
                        <CardDescription>
                            Define a new purpose type for wrapper elements
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Infobox"
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
                                    placeholder="infobox"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Used as identifier. Auto-generated from name if left empty.
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
                                    placeholder="A highlighted information box"
                                    rows={2}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon</Label>
                                    <Input
                                        id="icon"
                                        value={data.icon}
                                        onChange={(e) => setData('icon', e.target.value)}
                                        placeholder="info"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Lucide icon name (e.g., info, alert-triangle)
                                    </p>
                                    {errors.icon && (
                                        <p className="text-sm text-destructive">{errors.icon}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="css_class">CSS Class</Label>
                                    <Input
                                        id="css_class"
                                        value={data.css_class}
                                        onChange={(e) => setData('css_class', e.target.value)}
                                        placeholder="wrapper-infobox"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Class name for styling in frontend
                                    </p>
                                    {errors.css_class && (
                                        <p className="text-sm text-destructive">{errors.css_class}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Create Purpose
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/settings/wrapper-purposes">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

