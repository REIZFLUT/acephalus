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
import { Plus, MoreHorizontal, FolderOpen, Edit, Trash2, Eye } from 'lucide-react';
import type { PageProps, Collection } from '@/types';

interface CollectionsIndexProps extends PageProps {
    collections: (Collection & { contents_count: number })[];
}

export default function CollectionsIndex({ collections }: CollectionsIndexProps) {
    const handleDelete = (collection: Collection) => {
        router.delete(`/collections/${collection.slug}`);
    };

    return (
        <AppLayout
            title="Collections"
            breadcrumbs={[{ label: 'Collections' }]}
            actions={
                <Button asChild>
                    <Link href="/collections/create">
                        <Plus className="size-4 mr-2" />
                        New Collection
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your content collections and their schemas
                    </p>
                </div>

                {collections.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FolderOpen className="size-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                Collections define the structure of your content. Create your first collection to start managing content.
                            </p>
                            <Button asChild>
                                <Link href="/collections/create">
                                    <Plus className="size-4 mr-2" />
                                    Create your first collection
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Contents</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {collections.map((collection) => (
                                    <TableRow key={collection._id}>
                                        <TableCell>
                                            <Link
                                                href={`/collections/${collection.slug}`}
                                                className="font-medium hover:text-primary transition-colors"
                                            >
                                                {collection.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-muted px-2 py-1 rounded">
                                                {collection.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {collection.contents_count} items
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">
                                            {collection.description || '—'}
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
                                                            <Link href={`/collections/${collection.slug}`}>
                                                                <Eye className="size-4 mr-2" />
                                                                View Contents
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/collections/${collection.slug}/edit`}>
                                                                <Edit className="size-4 mr-2" />
                                                                Edit Collection
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                <Trash2 className="size-4 mr-2" />
                                                                Delete Collection
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "{collection.name}"? This will also delete all {collection.contents_count} content items. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(collection)}
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
            </div>
        </AppLayout>
    );
}

