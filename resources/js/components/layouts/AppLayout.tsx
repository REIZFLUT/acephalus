import { PropsWithChildren, ReactNode } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import {
    LayoutDashboard,
    FolderOpen,
    FileText,
    Image,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    Menu,
    Shield,
    Sun,
    Moon,
    Monitor,
    ScanFace,
    Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    SidebarInset,
} from '@/components/ui/sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import { DynamicIcon } from '@/components/DynamicIcon';
import { LanguageSelector } from '@/components/LanguageSelector';
import type { PageProps, PinnedNavigationItemShared } from '@/types';

interface AppLayoutProps extends PropsWithChildren {
    title: string;
    breadcrumbs?: Array<{ label: string; href?: string }>;
    actions?: ReactNode;
}

const navigationItems = [
    {
        labelKey: 'Main',
        items: [
            { nameKey: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { nameKey: 'Collections', href: '/collections', icon: FolderOpen },
            { nameKey: 'Media', href: '/media', icon: Image },
            { nameKey: 'AI Agent', href: '/agents', icon: Bot },
        ],
    },
    {
        labelKey: 'Administration',
        items: [
            { nameKey: 'Users', href: '/users', icon: Users },
            { nameKey: 'Settings', href: '/settings', icon: Settings },
        ],
    },
];

const themeOptions = [
    { value: 'light', labelKey: 'Light', icon: Sun },
    { value: 'dark', labelKey: 'Dark', icon: Moon },
    { value: 'system', labelKey: 'System', icon: Monitor },
] as const;

interface UserMenuProps {
    auth: PageProps['auth'];
    getInitials: (name: string) => string;
    handleLogout: () => void;
}

function UserMenu({ auth, getInitials, handleLogout }: UserMenuProps) {
    const { t } = useLaravelReactI18n();
    const { theme, setTheme } = useTheme();

    const currentTheme = themeOptions.find((opt) => opt.value === theme) ?? themeOptions[2];
    const ThemeIcon = currentTheme.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full justify-start gap-3">
                    <Avatar className="size-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {auth.user ? getInitials(auth.user.name) : '??'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium">{auth.user?.name ?? t('Guest')}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {auth.user?.email ?? ''}
                        </span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>{t('My Account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <Settings className="mr-2 size-4" />
                        {t('Profile Settings')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                    <ThemeIcon className="size-3" />
                    {t('Theme')}
                </DropdownMenuLabel>
                <div className="flex gap-1 px-2 pb-2">
                    {themeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={cn(
                                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors',
                                    theme === option.value
                                        ? 'bg-accent text-accent-foreground'
                                        : 'hover:bg-accent/50'
                                )}
                            >
                                <Icon className="size-3.5" />
                                {t(option.labelKey)}
                            </button>
                        );
                    })}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                    {t('Language')}
                </DropdownMenuLabel>
                <div className="px-2 pb-2">
                    <LanguageSelector showLabel={true} />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-4" />
                    {t('Log out')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AppLayout({ children, title, breadcrumbs = [], actions }: AppLayoutProps) {
    const { t } = useLaravelReactI18n();
    const { auth, pinnedNavigation = [] } = usePage<PageProps>().props;
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    const handleLogout = () => {
        router.post('/logout');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Check if a pinned navigation item is active
    const isPinnedItemActive = (item: PinnedNavigationItemShared) => {
        // Extract path from the item URL (before any query params)
        const itemPath = item.url.split('?')[0];
        
        // Check if current path matches the item's base path
        if (!currentPath.startsWith(itemPath)) {
            return false;
        }
        
        // If the item has a filter view, also check if the query param matches
        if (item.filter_view_id) {
            const params = new URLSearchParams(currentSearch);
            return params.get('filter_view') === item.filter_view_id;
        }
        
        // For items without filter view, only match if there's no filter_view in the URL
        const params = new URLSearchParams(currentSearch);
        return !params.has('filter_view');
    };

    return (
        <>
            <Head title={title} />
            <SidebarProvider>
                <Sidebar variant="inset" className="border-r border-sidebar-border">
                    <SidebarHeader className="border-b border-sidebar-border">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3">
                                    <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
                                        <ScanFace className="size-5 text-primary-foreground" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sidebar-foreground">acephalus</span>
                                        <span className="text-xs text-muted-foreground">Headless CMS</span>
                                    </div>
                                </Link>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    <SidebarContent>
                        {/* Pinned Navigation Items */}
                        {pinnedNavigation.length > 0 && (
                            <SidebarGroup>
                                <SidebarGroupLabel>{t('Pinned')}</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {pinnedNavigation.map((item) => (
                                            <SidebarMenuItem key={item._id}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isPinnedItemActive(item)}
                                                >
                                                    <Link href={item.url}>
                                                        <DynamicIcon name={item.icon} className="size-4" />
                                                        <span>{item.name}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}

                        {/* Main Navigation Groups */}
                        {navigationItems.map((group) => (
                            <SidebarGroup key={group.labelKey}>
                                <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => (
                                            <SidebarMenuItem key={item.nameKey}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={currentPath.startsWith(item.href)}
                                                >
                                                    <Link href={item.href}>
                                                        <item.icon className="size-4" />
                                                        <span>{t(item.nameKey)}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        ))}
                    </SidebarContent>

                    <SidebarFooter className="border-t border-sidebar-border">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <UserMenu
                                    auth={auth}
                                    getInitials={getInitials}
                                    handleLogout={handleLogout}
                                />
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset className="flex h-svh flex-col md:h-[calc(100svh-1rem)]">
                    {/* Header */}
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/dashboard">{t('Home')}</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {breadcrumbs.map((crumb, index) => (
                                    <BreadcrumbItem key={index}>
                                        <BreadcrumbSeparator />
                                        {crumb.href ? (
                                            <BreadcrumbLink asChild>
                                                <Link href={crumb.href}>{crumb.label}</Link>
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 min-h-0 p-6 overflow-auto">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}

