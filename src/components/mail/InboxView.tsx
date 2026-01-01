import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, RefreshCw, Mail, MailOpen, Star, Trash2,
    Loader2, AlertCircle, Settings2, Search, Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { cache } from '../../lib/cache';
import { ScrollArea } from '../ui/ScrollArea';
import { Checkbox } from '../ui/Checkbox';
import { useTheme } from '../../lib/ThemeContext';
import { useDashboardContext } from '../../layouts/DashboardShell';
import EmailViewer from './EmailViewer';
import ImapConfigDialog from './ImapConfigDialog';

const API_BASE = '/api/inbox';

interface Message {
    id: string;
    uid: number;
    accountId: string;
    folder: string;
    from: string;
    fromName: string;
    fromEmail: string;
    to: string;
    subject: string;
    date: string;
    text: string;
    html: string;
    isRead: boolean;
    isStarred: boolean;
    hasAttachments: boolean;
    attachmentCount: number;
    snippet: string;
    messageId: string;
    campaign?: string;
}

interface SmtpAccount {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    fromEmail: string;
    imapConfigured?: boolean;
    imapHost?: string;
    imapPort?: number;
    imapUser?: string;
    imapPassword?: string;
}

interface InboxViewProps {
    smtpAccounts: SmtpAccount[];
    onRefreshAccounts: () => void;
    onReply?: (message: Message) => void;
    onForward?: (message: Message) => void;
}

type FilterType = 'all' | 'unread' | 'starred' | 'has_attachments';

// Map sidebar items to folder names and filters
const SIDEBAR_TO_FOLDER: Record<string, { folder?: string; filter?: FilterType }> = {
    'all-mail': { folder: 'INBOX', filter: 'all' },
    'unread': { filter: 'unread' },
    'starred': { filter: 'starred' },
    'sent': { folder: 'Sent' },
    'archive': { folder: 'Archive' },
    'inbox': { folder: 'INBOX' },
    'drafts': { folder: 'Drafts' },
    'spam': { folder: 'Spam' },
    'trash': { folder: 'Trash' },
};

