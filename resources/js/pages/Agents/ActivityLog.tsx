import { useLaravelReactI18n } from 'laravel-react-i18n';
import { Activity, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PageProps } from '@/types';

interface Agent {
    _id: string;
    name: string;
}

interface ActivityLog {
    _id: string;
    tool: string;
    parameters: Record<string, unknown>;
    approval_mode: 'auto' | 'ask' | 'deny';
    approval_status: 'pending' | 'approved' | 'denied' | 'auto';
    result: unknown;
    error: string | null;
    execution_time_ms: number | null;
    created_at: string;
    user_name: string | null;
    approved_by_name: string | null;
}

interface Props extends PageProps {
    agent: Agent;
    logs: ActivityLog[];
}

export default function AgentsActivityLog({ agent, logs }: Props) {
    const { t } = useLaravelReactI18n();

    const getStatusIcon = (log: ActivityLog) => {
        if (log.error) {
            return <XCircle className="h-4 w-4 text-destructive" />;
        }

        switch (log.approval_status) {
            case 'auto':
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'denied':
                return <Ban className="h-4 w-4 text-destructive" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (log: ActivityLog) => {
        if (log.error) {
            return <Badge variant="destructive">{t('Failed')}</Badge>;
        }

        switch (log.approval_status) {
            case 'auto':
                return <Badge variant="secondary">{t('Auto')}</Badge>;
            case 'approved':
                return <Badge variant="default">{t('Approved')}</Badge>;
            case 'denied':
                return <Badge variant="destructive">{t('Denied')}</Badge>;
            case 'pending':
                return <Badge variant="outline">{t('Pending')}</Badge>;
            default:
                return null;
        }
    };

    const getModeBadge = (mode: string) => {
        switch (mode) {
            case 'auto':
                return (
                    <Badge variant="outline" className="text-xs">
                        {t('Auto')}
                    </Badge>
                );
            case 'ask':
                return (
                    <Badge variant="outline" className="text-xs">
                        {t('Ask')}
                    </Badge>
                );
            case 'deny':
                return (
                    <Badge variant="outline" className="text-xs text-destructive">
                        {t('Deny')}
                    </Badge>
                );
            default:
                return null;
        }
    };

    const formatToolName = (tool: string) => {
        const parts = tool.split('.');
        return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' > ');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <AppLayout
            title={t('Activity Log')}
            breadcrumbs={[
                { label: t('AI Agents'), href: '/agents' },
                { label: agent.name, href: `/agents/${agent._id}` },
                { label: t('Activity Log') },
            ]}
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        <CardTitle>{t('Activity Log')}</CardTitle>
                    </div>
                    <CardDescription>
                        {t('All actions performed by this agent.')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t('No activity yet.')}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>{t('Tool')}</TableHead>
                                        <TableHead>{t('Mode')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead>{t('User')}</TableHead>
                                        <TableHead>{t('Duration')}</TableHead>
                                        <TableHead>{t('Time')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell>{getStatusIcon(log)}</TableCell>
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <span className="font-mono text-sm">
                                                                {formatToolName(log.tool)}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="max-w-md">
                                                            <pre className="text-xs">
                                                                {JSON.stringify(log.parameters, null, 2)}
                                                            </pre>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell>{getModeBadge(log.approval_mode)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(log)}
                                                    {log.approved_by_name && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {t('by')} {log.approved_by_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {log.user_name || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {log.execution_time_ms !== null ? (
                                                    <span className="text-sm text-muted-foreground">
                                                        {log.execution_time_ms}ms
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
