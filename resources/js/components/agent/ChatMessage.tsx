import { useLaravelReactI18n } from 'laravel-react-i18n';
import { Bot, User, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
    }>;
    tool_name?: string;
    created_at: string;
}

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const { t } = useLaravelReactI18n();

    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const isTool = message.role === 'tool';

    const getIcon = () => {
        if (isUser) {
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                </div>
            );
        }
        if (isTool) {
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                    <Wrench className="h-4 w-4" />
                </div>
            );
        }
        return (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <Bot className="h-4 w-4" />
            </div>
        );
    };

    const getRoleName = () => {
        if (isUser) return t('You');
        if (isTool) return message.tool_name ? `Tool: ${message.tool_name}` : t('Tool Result');
        return t('AI Agent');
    };

    // Format tool result for human-readable display
    const renderToolResult = (parsed: Record<string, unknown>) => {
        const success = parsed.success as boolean;
        const message = parsed.message as string | undefined;
        const data = parsed.data as Record<string, unknown> | undefined;
        const cancelled = parsed.cancelled as boolean | undefined;

        // Handle cancelled tool calls
        if (cancelled) {
            return (
                <div className="text-sm text-muted-foreground italic">
                    {message || t('Action cancelled')}
                </div>
            );
        }

        return (
            <div className="space-y-2 text-sm">
                {/* Status indicator */}
                <div className={cn(
                    "flex items-center gap-2 font-medium",
                    success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                    {success ? '✓' : '✗'} {message || (success ? t('Success') : t('Error'))}
                </div>
                
                {/* Render relevant data fields */}
                {data && Object.keys(data).length > 0 && (
                    <div className="bg-muted/30 rounded p-2 space-y-1">
                        {data.id && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ID:</span>
                                <span className="font-mono text-xs">{String(data.id)}</span>
                            </div>
                        )}
                        {data.title && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('Title')}:</span>
                                <span className="font-medium">{String(data.title)}</span>
                            </div>
                        )}
                        {data.slug && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Slug:</span>
                                <span className="font-mono text-xs">{String(data.slug)}</span>
                            </div>
                        )}
                        {data.status && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-xs",
                                    data.status === 'published' 
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                )}>
                                    {String(data.status)}
                                </span>
                            </div>
                        )}
                        {data.collection && typeof data.collection === 'object' && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Collection:</span>
                                <span>{String((data.collection as Record<string, unknown>).name || '')}</span>
                            </div>
                        )}
                        {data.contents && Array.isArray(data.contents) && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                                <span className="text-muted-foreground text-xs">{data.contents.length} {t('items')}:</span>
                                <ul className="mt-1 space-y-1">
                                    {(data.contents as Array<Record<string, unknown>>).slice(0, 5).map((item, idx) => (
                                        <li key={idx} className="text-xs truncate">
                                            • {String(item.title || item.name || item.id)}
                                        </li>
                                    ))}
                                    {data.contents.length > 5 && (
                                        <li className="text-xs text-muted-foreground">
                                            ... {t('and')} {data.contents.length - 5} {t('more')}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Try to parse tool result content as JSON
    const renderContent = () => {
        if (isTool) {
            try {
                const parsed = JSON.parse(message.content) as Record<string, unknown>;
                // Check if this looks like a structured tool result
                if ('success' in parsed || 'message' in parsed || 'cancelled' in parsed) {
                    return renderToolResult(parsed);
                }
                // Fallback to formatted JSON for unknown structures
                return (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
                            {JSON.stringify(parsed, null, 2)}
                        </pre>
                    </div>
                );
            } catch {
                return <p className="text-sm">{message.content}</p>;
            }
        }

        if (isAssistant) {
            return (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
            );
        }

        return <p className="whitespace-pre-wrap">{message.content}</p>;
    };

    return (
        <div
            className={cn(
                'flex gap-3',
                isUser && 'flex-row-reverse'
            )}
        >
            {getIcon()}
            <div
                className={cn(
                    'flex flex-col max-w-[80%]',
                    isUser && 'items-end'
                )}
            >
                <span className="text-xs text-muted-foreground mb-1">{getRoleName()}</span>
                <div
                    className={cn(
                        'rounded-lg px-4 py-2',
                        isUser && 'bg-primary text-primary-foreground',
                        isAssistant && 'bg-muted',
                        isTool && 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800'
                    )}
                >
                    {renderContent()}

                    {/* Show tool calls if any */}
                    {message.tool_calls && message.tool_calls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                            <span className="text-xs text-muted-foreground">{t('Tools called')}:</span>
                            {message.tool_calls.map((tc) => (
                                <div
                                    key={tc.id}
                                    className="text-xs bg-background/50 rounded p-2"
                                >
                                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                                        {tc.name.replace(/_/g, '.')}
                                    </span>
                                    {tc.arguments && Object.keys(tc.arguments).length > 0 && (
                                        <div className="mt-1 space-y-0.5 text-muted-foreground">
                                            {Object.entries(tc.arguments).map(([key, value]) => {
                                                // Skip very long values (like elements_json)
                                                const displayValue = typeof value === 'string' && value.length > 100
                                                    ? value.substring(0, 50) + '...'
                                                    : String(value);
                                                return (
                                                    <div key={key} className="flex gap-2">
                                                        <span className="text-muted-foreground/70">{key.replace(/_json$/, '')}:</span>
                                                        <span className="truncate">{displayValue}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
}
