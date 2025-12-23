import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, RefreshCw, Mail, MailOpen, Star, Trash2, Archive,
    ChevronLeft, ChevronRight, Loader2, AlertCircle, Settings2,
    Search, MoreVertical, CheckSquare, Square, Clock, Paperclip, X,
    Zap, Filter, ChevronDown, Users, Megaphone, Folder, MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { cache } from '../../lib/cache';
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

type TabType = 'primary' | 'others';
type FilterType = 'all' | 'unread' | 'starred' | 'has_attachments';

export default function InboxView({ smtpAccounts, onRefreshAccounts, onReply, onForward }: InboxViewProps) {
    const { theme } = useTheme();
    const [selectedAccount, setSelectedAccount] = useState<SmtpAccount | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [inboxSearch, setInboxSearch] = useState('');
    const [showImapConfig, setShowImapConfig] = useState(false);
    const [accountToConfig, setAccountToConfig] = useState<SmtpAccount | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('primary');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [sidebarSection, setSidebarSection] = useState<'status' | 'inboxes' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash' | 'more'>('inboxes');
    const [activeFolder, setActiveFolder] = useState<string>('INBOX');

    // Filter accounts with IMAP configured
    const configuredAccounts = smtpAccounts.filter(a => a.imapConfigured);
    const unconfiguredAccounts = smtpAccounts.filter(a => !a.imapConfigured);

    // Auto-select first configured account
    useEffect(() => {
        if (!selectedAccount && configuredAccounts.length > 0) {
            setSelectedAccount(configuredAccounts[0]);
        }
    }, [configuredAccounts, selectedAccount]);

    // Fetch messages when account or folder changes
    const fetchMessages = useCallback(async (fresh = false) => {
        if (!selectedAccount) return;

        const cacheKey = `${activeFolder}:${selectedAccount.id}`;

        // Try to load from IndexedDB cache first (instant)
        if (!fresh) {
            try {
                const cachedMessages = await cache.getCachedMessages(selectedAccount.id, activeFolder);
                if (cachedMessages && cachedMessages.length > 0) {
                    setMessages(cachedMessages);
                    setLoading(false);
                    console.log(`Loaded ${cachedMessages.length} messages from cache (${activeFolder})`);
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
                // Fetch fresh from IMAP
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

                // Cache to IndexedDB
                await cache.cacheMessages(selectedAccount.id, activeFolder, fetchedMessages);

                toast.success(`Fetched ${data.count} emails from ${activeFolder}`);
            } else {
                // Get from server cache (DynamoDB)
                const res = await fetch(`${API_BASE}/messages/${selectedAccount.id}?folder=${activeFolder}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);

                    // Cache to IndexedDB
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

    // Track previous folder to detect folder changes
    const [prevFolder, setPrevFolder] = useState<string>('INBOX');

    // Load messages when account or folder changes
    useEffect(() => {
        if (selectedAccount?.imapConfigured) {
            // If folder changed, always fetch fresh
            const folderChanged = prevFolder !== activeFolder;
            if (folderChanged) {
                setPrevFolder(activeFolder);
                setMessages([]); // Clear old messages immediately
                fetchMessages(true); // Fetch fresh from IMAP
            } else {
                fetchMessages(false); // Use cache
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
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Apply filters
    const filteredMessages = messages.filter(m => {
        // Tab filter
        if (activeTab === 'others' && !m.campaign) return false;
        if (activeTab === 'primary' && m.campaign) return false;

        // Status filter
        if (activeFilter === 'unread' && m.isRead) return false;
        if (activeFilter === 'starred' && !m.isStarred) return false;
        if (activeFilter === 'has_attachments' && !m.hasAttachments) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                m.subject.toLowerCase().includes(query) ||
                m.from.toLowerCase().includes(query) ||
                m.snippet.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Count unread messages
    const unreadCount = messages.filter(m => !m.isRead).length;

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
                onReply={() => onReply?.(selectedMessage)}
                onForward={() => onForward?.(selectedMessage)}
            />
        );
    }

    return (
        <div className="flex-1 flex overflow-hidden h-full">
            {/* Left Sidebar - Inbox Style */}
            <div className={cn(
                'w-44 flex-shrink-0 flex flex-col border-r',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-[#f8f9fa] border-gray-200'
            )}>
                <ScrollArea className="flex-1 py-4">
                    {/* Status Section */}
                    <div className="px-4 mb-4">
                        <button
                            onClick={() => setSidebarSection('status')}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                sidebarSection === 'status'
                                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <span>Status</span>
                        </button>

                        {sidebarSection === 'status' && (
                            <div className="mt-2 space-y-1">
                                <button
                                    onClick={() => setActiveFilter('all')}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                        activeFilter === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    <Mail className="w-4 h-4" />
                                    All Messages
                                    {messages.length > 0 && (
                                        <span className={cn(
                                            'ml-auto text-xs px-1.5 py-0.5 rounded',
                                            activeFilter === 'all' ? 'bg-blue-500' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                        )}>
                                            {messages.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveFilter('unread')}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                        activeFilter === 'unread'
                                            ? 'bg-blue-600 text-white'
                                            : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    <MailOpen className="w-4 h-4" />
                                    Unread
                                    {unreadCount > 0 && (
                                        <span className={cn(
                                            'ml-auto text-xs px-1.5 py-0.5 rounded',
                                            activeFilter === 'unread' ? 'bg-blue-500' : 'bg-blue-600 text-white'
                                        )}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveFilter('starred')}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                        activeFilter === 'starred'
                                            ? 'bg-blue-600 text-white'
                                            : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    <Star className="w-4 h-4" />
                                    Starred
                                </button>
                            </div>
                        )}
                    </div>

                    {/* All Inboxes Section */}
                    <div className="px-4 mb-4">
                        <button
                            onClick={() => setSidebarSection('inboxes')}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                sidebarSection === 'inboxes'
                                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <span>All Inboxes</span>
                            {activeFolder === 'INBOX' && (
                                <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                        </button>

                        {sidebarSection === 'inboxes' && (
                            <div className="mt-2 space-y-2">
                                <div className="relative">
                                    <Search className={cn(
                                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )} />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={inboxSearch}
                                        onChange={(e) => setInboxSearch(e.target.value)}
                                        className={cn(
                                            'w-full pl-9 pr-3 py-2 rounded-lg text-sm border-0',
                                            theme === 'dark'
                                                ? 'bg-gray-800 text-white placeholder:text-gray-500'
                                                : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'
                                        )}
                                    />
                                </div>

                                {/* Inbox accounts list */}
                                <div className="space-y-1 mt-2">
                                    {configuredAccounts
                                        .filter(acc => !inboxSearch || acc.fromEmail.toLowerCase().includes(inboxSearch.toLowerCase()))
                                        .map(account => (
                                            <button
                                                key={account.id}
                                                onClick={() => {
                                                    setSelectedAccount(account);
                                                    setActiveFolder('INBOX');
                                                }}
                                                className={cn(
                                                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                                                    selectedAccount?.id === account.id
                                                        ? 'bg-blue-600 text-white'
                                                        : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                                                    selectedAccount?.id === account.id
                                                        ? 'bg-blue-500 text-white'
                                                        : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                                )}>
                                                    {account.fromEmail.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate flex-1">{account.fromEmail}</span>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sent Section */}
                    <div className="px-4 mb-4">
                        <button
                            onClick={() => setSidebarSection('sent')}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                sidebarSection === 'sent'
                                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>Sent</span>
                            </div>
                            {activeFolder === 'Sent' && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                        </button>

                        {sidebarSection === 'sent' && (
                            <div className="mt-2 space-y-1">
                                {configuredAccounts.map(account => (
                                    <button
                                        key={account.id}
                                        onClick={() => {
                                            setSelectedAccount(account);
                                            setActiveFolder('Sent');
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                                            selectedAccount?.id === account.id && activeFolder === 'Sent'
                                                ? 'bg-blue-600 text-white'
                                                : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                                            selectedAccount?.id === account.id && activeFolder === 'Sent'
                                                ? 'bg-blue-500 text-white'
                                                : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                        )}>
                                            {account.fromEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate flex-1">{account.fromEmail}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Drafts Section */}
                    <div className="px-4 mb-4">
                        <button
                            onClick={() => setSidebarSection('drafts')}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                sidebarSection === 'drafts'
                                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>Drafts</span>
                            </div>
                            {activeFolder === 'Drafts' && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                        </button>

                        {sidebarSection === 'drafts' && (
                            <div className="mt-2 space-y-1">
                                {configuredAccounts.map(account => (
                                    <button
                                        key={account.id}
                                        onClick={() => {
                                            setSelectedAccount(account);
                                            setActiveFolder('Drafts');
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                                            selectedAccount?.id === account.id && activeFolder === 'Drafts'
                                                ? 'bg-blue-600 text-white'
                                                : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                                            selectedAccount?.id === account.id && activeFolder === 'Drafts'
                                                ? 'bg-blue-500 text-white'
                                                : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                        )}>
                                            {account.fromEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate flex-1">{account.fromEmail}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Archive Section */}
                    <div className="px-4 mb-4">
                        <button
                            onClick={() => setSidebarSection('archive')}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                sidebarSection === 'archive'
                                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Archive className="w-4 h-4" />
                                <span>Archive</span>
                            </div>
                            {activeFolder === 'Archive' && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                        </button>

                        {sidebarSection === 'archive' && (
                            <div className="mt-2 space-y-1">
                                {configuredAccounts.map(account => (
                                    <button
                                        key={account.id}
                                        onClick={() => {
                                            setSelectedAccount(account);
                                            setActiveFolder('Archive');
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                                            selectedAccount?.id === account.id && activeFolder === 'Archive'
                                                ? 'bg-blue-600 text-white'
                                                : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                                            selectedAccount?.id === account.id && activeFolder === 'Archive'
                                                ? 'bg-blue-500 text-white'
                                                : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                        )}>
                                            {account.fromEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate flex-1">{account.fromEmail}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Spam Section */}
                    <div className="px-4 mb-4">
                        <button
                            onClick={() => setSidebarSection('spam')}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                sidebarSection === 'spam'
                                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>Spam</span>
                            </div>
                            {activeFolder === 'Spam' && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                        </button>

                        {sidebarSection === 'spam' && (
                            <div className="mt-2 space-y-1">
                                {configuredAccounts.map(account => (
                                    <button
                                        key={account.id}
                                        onClick={() => {
                                            setSelectedAccount(account);
                                            setActiveFolder('Spam');
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                                            selectedAccount?.id === account.id && activeFolder === 'Spam'
                                                ? 'bg-blue-600 text-white'
                                                : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                                            selectedAccount?.id === account.id && activeFolder === 'Spam'
                                                ? 'bg-blue-500 text-white'
                                                : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                        )}>
                                            {account.fromEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate flex-1">{account.fromEmail}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Trash Section */}
                    <div className="px-4 mb-4">
                        <button
                            onClick={() => setSidebarSection('trash')}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                sidebarSection === 'trash'
                                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                <span>Trash</span>
                            </div>
                            {activeFolder === 'Trash' && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                        </button>

                        {sidebarSection === 'trash' && (
                            <div className="mt-2 space-y-1">
                                {configuredAccounts.map(account => (
                                    <button
                                        key={account.id}
                                        onClick={() => {
                                            setSelectedAccount(account);
                                            setActiveFolder('Trash');
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                                            selectedAccount?.id === account.id && activeFolder === 'Trash'
                                                ? 'bg-blue-600 text-white'
                                                : theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                                            selectedAccount?.id === account.id && activeFolder === 'Trash'
                                                ? 'bg-blue-500 text-white'
                                                : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                        )}>
                                            {account.fromEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate flex-1">{account.fromEmail}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* More Section */}
                    <div className="px-4">
                        <button
                            onClick={() => setSidebarSection('more')}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                sidebarSection === 'more'
                                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <span>More</span>
                        </button>

                        {sidebarSection === 'more' && (
                            <div className="mt-2 space-y-1">
                                <button
                                    onClick={() => {
                                        if (unconfiguredAccounts.length > 0) {
                                            handleOpenImapConfig(unconfiguredAccounts[0]);
                                        }
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                        theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    <Settings2 className="w-4 h-4" />
                                    Configure IMAP
                                </button>
                                <button
                                    onClick={() => fetchMessages(true)}
                                    disabled={fetching}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                        theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
                                    Refresh Inbox
                                </button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Email List Area */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {/* Tabs - Primary / Others */}
                <div className={cn(
                    'flex items-center gap-6 px-6 border-b',
                    theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                )}>
                    <button
                        onClick={() => setActiveTab('primary')}
                        className={cn(
                            'py-4 text-sm font-medium border-b-2 transition-colors -mb-px',
                            activeTab === 'primary'
                                ? 'border-blue-500 text-blue-500'
                                : theme === 'dark'
                                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                        )}
                    >
                        Primary
                    </button>
                    <button
                        onClick={() => setActiveTab('others')}
                        className={cn(
                            'py-4 text-sm font-medium border-b-2 transition-colors -mb-px',
                            activeTab === 'others'
                                ? 'border-blue-500 text-blue-500'
                                : theme === 'dark'
                                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                        )}
                    >
                        Others
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-3">
                    <div className="relative">
                        <Search className={cn(
                            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )} />
                        <input
                            type="text"
                            placeholder="Search mail"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border',
                                theme === 'dark'
                                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {loading && messages.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className={cn(
                                'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                            )}>
                                <Inbox className={cn(
                                    'w-8 h-8',
                                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                )} />
                            </div>
                            <p className={cn(
                                'text-sm',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            )}>
                                {searchQuery ? 'No matching emails found' : 'No emails in your inbox'}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full">
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
                                            'grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-3 cursor-pointer transition-colors border-b',
                                            theme === 'dark'
                                                ? 'hover:bg-gray-800/50 border-gray-800'
                                                : 'hover:bg-gray-50 border-gray-100',
                                            !message.isRead && (theme === 'dark' ? 'bg-gray-800/30' : 'bg-blue-50/30')
                                        )}
                                    >
                                        {/* Checkbox */}
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center"
                                        >
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

                                        {/* Email Content - constrained width */}
                                        <div className="min-w-0">
                                            <div className={cn(
                                                'text-sm truncate',
                                                !message.isRead && 'font-semibold',
                                                theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                                            )}>
                                                {message.fromEmail}
                                            </div>
                                            <div className={cn(
                                                'text-sm truncate',
                                                !message.isRead && 'font-medium',
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                                            )}>
                                                {message.subject}
                                                {message.hasAttachments && (
                                                    <Paperclip className="w-3 h-3 inline ml-1 text-gray-400" />
                                                )}
                                            </div>
                                            <p className={cn(
                                                'text-xs truncate',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                            )}>
                                                {message.snippet}
                                            </p>
                                        </div>

                                        {/* Date - fixed width */}
                                        <div className={cn(
                                            'text-xs whitespace-nowrap',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            {formatDate(message.date)}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Load More Button */}
                            <div className="px-4 py-3">
                                <button
                                    onClick={() => fetchMessages(true)}
                                    disabled={fetching}
                                    className={cn(
                                        'w-full py-2 rounded-lg text-sm transition-colors',
                                        theme === 'dark'
                                            ? 'text-gray-400 hover:bg-gray-800'
                                            : 'text-gray-500 hover:bg-gray-100'
                                    )}
                                >
                                    {fetching ? 'Loading...' : 'Load more'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
