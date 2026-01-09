import { PropsWithChildren, ReactNode } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
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
import type { PageProps, PinnedNavigationItemShared } from '@/types';

interface AppLayoutProps extends PropsWithChildren {
    title: string;
    breadcrumbs?: Array<{ label: string; href?: string }>;
    actions?: ReactNode;
}

const navigationItems = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Collections', href: '/collections', icon: FolderOpen },
            { name: 'Media', href: '/media', icon: Image },
        ],
    },
    {
        label: 'Administration',
        items: [
            { name: 'Users', href: '/users', icon: Users },
            { name: 'Settings', href: '/settings', icon: Settings },
        ],
    },
];

const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
] as const;

interface UserMenuProps {
    auth: PageProps['auth'];
    getInitials: (name: string) => string;
    handleLogout: () => void;
}

function UserMenu({ auth, getInitials, handleLogout }: UserMenuProps) {
    const { theme, setTheme } = useTheme();

    const currentTheme = themeOptions.find((t) => t.value === theme) ?? themeOptions[2];
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
                        <span className="text-sm font-medium">{auth.user?.name ?? 'Guest'}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {auth.user?.email ?? ''}
                        </span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <Settings className="mr-2 size-4" />
                        Profile Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                    <ThemeIcon className="size-3" />
                    Theme
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
                                {option.label}
                            </button>
                        );
                    })}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AppLayout({ children, title, breadcrumbs = [], actions }: AppLayoutProps) {
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
                                        <svg
                                            className="size-5 text-primary-foreground"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sidebar-foreground">Continy</span>
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
                                <SidebarGroupLabel>Pinned</SidebarGroupLabel>
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
                            <SidebarGroup key={group.label}>
                                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => (
                                            <SidebarMenuItem key={item.name}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={currentPath.startsWith(item.href)}
                                                >
                                                    <Link href={item.href}>
                                                        <item.icon className="size-4" />
                                                        <span>{item.name}</span>
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
                                        <Link href="/dashboard">Home</Link>
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

