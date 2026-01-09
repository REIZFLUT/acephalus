import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TranslatableInput } from '@/components/ui/translatable-input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { EditionIcon, availableEditionIconNames } from '@/components/EditionIcon';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PageProps, TranslatableString } from '@/types';

export default function EditionsCreate({}: PageProps) {
    const { data, setData, post, processing, errors } = useForm<{
        name: TranslatableString;
        slug: string;
        description: TranslatableString;
        icon: string;
    }>({
        name: { en: '' },
        slug: '',
        description: { en: '' },
        icon: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/settings/editions');
    };

    const handleNameChange = (name: TranslatableString) => {
        setData((prev) => ({
            ...prev,
            name,
            slug: prev.slug || (name.en || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        }));
    };

    return (
        <AppLayout
            title="Create Edition"
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Editions', href: '/settings/editions' },
                { label: 'Create' },
            ]}
        >
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/settings/editions">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Settings
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Edition</CardTitle>
                        <CardDescription>
                            Define a new edition for content filtering (e.g., Print, Web, ePaper)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <TranslatableInput
                                    value={data.name}
                                    onChange={handleNameChange}
                                    placeholder="Print"
                                    modalTitle="Name Translations"
                                    modalDescription="Add translations for the edition name."
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
                                    placeholder="print"
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
                                <TranslatableInput
                                    value={data.description}
                                    onChange={(value) => setData('description', value)}
                                    placeholder="Content for printed publications"
                                    multiline
                                    rows={2}
                                    modalTitle="Description Translations"
                                    modalDescription="Add translations for the edition description."
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="icon">Icon</Label>
                                <Select
                                    value={data.icon || ''}
                                    onValueChange={(value) => setData('icon', value)}
                                >
                                    <SelectTrigger id="icon">
                                        <SelectValue placeholder="Select an icon">
                                            {data.icon ? (
                                                <div className="flex items-center gap-2">
                                                    <EditionIcon iconName={data.icon} className="size-4" />
                                                    <span>{data.icon}</span>
                                                </div>
                                            ) : (
                                                'Select an icon'
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEditionIconNames.map((iconName) => (
                                            <SelectItem key={iconName} value={iconName}>
                                                <div className="flex items-center gap-2">
                                                    <EditionIcon iconName={iconName} className="size-4" />
                                                    <span>{iconName}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.icon && (
                                    <p className="text-sm text-destructive">{errors.icon}</p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Create Edition
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/settings/editions">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

