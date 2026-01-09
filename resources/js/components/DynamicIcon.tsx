import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
    name: string | null | undefined;
    fallback?: keyof typeof LucideIcons;
}

/**
 * Renders a Lucide icon dynamically by name.
 * 
 * Supports both kebab-case (e.g., "folder-open") and PascalCase (e.g., "FolderOpen") names.
 */
export function DynamicIcon({ name, fallback = 'Box', className, ...props }: DynamicIconProps) {
    const iconName = name ? toComponentName(name) : fallback;
    
    // Get the icon from lucide-react
    const Icon = (LucideIcons as Record<string, LucideIcons.LucideIcon>)[iconName] 
        || (LucideIcons as Record<string, LucideIcons.LucideIcon>)[fallback] 
        || LucideIcons.Box;
    
    return <Icon className={cn('size-4', className)} {...props} />;
}

/**
 * Convert kebab-case or snake_case to PascalCase for Lucide icon lookup.
 * e.g., "folder-open" -> "FolderOpen"
 *       "folder_open" -> "FolderOpen"
 *       "FolderOpen" -> "FolderOpen"
 */
function toComponentName(name: string): string {
    // If already in PascalCase (starts with uppercase), return as-is
    if (/^[A-Z]/.test(name) && !name.includes('-') && !name.includes('_')) {
        return name;
    }
    
    // Convert kebab-case or snake_case to PascalCase
    return name
        .split(/[-_]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}

/**
 * Get all available Lucide icon names (for selection UI).
 * Returns a subset of commonly used icons for performance.
 */
export const commonIconNames = [
    'box',
    'folder',
    'folder-open',
    'file',
    'file-text',
    'image',
    'video',
    'music',
    'star',
    'heart',
    'bookmark',
    'tag',
    'flag',
    'pin',
    'map-pin',
    'home',
    'settings',
    'user',
    'users',
    'mail',
    'phone',
    'calendar',
    'clock',
    'check',
    'x',
    'plus',
    'minus',
    'edit',
    'trash',
    'search',
    'filter',
    'sort-asc',
    'sort-desc',
    'arrow-up',
    'arrow-down',
    'arrow-left',
    'arrow-right',
    'chevron-up',
    'chevron-down',
    'chevron-left',
    'chevron-right',
    'alert-circle',
    'alert-triangle',
    'info',
    'help-circle',
    'eye',
    'eye-off',
    'lock',
    'unlock',
    'shield',
    'key',
    'globe',
    'link',
    'external-link',
    'download',
    'upload',
    'share',
    'copy',
    'clipboard',
    'code',
    'terminal',
    'database',
    'server',
    'cloud',
    'wifi',
    'bluetooth',
    'battery',
    'cpu',
    'monitor',
    'smartphone',
    'tablet',
    'printer',
    'camera',
    'mic',
    'volume',
    'play',
    'pause',
    'stop',
    'skip-back',
    'skip-forward',
    'refresh-cw',
    'rotate-cw',
    'zap',
    'sun',
    'moon',
    'layers',
    'layout',
    'grid',
    'list',
    'table',
    'columns',
    'rows',
    'align-left',
    'align-center',
    'align-right',
    'bold',
    'italic',
    'underline',
    'type',
    'hash',
    'at-sign',
    'dollar-sign',
    'percent',
    'thumbs-up',
    'thumbs-down',
    'message-circle',
    'message-square',
    'send',
    'inbox',
    'archive',
    'trash-2',
    'save',
    'book',
    'book-open',
    'newspaper',
    'rss',
    'activity',
    'trending-up',
    'trending-down',
    'bar-chart',
    'pie-chart',
    'target',
    'crosshair',
    'award',
    'gift',
    'shopping-cart',
    'shopping-bag',
    'credit-card',
    'package',
    'truck',
    'map',
    'navigation',
    'compass',
    'anchor',
    'briefcase',
    'building',
    'store',
    'coffee',
    'utensils',
];
