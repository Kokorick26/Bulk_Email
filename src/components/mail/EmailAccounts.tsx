
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Search, Plus, Mail, Check, Users,
    Loader2, Trash2, X, User, Building2, Phone, Globe, Linkedin, MapPin, Save, MoreHorizontal, LayoutDashboard,
    Calendar, Send, AlertCircle, Inbox, Server
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '../ui/DropdownMenu';

const API_BASE = '/api/bulk-email';

// Provider Logos
const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const MicrosoftLogo = () => (
    <svg viewBox="0 0 21 21" className="w-5 h-5">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
);

interface SmtpAccount {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
    isDefault: boolean;
    createdAt: string;
    imapConfigured?: boolean;
    imapHost?: string;
    imapPort?: number;
    emailsSent?: number;
    warmupEmails?: number;
    healthScore?: number;
    // Sender profile fields for email footer
    senderFullName?: string;
    senderPosition?: string;
    senderCompany?: string;
    senderPhone?: string;
    senderWebsite?: string;
    senderLinkedIn?: string;
    senderAddress?: string;
    senderSignature?: string;
}

interface EmailAccountsProps {
    accounts: SmtpAccount[];
    onRefresh: () => void;
    className?: string;
}

type RightPanelView = 'empty' | 'account-detail' | 'add-options' | 'form-intro' | 'form-basic' | 'form-imap' | 'form-smtp';

