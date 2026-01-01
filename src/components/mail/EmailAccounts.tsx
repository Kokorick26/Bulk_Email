import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Search, Plus, MoreHorizontal, Mail, Check,
    FileSpreadsheet, Loader2, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
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
}

interface EmailAccountsProps {
    accounts: SmtpAccount[];
    onRefresh: () => void;
    className?: string;
}

type ViewState = 'list' | 'add-options' | 'provider-select' | 'form-basic' | 'form-imap' | 'form-smtp';

export function EmailAccounts({ accounts, onRefresh, className }: EmailAccountsProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [view, setView] = useState<ViewState>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    // Form state
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
    const [imapTestResult, setImapTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleTestImap = async () => {
        if (!form.imapHost || !form.imapUsername || !form.imapPassword) {
            toast.error('Please fill all IMAP fields');
            return;
        }
        setTestingImap(true);
        setImapTestResult(null);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch('/api/inbox/test-imap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    host: form.imapHost,
                    port: parseInt(form.imapPort) || 993,
                    user: form.imapUsername,
                    password: form.imapPassword,
                    tls: true,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setImapTestResult({ success: true, message: `Connected! Found ${data.mailboxes?.length || 0} mailboxes.` });
                toast.success('IMAP connection successful!');
            } else {
                setImapTestResult({ success: false, message: data.error || 'Connection failed' });
                toast.error(data.error || 'IMAP connection failed');
            }
        } catch (err: any) {
            setImapTestResult({ success: false, message: err.message || 'Connection failed' });
            toast.error('IMAP connection failed');
        } finally {
            setTestingImap(false);
        }
    };

    const handleTestSmtp = async () => {
        if (!form.smtpHost || !form.smtpUsername || !form.smtpPassword) {
            toast.error('Please fill all SMTP fields');
            return;
        }
        setTestingSmtp(true);
        setSmtpTestResult(null);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/smtp-accounts/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    host: form.smtpHost,
                    port: parseInt(form.smtpPort) || 587,
                    username: form.smtpUsername,
                    password: form.smtpPassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSmtpTestResult({ success: true, message: 'SMTP connection verified!' });
                toast.success('SMTP connection successful!');
            } else {
                setSmtpTestResult({ success: false, message: data.error || 'Connection failed' });
                toast.error(data.error || 'SMTP connection failed');
            }
        } catch (err: any) {
            setSmtpTestResult({ success: false, message: err.message || 'Connection failed' });
            toast.error('SMTP connection failed');
        } finally {
            setTestingSmtp(false);
        }
    };

    const filteredAccounts = accounts.filter(a =>
        a.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleBack = () => {
        switch (view) {
            case 'add-options':
                setView('list');
                break;
            case 'provider-select':
                setView('add-options');
                break;
            case 'form-basic':
                setView('provider-select');
                break;
            case 'form-imap':
                setView('form-basic');
                break;
            case 'form-smtp':
                setView('form-imap');
                break;
            default:
                setView('list');
        }
    };

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
            setForm({
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
            setView('list');
            onRefresh();
        } catch {
            toast.error('Failed to save account');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Delete this email account?')) return;

        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/smtp-accounts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Account deleted');
            onRefresh();
        } catch {
            toast.error('Failed to delete');
        }
    };

    // Auto-fill based on email domain
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
                setForm(p => ({
                    ...p,
                    imapHost: preset.imap,
                    smtpHost: preset.smtp,
                    imapUsername: form.email,
                    smtpUsername: form.email,
                }));
            }
        }
    }, [form.email]);

    // List View
    if (view === 'list') {
        return (
            <div className={cn('min-h-full', className)}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className={cn('text-xl font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                        Email Accounts
                    </h1>
                    <Button
                        onClick={() => setView('add-options')}
                        className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Add Account
                    </Button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className={cn(
                        'flex items-center gap-2 h-10 px-3 rounded-lg w-72',
                        isDark ? 'bg-neutral-900' : 'bg-gray-100'
                    )}>
                        <Search className={cn('w-4 h-4', isDark ? 'text-neutral-500' : 'text-gray-400')} />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'flex-1 bg-transparent border-0 outline-none text-[13px]',
                                isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className={cn('rounded-xl border', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                    {/* Header */}
                    <div className={cn(
                        'grid grid-cols-[auto_1fr_100px_120px_100px_50px] gap-4 px-5 py-3 border-b text-[11px] font-semibold uppercase tracking-wider',
                        isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-400'
                    )}>
                        <div className="flex items-center"><Checkbox /></div>
                        <div>Email</div>
                        <div>Sent</div>
                        <div>Warmup</div>
                        <div>Health</div>
                        <div></div>
                    </div>

                    {/* Body */}
                    {filteredAccounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Mail className={cn('w-10 h-10 mb-3', isDark ? 'text-neutral-600' : 'text-gray-300')} />
                            <p className={cn('font-medium mb-1', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                No accounts yet
                            </p>
                            <p className={cn('text-sm mb-4', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                                Add your first email account
                            </p>
                            <Button
                                onClick={() => setView('add-options')}
                                className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                            >
                                <Plus className="w-4 h-4" />
                                Add Account
                            </Button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredAccounts.map((account, index) => (
                                <motion.div
                                    key={account.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={cn(
                                        'grid grid-cols-[auto_1fr_100px_120px_100px_50px] gap-4 px-5 py-3 items-center border-b last:border-b-0',
                                        isDark
                                            ? 'border-neutral-800 hover:bg-neutral-800/50'
                                            : 'border-gray-100 hover:bg-gray-50'
                                    )}
                                >
                                    <div>
                                        <Checkbox
                                            checked={selectedAccounts.has(account.id)}
                                            onCheckedChange={(checked) => {
                                                const newSet = new Set(selectedAccounts);
                                                if (checked) newSet.add(account.id);
                                                else newSet.delete(account.id);
                                                setSelectedAccounts(newSet);
                                            }}
                                        />
                                    </div>
                                    <div className={cn('text-[13px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                        {account.fromEmail}
                                    </div>
                                    <div className={cn('text-[13px]', isDark ? 'text-neutral-400' : 'text-gray-600')}>
                                        {account.emailsSent || 0}
                                    </div>
                                    <div className={cn('text-[13px]', isDark ? 'text-neutral-400' : 'text-gray-600')}>
                                        {account.warmupEmails || 0}
                                    </div>
                                    <div className={cn('text-[13px]', isDark ? 'text-neutral-400' : 'text-gray-600')}>
                                        {account.healthScore || 100}%
                                    </div>
                                    <div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className={cn(
                                                    'p-2 rounded-lg transition-colors',
                                                    isDark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
                                                )}>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className={cn('rounded-xl p-1', isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200')}>
                                                <DropdownMenuItem className={cn('rounded-lg text-[13px]', isDark ? 'text-neutral-300 hover:bg-neutral-700' : 'text-gray-700 hover:bg-gray-50')}>
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className={isDark ? 'bg-neutral-700' : 'bg-gray-100'} />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteAccount(account.id)}
                                                    className={cn('rounded-lg text-[13px]', isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50')}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        );
    }

    // Add Options View
    if (view === 'add-options') {
        return (
            <div className={cn('min-h-full', className)}>
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-8',
                        isDark ? 'text-white hover:text-neutral-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="grid grid-cols-3 gap-6 max-w-4xl">
                    {/* Connect existing */}
                    <div className={cn(
                        'p-6 rounded-xl border',
                        isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-white border-gray-200'
                    )}>
                        <h3 className={cn('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
                            Connect Existing Account
                        </h3>
                        <div className="space-y-2 mb-4">
                            {['Connect via IMAP/SMTP', 'Sync replies automatically'].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className={cn('text-sm', isDark ? 'text-neutral-300' : 'text-gray-600')}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => setView('form-basic')}
                                className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                                    isDark ? 'border-neutral-600 hover:border-neutral-500 hover:bg-neutral-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                )}
                            >
                                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                    <GoogleLogo />
                                </div>
                                <div>
                                    <div className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>Google</div>
                                    <div className={cn('text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>Gmail / G-Suite</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setView('form-basic')}
                                className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                                    isDark ? 'border-neutral-600 hover:border-neutral-500 hover:bg-neutral-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                )}
                            >
                                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                    <MicrosoftLogo />
                                </div>
                                <div>
                                    <div className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>Microsoft</div>
                                    <div className={cn('text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>Office 365 / Outlook</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setView('form-basic')}
                                className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                                    isDark ? 'border-neutral-600 hover:border-neutral-500 hover:bg-neutral-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                )}
                            >
                                <div className={cn('w-8 h-8 rounded flex items-center justify-center', isDark ? 'bg-neutral-600' : 'bg-gray-100')}>
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>Custom SMTP</div>
                                    <div className={cn('text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>Any provider</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Pre-warmed (Coming Soon) */}
                    <div className={cn(
                        'p-6 rounded-xl border opacity-60',
                        isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-white border-gray-200'
                    )}>
                        <h3 className={cn('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
                            Pre-warmed Accounts
                        </h3>
                        <div className="space-y-2 mb-4">
                            {['Ready to send immediately', 'No setup required', 'High deliverability'].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className={cn('text-sm', isDark ? 'text-neutral-300' : 'text-gray-600')}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Button disabled className="w-full">
                            Coming Soon
                        </Button>
                    </div>

                    {/* Done-for-you (Coming Soon) */}
                    <div className={cn(
                        'p-6 rounded-xl border opacity-60',
                        isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-white border-gray-200'
                    )}>
                        <h3 className={cn('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
                            Done-for-you Setup
                        </h3>
                        <div className="space-y-2 mb-4">
                            {['We set up your accounts', 'Choose your domain', 'Automatic reconnects'].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className={cn('text-sm', isDark ? 'text-neutral-300' : 'text-gray-600')}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Button disabled className="w-full">
                            Coming Soon
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Form - Basic Info
    if (view === 'form-basic') {
        return (
            <div className={cn('min-h-full', className)}>
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-8',
                        isDark ? 'text-white hover:text-neutral-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="max-w-md">
                    <h2 className={cn('text-xl font-semibold mb-6', isDark ? 'text-white' : 'text-gray-900')}>
                        Account Details
                    </h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={form.firstName}
                                    onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))}
                                    className={cn(
                                        'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                        isDark
                                            ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                            : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={form.lastName}
                                    onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))}
                                    className={cn(
                                        'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                        isDark
                                            ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                            : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                    )}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                                placeholder="you@example.com"
                                className={cn(
                                    'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                    isDark
                                        ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500 placeholder:text-neutral-500'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500 placeholder:text-gray-400'
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <Button variant="outline" onClick={handleBack}>Cancel</Button>
                        <Button
                            onClick={() => setView('form-imap')}
                            disabled={!form.email}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Form - IMAP
    if (view === 'form-imap') {
        return (
            <div className={cn('min-h-full', className)}>
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-8',
                        isDark ? 'text-white hover:text-neutral-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="max-w-md">
                    <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                        IMAP Settings
                    </h2>
                    <p className={cn('text-sm mb-6', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                        Configure IMAP to receive and sync emails
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                IMAP Host
                            </label>
                            <input
                                type="text"
                                value={form.imapHost}
                                onChange={(e) => setForm(p => ({ ...p, imapHost: e.target.value }))}
                                placeholder="imap.gmail.com"
                                className={cn(
                                    'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                    isDark
                                        ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500 placeholder:text-neutral-500'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500 placeholder:text-gray-400'
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                    Port
                                </label>
                                <input
                                    type="text"
                                    value={form.imapPort}
                                    onChange={(e) => setForm(p => ({ ...p, imapPort: e.target.value }))}
                                    className={cn(
                                        'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                        isDark
                                            ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                            : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={form.imapUsername}
                                    onChange={(e) => setForm(p => ({ ...p, imapUsername: e.target.value }))}
                                    className={cn(
                                        'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                        isDark
                                            ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                            : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                    )}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                Password / App Password
                            </label>
                            <input
                                type="password"
                                value={form.imapPassword}
                                onChange={(e) => setForm(p => ({ ...p, imapPassword: e.target.value }))}
                                className={cn(
                                    'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                    isDark
                                        ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <Button variant="outline" onClick={handleBack}>Back</Button>
                        <Button variant="outline" onClick={handleTestImap} disabled={testingImap}>
                            {testingImap ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Test Connection
                        </Button>
                        <Button
                            onClick={() => setView('form-smtp')}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Form - SMTP
    if (view === 'form-smtp') {
        return (
            <div className={cn('min-h-full', className)}>
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-8',
                        isDark ? 'text-white hover:text-neutral-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="max-w-md">
                    <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                        SMTP Settings
                    </h2>
                    <p className={cn('text-sm mb-6', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                        Configure SMTP to send emails
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                SMTP Host
                            </label>
                            <input
                                type="text"
                                value={form.smtpHost}
                                onChange={(e) => setForm(p => ({ ...p, smtpHost: e.target.value }))}
                                placeholder="smtp.gmail.com"
                                className={cn(
                                    'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                    isDark
                                        ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500 placeholder:text-neutral-500'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500 placeholder:text-gray-400'
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                    Port
                                </label>
                                <input
                                    type="text"
                                    value={form.smtpPort}
                                    onChange={(e) => setForm(p => ({ ...p, smtpPort: e.target.value }))}
                                    className={cn(
                                        'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                        isDark
                                            ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                            : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={form.smtpUsername}
                                    onChange={(e) => setForm(p => ({ ...p, smtpUsername: e.target.value }))}
                                    className={cn(
                                        'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                        isDark
                                            ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                            : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                    )}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                Password / App Password
                            </label>
                            <input
                                type="password"
                                value={form.smtpPassword}
                                onChange={(e) => setForm(p => ({ ...p, smtpPassword: e.target.value }))}
                                className={cn(
                                    'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors',
                                    isDark
                                        ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <Button variant="outline" onClick={handleBack}>Back</Button>
                        <Button variant="outline" onClick={handleTestSmtp} disabled={testingSmtp}>
                            {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Test Connection
                        </Button>
                        <Button
                            onClick={handleSaveAccount}
                            disabled={saving || !form.smtpHost || !form.smtpUsername || !form.smtpPassword}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Account
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
