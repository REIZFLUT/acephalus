import { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Layers, BookCopy, Image, Shield, Pin, Puzzle } from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';

export type SettingsTab = 
    | 'wrapper-purposes' 
    | 'editions' 
    | 'media-meta-fields' 
    | 'custom-elements'
    | 'roles' 
    | 'pinned-navigation';

interface SettingsNavigationProps {
    activeTab: SettingsTab;
    onTabChange?: (tab: SettingsTab) => void;
    children?: ReactNode;
}

/**
 * Settings tab definitions - add new tabs here
 */
const SETTINGS_TABS: {
    value: SettingsTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    route: string;
}[] = [
    {
        value: 'wrapper-purposes',
        label: 'Wrapper Purposes',
        shortLabel: 'Wrappers',
        icon: Layers,
        route: '/settings',
    },
    {
        value: 'editions',
        label: 'Editions',
        shortLabel: 'Editions',
        icon: BookCopy,
        route: '/settings',
    },
    {
        value: 'media-meta-fields',
        label: 'Media Fields',
        shortLabel: 'Media',
        icon: Image,
        route: '/settings',
    },
    {
        value: 'custom-elements',
        label: 'Custom Elements',
        shortLabel: 'Elements',
        icon: Puzzle,
        permission: 'custom-elements.view',
        route: '/settings/custom-elements',
    },
    {
        value: 'roles',
        label: 'Roles',
        shortLabel: 'Roles',
        icon: Shield,
        permission: 'roles.view',
        route: '/settings',
    },
    {
        value: 'pinned-navigation',
        label: 'Navigation',
        shortLabel: 'Nav',
        icon: Pin,
        permission: 'pinned-navigation.view',
        route: '/settings',
    },
];

/**
 * Shared navigation component for all Settings pages.
 * Add new tabs to SETTINGS_TABS array above.
 * 
 * Can be used in two ways:
 * 1. With children (TabsContent elements) - wraps content in Tabs
 * 2. Without children - just renders the navigation
 */
export function SettingsNavigation({ activeTab, onTabChange, children }: SettingsNavigationProps) {
    const { can } = usePermission();

    // Filter tabs based on permissions
    const visibleTabs = SETTINGS_TABS.filter(
        (tab) => !tab.permission || can(tab.permission)
    );

    const handleTabChange = (value: string) => {
        const tab = value as SettingsTab;
        const tabConfig = SETTINGS_TABS.find((t) => t.value === tab);
        
        if (!tabConfig) return;

        // If it's a tab with a separate route, navigate there
        if (tabConfig.route !== '/settings') {
            router.visit(tabConfig.route);
            return;
        }

        // If there's a custom handler, use it
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    const tabNavigation = (
        <TabsList className="grid w-full max-w-5xl" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}>
            {visibleTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                    <tab.icon className="size-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                </TabsTrigger>
            ))}
        </TabsList>
    );

    // If children are provided, wrap everything in Tabs
    if (children) {
        return (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                {tabNavigation}
                {children}
            </Tabs>
        );
    }

    // Otherwise, just render the navigation inside minimal Tabs
    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            {tabNavigation}
        </Tabs>
    );
}

/**
 * Re-export TabsContent for convenience
 */
export { TabsContent as SettingsTabContent } from '@/components/ui/tabs';

/**
 * Get the route for a specific settings tab
 */
export function getSettingsTabRoute(tab: SettingsTab): string {
    const tabConfig = SETTINGS_TABS.find((t) => t.value === tab);
    if (!tabConfig) return '/settings';
    
    if (tabConfig.route === '/settings' && tab !== 'wrapper-purposes') {
        return `/settings?tab=${tab}`;
    }
    return tabConfig.route;
}

/**
 * Get all available settings tabs
 */
export function getSettingsTabs() {
    return SETTINGS_TABS;
}
