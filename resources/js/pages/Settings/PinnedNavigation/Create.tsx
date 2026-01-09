import { FormEvent, useState, useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DynamicIcon, commonIconNames } from '@/components/DynamicIcon';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PageProps, Collection, FilterView } from '@/types';

interface CreateProps extends PageProps {
    collections: Pick<Collection, '_id' | 'name' | 'slug'>[];
}

export default function PinnedNavigationCreate({ collections }: CreateProps) {
    const [filterViews, setFilterViews] = useState<Pick<FilterView, '_id' | 'name' | 'slug'>[]>([]);
    const [loadingFilterViews, setLoadingFilterViews] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        collection_id: '',
        filter_view_id: '',
        icon: '',
        is_active: true,
    });

    // Load filter views when collection changes
    useEffect(() => {
        if (data.collection_id) {
            setLoadingFilterViews(true);
            fetch(`/settings/pinned-navigation/filter-views/${data.collection_id}`)
                .then((res) => res.json())
                .then((views) => {
                    setFilterViews(views);
                    setLoadingFilterViews(false);
                })
                .catch(() => {
                    setFilterViews([]);
                    setLoadingFilterViews(false);
                });
        } else {
            setFilterViews([]);
        }
    }, [data.collection_id]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/settings/pinned-navigation');
    };

    const handleCollectionChange = (collectionId: string) => {
        const collection = collections.find((c) => c._id === collectionId);
        setData((prev) => ({
            ...prev,
            collection_id: collectionId,
            filter_view_id: '', // Reset filter view when collection changes
            name: prev.name || collection?.name || '',
        }));
    };

    return (
        <AppLayout
            title="Create Pinned Navigation"
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Navigation', href: '/settings/pinned-navigation' },
                { label: 'Create' },
            ]}
        >
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/settings/pinned-navigation">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Settings
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Pinned Navigation Item</CardTitle>
                        <CardDescription>
                            Add a navigation shortcut to a collection in the sidebar.
                            Optionally apply a filter view to show pre-filtered content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="collection_id">Collection *</Label>
                                <Select
                                    value={data.collection_id}
                                    onValueChange={handleCollectionChange}
                                >
                                    <SelectTrigger id="collection_id">
                                        <SelectValue placeholder="Select a collection" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.map((collection) => (
                                            <SelectItem key={collection._id} value={collection._id}>
                                                {collection.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.collection_id && (
                                    <p className="text-sm text-destructive">{errors.collection_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="My Collection"
                                />
                                <p className="text-xs text-muted-foreground">
                                    The name shown in the navigation sidebar.
                                </p>
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="filter_view_id">Filter View (Optional)</Label>
                                <Select
                                    value={data.filter_view_id || 'none'}
                                    onValueChange={(value) => setData('filter_view_id', value === 'none' ? '' : value)}
                                    disabled={!data.collection_id || loadingFilterViews}
                                >
                                    <SelectTrigger id="filter_view_id">
                                        <SelectValue placeholder={loadingFilterViews ? 'Loading...' : 'No filter (show all)'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No filter (show all)</SelectItem>
                                        {filterViews.map((view) => (
                                            <SelectItem key={view._id} value={view._id}>
                                                {view.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Optionally pre-filter the collection when navigating.
                                </p>
                                {errors.filter_view_id && (
                                    <p className="text-sm text-destructive">{errors.filter_view_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="icon">Icon</Label>
                                <Select
                                    value={data.icon || 'none'}
                                    onValueChange={(value) => setData('icon', value === 'none' ? '' : value)}
                                >
                                    <SelectTrigger id="icon">
                                        <SelectValue placeholder="Select an icon">
                                            {data.icon ? (
                                                <div className="flex items-center gap-2">
                                                    <DynamicIcon name={data.icon} className="size-4" />
                                                    <span>{data.icon}</span>
                                                </div>
                                            ) : (
                                                'Default icon'
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                        <SelectItem value="none">
                                            <div className="flex items-center gap-2">
                                                <DynamicIcon name="box" className="size-4" />
                                                <span>Default (box)</span>
                                            </div>
                                        </SelectItem>
                                        {commonIconNames.map((iconName) => (
                                            <SelectItem key={iconName} value={iconName}>
                                                <div className="flex items-center gap-2">
                                                    <DynamicIcon name={iconName} className="size-4" />
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

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">Active</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Show this item in the navigation sidebar.
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Create Item
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/settings/pinned-navigation">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
