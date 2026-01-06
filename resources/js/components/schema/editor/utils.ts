import * as LucideIcons from 'lucide-react';
import { Box } from 'lucide-react';

/**
 * Gets a Lucide icon component by its kebab-case name
 */
export function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> {
    const pascalName = iconName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    
    const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalName];
    return IconComponent || Box;
}

