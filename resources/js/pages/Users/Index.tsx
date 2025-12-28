import { Link, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Users, Edit, Trash2 } from 'lucide-react';
import type { PageProps, User, PaginatedData, Role } from '@/types';
import { formatDate } from '@/utils/date';

interface UsersIndexProps extends PageProps {
    users: PaginatedData<User & { roles: Role[] }>;
}

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export default function UsersIndex({ users, auth }: UsersIndexProps) {
    const handleDelete = (user: User) => {
        router.delete(`/users/${user.id}`);
    };

    return (
        <AppLayout
            title="Users"
            breadcrumbs={[{ label: 'Users' }]}
            actions={
                <Button asChild>
                    <Link href="/users/create">
                        <Plus className="size-4 mr-2" />
                        New User
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage user accounts and their roles
                    </p>
                </div>

                {users.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Users className="size-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No users yet</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                Create your first user account to get started.
                            </p>
                            <Button asChild>
                                <Link href="/users/create">
                                    <Plus className="size-4 mr-2" />
                                    Create first user
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-8">
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    {user.id === auth.user?.id && (
                                                        <span className="text-xs text-muted-foreground">(You)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {user.roles?.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <Badge key={role.id} variant="secondary">
                                                            {role.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">No roles</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(user.created_at)}
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
                                                            <Link href={`/users/${user.id}/edit`}>
                                                                <Edit className="size-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {user.id !== auth.user?.id && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                        <Trash2 className="size-4 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "{user.name}"? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(user)}
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
                {users.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: users.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === users.current_page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => router.get('/users', { page })}
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