export default function InboxView({ smtpAccounts, onRefreshAccounts, onReply, onForward }: InboxViewProps) {
    const { theme } = useTheme();
    const { activeSubItem, setActiveSubItem } = useDashboardContext();
    const isDark = theme === 'dark';

    const [selectedAccount, setSelectedAccount] = useState<SmtpAccount | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [showImapConfig, setShowImapConfig] = useState(false);
    const [accountToConfig, setAccountToConfig] = useState<SmtpAccount | null>(null);

    // Derive active folder and filter from context
    const sidebarConfig = SIDEBAR_TO_FOLDER[activeSubItem] || { folder: 'INBOX', filter: 'all' };
    const activeFolder = sidebarConfig.folder || 'INBOX';
    const activeFilter: FilterType = sidebarConfig.filter || 'all';

    const configuredAccounts = smtpAccounts.filter(a => a.imapConfigured);
    const unconfiguredAccounts = smtpAccounts.filter(a => !a.imapConfigured);

    useEffect(() => {
        if (!selectedAccount && configuredAccounts.length > 0) {
            setSelectedAccount(configuredAccounts[0]);
        }
    }, [configuredAccounts, selectedAccount]);

    const fetchMessages = useCallback(async (fresh = false) => {
        if (!selectedAccount) return;

        if (!fresh) {
            try {
                const cachedMessages = await cache.getCachedMessages(selectedAccount.id, activeFolder);
                if (cachedMessages && cachedMessages.length > 0) {
                    setMessages(cachedMessages);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error('Cache read error:', e);
            }
        }

        setLoading(true);
        if (fresh) setFetching(true);

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

            if (fresh) {
                const res = await fetch(`${API_BASE}/fetch/${selectedAccount.id}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ folder: activeFolder, limit: 50 }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to fetch');
                }

                const data = await res.json();
                const fetchedMessages = data.messages || [];
                setMessages(fetchedMessages);
                await cache.cacheMessages(selectedAccount.id, activeFolder, fetchedMessages);
                toast.success(`Fetched ${data.count} emails`);
            } else {
                const res = await fetch(`${API_BASE}/messages/${selectedAccount.id}?folder=${activeFolder}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                    await cache.cacheMessages(selectedAccount.id, activeFolder, data);
                }
            }
        } catch (err: any) {
            console.error('Error fetching messages:', err);
            toast.error(err.message || 'Failed to fetch messages');
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, [selectedAccount, activeFolder]);

    const [prevFolder, setPrevFolder] = useState<string>('INBOX');

    useEffect(() => {
        if (selectedAccount?.imapConfigured) {
            const folderChanged = prevFolder !== activeFolder;
            if (folderChanged) {
                setPrevFolder(activeFolder);
                setMessages([]);
                fetchMessages(true);
            } else {
                fetchMessages(false);
            }
        }
    }, [selectedAccount, activeFolder]);

    const handleMarkAsRead = async (message: Message) => {
        if (!message.uid || message.isRead) return;
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/message/${message.accountId}/${message.uid}/read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(prev => prev.map(m => m.id === message.id ? { ...m, isRead: true } : m));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleDelete = async (message: Message) => {
        if (!confirm('Delete this message?')) return;
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/message/${message.accountId}/${message.uid}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(prev => prev.filter(m => m.id !== message.id));
            if (selectedMessage?.id === message.id) setSelectedMessage(null);
            toast.success('Message deleted');
        } catch (err) {
            toast.error('Failed to delete message');
        }
    };

    const handleOpenImapConfig = (account: SmtpAccount) => {
        setAccountToConfig(account);
        setShowImapConfig(true);
    };

    const handleImapConfigured = () => {
        onRefreshAccounts();
        setShowImapConfig(false);
        toast.success('IMAP configured successfully!');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filteredMessages = messages.filter(m => {
        if (activeFilter === 'unread' && m.isRead) return false;
        if (activeFilter === 'starred' && !m.isStarred) return false;
        if (activeFilter === 'has_attachments' && !m.hasAttachments) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return m.subject.toLowerCase().includes(query) || m.from.toLowerCase().includes(query) || m.snippet.toLowerCase().includes(query);
        }
        return true;
    });

    const unreadCount = messages.filter(m => !m.isRead).length;

    // No configured accounts
    if (configuredAccounts.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-6',
                    isDark ? 'bg-neutral-800' : 'bg-gray-100'
                )}>
                    <Mail className={cn('w-8 h-8', isDark ? 'text-orange-400' : 'text-orange-600')} />
                </div>
                <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                    Configure IMAP to View Inbox
                </h2>
                <p className={cn('text-center max-w-md mb-6', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    Configure IMAP settings for at least one SMTP account to start receiving emails.
                </p>
                {smtpAccounts.length === 0 ? (
                    <p className={cn('text-sm', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                        No SMTP accounts found. Add an SMTP account first.
                    </p>
                ) : (
                    <div className="space-y-2 w-full max-w-sm">
                        {unconfiguredAccounts.map(account => (
                            <button
                                key={account.id}
                                onClick={() => handleOpenImapConfig(account)}
                                className={cn(
                                    'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
                                    isDark
                                        ? 'border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        isDark ? 'bg-neutral-700' : 'bg-gray-100'
                                    )}>
                                        <Mail className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className={cn('font-medium text-sm', isDark ? 'text-white' : 'text-gray-900')}>
                                            {account.name}
                                        </div>
                                        <div className={cn('text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                            {account.fromEmail}
                                        </div>
                                    </div>
                                </div>
                                <Settings2 className={cn('w-5 h-5', isDark ? 'text-neutral-500' : 'text-gray-400')} />
                            </button>
                        ))}
                    </div>
                )}
                <ImapConfigDialog
                    open={showImapConfig}
                    onOpenChange={setShowImapConfig}
                    account={accountToConfig}
                    onSuccess={handleImapConfigured}
                />
            </div>
        );
    }

    // Email viewer
    if (selectedMessage) {
        return (
            <EmailViewer
                message={selectedMessage}
                onBack={() => setSelectedMessage(null)}
                onDelete={() => handleDelete(selectedMessage)}
                onMarkAsRead={() => handleMarkAsRead(selectedMessage)}
                onReply={() => onReply?.(selectedMessage)}
                onForward={() => onForward?.(selectedMessage)}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Account Tabs + Refresh */}
            <div className={cn(
                'flex items-center justify-between px-4 py-2 border-b flex-shrink-0',
                isDark ? 'border-neutral-800' : 'border-gray-200'
            )}>
                <div className="flex items-center gap-1 overflow-x-auto">
                    {configuredAccounts.map(account => (
                        <button
                            key={account.id}
                            onClick={() => setSelectedAccount(account)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap',
                                selectedAccount?.id === account.id
                                    ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                                    : isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
                            <div className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                                selectedAccount?.id === account.id
                                    ? 'bg-orange-500 text-white'
                                    : isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-gray-200 text-gray-600'
                            )}>
                                {account.fromEmail.charAt(0).toUpperCase()}
                            </div>
                            <span className="max-w-[150px] truncate">{account.fromEmail}</span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => fetchMessages(true)}
                    disabled={fetching}
                    className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                        isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    )}
                >
                    <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
                    {fetching ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Search */}
            <div className={cn('px-4 py-3 flex-shrink-0', isDark ? 'border-b border-neutral-800' : 'border-b border-gray-200')}>
                <div className={cn(
                    'flex items-center gap-2 h-9 px-3 rounded-lg',
                    isDark ? 'bg-neutral-900' : 'bg-gray-100'
                )}>
                    <Search className={cn('w-4 h-4', isDark ? 'text-neutral-500' : 'text-gray-400')} />
                    <input
                        type="text"
                        placeholder="Search emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'flex-1 bg-transparent border-0 outline-none text-[13px]',
                            isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                        )}
                    />
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
                {loading && messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className={cn('w-6 h-6 animate-spin', isDark ? 'text-orange-500' : 'text-blue-500')} />
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className={cn(
                            'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                            isDark ? 'bg-neutral-800' : 'bg-gray-100'
                        )}>
                            <Inbox className={cn('w-7 h-7', isDark ? 'text-neutral-600' : 'text-gray-400')} />
                        </div>
                        <p className={cn('text-sm', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                            {searchQuery ? 'No matching emails' : 'No emails in this folder'}
                        </p>
                    </div>
                ) : (
                    <div>
                        <AnimatePresence>
                            {filteredMessages.map((message, index) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: index * 0.01 }}
                                    onClick={() => {
                                        setSelectedMessage(message);
                                        if (!message.isRead) handleMarkAsRead(message);
                                    }}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-colors',
                                        isDark
                                            ? 'border-neutral-800 hover:bg-neutral-800/50'
                                            : 'border-gray-100 hover:bg-gray-50',
                                        !message.isRead && (isDark ? 'bg-neutral-800/30' : 'bg-blue-50/30')
                                    )}
                                >
                                    <Checkbox
                                        checked={selectedMessages.has(message.id)}
                                        onCheckedChange={(checked) => {
                                            const newSet = new Set(selectedMessages);
                                            if (checked) newSet.add(message.id);
                                            else newSet.delete(message.id);
                                            setSelectedMessages(newSet);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-[13px] truncate',
                                                !message.isRead && 'font-semibold',
                                                isDark ? 'text-white' : 'text-gray-900'
                                            )}>
                                                {message.fromEmail}
                                            </span>
                                            {message.hasAttachments && (
                                                <Paperclip className={cn('w-3 h-3', isDark ? 'text-neutral-500' : 'text-gray-400')} />
                                            )}
                                        </div>
                                        <div className={cn(
                                            'text-[13px] truncate',
                                            !message.isRead && 'font-medium',
                                            isDark ? 'text-neutral-300' : 'text-gray-700'
                                        )}>
                                            {message.subject}
                                        </div>
                                        <p className={cn('text-[12px] truncate', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                                            {message.snippet}
                                        </p>
                                    </div>
                                    <div className={cn('text-[11px] whitespace-nowrap', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                        {formatDate(message.date)}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>

            <ImapConfigDialog
                open={showImapConfig}
                onOpenChange={setShowImapConfig}
                account={accountToConfig}
                onSuccess={handleImapConfigured}
            />
        </div>
    );
}
