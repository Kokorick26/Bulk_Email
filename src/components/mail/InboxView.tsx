import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, RefreshCw, Mail, MailOpen, Star, Trash2,
    Loader2, AlertCircle, Settings2, Search, Paperclip,
    Filter, Megaphone, Check, ChevronRight, ChevronLeft, Plus, Pencil
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
import ComposeEmailModal, { OriginalMessage } from './ComposeEmailModal';

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
    campaigns?: any[];
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

export default function InboxView({ smtpAccounts, campaigns = [], onRefreshAccounts, onReply, onForward }: InboxViewProps) {
    const { theme } = useTheme();
    const {
        activeSubItem,
        setActiveSubItem,
        inboxFilterAccountIds,
        setInboxFilterAccountIds,
        inboxFilterCampaignId,
        setInboxFilterCampaignId,
        inboxViewMode: viewMode,
        setInboxViewMode: setViewMode,
        socket
    } = useDashboardContext();
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

    // Compose modal state
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [composeMode, setComposeMode] = useState<'compose' | 'reply' | 'replyAll' | 'forward'>('compose');
    const [composeOriginalMessage, setComposeOriginalMessage] = useState<OriginalMessage | null>(null);

    // Derive active folder and filter from context
    const sidebarConfig = SIDEBAR_TO_FOLDER[activeSubItem] || { folder: 'INBOX', filter: 'all' };
    const activeFolder = sidebarConfig.folder || 'INBOX';
    const activeFilter: FilterType = sidebarConfig.filter || 'all';

    // Filter accounts based on inboxFilterAccountIds (for campaign or account selection)
    const configuredAccounts = smtpAccounts.filter(a => {
        if (!a.imapConfigured) return false;
        // If filtering by specific accounts (either from campaign or direct selection)
        if (inboxFilterAccountIds.length > 0) {
            return inboxFilterAccountIds.includes(a.id);
        }
        // Otherwise show all configured accounts
        return true;
    });
    const unconfiguredAccounts = smtpAccounts.filter(a => !a.imapConfigured);

    // Clear campaign filter function
    const clearCampaignFilter = () => {
        setInboxFilterAccountIds([]);
        setInboxFilterCampaignId(null);
        setViewMode('selection');
    };

    useEffect(() => {
        // If no account selected, or current selection is not in the (potentially filtered) list
        if (configuredAccounts.length > 0) {
            const currentIsValid = selectedAccount && configuredAccounts.some(a => a.id === selectedAccount.id);
            if (!currentIsValid) {
                setSelectedAccount(configuredAccounts[0]);
            }
        } else if (configuredAccounts.length === 0) {
            setSelectedAccount(null);
        }
    }, [configuredAccounts, selectedAccount]);

    // ... (fetchMessages code omitted for brevity but preserved in context) see next tools if needed

    // ... (rest of logic) ...

    // Selection View Handler
    const handleSelection = (type: 'all' | 'account' | 'campaign', id?: string) => {
        if (type === 'all') {
            setInboxFilterAccountIds([]);
            setInboxFilterCampaignId(null);
            setViewMode('inbox');
        } else if (type === 'account' && id) {
            setInboxFilterAccountIds([id]);
            setInboxFilterCampaignId(null); // Explicit account select clears campaign context
            setViewMode('inbox');
        } else if (type === 'campaign' && id) {
            const campaign = campaigns.find(c => c && c.id === id);
            if (campaign) {
                setInboxFilterCampaignId(id);
                setInboxFilterAccountIds(campaign.options?.selectedAccountIds || []);
                setViewMode('inbox');
            }
        }
    };



    // No configured accounts (Moved this check down so selection can show even if none configured? No, if none configured, selection is moot for 'account'/'campaign'. 'All' would be empty.
    // Actually, stick to existing logic: if `viewMode === 'inbox'`, run standard checks.
    // If I put this check *after* viewMode check, `configuredAccounts` filtering logic inside `handleSelection` (via map) needs to be safe. It is safe above.
    // If no accounts are configured at all, `configuredAccounts` length is 0.Selection screen shows empty lists for accounts. 'All' shows empty inbox.
    // So logic holds.

    // ... (Continue to fetchMessages)

    const fetchMessages = useCallback(async (fresh = false) => {
        if (!selectedAccount) return;

        // Always try cache first (unless explicitly fresh)
        if (!fresh) {
            try {
                const cachedMessages = await cache.getCachedMessages(selectedAccount.id, activeFolder);
                if (cachedMessages && cachedMessages.length > 0) {
                    // Ensure sorted
                    const sorted = cachedMessages.sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setMessages(sorted);
                    setLoading(false);
                    return; // Use cache, don't fetch
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
                // Fresh fetch from IMAP
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
                let fetchedMessages = data.messages || [];

                // Ensure sorted
                fetchedMessages = fetchedMessages.sort((a: Message, b: Message) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                setMessages(fetchedMessages);
                await cache.cacheMessages(selectedAccount.id, activeFolder, fetchedMessages);
                toast.success(`Fetched ${data.count} emails`);
            } else {
                // Get from DynamoDB cache
                const res = await fetch(`${API_BASE}/messages/${selectedAccount.id}?folder=${activeFolder}`, { headers });
                if (res.ok) {
                    const data = await res.json();

                    // Ensure sorted
                    const sorted = (data || []).sort((a: Message, b: Message) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );

                    setMessages(sorted);
                    await cache.cacheMessages(selectedAccount.id, activeFolder, sorted);
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
    const [prevAccount, setPrevAccount] = useState<string | null>(null);

    // Use cache-first strategy when switching folders
    useEffect(() => {
        if (!selectedAccount?.imapConfigured) return;

        const folderChanged = prevFolder !== activeFolder;
        const accountChanged = prevAccount !== selectedAccount.id;

        if (folderChanged || accountChanged) {
            setPrevFolder(activeFolder);
            setPrevAccount(selectedAccount.id);

            // Try to show cached data immediately
            (async () => {
                const cachedMessages = await cache.getCachedMessages(selectedAccount.id, activeFolder);
                if (cachedMessages && cachedMessages.length > 0) {
                    // Show cached data immediately
                    setMessages(cachedMessages);
                    setLoading(false);

                    // Background refresh only if cache is old (> 2 min)
                    const cacheAge = Date.now() - (cachedMessages as any)._cacheTime || 0;
                    if (cacheAge > 2 * 60 * 1000) {
                        // Silently refresh in background
                        fetchMessages(false);
                    }
                } else {
                    // No cache, fetch from server
                    setMessages([]);
                    fetchMessages(false);
                }
            })();
        }
    }, [selectedAccount, activeFolder]);

    // Real-time updates
    useEffect(() => {
        if (!socket || !selectedAccount) return;

        const handleNewEmails = async (data: any) => {
            // Check if update is for current account
            if (data.accountId === selectedAccount.id) {
                // Update cache for this folder (even if not currently viewing)
                await cache.appendMessages(data.accountId, data.folder, data.messages);

                // Update UI if viewing this folder
                if (data.folder === activeFolder) {
                    setMessages(prev => {
                        // Filter out any duplicates (just in case)
                        const existingIds = new Set(prev.map(m => m.id));
                        const newUnique = data.messages.filter((m: Message) => !existingIds.has(m.id));

                        if (newUnique.length === 0) return prev;

                        const updated = [...newUnique, ...prev];
                        // Sort by date desc
                        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    });
                }
            }
        };

        socket.on('NEW_EMAILS', handleNewEmails);

        return () => {
            socket.off('NEW_EMAILS', handleNewEmails);
        };
    }, [socket, selectedAccount, activeFolder]);

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

    // Compose/Reply/Forward handlers
    const handleCompose = () => {
        setComposeMode('compose');
        setComposeOriginalMessage(null);
        setShowComposeModal(true);
    };

    const handleReply = (message: Message) => {
        setComposeMode('reply');
        setComposeOriginalMessage(message as OriginalMessage);
        setShowComposeModal(true);
    };

    const handleReplyAll = (message: Message) => {
        setComposeMode('replyAll');
        setComposeOriginalMessage(message as OriginalMessage);
        setShowComposeModal(true);
    };

    const handleForward = (message: Message) => {
        setComposeMode('forward');
        setComposeOriginalMessage(message as OriginalMessage);
        setShowComposeModal(true);
    };

    const handleComposeSuccess = () => {
        // Refresh messages after sending
        fetchMessages(true);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filteredMessages = messages.filter(m => {
        // Filter by campaign if active
        if (inboxFilterCampaignId) {
            if (m.campaign !== inboxFilterCampaignId) return false;
        }

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

    if (viewMode === 'selection') {
        return (
            <div className={cn(
                "flex-1 flex flex-col p-6 overflow-hidden",
                isDark ? "bg-[#0a0a0a]" : "bg-gray-50"
            )}>
                <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
                    <div className="mb-6">
                        <h1 className={cn("text-lg font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                            Inbox View
                        </h1>
                        <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                            Select how you would like to view your emails
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
                        {/* Option 1: All Emails */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelection('all')}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-lg border transition-all text-center h-full max-h-[400px]",
                                isDark ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:border-orange-500/20" : "bg-white border-gray-200 hover:border-orange-300"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                                isDark ? "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20" : "bg-orange-50 text-orange-600"
                            )}>
                                <Inbox className="w-6 h-6" />
                            </div>
                            <h3 className={cn("text-sm font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                                All Emails
                            </h3>
                            <p className={cn("text-[10px] max-w-[200px] leading-relaxed", isDark ? "text-gray-500" : "text-gray-500")}>
                                View emails from all connected accounts in one unified timeline
                            </p>
                        </motion.button>

                        {/* Option 2: Select Account */}
                        <div className={cn(
                            "flex flex-col rounded-lg border overflow-hidden h-full max-h-[400px]",
                            isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
                        )}>
                            <div className={cn(
                                "flex items-center gap-2 p-3 border-b",
                                isDark ? "border-neutral-800" : "border-gray-100"
                            )}>
                                <div className={cn(
                                    "w-7 h-7 rounded flex items-center justify-center",
                                    isDark ? "bg-blue-500/10 text-blue-500" : "bg-blue-50 text-blue-600"
                                )}>
                                    <Mail className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <h3 className={cn("text-xs font-semibold", isDark ? "text-white" : "text-gray-900")}>
                                        By Account
                                    </h3>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {smtpAccounts.filter(a => a.imapConfigured).map(account => (
                                    <button
                                        key={account.id}
                                        onClick={() => handleSelection('account', account.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 p-2 rounded text-left transition-all group",
                                            isDark ? "hover:bg-neutral-800 border border-transparent hover:border-neutral-800" : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                                            isDark ? "bg-neutral-800 text-gray-400 group-hover:bg-neutral-700" : "bg-gray-100 text-gray-600 group-hover:bg-white"
                                        )}>
                                            {account.fromEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={cn("text-[11px] font-medium truncate group-hover:text-blue-400 transition-colors", isDark ? "text-gray-300" : "text-gray-800")}>
                                                {account.name}
                                            </p>
                                            <p className={cn("text-[10px] truncate opacity-60", isDark ? "text-gray-500" : "text-gray-500")}>
                                                {account.fromEmail}
                                            </p>
                                        </div>
                                        <ChevronRight className={cn(
                                            "w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity",
                                            isDark ? "text-gray-500" : "text-gray-400"
                                        )} />
                                    </button>
                                ))}
                                {smtpAccounts.filter(a => a.imapConfigured).length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-32 text-center opacity-40">
                                        <Mail className="w-6 h-6 mb-2" />
                                        <p className="text-[10px]">No IMAP accounts configured</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Option 3: Campaign Wise */}
                        <div className={cn(
                            "flex flex-col rounded-lg border overflow-hidden h-full max-h-[400px]",
                            isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
                        )}>
                            <div className={cn(
                                "flex items-center gap-2 p-3 border-b",
                                isDark ? "border-neutral-800" : "border-gray-100"
                            )}>
                                <div className={cn(
                                    "w-7 h-7 rounded flex items-center justify-center",
                                    isDark ? "bg-purple-500/10 text-purple-500" : "bg-purple-50 text-purple-600"
                                )}>
                                    <Megaphone className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <h3 className={cn("text-xs font-semibold", isDark ? "text-white" : "text-gray-900")}>
                                        By Campaign
                                    </h3>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {campaigns.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 text-center opacity-40">
                                        <Megaphone className="w-6 h-6 mb-2" />
                                        <p className="text-[10px]">No campaigns found</p>
                                    </div>
                                ) : (
                                    campaigns.map(campaign => (
                                        <button
                                            key={campaign.id}
                                            onClick={() => handleSelection('campaign', campaign.id)}
                                            className={cn(
                                                "w-full flex items-center gap-2.5 p-2 rounded text-left transition-all group",
                                                isDark ? "hover:bg-neutral-800 border border-transparent hover:border-neutral-800" : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded flex items-center justify-center text-[10px] shrink-0",
                                                isDark ? "bg-neutral-800 text-purple-400 group-hover:bg-neutral-700" : "bg-purple-50 text-purple-600 group-hover:bg-white"
                                            )}>
                                                <Megaphone className="w-3 h-3" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn("text-[11px] font-medium truncate group-hover:text-purple-400 transition-colors", isDark ? "text-gray-300" : "text-gray-800")}>
                                                    {campaign.name}
                                                </p>
                                                <p className={cn("text-[10px] truncate opacity-60", isDark ? "text-gray-500" : "text-gray-500")}>
                                                    {campaign.options?.selectedAccountIds?.length || 0} accounts linked
                                                </p>
                                            </div>
                                            <ChevronRight className={cn(
                                                "w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity",
                                                isDark ? "text-gray-500" : "text-gray-400"
                                            )} />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
            <>
                <EmailViewer
                    message={selectedMessage}
                    onBack={() => setSelectedMessage(null)}
                    onDelete={() => handleDelete(selectedMessage)}
                    onMarkAsRead={() => handleMarkAsRead(selectedMessage)}
                    onReply={() => handleReply(selectedMessage)}
                    onReplyAll={() => handleReplyAll(selectedMessage)}
                    onForward={() => handleForward(selectedMessage)}
                    onArchive={() => {
                        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
                        setSelectedMessage(null);
                    }}
                    onMessageUpdate={(updatedMessage) => {
                        setMessages(prev => prev.map(m =>
                            m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
                        ));
                        setSelectedMessage(updatedMessage);
                    }}
                />
                <ComposeEmailModal
                    isOpen={showComposeModal}
                    onClose={() => setShowComposeModal(false)}
                    smtpAccounts={smtpAccounts.map(a => ({
                        id: a.id,
                        name: a.name,
                        fromEmail: a.fromEmail,
                        fromName: a.name,
                    }))}
                    mode={composeMode}
                    originalMessage={composeOriginalMessage}
                    onSuccess={handleComposeSuccess}
                    defaultAccountId={selectedAccount?.id}
                />
            </>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full relative">
            {/* Campaign Filter Banner */}
            {inboxFilterAccountIds.length > 0 && (
                <div className={cn(
                    'px-4 py-2 text-xs flex items-center justify-between flex-shrink-0',
                    isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                )}>
                    <div className="flex items-center gap-2">
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Viewing accounts for selected campaign</span>
                    </div>
                    <button
                        onClick={clearCampaignFilter}
                        className="hover:underline opacity-80 hover:opacity-100 font-medium"
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Account Tabs + Refresh */}
            <div className={cn(
                'flex items-center justify-between px-4 py-2 border-b flex-shrink-0',
                isDark ? 'border-neutral-800' : 'border-gray-200'
            )}>
                <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                        onClick={() => setViewMode('selection')}
                        className={cn(
                            'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors mr-2',
                            isDark ? 'text-gray-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        )}
                        title="Back to selection"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
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

            {/* Floating Compose Button */}
            <button
                onClick={handleCompose}
                className="absolute bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-none shadow-lg font-medium bg-orange-500 text-white"
            >
                <Pencil className="w-5 h-5" />
                <span className="hidden sm:inline">Compose</span>
            </button>

            <ImapConfigDialog
                open={showImapConfig}
                onOpenChange={setShowImapConfig}
                account={accountToConfig}
                onSuccess={handleImapConfigured}
            />

            <ComposeEmailModal
                isOpen={showComposeModal}
                onClose={() => setShowComposeModal(false)}
                smtpAccounts={smtpAccounts.map(a => ({
                    id: a.id,
                    name: a.name,
                    fromEmail: a.fromEmail,
                    fromName: a.name,
                }))}
                mode={composeMode}
                originalMessage={composeOriginalMessage}
                onSuccess={handleComposeSuccess}
                defaultAccountId={selectedAccount?.id}
            />
        </div>
    );
}
