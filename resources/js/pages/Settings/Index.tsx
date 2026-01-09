import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Plus, Pencil, Trash2, Lock, Box, Layers, BookCopy, Image, Shield, Key, Users, Pin, FolderOpen, Filter, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { WrapperPurposeIcon } from '@/components/WrapperPurposeIcon';
import { EditionIcon } from '@/components/EditionIcon';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Can, usePermission } from '@/hooks/use-permission';
import { useTranslation } from '@/hooks/use-translation';
import type { PageProps, WrapperPurpose, Edition, PinnedNavigationItem, Collection, FilterView } from '@/types';

/** Roles that cannot be deleted */
const PROTECTED_ROLES = ['super-admin', 'admin', 'editor', 'author'];

interface MediaMetaField {
    _id: string;
    slug: string;
    name: string;
    description: string | null;
    field_type: string;
    options: { value: string; label: string }[] | null;
    is_system: boolean;
    required: boolean;
    placeholder: string | null;
    order: number;
}

interface Role {
    id: number;
    name: string;
    permissions_count?: number;
    users_count?: number;
}

interface PinnedNavigationItemWithRelations extends PinnedNavigationItem {
    collection?: Pick<Collection, '_id' | 'name' | 'slug'>;
    filter_view?: Pick<FilterView, '_id' | 'name' | 'slug'>;
}

interface SettingsIndexProps extends PageProps {
    purposes: WrapperPurpose[];
    editions: Edition[];
    mediaMetaFields?: MediaMetaField[];
    roles?: Role[];
    pinnedNavigationItems?: PinnedNavigationItemWithRelations[];
    activeTab?: string;
}

