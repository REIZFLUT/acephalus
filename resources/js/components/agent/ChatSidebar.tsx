import { useState } from 'react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import { Plus, MessageSquare, Pencil, Trash2, Check, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface ChatSummary {
    _id: string;
    title: string;
    updated_at: string;
}

interface ChatSidebarProps {
    agentId: string;
    chats: ChatSummary[];
    currentChatId: string;
    onSelectChat: (chatId: string) => void;
    onNewChat: () => void;
    onChatDeleted: (chatId: string) => void;
    onTitleUpdated: (chatId: string, title: string) => void;
}

export function ChatSidebar({
    agentId,
    chats,
    currentChatId,
    onSelectChat,
    onNewChat,
    onChatDeleted,
    onTitleUpdated,
}: ChatSidebarProps) {
    const { t } = useLaravelReactI18n();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleStartEdit = (chat: ChatSummary) => {
        setEditingId(chat._id);
        setEditTitle(chat.title || t('New Chat'));
    };

    const handleSaveTitle = async (chatId: string) => {
        if (!editTitle.trim()) {
            setEditingId(null);
            return;
        }

        try {
            await axios.put(`/agents/${agentId}/chats/${chatId}/title`, {
                title: editTitle.trim(),
            });
            onTitleUpdated(chatId, editTitle.trim());
        } catch (error) {
            console.error('Failed to update title:', error);
        } finally {
            setEditingId(null);
        }
    };

    const handleDelete = async (chatId: string) => {
        try {
            await axios.delete(`/agents/${agentId}/chats/${chatId}`);
            onChatDeleted(chatId);
        } catch (error) {
            console.error('Failed to delete chat:', error);
        } finally {
            setDeleteId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
        if (e.key === 'Enter') {
            handleSaveTitle(chatId);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    // Group chats by date
    const groupedChats = chats.reduce((groups, chat) => {
        const date = new Date(chat.updated_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        let group: string;
        if (date.toDateString() === today.toDateString()) {
            group = t('Today');
        } else if (date.toDateString() === yesterday.toDateString()) {
            group = t('Yesterday');
        } else if (date > lastWeek) {
            group = t('Last 7 days');
        } else {
            group = t('Older');
        }

        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(chat);
        return groups;
    }, {} as Record<string, ChatSummary[]>);

    const groupOrder = [t('Today'), t('Yesterday'), t('Last 7 days'), t('Older')];

    return (
        <div className="flex flex-col h-full bg-muted/30 border-r">
            {/* New Chat Button */}
            <div className="p-3 border-b">
                <Button
                    onClick={onNewChat}
                    variant="outline"
                    className="w-full justify-start gap-2"
                >
                    <Plus className="h-4 w-4" />
                    {t('New Chat')}
                </Button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                    {groupOrder.map((group) => {
                        const groupChats = groupedChats[group];
                        if (!groupChats || groupChats.length === 0) return null;

                        return (
                            <div key={group} className="mb-4">
                                <h3 className="px-2 mb-1 text-xs font-medium text-muted-foreground">
                                    {group}
                                </h3>
                                <div className="space-y-1">
                                    {groupChats.map((chat) => (
                                        <div
                                            key={chat._id}
                                            className={cn(
                                                'group relative flex items-center rounded-lg hover:bg-accent transition-colors',
                                                currentChatId === chat._id && 'bg-accent'
                                            )}
                                        >
                                            {editingId === chat._id ? (
                                                <div className="flex items-center gap-1 p-2 w-full">
                                                    <Input
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, chat._id)}
                                                        className="h-7 text-sm"
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => handleSaveTitle(chat._id)}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => onSelectChat(chat._id)}
                                                        className="flex-1 flex items-center gap-2 p-2 text-left"
                                                    >
                                                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        <span className="truncate text-sm">
                                                            {chat.title || t('New Chat')}
                                                        </span>
                                                    </button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 mr-1"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleStartEdit(chat)}
                                                            >
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                {t('Rename')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleteId(chat._id)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                {t('Delete')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {chats.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            {t('No chats yet')}
                        </p>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Delete Chat')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('Are you sure you want to delete this chat? This action cannot be undone.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && handleDelete(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
