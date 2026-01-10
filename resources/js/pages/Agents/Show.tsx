import { useState, useRef, useEffect } from 'react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import { Bot, Send, Loader2, PanelLeftClose, PanelLeft } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/agent/ChatMessage';
import { ChatSidebar } from '@/components/agent/ChatSidebar';
import { ApprovalDialog } from '@/components/agent/ApprovalDialog';
import axios from 'axios';
import type { PageProps } from '@/types';

interface Agent {
    _id: string;
    name: string;
    description: string | null;
    provider: string;
    model: string;
    is_active: boolean;
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
    }>;
    created_at: string;
}

interface PendingToolCall {
    id: string;
    tool: string;
    parameters: Record<string, unknown>;
    explanation: string;
    log_id: string;
}

interface Chat {
    _id: string;
    messages: Message[];
    pending_tool_call: PendingToolCall | null;
    title: string | null;
}

interface ChatSummary {
    _id: string;
    title: string;
    updated_at: string;
}

interface Props extends PageProps {
    agent: Agent;
    chat: Chat;
    chats: ChatSummary[];
}

export default function AgentsShow({ agent, chat: initialChat, chats: initialChats }: Props) {
    const { t } = useLaravelReactI18n();
    const [messages, setMessages] = useState<Message[]>(initialChat.messages);
    const [pendingToolCall, setPendingToolCall] = useState<PendingToolCall | null>(
        initialChat.pending_tool_call
    );
    const [chatId, setChatId] = useState(initialChat._id);
    const [chatTitle, setChatTitle] = useState(initialChat.title);
    const [chats, setChats] = useState(initialChats);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        // Optimistically add user message
        const tempUserMessage: Message = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMessage]);

        try {
            const response = await axios.post(`/agents/${agent._id}/chat`, {
                message: userMessage,
                chat_id: chatId,
            });

            if (response.data.success) {
                setMessages(response.data.messages);
                setPendingToolCall(response.data.pending_tool_call);
                if (response.data.chat_id !== chatId) {
                    setChatId(response.data.chat_id);
                }
                
                // Update chat title in sidebar if this is the first message
                if (!chatTitle && response.data.messages.length > 0) {
                    const firstUserMsg = response.data.messages.find((m: Message) => m.role === 'user');
                    if (firstUserMsg) {
                        const newTitle = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
                        setChatTitle(newTitle);
                        setChats((prev) =>
                            prev.map((c) =>
                                c._id === chatId ? { ...c, title: newTitle, updated_at: new Date().toISOString() } : c
                            )
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove optimistic message on error
            setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!pendingToolCall) return;

        setIsLoading(true);
        try {
            const response = await axios.post(`/agents/${agent._id}/approve`, {
                chat_id: chatId,
            });

            if (response.data.success) {
                setMessages(response.data.messages);
                setPendingToolCall(null);
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeny = async () => {
        if (!pendingToolCall) return;

        setIsLoading(true);
        try {
            const response = await axios.post(`/agents/${agent._id}/deny`, {
                chat_id: chatId,
            });

            if (response.data.success) {
                setMessages(response.data.messages);
                setPendingToolCall(null);
            }
        } catch (error) {
            console.error('Failed to deny:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = async () => {
        try {
            const response = await axios.post(`/agents/${agent._id}/chats`);
            if (response.data.success) {
                setChatId(response.data.chat._id);
                setChatTitle(null);
                setMessages([]);
                setPendingToolCall(null);
                setChats((prev) => [
                    { _id: response.data.chat._id, title: t('New Chat'), updated_at: new Date().toISOString() },
                    ...prev,
                ]);
            }
        } catch (error) {
            console.error('Failed to create new chat:', error);
        }
    };

    const handleSelectChat = async (loadChatId: string) => {
        if (loadChatId === chatId) return;

        try {
            const response = await axios.get(`/agents/${agent._id}/chats/${loadChatId}`);
            if (response.data.success) {
                setChatId(response.data.chat._id);
                setChatTitle(response.data.chat.title);
                setMessages(response.data.chat.messages);
                setPendingToolCall(response.data.chat.pending_tool_call);
            }
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    };

    const handleChatDeleted = (deletedChatId: string) => {
        setChats((prev) => prev.filter((c) => c._id !== deletedChatId));
        
        // If the deleted chat was the current one, create a new chat
        if (deletedChatId === chatId) {
            const remainingChats = chats.filter((c) => c._id !== deletedChatId);
            if (remainingChats.length > 0) {
                handleSelectChat(remainingChats[0]._id);
            } else {
                handleNewChat();
            }
        }
    };

    const handleTitleUpdated = (updatedChatId: string, title: string) => {
        setChats((prev) =>
            prev.map((c) => (c._id === updatedChatId ? { ...c, title } : c))
        );
        if (updatedChatId === chatId) {
            setChatTitle(title);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AppLayout
            title={agent.name}
            breadcrumbs={[
                { label: t('AI Agents'), href: '/agents' },
                { label: agent.name },
            ]}
            actions={
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    title={sidebarOpen ? t('Hide sidebar') : t('Show sidebar')}
                >
                    {sidebarOpen ? (
                        <PanelLeftClose className="h-5 w-5" />
                    ) : (
                        <PanelLeft className="h-5 w-5" />
                    )}
                </Button>
            }
        >
            <div className="flex h-[calc(100vh-5rem)] -mx-6 -mt-6 -mb-6">
                {/* Sidebar - independently scrollable */}
                {sidebarOpen && (
                    <div className="w-64 shrink-0 h-full overflow-hidden">
                        <ChatSidebar
                            agentId={agent._id}
                            chats={chats}
                            currentChatId={chatId}
                            onSelectChat={handleSelectChat}
                            onNewChat={handleNewChat}
                            onChatDeleted={handleChatDeleted}
                            onTitleUpdated={handleTitleUpdated}
                        />
                    </div>
                )}

                {/* Main Chat Area - flex column with fixed input */}
                <div className="flex-1 flex flex-col min-w-0 h-full">
                    {/* Chat Title - fixed at top */}
                    {chatTitle && (
                        <div className="py-2 px-6 border-b shrink-0">
                            <h2 className="text-lg font-medium truncate">{chatTitle}</h2>
                        </div>
                    )}

                    {/* Chat Messages - scrollable area */}
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="space-y-4 p-6">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">
                                        {t('Start a conversation')}
                                    </h3>
                                    <p className="text-muted-foreground max-w-md">
                                        {agent.description || t('Ask the agent anything about your CMS content.')}
                                    </p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <ChatMessage key={message.id} message={message} />
                                ))
                            )}

                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">{t('Thinking...')}</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Pending Tool Call Approval - fixed above input */}
                    {pendingToolCall && (
                        <div className="px-6 shrink-0">
                            <ApprovalDialog
                                toolCall={pendingToolCall}
                                onApprove={handleApprove}
                                onDeny={handleDeny}
                                isLoading={isLoading}
                            />
                        </div>
                    )}

                    {/* Input Area - fixed at bottom */}
                    <div className="border-t p-4 px-6 shrink-0 bg-background">
                        <div className="flex gap-2">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('Type your message...')}
                                className="min-h-[60px] resize-none"
                                disabled={isLoading || !!pendingToolCall}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading || !!pendingToolCall}
                                className="h-auto"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('Press Enter to send, Shift+Enter for new line')}
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
