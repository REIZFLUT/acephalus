import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
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
import { Plus, MoreHorizontal, FolderOpen, Edit, Trash2, Eye, Lock as LockIcon, Unlock } from 'lucide-react';
import type { PageProps, Collection } from '@/types';
import { LockBadge } from '@/components/ui/lock-badge';
import { LockDialog } from '@/components/ui/lock-dialog';
import { usePermission } from '@/hooks/use-permission';

interface CollectionsIndexProps extends PageProps {
    collections: (Collection & { contents_count: number })[];
}

export default function CollectionsIndex({ collections }: CollectionsIndexProps) {
    const { t } = useLaravelReactI18n();
    const { can } = usePermission();
    const [lockDialogOpen, setLockDialogOpen] = useState(false);
    const [lockDialogCollection, setLockDialogCollection] = useState<Collection | null>(null);
    const [lockDialogIsLocking, setLockDialogIsLocking] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDelete = (collection: Collection) => {
        router.delete(`/collections/${collection.slug}`);
    };

    const openLockDialog = (collection: Collection, isLocking: boolean) => {
        setLockDialogCollection(collection);
        setLockDialogIsLocking(isLocking);
        setLockDialogOpen(true);
    };

    const handleLockConfirm = (reason?: string) => {
        if (!lockDialogCollection) return;
        setIsProcessing(true);

        if (lockDialogIsLocking) {
            router.post(`/collections/${lockDialogCollection.slug}/lock`, { reason }, {
                preserveScroll: true,
                onSuccess: () => setLockDialogOpen(false),
                onFinish: () => setIsProcessing(false),
            });
        } else {
            router.delete(`/collections/${lockDialogCollection.slug}/lock`, {
                preserveScroll: true,
                onSuccess: () => setLockDialogOpen(false),
                onFinish: () => setIsProcessing(false),
            });
        }
    };

    return (
        <AppLayout
            title={t('Collections')}
            breadcrumbs={[{ label: t('Collections') }]}
            actions={
                <Button asChild>
                    <Link href="/collections/create">
                        <Plus className="size-4 mr-2" />
                        {t('New Collection')}
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Collections')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('Manage your content collections and their schemas')}
                    </p>
                </div>

                {collections.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FolderOpen className="size-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">{t('No collections yet')}</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                {t('Collections define the structure of your content. Create your first collection to start managing content.')}
                            </p>
                            <Button asChild>
                                <Link href="/collections/create">
                                    <Plus className="size-4 mr-2" />
                                    {t('Create your first collection')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Name')}</TableHead>
                                    <TableHead>{t('Slug')}</TableHead>
                                    <TableHead>{t('Lock')}</TableHead>
                                    <TableHead>{t('Contents')}</TableHead>
                                    <TableHead>{t('Description')}</TableHead>
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
                                            <LockBadge
                                                isLocked={collection.is_locked ?? false}
                                                lockedAt={collection.locked_at}
                                                lockReason={collection.lock_reason}
                                                source="self"
                                                showUnlocked
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {t(':count items', { count: collection.contents_count })}
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
                                                                {t('View Contents')}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild disabled={collection.is_locked}>
                                                            <Link href={`/collections/${collection.slug}/edit`}>
                                                                <Edit className="size-4 mr-2" />
                                                                {t('Edit Collection')}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {collection.is_locked ? (
                                                            can('collections.unlock') && (
                                                                <DropdownMenuItem onClick={() => openLockDialog(collection, false)}>
                                                                    <Unlock className="size-4 mr-2" />
                                                                    {t('Unlock Collection')}
                                                                </DropdownMenuItem>
                                                            )
                                                        ) : (
                                                            can('collections.lock') && (
                                                                <DropdownMenuItem onClick={() => openLockDialog(collection, true)}>
                                                                    <LockIcon className="size-4 mr-2" />
                                                                    {t('Lock Collection')}
                                                                </DropdownMenuItem>
                                                            )
                                                        )}
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem 
                                                                className="text-destructive focus:text-destructive"
                                                                disabled={collection.is_locked}
                                                            >
                                                                <Trash2 className="size-4 mr-2" />
                                                                {t('Delete Collection')}
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('Delete Collection')}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('Are you sure you want to delete ":collection"? This will also delete all :count content items. This action cannot be undone.', { collection: collection.name, count: collection.contents_count })}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(collection)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            {t('Delete')}
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

                {/* Lock Dialog */}
                <LockDialog
                    open={lockDialogOpen}
                    onOpenChange={setLockDialogOpen}
                    onConfirm={handleLockConfirm}
                    isLocking={lockDialogIsLocking}
                    resourceType="collection"
                    resourceName={lockDialogCollection?.name}
                    processing={isProcessing}
                />
            </div>
        </AppLayout>
    );
}
