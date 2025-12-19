import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, RefreshCw, Mail, Loader2, Search, Eye, MoreVertical,
    CheckCircle2, XCircle, Clock, ExternalLink, User, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useTheme } from '../../lib/ThemeContext';

const API_BASE = '/api/inbox';

interface SentEmail {
    id: string;
    email: string;
    subject: string;
    campaignName: string;
    status: 'sent' | 'failed';
    sentAt: string;
    messageId?: string;
    error?: string;
    htmlContent?: string;
    smtpAccountId?: string;
}

interface SmtpAccount {
    id: string;
    name: string;
    fromEmail: string;
}

interface SentViewProps {
    smtpAccounts: SmtpAccount[];
}

export default function SentView({ smtpAccounts }: SentViewProps) {
    const { theme } = useTheme();
    const [emails, setEmails] = useState<SentEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
    const [filterAccount, setFilterAccount] = useState<string>('all');

    const fetchSentEmails = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/sent?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setEmails(data);
            }
        } catch (err) {
            console.error('Error fetching sent emails:', err);
            toast.error('Failed to fetch sent emails');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSentEmails();
    }, [fetchSentEmails]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const getAccountName = (accountId?: string) => {
        if (!accountId) return 'Unknown';
        const account = smtpAccounts.find(a => a.id === accountId);
        return account?.name || 'System Default';
    };

    const filteredEmails = emails.filter(email => {
        const matchesSearch =
            email.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.campaignName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesAccount = filterAccount === 'all' || email.smtpAccountId === filterAccount;

        return matchesSearch && matchesAccount;
    });

    const stats = {
        total: emails.length,
        successful: emails.filter(e => e.status === 'sent').length,
        failed: emails.filter(e => e.status === 'failed').length,
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stats Header */}
            <div className={cn(
                'px-6 py-4 border-b',
                theme === 'dark' ? 'border-[#3c4043]' : 'border-[#dadce0]'
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className={cn(
                            'text-xl font-medium',
                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                        )}>
                            Sent Emails
                        </h1>
                        <p className={cn(
                            'text-sm mt-1',
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            View all emails sent from your campaigns
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchSentEmails}
                        disabled={loading}
                        className={cn(
                            'rounded-full',
                            theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                        )}
                    >
                        <RefreshCw className={cn(
                            'w-5 h-5',
                            loading && 'animate-spin',
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )} />
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className={cn(
                        'p-4 rounded-xl',
                        theme === 'dark' ? 'bg-[#303134]' : 'bg-[#f1f3f4]'
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center',
                                theme === 'dark' ? 'bg-[#3c4043]' : 'bg-white'
                            )}>
                                <Send className="w-5 h-5 text-[#1a73e8]" />
                            </div>
                            <div>
                                <div className={cn(
                                    'text-2xl font-medium',
                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                )}>
                                    {stats.total}
                                </div>
                                <div className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                )}>
                                    Total Sent
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={cn(
                        'p-4 rounded-xl',
                        theme === 'dark' ? 'bg-[#303134]' : 'bg-[#f1f3f4]'
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center',
                                'bg-green-500/10'
                            )}>
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <div className={cn(
                                    'text-2xl font-medium',
                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                )}>
                                    {stats.successful}
                                </div>
                                <div className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                )}>
                                    Delivered
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={cn(
                        'p-4 rounded-xl',
                        theme === 'dark' ? 'bg-[#303134]' : 'bg-[#f1f3f4]'
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center',
                                'bg-red-500/10'
                            )}>
                                <XCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <div className={cn(
                                    'text-2xl font-medium',
                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                )}>
                                    {stats.failed}
                                </div>
                                <div className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                )}>
                                    Failed
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className={cn(
                'flex items-center gap-4 px-6 py-3 border-b',
                theme === 'dark' ? 'border-[#3c4043]' : 'border-[#dadce0]'
            )}>
                {/* Account Filter */}
                <select
                    value={filterAccount}
                    onChange={(e) => setFilterAccount(e.target.value)}
                    className={cn(
                        'px-3 py-1.5 rounded-lg border text-sm',
                        theme === 'dark'
                            ? 'bg-[#303134] border-[#3c4043] text-[#e8eaed]'
                            : 'bg-white border-[#dadce0] text-[#202124]'
                    )}
                >
                    <option value="all">All Accounts</option>
                    {smtpAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                            {acc.name}
                        </option>
                    ))}
                </select>

                {/* Search */}
                <div className="flex-1 max-w-md relative">
                    <Search className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                    )} />
                    <Input
                        type="text"
                        placeholder="Search by email, subject, or campaign..."
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

            {/* Email List */}
            <ScrollArea className="flex-1">
                {loading && emails.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
                    </div>
                ) : filteredEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Send className={cn(
                            'w-16 h-16 mb-4',
                            theme === 'dark' ? 'text-[#3c4043]' : 'text-[#dadce0]'
                        )} />
                        <p className={cn(
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            {searchQuery || filterAccount !== 'all'
                                ? 'No matching emails found'
                                : 'No sent emails yet. Start a campaign to send emails.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-transparent">
                        <AnimatePresence>
                            {filteredEmails.map((email, index) => (
                                <motion.div
                                    key={email.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.01 }}
                                    onClick={() => setSelectedEmail(email)}
                                    className={cn(
                                        'flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors border-b',
                                        theme === 'dark'
                                            ? 'border-[#3c4043] hover:bg-[#303134]'
                                            : 'border-[#f1f3f4] hover:bg-[#f8f9fa]'
                                    )}
                                >
                                    {/* Status Icon */}
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                        email.status === 'sent'
                                            ? 'bg-green-500/10'
                                            : 'bg-red-500/10'
                                    )}>
                                        {email.status === 'sent' ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>

                                    {/* Recipient */}
                                    <div className={cn(
                                        'w-48 shrink-0 truncate',
                                        theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                    )}>
                                        {email.email}
                                    </div>

                                    {/* Subject & Campaign */}
                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            'truncate',
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>
                                            {email.subject}
                                        </div>
                                        <div className={cn(
                                            'text-sm truncate',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            Campaign: {email.campaignName}
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className={cn(
                                        'text-sm shrink-0',
                                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                    )}>
                                        {formatDate(email.sentAt)}
                                    </div>

                                    {/* View Arrow */}
                                    <ChevronRight className={cn(
                                        'w-5 h-5 shrink-0',
                                        theme === 'dark' ? 'text-[#5f6368]' : 'text-[#9aa0a6]'
                                    )} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>

            {/* Email Detail Dialog */}
            <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
                <DialogContent className={cn(
                    'max-w-2xl max-h-[80vh] overflow-hidden flex flex-col',
                    theme === 'dark' ? 'bg-[#303134] border-[#3c4043]' : ''
                )}>
                    <DialogHeader>
                        <DialogTitle className={cn(
                            'flex items-center gap-3',
                            theme === 'dark' ? 'text-[#e8eaed]' : ''
                        )}>
                            <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                                selectedEmail?.status === 'sent'
                                    ? 'bg-green-500/10'
                                    : 'bg-red-500/10'
                            )}>
                                {selectedEmail?.status === 'sent' ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <div className="truncate">
                                {selectedEmail?.subject}
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedEmail && (
                        <ScrollArea className="flex-1 -mx-6 px-6">
                            <div className="space-y-4 py-4">
                                {/* Recipient */}
                                <div className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg',
                                    theme === 'dark' ? 'bg-[#202124]' : 'bg-[#f1f3f4]'
                                )}>
                                    <User className={cn(
                                        'w-5 h-5',
                                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                    )} />
                                    <div>
                                        <div className={cn(
                                            'text-sm',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            Sent to
                                        </div>
                                        <div className={cn(
                                            'font-medium',
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>
                                            {selectedEmail.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={cn(
                                        'p-3 rounded-lg',
                                        theme === 'dark' ? 'bg-[#202124]' : 'bg-[#f1f3f4]'
                                    )}>
                                        <div className={cn(
                                            'text-sm mb-1',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            Campaign
                                        </div>
                                        <div className={cn(
                                            'font-medium truncate',
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>
                                            {selectedEmail.campaignName}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        'p-3 rounded-lg',
                                        theme === 'dark' ? 'bg-[#202124]' : 'bg-[#f1f3f4]'
                                    )}>
                                        <div className={cn(
                                            'text-sm mb-1',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            Sent At
                                        </div>
                                        <div className={cn(
                                            'font-medium',
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>
                                            {formatDate(selectedEmail.sentAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className={cn(
                                    'flex items-center gap-2 p-3 rounded-lg',
                                    selectedEmail.status === 'sent'
                                        ? theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'
                                        : theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'
                                )}>
                                    {selectedEmail.status === 'sent' ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            <span className="text-green-600 dark:text-green-400">
                                                Successfully delivered
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-5 h-5 text-red-500" />
                                            <div>
                                                <span className="text-red-600 dark:text-red-400">
                                                    Delivery failed
                                                </span>
                                                {selectedEmail.error && (
                                                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                                                        {selectedEmail.error}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Email Preview */}
                                {selectedEmail.htmlContent && (
                                    <div>
                                        <div className={cn(
                                            'text-sm mb-2',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            Email Preview
                                        </div>
                                        <div className={cn(
                                            'p-4 rounded-lg border max-h-64 overflow-auto',
                                            theme === 'dark'
                                                ? 'bg-[#202124] border-[#3c4043]'
                                                : 'bg-white border-[#dadce0]'
                                        )}>
                                            <div
                                                className={cn(
                                                    'text-sm',
                                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                                )}
                                                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Message ID */}
                                {selectedEmail.messageId && (
                                    <div className={cn(
                                        'text-xs font-mono p-2 rounded',
                                        theme === 'dark' ? 'bg-[#202124] text-[#9aa0a6]' : 'bg-[#f1f3f4] text-[#5f6368]'
                                    )}>
                                        Message ID: {selectedEmail.messageId}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
