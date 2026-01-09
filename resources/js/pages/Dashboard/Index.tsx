import { Link } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FolderOpen,
    FileText,
    Image,
    Users,
    Plus,
    ArrowRight,
    TrendingUp,
    Clock,
} from 'lucide-react';
import type { PageProps, Content } from '@/types';

interface DashboardProps extends PageProps {
    stats: {
        collections: number;
        contents: number;
        published: number;
        drafts: number;
        media: number;
        users: number;
    };
    recentContents: Content[];
}

const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    href,
}: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    href?: string;
}) => {
    const content = (
        <Card className="group hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value.toLocaleString()}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
};

const QuickAction = ({
    title,
    description,
    icon: Icon,
    href,
}: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
}) => (
    <Link href={href} className="block">
        <Card className="group hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
        </Card>
    </Link>
);

export default function DashboardIndex({ stats, recentContents }: DashboardProps) {
    const { t } = useLaravelReactI18n();
    
    return (
        <AppLayout title={t('Dashboard')}>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Dashboard')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t("Welcome to acephalus CMS. Here's an overview of your content.")}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={t('Collections')}
                        value={stats.collections}
                        icon={FolderOpen}
                        href="/collections"
                    />
                    <StatCard
                        title={t('Total Contents')}
                        value={stats.contents}
                        icon={FileText}
                        description={t(':published published, :drafts drafts', { published: stats.published, drafts: stats.drafts })}
                    />
                    <StatCard
                        title={t('Media Files')}
                        value={stats.media}
                        icon={Image}
                        href="/media"
                    />
                    <StatCard
                        title={t('Users')}
                        value={stats.users}
                        icon={Users}
                        href="/users"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="size-5" />
                                {t('Quick Actions')}
                            </CardTitle>
                            <CardDescription>
                                {t('Get started with common tasks')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <QuickAction
                                title={t('Create Collection')}
                                description={t('Define a new content structure')}
                                icon={Plus}
                                href="/collections/create"
                            />
                            <QuickAction
                                title={t('Upload Media')}
                                description={t('Add images, videos, or documents')}
                                icon={Image}
                                href="/media"
                            />
                            <QuickAction
                                title={t('Manage Users')}
                                description={t('Add or modify user accounts')}
                                icon={Users}
                                href="/users"
                            />
                        </CardContent>
                    </Card>

                    {/* Recent Contents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="size-5" />
                                {t('Recent Contents')}
                            </CardTitle>
                            <CardDescription>
                                {t('Latest updated content entries')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentContents.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="size-12 mx-auto mb-3 opacity-50" />
                                    <p>{t('No content yet')}</p>
                                    <p className="text-sm">{t('Create your first collection to get started')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentContents.map((content) => (
                                        <Link
                                            key={content._id}
                                            href={`/contents/${content._id}/edit`}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{content.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {content.collection?.name ?? t('Unknown Collection')}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={content.status === 'published' ? 'default' : 'secondary'}
                                            >
                                                {content.status === 'published' ? t('published') : t('draft')}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {recentContents.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <Link href="/collections">
                                        <Button variant="outline" className="w-full">
                                            {t('View All Contents')}
                                            <ArrowRight className="ml-2 size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