export default function SettingsIndex({ purposes, editions, mediaMetaFields = [], roles = [], pinnedNavigationItems = [], activeTab = 'wrapper-purposes' }: SettingsIndexProps) {
    const [currentTab, setCurrentTab] = useState(activeTab);
    const { can } = usePermission();
    const { t } = useLaravelReactI18n();
    const { resolveTranslation } = useTranslation();

    const handleDeletePinnedNavigation = (id: string) => {
        router.delete(`/settings/pinned-navigation/${id}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReorderPinnedNavigation = (index: number, direction: 'up' | 'down') => {
        const items = [...pinnedNavigationItems];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Swap items
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        
        // Send new order to backend
        router.post('/settings/pinned-navigation/reorder', {
            items: items.map((item) => item._id),
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeletePurpose = (slug: string) => {
        router.delete(`/settings/wrapper-purposes/${slug}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeleteEdition = (slug: string) => {
        router.delete(`/settings/editions/${slug}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeleteMediaMetaField = (slug: string) => {
        router.delete(`/settings/media-meta-fields/${slug}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeleteRole = (roleId: number) => {
        router.delete(`/settings/roles/${roleId}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getFieldTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            text: 'Text',
            textarea: 'Textarea',
            select: 'Select',
            multi_select: 'Multi-Select',
            number: 'Number',
            date: 'Date',
            url: 'URL',
            email: 'Email',
        };
        return labels[type] || type;
    };

    const getRoleBadgeVariant = (roleName: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (roleName) {
            case 'super-admin':
                return 'destructive';
            case 'admin':
                return 'default';
            default:
                return 'secondary';
        }
    };

    const getActionButton = () => {
        switch (currentTab) {
            case 'wrapper-purposes':
                return (
                    <Can permission="wrapper-purposes.create">
                        <Button asChild>
                            <Link href="/settings/wrapper-purposes/create">
                                <Plus className="size-4 mr-2" />
                                Add Purpose
                            </Link>
                        </Button>
                    </Can>
                );
            case 'editions':
                return (
                    <Can permission="editions.create">
                        <Button asChild>
                            <Link href="/settings/editions/create">
                                <Plus className="size-4 mr-2" />
                                Add Edition
                            </Link>
                        </Button>
                    </Can>
                );
            case 'media-meta-fields':
                return (
                    <Can permission="media-meta-fields.create">
                        <Button asChild>
                            <Link href="/settings/media-meta-fields/create">
                                <Plus className="size-4 mr-2" />
                                Add Field
                            </Link>
                        </Button>
                    </Can>
                );
            case 'roles':
                return (
                    <Can permission="roles.create">
                        <Button asChild>
                            <Link href="/settings/roles/create">
                                <Plus className="size-4 mr-2" />
                                Add Role
                            </Link>
                        </Button>
                    </Can>
                );
            case 'pinned-navigation':
                return (
                    <Can permission="pinned-navigation.create">
                        <Button asChild>
                            <Link href="/settings/pinned-navigation/create">
                                <Plus className="size-4 mr-2" />
                                Add Item
                            </Link>
                        </Button>
                    </Can>
                );
            default:
                return null;
        }
    };

    return (
        <AppLayout
            title="Settings"
            breadcrumbs={[
                { label: 'Settings' },
            ]}
            actions={getActionButton()}
        >
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <TabsList className="grid w-full max-w-4xl grid-cols-5">
                    <TabsTrigger value="wrapper-purposes" className="gap-2">
                        <Layers className="size-4" />
                        <span className="hidden sm:inline">Wrapper Purposes</span>
                        <span className="sm:hidden">Wrappers</span>
                    </TabsTrigger>
                    <TabsTrigger value="editions" className="gap-2">
                        <BookCopy className="size-4" />
                        Editions
                    </TabsTrigger>
                    <TabsTrigger value="media-meta-fields" className="gap-2">
                        <Image className="size-4" />
                        <span className="hidden sm:inline">Media Fields</span>
                        <span className="sm:hidden">Media</span>
                    </TabsTrigger>
                    {can('roles.view') && (
                        <TabsTrigger value="roles" className="gap-2">
                            <Shield className="size-4" />
                            Roles
                        </TabsTrigger>
                    )}
                    {can('pinned-navigation.view') && (
                        <TabsTrigger value="pinned-navigation" className="gap-2">
                            <Pin className="size-4" />
                            <span className="hidden sm:inline">Navigation</span>
                            <span className="sm:hidden">Nav</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Wrapper Purposes Tab */}
                <TabsContent value="wrapper-purposes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Wrapper Purposes</CardTitle>
                            <CardDescription>
                                Manage the available purposes for wrapper elements. 
                                These can be enabled per collection.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {purposes.length === 0 ? (
                                <div className="text-center py-12">
                                    <Box className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Wrapper Purposes</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create your first wrapper purpose to get started.
                                    </p>
                                    <Can permission="wrapper-purposes.create">
                                        <Button asChild>
                                            <Link href="/settings/wrapper-purposes/create">
                                                <Plus className="size-4 mr-2" />
                                                Add Purpose
                                            </Link>
                                        </Button>
                                    </Can>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">Icon</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>CSS Class</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purposes.map((purpose) => (
                                            <TableRow key={purpose._id}>
                                                <TableCell>
                                                    <div className="flex items-center justify-center">
                                                        <WrapperPurposeIcon 
                                                            iconName={purpose.icon} 
                                                            className="size-5 text-muted-foreground" 
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{resolveTranslation(purpose.name)}</span>
                                                        {purpose.is_system && (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <Lock className="size-3" />
                                                                System
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        {purpose.slug}
                                                    </code>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">
                                                    {resolveTranslation(purpose.description) || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {purpose.css_class ? (
                                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                            {purpose.css_class}
                                                        </code>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Can permission="wrapper-purposes.update">
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <Link href={`/settings/wrapper-purposes/${purpose.slug}/edit`}>
                                                                    <Pencil className="size-4" />
                                                                </Link>
                                                            </Button>
                                                        </Can>
                                                        <Can permission="wrapper-purposes.delete">
                                                            {!purpose.is_system && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Purpose</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete "{resolveTranslation(purpose.name)}"? 
                                                                                This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeletePurpose(purpose.slug)}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </Can>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Editions Tab */}
                <TabsContent value="editions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Editions</CardTitle>
                            <CardDescription>
                                Manage the available editions for filtering content. 
                                Editions like "Print", "Web", or "ePaper" can be enabled per collection.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {editions.length === 0 ? (
                                <div className="text-center py-12">
                                    <BookCopy className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Editions</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create your first edition to get started.
                                    </p>
                                    <Can permission="editions.create">
                                        <Button asChild>
                                            <Link href="/settings/editions/create">
                                                <Plus className="size-4 mr-2" />
                                                Add Edition
                                            </Link>
                                        </Button>
                                    </Can>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">Icon</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editions.map((edition) => (
                                            <TableRow key={edition._id}>
                                                <TableCell>
                                                    <div className="flex items-center justify-center">
                                                        <EditionIcon 
                                                            iconName={edition.icon} 
                                                            className="size-5 text-muted-foreground" 
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{resolveTranslation(edition.name)}</span>
                                                        {edition.is_system && (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <Lock className="size-3" />
                                                                System
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        {edition.slug}
                                                    </code>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">
                                                    {resolveTranslation(edition.description) || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Can permission="editions.update">
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <Link href={`/settings/editions/${edition.slug}/edit`}>
                                                                    <Pencil className="size-4" />
                                                                </Link>
                                                            </Button>
                                                        </Can>
                                                        <Can permission="editions.delete">
                                                            {!edition.is_system && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Edition</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete "{resolveTranslation(edition.name)}"? 
                                                                                This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteEdition(edition.slug)}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </Can>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Media Meta Fields Tab */}
                <TabsContent value="media-meta-fields">
                    <Card>
                        <CardHeader>
                            <CardTitle>Media Meta Fields</CardTitle>
                            <CardDescription>
                                Define additional metadata fields for media files.
                                These can be restricted per collection.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mediaMetaFields.length === 0 ? (
                                <div className="text-center py-12">
                                    <Image className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Media Fields</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create your first media meta field to get started.
                                    </p>
                                    <Can permission="media-meta-fields.create">
                                        <Button asChild>
                                            <Link href="/settings/media-meta-fields/create">
                                                <Plus className="size-4 mr-2" />
                                                Add Field
                                            </Link>
                                        </Button>
                                    </Can>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Required</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mediaMetaFields.map((field) => (
                                            <TableRow key={field._id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{field.name}</span>
                                                        {field.is_system && (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <Lock className="size-3" />
                                                                System
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        {field.slug}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {getFieldTypeLabel(field.field_type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {field.required ? (
                                                        <Badge variant="default">Yes</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">No</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">
                                                    {field.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Can permission="media-meta-fields.update">
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <Link href={`/settings/media-meta-fields/${field.slug}/edit`}>
                                                                    <Pencil className="size-4" />
                                                                </Link>
                                                            </Button>
                                                        </Can>
                                                        <Can permission="media-meta-fields.delete">
                                                            {!field.is_system && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Field</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete "{field.name}"? 
                                                                                This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteMediaMetaField(field.slug)}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </Can>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Roles Tab */}
                <Can permission="roles.view">
                    <TabsContent value="roles">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="size-5" />
                                    Roles & Permissions
                                </CardTitle>
                                <CardDescription>
                                    Manage user roles and their associated permissions.
                                    Roles determine what actions users can perform in the system.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {roles.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Shield className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Roles</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Run the database seeder to create default roles.
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Role</TableHead>
                                                <TableHead className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Key className="size-4" />
                                                        Permissions
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Users className="size-4" />
                                                        Users
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {roles.map((role) => {
                                                const isProtected = PROTECTED_ROLES.includes(role.name);
                                                const isSuperAdmin = role.name === 'super-admin';
                                                
                                                return (
                                                    <TableRow key={role.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={getRoleBadgeVariant(role.name)}>
                                                                    {role.name}
                                                                </Badge>
                                                                {isProtected && (
                                                                    <Lock className="size-3.5 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            {isSuperAdmin && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Bypasses all permission checks
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {isSuperAdmin ? (
                                                                <span className="text-muted-foreground text-sm">All</span>
                                                            ) : (
                                                                <span className="font-mono text-sm">
                                                                    {role.permissions_count ?? 0}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="font-mono text-sm">
                                                                {role.users_count ?? 0}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Can permission="roles.update">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        asChild
                                                                    >
                                                                        <Link href={`/settings/roles/${role.id}/edit`}>
                                                                            <Pencil className="size-4" />
                                                                        </Link>
                                                                    </Button>
                                                                </Can>
                                                                <Can permission="roles.delete">
                                                                    {!isProtected && (role.users_count ?? 0) === 0 && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="text-destructive hover:text-destructive"
                                                                                >
                                                                                    <Trash2 className="size-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Are you sure you want to delete the "{role.name}" role?
                                                                                        This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDeleteRole(role.id)}
                                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                    >
                                                                                        Delete
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </Can>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Can>

                {/* Pinned Navigation Tab */}
                <Can permission="pinned-navigation.view">
                    <TabsContent value="pinned-navigation">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Pin className="size-5" />
                                    Pinned Navigation
                                </CardTitle>
                                <CardDescription>
                                    Configure pinned navigation items that appear at the top of the sidebar.
                                    Link directly to collections with optional filter views.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {pinnedNavigationItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Pin className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Pinned Items</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Add navigation shortcuts to frequently used collections.
                                        </p>
                                        <Can permission="pinned-navigation.create">
                                            <Button asChild>
                                                <Link href="/settings/pinned-navigation/create">
                                                    <Plus className="size-4 mr-2" />
                                                    Add Item
                                                </Link>
                                            </Button>
                                        </Can>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16 text-center">Order</TableHead>
                                                <TableHead className="w-12">Icon</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Collection</TableHead>
                                                <TableHead>Filter View</TableHead>
                                                <TableHead className="text-center">Active</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pinnedNavigationItems.map((item, index) => (
                                                <TableRow key={item._id}>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Can permission="pinned-navigation.update">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7"
                                                                    disabled={index === 0}
                                                                    onClick={() => handleReorderPinnedNavigation(index, 'up')}
                                                                >
                                                                    <ChevronUp className="size-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7"
                                                                    disabled={index === pinnedNavigationItems.length - 1}
                                                                    onClick={() => handleReorderPinnedNavigation(index, 'down')}
                                                                >
                                                                    <ChevronDown className="size-4" />
                                                                </Button>
                                                            </Can>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center">
                                                            <DynamicIcon 
                                                                name={item.icon} 
                                                                className="size-5 text-muted-foreground" 
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium">{item.name}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <FolderOpen className="size-4 text-muted-foreground" />
                                                            <span>{item.collection?.name || '-'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.filter_view ? (
                                                            <div className="flex items-center gap-2">
                                                                <Filter className="size-4 text-muted-foreground" />
                                                                <span>{item.filter_view.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item.is_active ? (
                                                            <Check className="size-4 text-green-600 mx-auto" />
                                                        ) : (
                                                            <X className="size-4 text-muted-foreground mx-auto" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Can permission="pinned-navigation.update">
                                                                <Button variant="ghost" size="icon" asChild>
                                                                    <Link href={`/settings/pinned-navigation/${item._id}/edit`}>
                                                                        <Pencil className="size-4" />
                                                                    </Link>
                                                                </Button>
                                                            </Can>
                                                            <Can permission="pinned-navigation.delete">
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Pinned Item</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete "{item.name}"? 
                                                                                This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeletePinnedNavigation(item._id)}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </Can>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Can>
            </Tabs>
        </AppLayout>
    );
}
