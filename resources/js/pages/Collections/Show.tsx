import { Link, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, FileText, Settings, Tag, X, BookOpen } from 'lucide-react';
import type { PageProps, Collection, Content, PaginatedData, CollectionRelease, Edition, ListViewSettings, CollectionSchema } from '@/types';
import { ContentDataTable } from '@/components/data-table';

interface ReleaseContent extends Content {
    release?: string;
    is_release_end?: boolean;
}

interface CollectionsShowProps extends PageProps {
    collection: Collection;
    contents: PaginatedData<ReleaseContent>;
    releases?: CollectionRelease[];
    selectedRelease?: string | null;
    editions?: Edition[];
    selectedEdition?: string | null;
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
        { id: 'current_release', label: 'Release', type: 'base', visible: false, toggleable: true, sortable: true },
        { id: 'editions', label: 'Editions', type: 'base', visible: false, toggleable: true, sortable: false },
    ],
    default_per_page: 20,
    per_page_options: [10, 20, 50, 100],
    default_sort_column: 'updated_at',
    default_sort_direction: 'desc',
};

export default function CollectionsShow({ collection, contents, releases = [], selectedRelease, editions = [], selectedEdition }: CollectionsShowProps) {
    // Get list view settings from collection schema or use defaults
    const schema = collection.schema as CollectionSchema | null;
    const listViewSettings: ListViewSettings = schema?.list_view_settings || defaultListViewSettings;

    const buildFilterParams = (overrides: { release?: string | null; edition?: string | null } = {}) => {
        const params: Record<string, string> = {};
        const release = overrides.release !== undefined ? overrides.release : selectedRelease;
        const edition = overrides.edition !== undefined ? overrides.edition : selectedEdition;
        
        if (release) params.release = release;
        if (edition) params.edition = edition;
        
        return params;
    };

    const handleReleaseFilter = (release: string) => {
        if (release === 'all') {
            router.get(`/collections/${collection.slug}`, buildFilterParams({ release: null }), { preserveState: true });
        } else {
            router.get(`/collections/${collection.slug}`, buildFilterParams({ release }), { preserveState: true });
        }
    };

    const handleEditionFilter = (edition: string) => {
        if (edition === 'all') {
            router.get(`/collections/${collection.slug}`, buildFilterParams({ edition: null }), { preserveState: true });
        } else {
            router.get(`/collections/${collection.slug}`, buildFilterParams({ edition }), { preserveState: true });
        }
    };

    const clearReleaseFilter = () => {
        router.get(`/collections/${collection.slug}`, buildFilterParams({ release: null }), { preserveState: true });
    };

    const clearEditionFilter = () => {
        router.get(`/collections/${collection.slug}`, buildFilterParams({ edition: null }), { preserveState: true });
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
                    <Button variant="outline" asChild>
                        <Link href={`/collections/${collection.slug}/edit`}>
                            <Settings className="size-4 mr-2" />
                            Settings
                        </Link>
                    </Button>
                    <Button asChild>
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
                    <h1 className="text-3xl font-bold tracking-tight">{collection.name}</h1>
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
                {(releases.length > 0 || editions.length > 0) && (
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Release Filter */}
                                {releases.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Tag className="size-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Release:</span>
                                        </div>
                                        <Select
                                            value={selectedRelease || 'all'}
                                            onValueChange={handleReleaseFilter}
                                        >
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue placeholder="All (current state)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All (current state)</SelectItem>
                                                {releases.slice().reverse().map((release) => (
                                                    <SelectItem key={release.name} value={release.name}>
                                                        {release.name}
                                                        {release.name === collection.current_release && ' (current)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedRelease && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearReleaseFilter}
                                                className="text-muted-foreground"
                                            >
                                                <X className="size-4 mr-1" />
                                                Clear
                                            </Button>
                                        )}
                                    </>
                                )}

                                {/* Edition Filter */}
                                {editions.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 border-l pl-4 ml-2">
                                            <BookOpen className="size-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Edition:</span>
                                        </div>
                                        <Select
                                            value={selectedEdition || 'all'}
                                            onValueChange={handleEditionFilter}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="All Editions" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Editions</SelectItem>
                                                {editions.map((edition) => (
                                                    <SelectItem key={edition._id} value={edition.slug}>
                                                        {edition.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedEdition && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearEditionFilter}
                                                className="text-muted-foreground"
                                            >
                                                <X className="size-4 mr-1" />
                                                Clear
                                            </Button>
                                        )}
                                    </>
                                )}

                                {/* Active filter badges */}
                                {(selectedRelease || selectedEdition) && (
                                    <div className="flex items-center gap-2 ml-auto">
                                        {selectedRelease && (
                                            <Badge variant="outline">
                                                Release: {selectedRelease}
                                            </Badge>
                                        )}
                                        {selectedEdition && (
                                            <Badge variant="outline">
                                                Edition: {editions.find(e => e.slug === selectedEdition)?.name || selectedEdition}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

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

