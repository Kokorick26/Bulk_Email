import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, RefreshCw, Mail, MailOpen, Star, Trash2, Archive,
    ChevronLeft, ChevronRight, Loader2, AlertCircle, Settings2,
    Search, MoreVertical, CheckSquare, Square, Clock, Paperclip, X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { useTheme } from '../../lib/ThemeContext';
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
}

export default function InboxView({ smtpAccounts, onRefreshAccounts }: InboxViewProps) {
    const { theme } = useTheme();
    const [selectedAccount, setSelectedAccount] = useState<SmtpAccount | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [showImapConfig, setShowImapConfig] = useState(false);
    const [accountToConfig, setAccountToConfig] = useState<SmtpAccount | null>(null);

    // Filter accounts with IMAP configured
    const configuredAccounts = smtpAccounts.filter(a => a.imapConfigured);
    const unconfiguredAccounts = smtpAccounts.filter(a => !a.imapConfigured);

    // Auto-select first configured account
    useEffect(() => {
        if (!selectedAccount && configuredAccounts.length > 0) {
            setSelectedAccount(configuredAccounts[0]);
        }
    }, [configuredAccounts, selectedAccount]);

    // Fetch messages when account changes
    const fetchMessages = useCallback(async (fresh = false) => {
        if (!selectedAccount) return;

        setLoading(true);
        if (fresh) setFetching(true);

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

            if (fresh) {
                // Fetch fresh from IMAP
                const res = await fetch(`${API_BASE}/fetch/${selectedAccount.id}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ folder: 'INBOX', limit: 50 }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to fetch');
                }

                const data = await res.json();
                setMessages(data.messages || []);
                toast.success(`Fetched ${data.count} emails`);
            } else {
                // Get cached messages
                const res = await fetch(`${API_BASE}/messages/${selectedAccount.id}?folder=INBOX`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            }
        } catch (err: any) {
            console.error('Error fetching messages:', err);
            toast.error(err.message || 'Failed to fetch messages');
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, [selectedAccount]);

    useEffect(() => {
        if (selectedAccount?.imapConfigured) {
            fetchMessages(true);
        }
    }, [selectedAccount, fetchMessages]);

    const handleMarkAsRead = async (message: Message) => {
        if (!message.uid || message.isRead) return;

        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/message/${message.accountId}/${message.uid}/read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessages(prev => prev.map(m =>
                m.id === message.id ? { ...m, isRead: true } : m
            ));
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
            if (selectedMessage?.id === message.id) {
                setSelectedMessage(null);
            }
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

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filteredMessages = messages.filter(m =>
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.snippet.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // No configured accounts view
    if (configuredAccounts.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center mb-6',
                    theme === 'dark' ? 'bg-[#3c4043]' : 'bg-[#e8f0fe]'
                )}>
                    <Mail className={cn(
                        'w-10 h-10',
                        theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                    )} />
                </div>
                <h2 className={cn(
                    'text-xl font-medium mb-2',
                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                )}>
                    Configure IMAP to View Inbox
                </h2>
                <p className={cn(
                    'text-center max-w-md mb-6',
                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                )}>
                    To view your inbox, you need to configure IMAP settings for at least one SMTP account.
                </p>

                {smtpAccounts.length === 0 ? (
                    <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                    )}>
                        No SMTP accounts found. Add an SMTP account first.
                    </p>
                ) : (
                    <div className="space-y-3 w-full max-w-sm">
                        {unconfiguredAccounts.map(account => (
                            <button
                                key={account.id}
                                onClick={() => handleOpenImapConfig(account)}
                                className={cn(
                                    'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
                                    theme === 'dark'
                                        ? 'border-[#3c4043] bg-[#303134] hover:bg-[#3c4043]'
                                        : 'border-[#dadce0] bg-white hover:bg-[#f1f3f4]'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center',
                                        theme === 'dark' ? 'bg-[#3c4043]' : 'bg-[#e8f0fe]'
                                    )}>
                                        <Mail className="w-5 h-5 text-[#1a73e8]" />
                                    </div>
                                    <div className="text-left">
                                        <div className={cn(
                                            'font-medium',
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>
                                            {account.name}
                                        </div>
                                        <div className={cn(
                                            'text-sm',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            {account.fromEmail}
                                        </div>
                                    </div>
                                </div>
                                <Settings2 className={cn(
                                    'w-5 h-5',
                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                )} />
                            </button>
                        ))}
                    </div>
                )}

                {/* IMAP Config Dialog */}
                <ImapConfigDialog
                    open={showImapConfig}
                    onOpenChange={setShowImapConfig}
                    account={accountToConfig}
                    onSuccess={handleImapConfigured}
                />
            </div>
        );
    }

    // Email viewer view
    if (selectedMessage) {
        return (
            <EmailViewer
                message={selectedMessage}
                onBack={() => setSelectedMessage(null)}
                onDelete={() => handleDelete(selectedMessage)}
                onMarkAsRead={() => handleMarkAsRead(selectedMessage)}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className={cn(
                'flex items-center gap-2 px-4 py-2 border-b',
                theme === 'dark' ? 'border-[#3c4043]' : 'border-[#dadce0]'
            )}>
                {/* Account Selector */}
                <select
                    value={selectedAccount?.id || ''}
                    onChange={(e) => {
                        const acc = configuredAccounts.find(a => a.id === e.target.value);
                        setSelectedAccount(acc || null);
                    }}
                    className={cn(
                        'px-3 py-1.5 rounded-lg border text-sm',
                        theme === 'dark'
                            ? 'bg-[#303134] border-[#3c4043] text-[#e8eaed]'
                            : 'bg-white border-[#dadce0] text-[#202124]'
                    )}
                >
                    {configuredAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.fromEmail})
                        </option>
                    ))}
                </select>

                {/* Refresh Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fetchMessages(true)}
                    disabled={fetching}
                    className={cn(
                        'rounded-full',
                        theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                    )}
                >
                    <RefreshCw className={cn(
                        'w-4 h-4',
                        fetching && 'animate-spin',
                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                    )} />
                </Button>

                {/* Configure IMAP for unconfigured accounts */}
                {unconfiguredAccounts.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenImapConfig(unconfiguredAccounts[0])}
                        className={cn(
                            'ml-auto',
                            theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                        )}
                    >
                        <Settings2 className="w-4 h-4 mr-1" />
                        Configure More Accounts
                    </Button>
                )}

                {/* Search */}
                <div className={cn(
                    'flex-1 max-w-md ml-auto relative',
                )}>
                    <Search className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                    )} />
                    <Input
                        type="text"
                        placeholder="Search emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'pl-10 pr-4',
                            theme === 'dark'
                                ? 'bg-[#303134] border-[#3c4043]'
                                : 'bg-[#f1f3f4] border-transparent'
                        )}
                    />
                </div>
            </div>

            {/* Message List */}
            <ScrollArea className="flex-1">
                {loading && messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Inbox className={cn(
                            'w-16 h-16 mb-4',
                            theme === 'dark' ? 'text-[#3c4043]' : 'text-[#dadce0]'
                        )} />
                        <p className={cn(
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            {searchQuery ? 'No matching emails found' : 'No emails in your inbox'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-transparent">
                        <AnimatePresence>
                            {filteredMessages.map((message, index) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.02 }}
                                    onClick={() => {
                                        setSelectedMessage(message);
                                        if (!message.isRead) handleMarkAsRead(message);
                                    }}
                                    className={cn(
                                        'flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors border-b',
                                        theme === 'dark'
                                            ? 'border-[#3c4043] hover:bg-[#303134]'
                                            : 'border-[#f1f3f4] hover:bg-[#f8f9fa]',
                                        !message.isRead && (theme === 'dark' ? 'bg-[#303134]' : 'bg-[#f2f6fc]')
                                    )}
                                >
                                    {/* Checkbox */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedMessages.has(message.id)}
                                            onCheckedChange={(checked: boolean | 'indeterminate') => {
                                                const newSet = new Set(selectedMessages);
                                                if (checked === true) {
                                                    newSet.add(message.id);
                                                } else {
                                                    newSet.delete(message.id);
                                                }
                                                setSelectedMessages(newSet);
                                            }}
                                        />
                                    </div>

                                    {/* Star */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Toggle star
                                        }}
                                        className={cn(
                                            'shrink-0',
                                            message.isStarred
                                                ? 'text-yellow-400'
                                                : theme === 'dark'
                                                    ? 'text-[#5f6368]'
                                                    : 'text-[#9aa0a6]'
                                        )}
                                    >
                                        <Star className={cn('w-5 h-5', message.isStarred && 'fill-current')} />
                                    </button>

                                    {/* Sender */}
                                    <div className={cn(
                                        'w-48 shrink-0 truncate',
                                        !message.isRead && 'font-semibold',
                                        theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                    )}>
                                        {message.fromName || message.fromEmail}
                                    </div>

                                    {/* Subject & Snippet */}
                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                        <span className={cn(
                                            'shrink-0',
                                            !message.isRead && 'font-semibold',
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>
                                            {message.subject}
                                        </span>
                                        <span className={cn(
                                            'truncate',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            - {message.snippet}
                                        </span>
                                    </div>

                                    {/* Attachment Icon */}
                                    {message.hasAttachments && (
                                        <Paperclip className={cn(
                                            'w-4 h-4 shrink-0',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )} />
                                    )}

                                    {/* Date */}
                                    <div className={cn(
                                        'text-sm shrink-0',
                                        !message.isRead && 'font-semibold',
                                        theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                    )}>
                                        {formatDate(message.date)}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>

            {/* IMAP Config Dialog */}
            <ImapConfigDialog
                open={showImapConfig}
                onOpenChange={setShowImapConfig}
                account={accountToConfig}
                onSuccess={handleImapConfigured}
            />
        </div>
    );
}
