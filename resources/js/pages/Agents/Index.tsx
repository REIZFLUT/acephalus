import { Link } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import { Bot, Plus, Settings, MessageSquare, Activity, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { router } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface Agent {
    _id: string;
    name: string;
    description: string | null;
    provider: string;
    model: string;
    is_active: boolean;
    user: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

interface Props extends PageProps {
    agents: Agent[];
}

export default function AgentsIndex({ agents }: Props) {
    const { t } = useLaravelReactI18n();

    const handleDelete = (agentId: string) => {
        router.delete(`/agents/${agentId}`);
    };

    return (
        <AppLayout
            title={t('AI Agents')}
            breadcrumbs={[{ label: t('AI Agents') }]}
            actions={
                <Button asChild>
                    <Link href="/agents/create">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('New Agent')}
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                {agents.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">{t('No agents yet')}</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                {t('Create your first AI agent to get started.')}
                            </p>
                            <Button asChild>
                                <Link href="/agents/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('Create Agent')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {agents.map((agent) => (
                            <Card key={agent._id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <Bot className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{agent.name}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {agent.provider} / {agent.model}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                                            {agent.is_active ? t('Active') : t('Inactive')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    {agent.description && (
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {agent.description}
                                        </p>
                                    )}
                                    {agent.user && (
                                        <p className="text-xs text-muted-foreground">
                                            {t('Linked to')}: {agent.user.name}
                                        </p>
                                    )}
                                </CardContent>
                                <div className="border-t p-4 flex gap-2">
                                    <Button asChild variant="default" size="sm" className="flex-1">
                                        <Link href={`/agents/${agent._id}`}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            {t('Chat')}
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/agents/${agent._id}/activity`}>
                                            <Activity className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/agents/${agent._id}/edit`}>
                                            <Settings className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('Delete Agent')}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('Are you sure you want to delete this agent? All chats and activity logs will be permanently deleted.')}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(agent._id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {t('Delete')}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
