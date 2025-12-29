import { Link, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, FileText, Edit, Trash2, Eye, Settings, Send, Archive } from 'lucide-react';
import type { PageProps, Collection, Content, PaginatedData } from '@/types';
import { formatDate } from '@/utils/date';

interface CollectionsShowProps extends PageProps {
    collection: Collection;
    contents: PaginatedData<Content>;
}

export default function CollectionsShow({ collection, contents }: CollectionsShowProps) {
    const handleDeleteContent = (content: Content) => {
        router.delete(`/contents/${content._id}`);
    };

    const handlePublish = (content: Content) => {
        router.post(`/contents/${content._id}/publish`);
    };

    const handleUnpublish = (content: Content) => {
        router.post(`/contents/${content._id}/unpublish`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-success text-success-foreground">Published</Badge>;
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'archived':
                return <Badge variant="outline">Archived</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
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

                {/* Contents Table */}
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
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contents.data.map((content) => (
                                    <TableRow key={content._id}>
                                        <TableCell>
                                            <Link
                                                href={`/contents/${content._id}/edit`}
                                                className="font-medium hover:text-primary transition-colors"
                                            >
                                                {content.title}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                /{collection.slug}/{content.slug}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(content.status)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground">
                                                v{content.versions_count ?? content.current_version}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(content.updated_at)}
                                        </TableCell>
                                        <TableCell>
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/contents/${content._id}/edit`}>
                                                                <Edit className="size-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {content.status === 'draft' ? (
                                                            <DropdownMenuItem onClick={() => handlePublish(content)}>
                                                                <Send className="size-4 mr-2" />
                                                                Publish
                                                            </DropdownMenuItem>
                                                        ) : content.status === 'published' ? (
                                                            <DropdownMenuItem onClick={() => handleUnpublish(content)}>
                                                                <Archive className="size-4 mr-2" />
                                                                Unpublish
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                <Trash2 className="size-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "{content.title}"? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteContent(content)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

                {/* Pagination */}
                {contents.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: contents.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === contents.current_page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => router.get(`/collections/${collection.slug}`, { page })}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

