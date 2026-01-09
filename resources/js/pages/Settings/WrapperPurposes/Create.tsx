import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { WrapperPurposeIcon, availableIconNames } from '@/components/WrapperPurposeIcon';
import { TranslatableInput } from '@/components/ui/translatable-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PageProps, TranslatableString } from '@/types';

export default function WrapperPurposesCreate({}: PageProps) {
    const { data, setData, post, processing, errors } = useForm<{
        name: TranslatableString;
        slug: string;
        description: TranslatableString;
        icon: string;
        css_class: string;
    }>({
        name: { en: '' },
        slug: '',
        description: { en: '' },
        icon: '',
        css_class: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/settings/wrapper-purposes');
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
            title="Create Wrapper Purpose"
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Wrapper Purposes', href: '/settings/wrapper-purposes' },
                { label: 'Create' },
            ]}
        >
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/settings/wrapper-purposes">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Settings
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
                                <TranslatableInput
                                    value={data.name}
                                    onChange={handleNameChange}
                                    placeholder="Infobox"
                                    modalTitle="Name Translations"
                                    modalDescription="Add translations for the wrapper purpose name."
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
                                <TranslatableInput
                                    value={data.description}
                                    onChange={(value) => setData('description', value)}
                                    placeholder="A highlighted information box"
                                    multiline
                                    rows={2}
                                    modalTitle="Description Translations"
                                    modalDescription="Add translations for the wrapper purpose description."
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
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
                                                        <WrapperPurposeIcon iconName={data.icon} className="size-4" />
                                                        <span>{data.icon}</span>
                                                    </div>
                                                ) : (
                                                    'Select an icon'
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableIconNames.map((iconName) => (
                                                <SelectItem key={iconName} value={iconName}>
                                                    <div className="flex items-center gap-2">
                                                        <WrapperPurposeIcon iconName={iconName} className="size-4" />
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

