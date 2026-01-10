import { FormEvent } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Loader2, Shield, Trash2, Lock, Info } from 'lucide-react';
import { Can } from '@/hooks/use-permission';
import { CATEGORY_LABELS, getPermissionAction } from '@/lib/permissions';
import type { PageProps, Role, Permission, PermissionCategory } from '@/types';

interface RolesEditProps extends PageProps {
    role: Role;
    permissions: Permission[];
    permissionCategories: Record<PermissionCategory, string[]>;
    isProtected: boolean;
}

const PROTECTED_ROLES = ['super-admin', 'admin', 'editor', 'author', 'viewer'];

export default function RolesEdit({ role, permissions, permissionCategories, isProtected }: RolesEditProps) {
    const currentPermissions = role.permissions?.map((p) => p.name) ?? [];
    const isBuiltIn = PROTECTED_ROLES.includes(role.name);
    const isSuperAdmin = role.name === 'super-admin';

    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: currentPermissions,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/settings/roles/${role.id}`);
    };

    const handleDelete = () => {
        router.delete(`/settings/roles/${role.id}`);
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
            setData('permissions', data.permissions.filter((p) => !categoryPermissions.includes(p)));
        } else {
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

    // Super-admin role cannot be edited
    if (isSuperAdmin) {
        return (
            <AppLayout
                title={`Role: ${role.name}`}
                breadcrumbs={[
                    { label: 'Settings', href: '/settings' },
                    { label: 'Roles', href: '/settings/roles' },
                    { label: role.name },
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="size-5" />
                                Super Admin Role
                                <Badge variant="destructive">Protected</Badge>
                            </CardTitle>
                            <CardDescription>
                                The super-admin role cannot be modified. Users with this role bypass all permission checks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                                <Info className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground mb-1">Full System Access</p>
                                    <p>
                                        Super-admins have unrestricted access to all features and data.
                                        This role is designed for system administrators who need complete control.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title={`Edit Role: ${role.name}`}
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Roles', href: '/settings/roles' },
                { label: role.name },
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
                                    Edit Role
                                    {isBuiltIn && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Lock className="size-3" />
                                            Built-in
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {isBuiltIn 
                                        ? 'This is a built-in role. You can modify its permissions but cannot delete it.'
                                        : 'Update the role name and permissions.'
                                    }
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
                                        disabled={isBuiltIn}
                                    />
                                    {isBuiltIn && (
                                        <p className="text-xs text-muted-foreground">
                                            Built-in role names cannot be changed.
                                        </p>
                                    )}
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
                                Save Changes
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/settings/roles">Cancel</Link>
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Danger Zone - Only for non-protected roles */}
                <Can permission="roles.delete">
                    {!isBuiltIn && (
                        <Card className="mt-6 border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                <CardDescription>
                                    Permanently delete this role. This action cannot be undone.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="size-4 mr-2" />
                                            Delete Role
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
                                                onClick={handleDelete}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    )}
                </Can>
            </div>
        </AppLayout>
    );
}

