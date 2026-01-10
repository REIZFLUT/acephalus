import { useLaravelReactI18n } from 'laravel-react-i18n';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PendingToolCall {
    id: string;
    tool: string;
    parameters: Record<string, unknown>;
    explanation: string;
    log_id: string;
}

interface ApprovalDialogProps {
    toolCall: PendingToolCall;
    onApprove: () => void;
    onDeny: () => void;
    isLoading: boolean;
}

export function ApprovalDialog({ toolCall, onApprove, onDeny, isLoading }: ApprovalDialogProps) {
    const { t } = useLaravelReactI18n();

    const formatToolName = (tool: string) => {
        const parts = tool.split('.');
        return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' > ');
    };

    const getToolDescription = (tool: string) => {
        const descriptions: Record<string, string> = {
            'content.create': t('Create a new content item'),
            'content.update': t('Update an existing content item'),
            'content.delete': t('Delete a content item'),
            'content.publish': t('Publish a content item'),
            'content.unpublish': t('Unpublish a content item'),
            'media.update': t('Update media metadata'),
            'media.delete': t('Delete a media file'),
        };
        return descriptions[tool] || t('Execute action');
    };

    return (
        <Card className="border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10 mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                    <CardTitle className="text-lg">{t('Approval Required')}</CardTitle>
                </div>
                <CardDescription>
                    {t('The agent wants to perform the following action:')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                        {formatToolName(toolCall.tool)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        {getToolDescription(toolCall.tool)}
                    </span>
                </div>

                {toolCall.explanation && (
                    <p className="text-sm">{toolCall.explanation}</p>
                )}

                <div className="bg-background/50 rounded-lg p-3">
                    <span className="text-xs text-muted-foreground block mb-2">{t('Parameters')}:</span>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(toolCall.parameters, null, 2)}
                    </pre>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button
                    onClick={onApprove}
                    disabled={isLoading}
                    className="flex-1"
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Check className="mr-2 h-4 w-4" />
                    )}
                    {t('Approve')}
                </Button>
                <Button
                    onClick={onDeny}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1"
                >
                    <X className="mr-2 h-4 w-4" />
                    {t('Deny')}
                </Button>
            </CardFooter>
        </Card>
    );
}
