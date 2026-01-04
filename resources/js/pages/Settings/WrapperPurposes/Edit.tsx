import { FormEvent } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeft, Loader2, Lock, Trash2 } from 'lucide-react';
import { WrapperPurposeIcon, availableIconNames } from '@/components/WrapperPurposeIcon';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PageProps, WrapperPurpose } from '@/types';

interface WrapperPurposesEditProps extends PageProps {
    purpose: WrapperPurpose;
}

export default function WrapperPurposesEdit({ purpose }: WrapperPurposesEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: purpose.name,
        slug: purpose.slug,
        description: purpose.description || '',
        icon: purpose.icon || '',
        css_class: purpose.css_class || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/settings/wrapper-purposes/${purpose.slug}`);
    };

    const handleDelete = () => {
        router.delete(`/settings/wrapper-purposes/${purpose.slug}`);
    };

    return (
        <AppLayout
            title={`Edit ${purpose.name}`}
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Wrapper Purposes', href: '/settings/wrapper-purposes' },
                { label: purpose.name },
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

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <CardTitle>Edit Wrapper Purpose</CardTitle>
                                {purpose.is_system && (
                                    <Badge variant="secondary" className="gap-1">
                                        <Lock className="size-3" />
                                        System
                                    </Badge>
                                )}
                            </div>
                            <CardDescription>
                                {purpose.is_system
                                    ? 'System purposes can only have their description and icon changed.'
                                    : 'Update the wrapper purpose settings'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        disabled={purpose.is_system}
                                        autoFocus={!purpose.is_system}
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
                                        disabled={purpose.is_system}
                                    />
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
                                        rows={2}
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
                                            disabled={purpose.is_system}
                                        />
                                        {errors.css_class && (
                                            <p className="text-sm text-destructive">{errors.css_class}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                        Save Changes
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/settings/wrapper-purposes">Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Danger Zone - only for non-system purposes */}
                    {!purpose.is_system && (
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" type="button">
                                            <Trash2 className="size-4 mr-2" />
                                            Delete Purpose
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Purpose</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{purpose.name}"? 
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

