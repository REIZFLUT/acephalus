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
import { Plus, Pencil, Trash2, Lock, Shield, Users, Key } from 'lucide-react';
import { Can } from '@/hooks/use-permission';
import type { PageProps, Role, PermissionCategory } from '@/types';

interface RolesIndexProps extends PageProps {
    roles: Role[];
    permissionCategories: Record<PermissionCategory, string[]>;
}

const PROTECTED_ROLES = ['super-admin', 'admin', 'editor', 'author', 'viewer'];

export default function RolesIndex({ roles, permissionCategories }: RolesIndexProps) {
    const handleDelete = (roleId: number) => {
        router.delete(`/settings/roles/${roleId}`);
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

    return (
        <AppLayout
            title="Roles"
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Roles' },
            ]}
            actions={
                <Can permission="roles.create">
                    <Button asChild>
                        <Link href="/settings/roles/create">
                            <Plus className="size-4 mr-2" />
                            Add Role
                        </Link>
                    </Button>
                </Can>
            }
        >
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
                                Create your first role to get started.
                            </p>
                            <Can permission="roles.create">
                                <Button asChild>
                                    <Link href="/settings/roles/create">
                                        <Plus className="size-4 mr-2" />
                                        Add Role
                                    </Link>
                                </Button>
                            </Can>
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
                                                            disabled={isSuperAdmin}
                                                        >
                                                            <Link href={`/settings/roles/${role.id}/edit`}>
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </Can>
                                                    <Can permission="roles.delete">
                                                        {!isProtected && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-destructive hover:text-destructive"
                                                                        disabled={(role.users_count ?? 0) > 0}
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
                                                                            onClick={() => handleDelete(role.id)}
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
        </AppLayout>
    );
}

