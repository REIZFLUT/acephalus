import { useForm } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToolApprovalConfig } from '@/components/agent/ToolApprovalConfig';
import type { PageProps } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Provider {
    value: string;
    label: string;
}

interface Props extends PageProps {
    users: User[];
    providers: Provider[];
    defaultToolApprovals: Record<string, string>;
}

export default function AgentsCreate({ users, providers, defaultToolApprovals }: Props) {
    const { t } = useLaravelReactI18n();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        user_id: '',
        provider: 'anthropic',
        model: '',
        is_active: true,
        tool_approvals: {} as Record<string, string>,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/agents');
    };

    return (
        <AppLayout
            title={t('Create Agent')}
            breadcrumbs={[
                { label: t('AI Agents'), href: '/agents' },
                { label: t('Create') },
            ]}
        >
            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Basic Information')}</CardTitle>
                        <CardDescription>
                            {t('Configure the basic settings for your AI agent.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('Name')}</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t('e.g. Content Assistant')}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{t('Description')}</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder={t('What does this agent do?')}
                                rows={3}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">{errors.description}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user_id">{t('Linked User')}</Label>
                            <Select
                                value={data.user_id.toString()}
                                onValueChange={(value) => setData('user_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Select a user')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.name} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {t('The agent will inherit permissions from this user.')}
                            </p>
                            {errors.user_id && (
                                <p className="text-sm text-destructive">{errors.user_id}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active">{t('Active')}</Label>
                                <p className="text-xs text-muted-foreground">
                                    {t('Enable or disable this agent.')}
                                </p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('LLM Configuration')}</CardTitle>
                        <CardDescription>
                            {t('Configure the AI model provider and settings.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="provider">{t('Provider')}</Label>
                            <Select
                                value={data.provider}
                                onValueChange={(value) => setData('provider', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {providers.map((provider) => (
                                        <SelectItem key={provider.value} value={provider.value}>
                                            {provider.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.provider && (
                                <p className="text-sm text-destructive">{errors.provider}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="model">{t('Model')}</Label>
                            <Input
                                id="model"
                                value={data.model}
                                onChange={(e) => setData('model', e.target.value)}
                                placeholder={t('Leave empty for default')}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('e.g. gpt-4o, claude-sonnet-4-20250514')}
                            </p>
                            {errors.model && (
                                <p className="text-sm text-destructive">{errors.model}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Tool Permissions')}</CardTitle>
                        <CardDescription>
                            {t('Configure which actions the agent can perform and which require approval.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ToolApprovalConfig
                            value={data.tool_approvals}
                            onChange={(approvals) => setData('tool_approvals', approvals)}
                            defaults={defaultToolApprovals}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {t('Create Agent')}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
