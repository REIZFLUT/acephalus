import { FormEvent } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { TranslatableInput } from '@/components/ui/translatable-input';
import { ArrowLeft, Loader2, Lock, Trash2 } from 'lucide-react';
import { EditionIcon, availableEditionIconNames } from '@/components/EditionIcon';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PageProps, Edition, TranslatableString } from '@/types';
import { normalizeToTranslatable, useTranslation } from '@/hooks/use-translation';

interface EditionsEditProps extends PageProps {
    edition: Edition;
}

export default function EditionsEdit({ edition }: EditionsEditProps) {
    const { resolveTranslation } = useTranslation();
    const editionName = resolveTranslation(edition.name);
    
    const { data, setData, put, processing, errors } = useForm<{
        name: TranslatableString;
        slug: string;
        description: TranslatableString;
        icon: string;
    }>({
        name: normalizeToTranslatable(edition.name),
        slug: edition.slug,
        description: normalizeToTranslatable(edition.description),
        icon: edition.icon || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/settings/editions/${edition.slug}`);
    };

    const handleDelete = () => {
        router.delete(`/settings/editions/${edition.slug}`);
    };

    return (
        <AppLayout
            title={`Edit ${editionName}`}
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Editions', href: '/settings/editions' },
                { label: editionName },
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

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <CardTitle>Edit Edition</CardTitle>
                                {edition.is_system && (
                                    <Badge variant="secondary" className="gap-1">
                                        <Lock className="size-3" />
                                        System
                                    </Badge>
                                )}
                            </div>
                            <CardDescription>
                                {edition.is_system
                                    ? 'System editions can only have their description and icon changed.'
                                    : 'Update the edition settings'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <TranslatableInput
                                        value={data.name}
                                        onChange={(value) => setData('name', value)}
                                        disabled={edition.is_system}
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
                                        disabled={edition.is_system}
                                    />
                                    {errors.slug && (
                                        <p className="text-sm text-destructive">{errors.slug}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <TranslatableInput
                                        value={data.description}
                                        onChange={(value) => setData('description', value)}
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
                                        Save Changes
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/settings/editions">Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Danger Zone - only for non-system editions */}
                    {!edition.is_system && (
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" type="button">
                                            <Trash2 className="size-4 mr-2" />
                                            Delete Edition
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Edition</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{editionName}"? 
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
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
