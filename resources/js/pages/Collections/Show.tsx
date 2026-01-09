import { Link, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Settings } from 'lucide-react';
import type { PageProps, Collection, Content, PaginatedData, Edition, ListViewSettings, CollectionSchema, FilterView, FilterField } from '@/types';
import { ContentDataTable } from '@/components/data-table';
import { FilterViewSelector } from '@/components/filters';
import { LockBadge } from '@/components/ui/lock-badge';
import { LockButton } from '@/components/ui/lock-button';
import { usePermission } from '@/hooks/use-permission';

interface CollectionsShowProps extends PageProps {
    collection: Collection;
    contents: PaginatedData<Content>;
    editions?: Edition[];
    filterViews?: FilterView[];
    selectedFilterView?: FilterView | null;
    availableFilterFields?: FilterField[];
}

// Default list view settings used when collection doesn't have custom settings
const defaultListViewSettings: ListViewSettings = {
    columns: [
        { id: 'title', label: 'Title', type: 'base', visible: true, toggleable: false, sortable: true },
        { id: 'status', label: 'Status', type: 'base', visible: true, toggleable: true, sortable: true },
        { id: 'current_version', label: 'Version', type: 'base', visible: true, toggleable: true, sortable: true },
        { id: 'updated_at', label: 'Updated', type: 'base', visible: true, toggleable: true, sortable: true },
        { id: 'slug', label: 'Slug', type: 'base', visible: false, toggleable: true, sortable: true },
        { id: 'created_at', label: 'Created', type: 'base', visible: false, toggleable: true, sortable: true },
        { id: 'editions', label: 'Editions', type: 'base', visible: false, toggleable: true, sortable: false },
    ],
    default_per_page: 20,
    per_page_options: [10, 20, 50, 100],
    default_sort_column: 'updated_at',
    default_sort_direction: 'desc',
};

export default function CollectionsShow({ 
    collection, 
    contents, 
    editions = [], 
    filterViews = [],
    selectedFilterView = null,
    availableFilterFields = [],
}: CollectionsShowProps) {
    const { can } = usePermission();
    
    // Get list view settings from collection schema or use defaults
    const schema = collection.schema as CollectionSchema | null;
    const listViewSettings: ListViewSettings = schema?.list_view_settings || defaultListViewSettings;
    
    const isLocked = collection.is_locked ?? false;

    const handleFilterViewSelect = (filterView: FilterView | null) => {
        const params: Record<string, string> = {};
        if (filterView) {
            params.filter_view = filterView._id;
        }
        router.get(`/collections/${collection.slug}`, params, { preserveState: true });
    };

    const handleSaveFilterView = async (filterViewData: Partial<FilterView>) => {
        const response = await fetch('/settings/filter-views/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
            },
            body: JSON.stringify({
                ...filterViewData,
                collection_id: collection.id,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save filter view');
        }

        router.reload({ only: ['filterViews'] });
    };

    const handleUpdateFilterView = async (id: string, filterViewData: Partial<FilterView>) => {
        const response = await fetch(`/settings/filter-views/${id}/json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
            },
            body: JSON.stringify(filterViewData),
        });

        if (!response.ok) {
            throw new Error('Failed to update filter view');
        }

        router.reload({ only: ['filterViews', 'selectedFilterView'] });
    };

    const handleDeleteFilterView = async (id: string) => {
        const response = await fetch(`/settings/filter-views/${id}/json`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete filter view');
        }

        // Clear selection and reload
        router.get(`/collections/${collection.slug}`, {}, { preserveState: true });
    };

    return (
        <AppLayout
            title={collection.name}
            breadcrumbs={[
                { label: 'Collections', href: '/collections' },
                { label: collection.name },
            ]}
            actions={
                <div className="flex gap-2">
                    <LockButton
                        isLocked={isLocked}
                        lockRoute={`/collections/${collection.slug}/lock`}
                        unlockRoute={`/collections/${collection.slug}/lock`}
                        resourceType="collection"
                        resourceName={collection.name}
                        canLock={can('collections.lock')}
                        canUnlock={can('collections.unlock')}
                    />
                    <Button variant="outline" asChild disabled={isLocked}>
                        <Link href={`/collections/${collection.slug}/edit`}>
                            <Settings className="size-4 mr-2" />
                            Settings
                        </Link>
                    </Button>
                    <Button asChild disabled={isLocked}>
                        <Link href={`/collections/${collection.slug}/contents/create`}>
                            <Plus className="size-4 mr-2" />
                            New Content
                        </Link>
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Collection Header */}
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{collection.name}</h1>
                        <LockBadge
                            isLocked={isLocked}
                            lockedBy={undefined}
                            lockedAt={collection.locked_at}
                            lockReason={collection.lock_reason}
                            source="self"
                        />
                    </div>
                    {collection.description && (
                        <p className="text-muted-foreground mt-1">{collection.description}</p>
                    )}
                    <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                        <span>
                            Slug: <code className="bg-muted px-2 py-0.5 rounded">{collection.slug}</code>
                        </span>
                        <span>{contents.total} content items</span>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="py-4">
                        <FilterViewSelector
                            filterViews={filterViews}
                            selectedFilterView={selectedFilterView}
                            availableFields={availableFilterFields}
                            collectionId={collection.id}
                            onSelect={handleFilterViewSelect}
                            onSave={handleSaveFilterView}
                            onUpdate={handleUpdateFilterView}
                            onDelete={handleDeleteFilterView}
                        />
                    </CardContent>
                </Card>

                {/* Contents Data Table */}
                {contents.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="size-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                Start creating content for this collection.
                            </p>
                            <Button asChild>
                                <Link href={`/collections/${collection.slug}/contents/create`}>
                                    <Plus className="size-4 mr-2" />
                                    Create your first content
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <ContentDataTable
                        contents={contents.data}
                        collection={collection}
                        listViewSettings={listViewSettings}
                        editions={editions}
                    />
                )}
            </div>
        </AppLayout>
    );
}

