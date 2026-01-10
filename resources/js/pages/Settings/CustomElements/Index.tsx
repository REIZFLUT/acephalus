import { Link, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Pencil, Trash2, Lock, Box, MoreHorizontal, Copy, GripVertical } from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import { SettingsNavigation } from '@/components/settings';
import { Can } from '@/hooks/use-permission';
import { useTranslation } from '@/hooks/use-translation';
import type { PageProps, CustomElementModel, CustomElementCategory, CustomElementInputType } from '@/types';

interface CustomElementsIndexProps extends PageProps {
    customElements: CustomElementModel[];
    categories: CustomElementCategory[];
    inputTypes: CustomElementInputType[];
}

const categoryLabels: Record<CustomElementCategory, string> = {
    content: 'Content',
    data: 'Data',
    layout: 'Layout',
    interactive: 'Interactive',
    media: 'Media',
};

const categoryColors: Record<CustomElementCategory, string> = {
    content: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    data: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    layout: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    interactive: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    media: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
};

export default function CustomElementsIndex({ customElements, categories, inputTypes }: CustomElementsIndexProps) {
    const { resolveTranslation } = useTranslation();

    const handleDelete = (type: string) => {
        router.delete(`/settings/custom-elements/${type}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDuplicate = (type: string) => {
        router.post(`/settings/custom-elements/${type}/duplicate`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Group elements by category
    const elementsByCategory = customElements.reduce((acc, element) => {
        const category = element.category || 'content';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(element);
        return acc;
    }, {} as Record<string, CustomElementModel[]>);

    return (
        <AppLayout
            title="Settings"
            breadcrumbs={[
                { label: 'Settings' },
            ]}
            actions={
                <Can permission="custom-elements.create">
                    <Button asChild>
                        <Link href="/settings/custom-elements/create">
                            <Plus className="size-4 mr-2" />
                            Create Element
                        </Link>
                    </Button>
                </Can>
            }
        >
            <SettingsNavigation activeTab="custom-elements">
                {/* Custom Elements Content */}
                <div className="space-y-6">
                    {customElements.length === 0 ? (
                        <Card>
                            <CardContent className="py-12">
                                <div className="text-center">
                                    <Box className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Custom Elements</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create your first custom element to extend the content editor.
                                    </p>
                                    <Can permission="custom-elements.create">
                                        <Button asChild>
                                            <Link href="/settings/custom-elements/create">
                                                <Plus className="size-4 mr-2" />
                                                Create Element
                                            </Link>
                                        </Button>
                                    </Can>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Summary Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Custom Elements</CardTitle>
                                    <CardDescription>
                                        Manage custom element types that can be used in the content editor.
                                        Custom elements allow you to create reusable content blocks with custom fields.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((category) => {
                                            const count = elementsByCategory[category]?.length || 0;
                                            return (
                                                <Badge 
                                                    key={category} 
                                                    variant="outline"
                                                    className={count > 0 ? categoryColors[category] : ''}
                                                >
                                                    {categoryLabels[category]}: {count}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Elements Table */}
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                <TableHead className="w-12">Icon</TableHead>
                                                <TableHead>Label</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-center">Fields</TableHead>
                                                <TableHead className="text-center">Children</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customElements.map((element) => (
                                                <TableRow key={element._id}>
                                                    <TableCell>
                                                        <GripVertical className="size-4 text-muted-foreground cursor-grab" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center">
                                                            <DynamicIcon 
                                                                name={element.icon || 'box'} 
                                                                className="size-5 text-muted-foreground" 
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {resolveTranslation(element.label)}
                                                            </span>
                                                            {element.is_system && (
                                                                <Badge variant="secondary" className="gap-1">
                                                                    <Lock className="size-3" />
                                                                    System
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {element.description && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                                                                {resolveTranslation(element.description)}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                            {element.type}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={categoryColors[element.category]}
                                                        >
                                                            {categoryLabels[element.category]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-mono text-sm">
                                                            {element.fields?.length || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {element.can_have_children ? (
                                                            <Badge variant="default" className="text-xs">Yes</Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">No</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="size-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <Can permission="custom-elements.update">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/settings/custom-elements/${element.type}/edit`}>
                                                                            <Pencil className="size-4 mr-2" />
                                                                            Edit
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                </Can>
                                                                <Can permission="custom-elements.create">
                                                                    <DropdownMenuItem onClick={() => handleDuplicate(element.type)}>
                                                                        <Copy className="size-4 mr-2" />
                                                                        Duplicate
                                                                    </DropdownMenuItem>
                                                                </Can>
                                                                {!element.is_system && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <Can permission="custom-elements.delete">
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <DropdownMenuItem
                                                                                        onSelect={(e) => e.preventDefault()}
                                                                                        className="text-destructive focus:text-destructive"
                                                                                    >
                                                                                        <Trash2 className="size-4 mr-2" />
                                                                                        Delete
                                                                                    </DropdownMenuItem>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Delete Custom Element</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            Are you sure you want to delete "{resolveTranslation(element.label)}"? 
                                                                                            This action cannot be undone. Existing content using this element 
                                                                                            type may become inaccessible.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                        <AlertDialogAction
                                                                                            onClick={() => handleDelete(element.type)}
                                                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                        >
                                                                                            Delete
                                                                                        </AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </Can>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </SettingsNavigation>
        </AppLayout>
    );
}
