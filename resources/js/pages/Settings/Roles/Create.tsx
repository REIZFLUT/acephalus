import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import type { PageProps, Permission, PermissionCategory } from '@/types';

interface RolesCreateProps extends PageProps {
    permissions: Permission[];
    permissionCategories: Record<PermissionCategory, string[]>;
}

const CATEGORY_LABELS: Record<string, string> = {
    contents: 'Contents',
    collections: 'Collections',
    collections_schema: 'Collection Schema',
    media: 'Media',
    media_meta_fields: 'Media Meta Fields',
    editions: 'Editions',
    wrapper_purposes: 'Wrapper Purposes',
    users: 'Users',
    roles: 'Roles',
    settings: 'Settings',
};

const PERMISSION_LABELS: Record<string, string> = {
    view: 'View',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    publish: 'Publish',
};

function getPermissionAction(permission: string): string {
    const parts = permission.split('.');
    const action = parts[parts.length - 1];
    return PERMISSION_LABELS[action] || action;
}

export default function RolesCreate({ permissions, permissionCategories }: RolesCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: [] as string[],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/settings/roles');
    };

    const togglePermission = (permissionName: string) => {
        const newPermissions = data.permissions.includes(permissionName)
            ? data.permissions.filter((p) => p !== permissionName)
            : [...data.permissions, permissionName];
        setData('permissions', newPermissions);
    };

    const toggleCategory = (category: string, categoryPermissions: string[]) => {
        const allSelected = categoryPermissions.every((p) => data.permissions.includes(p));
        
        if (allSelected) {
            // Remove all permissions in this category
            setData('permissions', data.permissions.filter((p) => !categoryPermissions.includes(p)));
        } else {
            // Add all permissions in this category
            const newPermissions = [...new Set([...data.permissions, ...categoryPermissions])];
            setData('permissions', newPermissions);
        }
    };

    const selectAll = () => {
        const allPermissions = permissions.map((p) => p.name);
        setData('permissions', allPermissions);
    };

    const deselectAll = () => {
        setData('permissions', []);
    };

    return (
        <AppLayout
            title="Create Role"
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Roles', href: '/settings/roles' },
                { label: 'Create' },
            ]}
        >
            <div className="max-w-4xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/settings/roles">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Roles
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="size-5" />
                                    Create Role
                                </CardTitle>
                                <CardDescription>
                                    Define a new role with specific permissions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Role Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., content-manager"
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Permissions</CardTitle>
                                        <CardDescription>
                                            Select which permissions this role should have.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={selectAll}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={deselectAll}
                                        >
                                            Deselect All
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {Object.entries(permissionCategories).map(([category, categoryPermissions]) => {
                                        const allSelected = categoryPermissions.every((p) => 
                                            data.permissions.includes(p)
                                        );
                                        const someSelected = categoryPermissions.some((p) => 
                                            data.permissions.includes(p)
                                        );
                                        
                                        return (
                                            <div key={category}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Checkbox
                                                        id={`category-${category}`}
                                                        checked={allSelected}
                                                        // @ts-expect-error - indeterminate is valid HTML attribute
                                                        indeterminate={someSelected && !allSelected}
                                                        onCheckedChange={() => toggleCategory(category, categoryPermissions)}
                                                    />
                                                    <Label 
                                                        htmlFor={`category-${category}`}
                                                        className="text-sm font-semibold cursor-pointer"
                                                    >
                                                        {CATEGORY_LABELS[category] || category}
                                                    </Label>
                                                </div>
                                                <div className="ml-7 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                    {categoryPermissions.map((permission) => (
                                                        <div key={permission} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={permission}
                                                                checked={data.permissions.includes(permission)}
                                                                onCheckedChange={() => togglePermission(permission)}
                                                            />
                                                            <Label
                                                                htmlFor={permission}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                {getPermissionAction(permission)}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Separator className="mt-4" />
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.permissions && (
                                    <p className="text-sm text-destructive mt-4">{errors.permissions}</p>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={processing}>
                                {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                Create Role
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/settings/roles">Cancel</Link>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

