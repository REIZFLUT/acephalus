import { usePage } from '@inertiajs/react';
import type { PageProps, PermissionName } from '@/types';

/**
 * Hook for checking user permissions in React components.
 * 
 * @example
 * ```tsx
 * const { can, canAny, canAll, hasRole, isSuperAdmin } = usePermission();
 * 
 * if (can('contents.create')) {
 *   // User can create contents
 * }
 * 
 * if (canAny(['contents.update', 'contents.delete'])) {
 *   // User can update OR delete contents
 * }
 * 
 * if (canAll(['users.view', 'users.update'])) {
 *   // User can view AND update users
 * }
 * ```
 */
export function usePermission() {
    const { props } = usePage<PageProps>();
    const { auth } = props;

    const permissions = auth.user?.permissions ?? [];
    const roles = auth.user?.roles ?? [];
    const isSuperAdmin = auth.user?.is_super_admin ?? false;

    /**
     * Check if the user has a specific permission.
     * Super-admins always have all permissions.
     */
    const can = (permission: PermissionName | string): boolean => {
        if (isSuperAdmin) {
            return true;
        }
        return permissions.includes(permission);
    };

    /**
     * Check if the user has ANY of the specified permissions.
     * Super-admins always have all permissions.
     */
    const canAny = (permissionList: (PermissionName | string)[]): boolean => {
        if (isSuperAdmin) {
            return true;
        }
        return permissionList.some((permission) => permissions.includes(permission));
    };

    /**
     * Check if the user has ALL of the specified permissions.
     * Super-admins always have all permissions.
     */
    const canAll = (permissionList: (PermissionName | string)[]): boolean => {
        if (isSuperAdmin) {
            return true;
        }
        return permissionList.every((permission) => permissions.includes(permission));
    };

    /**
     * Check if the user has a specific role.
     */
    const hasRole = (role: string): boolean => {
        return roles.includes(role);
    };

    /**
     * Check if the user has ANY of the specified roles.
     */
    const hasAnyRole = (roleList: string[]): boolean => {
        return roleList.some((role) => roles.includes(role));
    };

    /**
     * Check if the user has ALL of the specified roles.
     */
    const hasAllRoles = (roleList: string[]): boolean => {
        return roleList.every((role) => roles.includes(role));
    };

    return {
        can,
        canAny,
        canAll,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        isSuperAdmin,
        permissions,
        roles,
    };
}

/**
 * Component that conditionally renders children based on permissions.
 * 
 * @example
 * ```tsx
 * <Can permission="contents.create">
 *   <Button>Create Content</Button>
 * </Can>
 * 
 * <Can permissions={['contents.update', 'contents.delete']} requireAll={false}>
 *   <EditMenu />
 * </Can>
 * ```
 */
export function Can({
    permission,
    permissions: permissionList,
    requireAll = false,
    fallback = null,
    children,
}: {
    permission?: PermissionName | string;
    permissions?: (PermissionName | string)[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}) {
    const { can, canAny, canAll } = usePermission();

    let hasPermission = false;

    if (permission) {
        hasPermission = can(permission);
    } else if (permissionList) {
        hasPermission = requireAll ? canAll(permissionList) : canAny(permissionList);
    }

    return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that conditionally renders children based on roles.
 * 
 * @example
 * ```tsx
 * <HasRole role="admin">
 *   <AdminPanel />
 * </HasRole>
 * ```
 */
export function HasRole({
    role,
    roles: roleList,
    requireAll = false,
    fallback = null,
    children,
}: {
    role?: string;
    roles?: string[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}) {
    const { hasRole, hasAnyRole, hasAllRoles } = usePermission();

    let hasRequiredRole = false;

    if (role) {
        hasRequiredRole = hasRole(role);
    } else if (roleList) {
        hasRequiredRole = requireAll ? hasAllRoles(roleList) : hasAnyRole(roleList);
    }

    return hasRequiredRole ? <>{children}</> : <>{fallback}</>;
}

export default usePermission;

