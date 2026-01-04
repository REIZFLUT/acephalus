import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
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
import { Plus, Pencil, Trash2, Lock, Box, Layers, BookCopy } from 'lucide-react';
import { WrapperPurposeIcon } from '@/components/WrapperPurposeIcon';
import { EditionIcon } from '@/components/EditionIcon';
import type { PageProps, WrapperPurpose, Edition } from '@/types';

interface SettingsIndexProps extends PageProps {
    purposes: WrapperPurpose[];
    editions: Edition[];
    activeTab?: string;
}

export default function SettingsIndex({ purposes, editions, activeTab = 'wrapper-purposes' }: SettingsIndexProps) {
    const [currentTab, setCurrentTab] = useState(activeTab);

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

    return (
        <AppLayout
            title="Settings"
            breadcrumbs={[
                { label: 'Settings' },
            ]}
            actions={
                currentTab === 'wrapper-purposes' ? (
                    <Button asChild>
                        <Link href="/settings/wrapper-purposes/create">
                            <Plus className="size-4 mr-2" />
                            Add Purpose
                        </Link>
                    </Button>
                ) : (
                    <Button asChild>
                        <Link href="/settings/editions/create">
                            <Plus className="size-4 mr-2" />
                            Add Edition
                        </Link>
                    </Button>
                )
            }
        >
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="wrapper-purposes" className="gap-2">
                        <Layers className="size-4" />
                        Wrapper Purposes
                    </TabsTrigger>
                    <TabsTrigger value="editions" className="gap-2">
                        <BookCopy className="size-4" />
                        Editions
                    </TabsTrigger>
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
                                    <Button asChild>
                                        <Link href="/settings/wrapper-purposes/create">
                                            <Plus className="size-4 mr-2" />
                                            Add Purpose
                                        </Link>
                                    </Button>
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
                                                        <span className="font-medium">{purpose.name}</span>
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
                                                    {purpose.description || '-'}
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
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/settings/wrapper-purposes/${purpose.slug}/edit`}>
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
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
                                                                            Are you sure you want to delete "{purpose.name}"? 
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
                                    <Button asChild>
                                        <Link href="/settings/editions/create">
                                            <Plus className="size-4 mr-2" />
                                            Add Edition
                                        </Link>
                                    </Button>
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
                                                        <span className="font-medium">{edition.name}</span>
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
                                                    {edition.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/settings/editions/${edition.slug}/edit`}>
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
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
                                                                            Are you sure you want to delete "{edition.name}"? 
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
            </Tabs>
        </AppLayout>
    );
}

