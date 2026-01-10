/**
 * Permission category labels for the UI.
 * Add new categories here when adding new permission groups.
 */
export const CATEGORY_LABELS: Record<string, string> = {
    contents: 'Contents',
    collections: 'Collections',
    collections_schema: 'Collection Schema',
    media: 'Media',
    media_meta_fields: 'Media Meta Fields',
    editions: 'Editions',
    wrapper_purposes: 'Wrapper Purposes',
    pinned_navigation: 'Pinned Navigation',
    custom_elements: 'Custom Elements',
    users: 'Users',
    roles: 'Roles',
    settings: 'Settings',
    locking: 'Locking',
};

/**
 * Permission action labels for the UI.
 * Add new actions here when adding new permission types.
 */
export const PERMISSION_LABELS: Record<string, string> = {
    view: 'View',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    publish: 'Publish',
    lock: 'Lock',
    unlock: 'Unlock',
};

/**
 * Get the human-readable label for a permission action.
 * @param permission - The full permission string (e.g., "contents.view")
 * @returns The action label (e.g., "View")
 */
export function getPermissionAction(permission: string): string {
    const parts = permission.split('.');
    const action = parts[parts.length - 1];
    return PERMISSION_LABELS[action] || action;
}

/**
 * Get the human-readable label for a permission category.
 * @param category - The category key (e.g., "custom_elements")
 * @returns The category label (e.g., "Custom Elements")
 */
export function getCategoryLabel(category: string): string {
    return CATEGORY_LABELS[category] || category;
}