export function EmailAccounts({ accounts, onRefresh, className }: EmailAccountsProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // UI State
    const [view, setView] = useState<RightPanelView>('empty');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<SmtpAccount | null>(null);

    // Account Editing State
    const [saving, setSaving] = useState(false);
    const [sidebarSaving, setSidebarSaving] = useState(false);
    const [senderProfile, setSenderProfile] = useState({
        senderFullName: '',
        senderPosition: '',
        senderCompany: '',
        senderPhone: '',
        senderWebsite: '',
        senderLinkedIn: '',
        senderAddress: '',
        senderSignature: '',
    });

    // Form state for adding new account
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        imapUsername: '',
        imapPassword: '',
        imapHost: '',
        imapPort: '993',
        smtpUsername: '',
        smtpPassword: '',
        smtpHost: '',
        smtpPort: '587',
    });

    const [testingImap, setTestingImap] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);

    // Email History State
    interface EmailHistoryData {
        todaySentCount: number;
        dailyLimit: number;
        remainingToday: number;
        sentByCampaign: Array<{ campaignId: string; campaignName: string; emails: Array<{ id: string; to: string; subject: string; status: string; sentAt: string }> }>;
        scheduledByCampaign: Array<{ campaignId: string; campaignName: string; emails: Array<{ id: string; to: string; subject: string; scheduledTime: string }> }>;
        sentEmails: Array<{ id: string; to: string; subject: string; status: string; sentAt: string; campaignName?: string }>;
        scheduledEmails: Array<{ id: string; to: string; subject: string; scheduledTime: string; campaignName?: string }>;
    }
    const [emailHistory, setEmailHistory] = useState<EmailHistoryData | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);







    // Filter accounts
    const filteredAccounts = accounts.filter(a => {
        return a.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Selection Handler
    useEffect(() => {
        if (!selectedAccount && filteredAccounts.length > 0 && view === 'empty') {
            // Standard behavior: Select nothing until user clicks, OR could select first.
            // Leaving as empty to match explicit user action preference, unless they want auto-select.
            // LeadListsPage auto-selects. Let's try auto-selecting the first one if available.
            if (filteredAccounts.length > 0) {
                setSelectedAccount(filteredAccounts[0]);
            }
        }
    }, [filteredAccounts, selectedAccount, view]);

    // Update profile state when selection changes
    useEffect(() => {
        if (selectedAccount) {
            setSenderProfile({
                senderFullName: selectedAccount.senderFullName || selectedAccount.fromName || '',
                senderPosition: selectedAccount.senderPosition || '',
                senderCompany: selectedAccount.senderCompany || '',
                senderPhone: selectedAccount.senderPhone || '',
                senderWebsite: selectedAccount.senderWebsite || '',
                senderLinkedIn: selectedAccount.senderLinkedIn || '',
                senderAddress: selectedAccount.senderAddress || '',
                senderSignature: selectedAccount.senderSignature || '',
            });
            setView('account-detail');

            // Fetch email history for this account
            const fetchHistory = async () => {
                setHistoryLoading(true);
                try {
                    const token = localStorage.getItem('bulkEmailToken');
                    const res = await fetch(`${API_BASE}/smtp-accounts/${selectedAccount.id}/history`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setEmailHistory(data);
                    }
                } catch (err) {
                    console.error('Failed to fetch email history:', err);
                } finally {
                    setHistoryLoading(false);
                }
            };
            fetchHistory();
        }
    }, [selectedAccount]);


    const handleAddNew = () => {
        // Reset selection and show add options
        setSelectedAccount(null);
        setView('add-options');
    };

    const handleBack = () => {
        switch (view) {
            case 'form-basic': setView('add-options'); break;
            case 'form-imap': setView('form-basic'); break;
            case 'form-smtp': setView('form-imap'); break;
            default: setView('empty');
        }
    };

    // Save Logic (Sender Profile)
    const saveSenderProfile = async () => {
        if (!selectedAccount) return;
        setSidebarSaving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/smtp-accounts/${selectedAccount.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(senderProfile),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success('Sender profile updated!');
            onRefresh();
        } catch {
            toast.error('Failed to save sender profile');
        } finally {
            setSidebarSaving(false);
        }
    };

    // Save Logic (New Account)
    const handleSaveAccount = async () => {
        if (!form.email || !form.smtpHost || !form.smtpUsername || !form.smtpPassword) {
            toast.error('Please fill all required SMTP fields');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/smtp-accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: `${form.firstName} ${form.lastName}`.trim() || form.email,
                    host: form.smtpHost,
                    port: parseInt(form.smtpPort) || 587,
                    username: form.smtpUsername,
                    password: form.smtpPassword,
                    fromEmail: form.email,
                    fromName: `${form.firstName} ${form.lastName}`.trim(),
                    imapHost: form.imapHost || undefined,
                    imapPort: form.imapPort ? parseInt(form.imapPort) : undefined,
                    imapUser: form.imapUsername || undefined,
                    imapPassword: form.imapPassword || undefined,
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success('Account added successfully!');
            // Reset and refresh
            setForm({ firstName: '', lastName: '', email: '', imapUsername: '', imapPassword: '', imapHost: '', imapPort: '993', smtpUsername: '', smtpPassword: '', smtpHost: '', smtpPort: '587' });
            onRefresh();
            // Automatically select the new account (might need to wait for refresh, but for now just go back to empty/list)
            setView('empty');
        } catch {
            toast.error('Failed to save account');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('Delete this email account?')) return;
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/smtp-accounts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Account deleted');
            if (selectedAccount?.id === id) {
                setSelectedAccount(null);
                setView('empty');
            }
            onRefresh();
        } catch {
            toast.error('Failed to delete');
        }
    };

    // Auto-fill domain
    useEffect(() => {
        if (form.email && form.email.includes('@')) {
            const domain = form.email.split('@')[1].toLowerCase();
            const presets: Record<string, { imap: string; smtp: string }> = {
                'gmail.com': { imap: 'imap.gmail.com', smtp: 'smtp.gmail.com' },
                'outlook.com': { imap: 'outlook.office365.com', smtp: 'smtp.office365.com' },
                'hotmail.com': { imap: 'outlook.office365.com', smtp: 'smtp.office365.com' },
                'yahoo.com': { imap: 'imap.mail.yahoo.com', smtp: 'smtp.mail.yahoo.com' },
                'zoho.com': { imap: 'imappro.zoho.com', smtp: 'smtppro.zoho.com' },
            };
            const preset = presets[domain];
            if (preset && !form.imapHost && !form.smtpHost) {
                setForm(p => ({ ...p, imapHost: preset.imap, smtpHost: preset.smtp, imapUsername: form.email, smtpUsername: form.email }));
            }
        }
    }, [form.email]);

    return (
        <div className="flex flex-1 min-h-0 h-full">
            {/* SIDEBAR - List of Accounts */}
            <div className={cn(
                'w-[260px] flex-shrink-0 flex flex-col border-r h-full',
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-200'
            )}>
                {/* Header */}
                <div className={cn('px-3 py-3 border-b flex flex-col gap-3', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                    <div className="flex items-center justify-between">
                        <h2 className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                            Email Accounts
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                New
                            </button>
                        </div>
                    </div>
                    {/* Search */}
                    <div className={cn(
                        'flex items-center gap-2 h-8 px-2.5 rounded',
                        isDark ? 'bg-neutral-800' : 'bg-gray-100'
                    )}>
                        <Search className={cn('w-3.5 h-3.5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'flex-1 bg-transparent border-0 outline-none text-[11px]',
                                isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                    </div>


                </div>

                {/* List */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-0.5">
                        {filteredAccounts.length === 0 ? (
                            <div className="text-center py-10 px-3">
                                <div className={cn(
                                    'w-10 h-10 rounded mx-auto mb-2 flex items-center justify-center',
                                    isDark ? 'bg-neutral-800' : 'bg-gray-100'
                                )}>
                                    <Mail className={cn('w-5 h-5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                                </div>
                                <p className={cn('text-[11px] font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                                    No accounts
                                </p>
                                <button
                                    onClick={handleAddNew}
                                    className="text-[10px] text-orange-500 hover:underline font-medium"
                                >
                                    Add your first account →
                                </button>
                            </div>
                        ) : (
                            filteredAccounts.map(account => {
                                const isActive = selectedAccount?.id === account.id;
                                return (
                                    <button
                                        key={account.id}
                                        onClick={() => setSelectedAccount(account)}
                                        className={cn(
                                            'w-full flex items-center gap-2 p-2 rounded text-left transition-all group relative',
                                            isActive
                                                ? isDark ? 'bg-neutral-800' : 'bg-gray-100'
                                                : isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-7 h-7 rounded flex items-center justify-center shrink-0',
                                            isActive
                                                ? 'bg-orange-500 text-white'
                                                : isDark ? 'bg-neutral-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                        )}>
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn('text-[11px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                                {account.fromEmail}
                                            </p>
                                            <p className={cn('text-[9px] truncate', isDark ? 'text-gray-500' : 'text-gray-400')}>
                                                {account.name}
                                            </p>
                                        </div>

                                        {/* Context Menu Trigger */}
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className={cn(
                                                        'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                                                        isActive ? 'opacity-100 text-white' : isDark ? 'text-gray-400 hover:bg-neutral-700' : 'text-gray-500 hover:bg-gray-200'
                                                    )}>
                                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteAccount(account.id)}
                                                        className="text-red-500 focus:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {/* VIEW: ADD ACCOUNT FLOW */}
                    {['add-options', 'form-basic', 'form-imap', 'form-smtp'].includes(view) && (
                        <motion.div
                            key="add-flow"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 overflow-y-auto p-8"
                        >
                            <div className="max-w-2xl mx-auto">
                                {view === 'add-options' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-8">
                                            <Button variant="ghost" size="sm" onClick={() => { setView('empty'); setSelectedAccount(null); }} className="gap-2">
                                                <ChevronLeft className="w-4 h-4" /> Cancel
                                            </Button>
                                            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Add Email Account</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <button
                                                onClick={() => setView('form-basic')}
                                                className={cn(
                                                    'p-6 rounded-xl border text-left transition-all hover:scale-[1.02]',
                                                    isDark ? 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800' : 'bg-white border-gray-200 hover:shadow-md'
                                                )}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                                                    <GoogleLogo />
                                                </div>
                                                <h3 className={cn('font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>Google / G-Suite</h3>
                                                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>Connect using App Password</p>
                                            </button>

                                            <button
                                                onClick={() => setView('form-basic')}
                                                className={cn(
                                                    'p-6 rounded-xl border text-left transition-all hover:scale-[1.02]',
                                                    isDark ? 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800' : 'bg-white border-gray-200 hover:shadow-md'
                                                )}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                                                    <MicrosoftLogo />
                                                </div>
                                                <h3 className={cn('font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>Microsoft</h3>
                                                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>Outlook, Office 365, Hotmail</p>
                                            </button>

                                            <button
                                                onClick={() => setView('form-basic')}
                                                className={cn(
                                                    'p-6 rounded-xl border text-left transition-all hover:scale-[1.02]',
                                                    isDark ? 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800' : 'bg-white border-gray-200 hover:shadow-md'
                                                )}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-600">
                                                    <Mail className="w-6 h-6" />
                                                </div>
                                                <h3 className={cn('font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>Custom SMTP</h3>
                                                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>Any other email provider</p>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {view === 'form-basic' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-8">
                                            <Button variant="ghost" size="sm" onClick={() => setView('add-options')} className="gap-2">
                                                <ChevronLeft className="w-4 h-4" /> Back
                                            </Button>
                                            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Account Details</h2>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">First Name</label>
                                                    <input type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">Last Name</label>
                                                    <input type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Email Address</label>
                                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} />
                                            </div>
                                            <Button onClick={() => setView('form-imap')} disabled={!form.email} className="w-full bg-orange-500 text-white mt-4">Continue</Button>
                                        </div>
                                    </div>
                                )}

                                {/* (Condensed IMAP/SMTP forms for brevity but fully functional) */}
                                {view === 'form-imap' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-8">
                                            <Button variant="ghost" size="sm" onClick={() => setView('form-basic')} className="gap-2">
                                                <ChevronLeft className="w-4 h-4" /> Back
                                            </Button>
                                            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>IMAP Settings</h2>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">IMAP Host</label>
                                                <input type="text" value={form.imapHost} onChange={e => setForm(f => ({ ...f, imapHost: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-sm font-medium mb-1 block">Port</label><input type="text" value={form.imapPort} onChange={e => setForm(f => ({ ...f, imapPort: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} /></div>
                                                <div><label className="text-sm font-medium mb-1 block">Username</label><input type="text" value={form.imapUsername} onChange={e => setForm(f => ({ ...f, imapUsername: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} /></div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Password / App Password</label>
                                                <input type="password" value={form.imapPassword} onChange={e => setForm(f => ({ ...f, imapPassword: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} />
                                            </div>
                                            <Button onClick={() => setView('form-smtp')} className="w-full bg-orange-500 text-white mt-4">Continue</Button>
                                        </div>
                                    </div>
                                )}

                                {view === 'form-smtp' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-8">
                                            <Button variant="ghost" size="sm" onClick={() => setView('form-imap')} className="gap-2">
                                                <ChevronLeft className="w-4 h-4" /> Back
                                            </Button>
                                            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>SMTP Settings</h2>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">SMTP Host</label>
                                                <input type="text" value={form.smtpHost} onChange={e => setForm(f => ({ ...f, smtpHost: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-sm font-medium mb-1 block">Port</label><input type="text" value={form.smtpPort} onChange={e => setForm(f => ({ ...f, smtpPort: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} /></div>
                                                <div><label className="text-sm font-medium mb-1 block">Username</label><input type="text" value={form.smtpUsername} onChange={e => setForm(f => ({ ...f, smtpUsername: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} /></div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Password / App Password</label>
                                                <input type="password" value={form.smtpPassword} onChange={e => setForm(f => ({ ...f, smtpPassword: e.target.value }))} className={cn('w-full h-10 px-3 rounded-lg border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')} />
                                            </div>
                                            <Button onClick={handleSaveAccount} disabled={saving} className="w-full bg-orange-500 text-white mt-4">
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Account
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}


                    {/* VIEW: SELECTED ACCOUNT DETAILS */}
                    {view === 'account-detail' && selectedAccount && (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {/* Header */}
                            <div className={cn(
                                'flex items-center justify-between px-4 py-3 border-b',
                                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                            )}>
                                <div>
                                    <h1 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                        {selectedAccount.fromEmail}
                                    </h1>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                                        <span className="flex items-center gap-1">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", selectedAccount.healthScore && selectedAccount.healthScore > 80 ? "bg-emerald-500" : "bg-yellow-500")} />
                                            Health: {selectedAccount.healthScore || 100}%
                                        </span>
                                        <span>•</span>
                                        <span>Sent: {selectedAccount.emailsSent || 0}</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={saveSenderProfile}
                                    disabled={sidebarSaving}
                                    className="gap-1.5 h-7 px-2.5 rounded text-[10px] bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                    {sidebarSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save Changes
                                </Button>
                            </div>

                            {/* Content */}
                            <ScrollArea className="flex-1">
                                <div className="p-4 max-w-4xl mx-auto space-y-4">

                                    {/* Email Activity Section */}
                                    <div className={cn('rounded border', isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200')}>
                                        <div className={cn('px-4 py-3 border-b flex items-center justify-between', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                    <Mail className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <h3 className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Email Activity</h3>
                                                    <p className="text-[9px] text-gray-500">Sent and scheduled emails from this account</p>
                                                </div>
                                            </div>
                                            {emailHistory && (
                                                <div className={cn('px-2 py-1 rounded text-[9px] font-medium',
                                                    emailHistory.remainingToday > 0
                                                        ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                                        : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                                                )}>
                                                    {emailHistory.remainingToday} of {emailHistory.dailyLimit} left today
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            {historyLoading ? (
                                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                                    <p className="text-sm">Loading activity...</p>
                                                </div>
                                            ) : emailHistory ? (
                                                <div className="space-y-10">
                                                    {/* Scheduled Emails Grouped by Campaign */}
                                                    {emailHistory.scheduledByCampaign.length > 0 && (
                                                        <div className="space-y-5">
                                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
                                                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                                                                    <Calendar className="w-4 h-4" />
                                                                </div>
                                                                <h4 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                                                    Scheduled Queue
                                                                </h4>
                                                                <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500')}>
                                                                    {emailHistory.scheduledEmails.length} pending
                                                                </span>
                                                            </div>
                                                            <div className="space-y-6">
                                                                {emailHistory.scheduledByCampaign.map(group => (
                                                                    <div key={group.campaignId} className="space-y-3">
                                                                        <div className="flex items-center gap-2 px-2">
                                                                            <LayoutDashboard className="w-3.5 h-3.5 text-gray-400" />
                                                                            <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                                                                                {group.campaignName}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {group.emails.map(email => (
                                                                                <div key={email.id} className={cn('group p-3 rounded-lg flex items-center justify-between transition-colors', isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50')}>
                                                                                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                                                        <p className={cn('text-sm font-medium truncate', isDark ? 'text-neutral-200' : 'text-gray-700')}>{email.to}</p>
                                                                                        <p className={cn('text-xs truncate', isDark ? 'text-neutral-500' : 'text-gray-500')}>{email.subject}</p>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end gap-1 ml-4">
                                                                                        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-500')}>
                                                                                            Pending
                                                                                        </span>
                                                                                        <span className="text-[10px] text-gray-400">{new Date(email.scheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Sent Emails Grouped by Campaign */}
                                                    <div className="space-y-5">
                                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
                                                            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                                                                <Send className="w-4 h-4" />
                                                            </div>
                                                            <h4 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                                                Recently Sent
                                                            </h4>
                                                            <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500')}>
                                                                {emailHistory.sentEmails.length} sent
                                                            </span>
                                                        </div>

                                                        {emailHistory.sentByCampaign.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-3', isDark ? 'bg-neutral-800 text-neutral-600' : 'bg-gray-100 text-gray-400')}>
                                                                    <Inbox className="w-6 h-6" />
                                                                </div>
                                                                <p className={cn('text-sm font-medium', isDark ? 'text-neutral-400' : 'text-gray-600')}>No emails sent yet</p>
                                                                <p className={cn('text-xs mt-1', isDark ? 'text-neutral-500' : 'text-gray-500')}>Emails sent from this account will appear here.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-6">
                                                                {emailHistory.sentByCampaign.map(group => (
                                                                    <div key={group.campaignId} className="space-y-3">
                                                                        <div className="flex items-center gap-2 px-2">
                                                                            <LayoutDashboard className="w-3.5 h-3.5 text-gray-400" />
                                                                            <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                                                                                {group.campaignName}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {group.emails.map(email => (
                                                                                <div key={email.id} className={cn('group p-3 rounded-lg flex items-center justify-between transition-colors', isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50')}>
                                                                                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                                                        <p className={cn('text-sm font-medium truncate', isDark ? 'text-neutral-200' : 'text-gray-700')}>{email.to}</p>
                                                                                        <p className={cn('text-xs truncate', isDark ? 'text-neutral-500' : 'text-gray-500')}>{email.subject}</p>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end gap-1 ml-4">
                                                                                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide',
                                                                                            email.status === 'opened' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                                                email.status === 'clicked' ? 'bg-blue-500/10 text-blue-500' :
                                                                                                    isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'
                                                                                        )}>{email.status}</span>
                                                                                        <span className="text-[10px] text-gray-400">{new Date(email.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-3', isDark ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-500')}>
                                                        <AlertCircle className="w-6 h-6" />
                                                    </div>
                                                    <p className={cn('text-sm font-medium', isDark ? 'text-neutral-400' : 'text-gray-600')}>Unable to load history</p>
                                                    <p className={cn('text-xs mt-1 max-w-[200px]', isDark ? 'text-neutral-500' : 'text-gray-500')}>We couldn't fetch the email history for this account. Please try again later.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    {/* Sender Profile Section */}
                                    <div className={cn('rounded border', isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200')}>
                                        <div className={cn('px-4 py-3 border-b flex items-center gap-2', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                                            <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                <User className="w-3 h-3" />
                                            </div>
                                            <div>
                                                <h3 className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Sender Profile</h3>
                                                <p className="text-[9px] text-gray-500">How you appear in recipients' inboxes</p>
                                            </div>
                                        </div>

                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            <div className="col-span-1">
                                                <label className="text-[10px] font-medium mb-1 block text-gray-500">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={senderProfile.senderFullName}
                                                    onChange={e => setSenderProfile(p => ({ ...p, senderFullName: e.target.value }))}
                                                    className={cn('w-full h-8 px-2.5 text-xs rounded border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')}
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-[10px] font-medium mb-1 block text-gray-500">Position / Title</label>
                                                <input
                                                    type="text"
                                                    value={senderProfile.senderPosition}
                                                    onChange={e => setSenderProfile(p => ({ ...p, senderPosition: e.target.value }))}
                                                    className={cn('w-full h-8 px-2.5 text-xs rounded border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-medium mb-1 block text-gray-500">Company Name</label>
                                                <input
                                                    type="text"
                                                    value={senderProfile.senderCompany}
                                                    onChange={e => setSenderProfile(p => ({ ...p, senderCompany: e.target.value }))}
                                                    className={cn('w-full h-8 px-2.5 text-xs rounded border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Details */}
                                    <div className={cn('rounded border', isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200')}>
                                        <div className={cn('px-4 py-3 border-b flex items-center gap-2', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                                            <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <Building2 className="w-3 h-3" />
                                            </div>
                                            <div>
                                                <h3 className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Contact & Social</h3>
                                                <p className="text-[9px] text-gray-500">Additional details for your signature</p>
                                            </div>
                                        </div>

                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            <div className="col-span-1">
                                                <label className="text-[10px] font-medium mb-1 block text-gray-500">Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={senderProfile.senderPhone}
                                                    onChange={e => setSenderProfile(p => ({ ...p, senderPhone: e.target.value }))}
                                                    className={cn('w-full h-8 px-2.5 text-xs rounded border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')}
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-[10px] font-medium mb-1 block text-gray-500">Website</label>
                                                <input
                                                    type="text"
                                                    value={senderProfile.senderWebsite}
                                                    onChange={e => setSenderProfile(p => ({ ...p, senderWebsite: e.target.value }))}
                                                    className={cn('w-full h-8 px-2.5 text-xs rounded border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-medium mb-1 block text-gray-500">LinkedIn Profile</label>
                                                <input
                                                    type="text"
                                                    value={senderProfile.senderLinkedIn}
                                                    onChange={e => setSenderProfile(p => ({ ...p, senderLinkedIn: e.target.value }))}
                                                    className={cn('w-full h-8 px-2.5 text-xs rounded border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-medium mb-1 block text-gray-500">Physical Address</label>
                                                <input
                                                    type="text"
                                                    value={senderProfile.senderAddress}
                                                    onChange={e => setSenderProfile(p => ({ ...p, senderAddress: e.target.value }))}
                                                    className={cn('w-full h-8 px-2.5 text-xs rounded border bg-transparent', isDark ? 'border-neutral-700' : 'border-gray-200')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Server Configuration Section */}
                                    <div className={cn('rounded border', isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200')}>
                                        <div className={cn('px-4 py-3 border-b flex items-center gap-2', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                                            <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
                                                <Server className="w-3 h-3" />
                                            </div>
                                            <div>
                                                <h3 className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Server Configuration</h3>
                                                <p className="text-[9px] text-gray-500">SMTP and IMAP server details</p>
                                            </div>
                                        </div>

                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Mail className="w-3 h-3 text-orange-500" />
                                                    <span className="text-[10px] font-medium">SMTP Settings (Outgoing)</span>
                                                </div>
                                                <div className={cn('grid grid-cols-2 gap-3 p-3 rounded border', isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-gray-50 border-gray-100')}>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 mb-0.5">Host</p>
                                                        <p className={cn('text-[10px] font-mono', isDark ? 'text-white' : 'text-gray-900')}>
                                                            {selectedAccount?.host || 'Not configured'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 mb-0.5">Port</p>
                                                        <p className={cn('text-[10px] font-mono', isDark ? 'text-white' : 'text-gray-900')}>
                                                            {selectedAccount?.port || '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 mb-0.5">Username</p>
                                                        <p className={cn('text-[10px] font-mono truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                                            {selectedAccount?.username || selectedAccount?.fromEmail || '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 mb-0.5">From Email</p>
                                                        <p className={cn('text-[10px] font-mono truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                                            {selectedAccount?.fromEmail || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Inbox className="w-3 h-3 text-blue-500" />
                                                    <span className="text-[10px] font-medium">IMAP Settings (Incoming)</span>
                                                    {selectedAccount?.imapConfigured ? (
                                                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-green-500/20 text-green-500">Configured</span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-yellow-500/20 text-yellow-500">Not Configured</span>
                                                    )}
                                                </div>
                                                <div className={cn('grid grid-cols-2 gap-3 p-3 rounded border', isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-gray-50 border-gray-100')}>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 mb-0.5">Host</p>
                                                        <p className={cn('text-[10px] font-mono', isDark ? 'text-white' : 'text-gray-900')}>
                                                            {selectedAccount?.imapHost || 'Not configured'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 mb-0.5">Port</p>
                                                        <p className={cn('text-[10px] font-mono', isDark ? 'text-white' : 'text-gray-900')}>
                                                            {selectedAccount?.imapPort || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Placeholders Guide */}
                                    <div className={cn(
                                        'p-3 rounded border flex gap-3',
                                        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-orange-50 border-orange-100'
                                    )}>
                                        <div className="p-1.5 bg-orange-500/10 rounded h-fit">
                                            <LayoutDashboard className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className={cn('text-[10px] font-medium mb-0.5', isDark ? 'text-white' : 'text-gray-900')}>
                                                Using these in your campaigns
                                            </h4>
                                            <p className={cn('text-[9px] mb-2', isDark ? 'text-neutral-400' : 'text-gray-600')}>
                                                You can use these placeholders in your email templates. We'll automatically replace them with the correct info for each account.
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['[Your Name]', '[Your Position]', '[Your Company]', '[Your Phone]', '[Your Website]'].map(p => (
                                                    <code key={p} className={cn(
                                                        'px-1.5 py-0.5 rounded text-[9px] font-mono border',
                                                        isDark ? 'bg-neutral-800 border-neutral-700 text-orange-400' : 'bg-white border-gray-200 text-orange-600'
                                                    )}>
                                                        {p}
                                                    </code>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </ScrollArea>
                        </motion.div>
                    )}

                    {/* EMPTY STATE */}
                    {view === 'empty' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-60">
                            <div className={cn('w-20 h-20 rounded-3xl mb-6 flex items-center justify-center', isDark ? 'bg-neutral-800' : 'bg-gray-100')}>
                                <Mail className={cn('w-10 h-10', isDark ? 'text-neutral-600' : 'text-gray-400')} />
                            </div>
                            <h3 className={cn('text-lg font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                                Select an Account
                            </h3>
                            <p className="max-w-sm text-sm text-gray-500">
                                Select an email account from the sidebar or add a new one to manage its settings and sender profile.
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>


        </div>
    );
}
