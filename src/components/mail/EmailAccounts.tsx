import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Search, Plus, MoreHorizontal, Mail, Check,
    FileSpreadsheet, Loader2, Download, ArrowRight, Edit, Pause, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '../ui/DropdownMenu';

const API_BASE = '/api/bulk-email';

// Google Logo SVG
const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// Microsoft Logo SVG
const MicrosoftLogo = () => (
    <svg viewBox="0 0 21 21" className="w-5 h-5">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
);

// Yahoo Logo SVG
const YahooLogo = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#6001D2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 13.5h-2V9l-3.5 4.5h-.1L6.5 9v6.5h-2v-9h2.2l3.3 4.2 3.3-4.2h2.2v9z" />
    </svg>
);

// Zoho Logo Icon
const ZohoLogo = () => (
    <div className="w-5 h-5 rounded bg-gradient-to-r from-yellow-400 to-red-500 flex items-center justify-center">
        <span className="text-white text-xs font-bold">Z</span>
    </div>
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

type ViewState = 'list' | 'add-options' | 'provider-select' | 'form-basic' | 'form-imap' | 'form-smtp' | 'google-setup' | 'microsoft-setup';

export function EmailAccounts({ accounts, onRefresh, className }: EmailAccountsProps) {
    const { theme } = useTheme();
    const [view, setView] = useState<ViewState>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<'google' | 'microsoft' | 'other' | null>(null);

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

    // Testing states
    const [testingImap, setTestingImap] = useState(false);
    const [imapTestResult, setImapTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Test IMAP connection
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

    // Test SMTP connection
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

    // Auto-fill IMAP/SMTP based on email domain
    useEffect(() => {
        if (form.email && form.email.includes('@')) {
            const domain = form.email.split('@')[1].toLowerCase();
            const presets: Record<string, { imap: string; smtp: string }> = {
                'gmail.com': { imap: 'imap.gmail.com', smtp: 'smtp.gmail.com' },
                'outlook.com': { imap: 'outlook.office365.com', smtp: 'smtp.office365.com' },
                'hotmail.com': { imap: 'outlook.office365.com', smtp: 'smtp.office365.com' },
                'yahoo.com': { imap: 'imap.mail.yahoo.com', smtp: 'smtp.mail.yahoo.com' },
                'zoho.com': { imap: 'imappro.zoho.com', smtp: 'smtppro.zoho.com' },
                'zoho.eu': { imap: 'imappro.zoho.eu', smtp: 'smtppro.zoho.eu' },
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

    // Render based on view state
    if (view === 'list') {
        return (
            <div className={cn('min-h-screen', className)}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className={cn(
                        'text-2xl font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Email Accounts
                    </h1>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-64">
                        <Search className={cn(
                            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border',
                                theme === 'dark'
                                    ? 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border',
                                    theme === 'dark'
                                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                )}>
                                    All statuses
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>All statuses</DropdownMenuItem>
                                <DropdownMenuItem>Active</DropdownMenuItem>
                                <DropdownMenuItem>Paused</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={() => setView('add-options')}
                            className={cn(
                                'gap-2',
                                theme === 'dark'
                                    ? 'bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)] text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            Add New
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className={cn(
                    'rounded-xl border',
                    theme === 'dark' ? 'border-white/5' : 'border-gray-200'
                )}>
                    {/* Table Header */}
                    <div className={cn(
                        'grid grid-cols-[auto_1fr_120px_140px_120px_50px] gap-4 px-6 py-4 border-b text-xs font-medium uppercase tracking-wider',
                        theme === 'dark' ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'
                    )}>
                        <div className="flex items-center">
                            <Checkbox />
                        </div>
                        <div>Email</div>
                        <div>Emails Sent</div>
                        <div>Warmup Emails</div>
                        <div>Health Score</div>
                        <div></div>
                    </div>

                    {/* Table Body */}
                    {filteredAccounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Mail className={cn(
                                'w-12 h-12 mb-4',
                                theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                            )} />
                            <p className={cn(
                                'text-lg font-medium mb-1',
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                                No email accounts yet
                            </p>
                            <p className={cn(
                                'text-sm mb-4',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            )}>
                                Add your first email account to get started
                            </p>
                            <Button
                                onClick={() => setView('add-options')}
                                className={cn(
                                    'gap-2',
                                    theme === 'dark'
                                        ? 'bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)] text-white'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                                )}
                            >
                                <Plus className="w-4 h-4" />
                                Add New Account
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
                                        'grid grid-cols-[auto_1fr_120px_140px_120px_50px] gap-4 px-6 py-4 items-center border-b last:border-b-0',
                                        theme === 'dark'
                                            ? 'border-gray-800 hover:bg-gray-800/50'
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
                                    <div className={cn(
                                        'text-sm font-medium',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {account.fromEmail}
                                    </div>
                                    <div className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    )}>
                                        {account.emailsSent || 0}
                                    </div>
                                    <div className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    )}>
                                        {account.warmupEmails || 0}
                                    </div>
                                    <div className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    )}>
                                        {account.healthScore || 0}%
                                    </div>
                                    <div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className={cn(
                                                    'p-2 rounded-lg transition-colors',
                                                    theme === 'dark'
                                                        ? 'hover:bg-gray-700 text-gray-400'
                                                        : 'hover:bg-gray-100 text-gray-500'
                                                )}>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Pause</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteAccount(account.id)}
                                                    className="text-red-500"
                                                >
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
            <div className={cn('min-h-screen', className)}>
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-12',
                        theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Options Grid */}
                <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {/* Pre-warmed accounts */}
                    <div className={cn(
                        'p-6 rounded-xl border',
                        theme === 'dark' ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'
                    )}>
                        <h3 className={cn(
                            'text-lg font-semibold mb-6',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Pre-warmed accounts
                        </h3>
                        <div className="space-y-3 mb-8">
                            {[
                                'Pre-Made Accounts & Domains',
                                'Start Sending Right away',
                                'No Setup Required',
                                'Scale existing campaigns instantly',
                                'High-quality US IP Accounts',
                                'Deliverability Optimized',
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    )}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className={cn(
                            'text-sm mb-4',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            403 domains remaining
                        </p>
                        <Button onClick={() => toast.info('Pre-warmed accounts coming soon! Use "Connect existing accounts" for now.')} className="w-full bg-gray-600 hover:bg-gray-500 text-white">
                            Coming Soon <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-500 rounded">Pro</span>
                        </Button>
                    </div>

                    {/* Done-for-you Email Setup */}
                    <div className={cn(
                        'p-6 rounded-xl border',
                        theme === 'dark' ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'
                    )}>
                        <h3 className={cn(
                            'text-lg font-semibold mb-6',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Done-for-you Email Setup
                        </h3>
                        <div className="space-y-3 mb-8">
                            {[
                                'We Set Up Your Accounts',
                                'You Choose The Domain & Account Names',
                                'Automatic reconnects',
                                'Save time and money',
                                'High-quality US IP accounts',
                                'Deliverability Optimized',
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    )}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => toast.info('Done-for-you setup coming soon! Use "Connect existing accounts" for now.')}
                                className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left opacity-60',
                                    theme === 'dark'
                                        ? 'border-gray-600 hover:border-gray-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                )}
                            >
                                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                    <GoogleLogo />
                                </div>
                                <div className="flex-1">
                                    <div className={cn('text-sm font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                        Google
                                    </div>
                                    <div className={cn('text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                        Gmail / G-Suite
                                    </div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-gray-600 text-white rounded">Soon</span>
                            </button>
                        </div>
                    </div>

                    {/* Connect existing accounts */}
                    <div className={cn(
                        'p-6 rounded-xl border',
                        theme === 'dark' ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'
                    )}>
                        <h3 className={cn(
                            'text-lg font-semibold mb-6',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Connect existing accounts
                        </h3>
                        <div className="space-y-3 mb-8">
                            {[
                                'Connect any IMAP or SMTP email provider',
                                'Sync up replies in the Unibox',
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    )}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => setView('google-setup')}
                                className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left',
                                    theme === 'dark'
                                        ? 'border-gray-600 hover:border-gray-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                )}
                            >
                                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                    <GoogleLogo />
                                </div>
                                <div>
                                    <div className={cn('text-sm font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                        Google
                                    </div>
                                    <div className={cn('text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                        Gmail / G-Suite
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setView('microsoft-setup')}
                                className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left',
                                    theme === 'dark'
                                        ? 'border-gray-600 hover:border-gray-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                )}
                            >
                                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                    <MicrosoftLogo />
                                </div>
                                <div>
                                    <div className={cn('text-sm font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                        Microsoft
                                    </div>
                                    <div className={cn('text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                        Office 365 / Outlook
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setView('provider-select')}
                                className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left',
                                    theme === 'dark'
                                        ? 'border-gray-600 hover:border-gray-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                )}
                            >
                                <div className={cn(
                                    'w-8 h-8 rounded flex items-center justify-center',
                                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                )}>
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className={cn('text-sm font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                        Any Provider
                                    </div>
                                    <div className={cn('text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                        IMAP / SMTP
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Provider Select View
    if (view === 'provider-select') {
        return (
            <div className={cn('min-h-screen', className)}>
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-12',
                        theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleBack}
                        className={cn(
                            'flex items-center gap-2 text-sm mb-8',
                            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Select another provider
                    </button>

                    <div className="space-y-3">
                        <button className={cn(
                            'w-full flex items-center gap-4 p-4 rounded-lg border text-left',
                            theme === 'dark'
                                ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        )}>
                            <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                            )}>
                                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <div className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                    Any Provider
                                </div>
                                <div className={cn('font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                    Bulk Import from CSV
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setView('form-basic')}
                            className={cn(
                                'w-full flex items-center gap-4 p-4 rounded-lg border text-left',
                                theme === 'dark'
                                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            )}
                        >
                            <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                            )}>
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <div className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                    Any Provider
                                </div>
                                <div className={cn('font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                    Single Account
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Basic Form View
    if (view === 'form-basic') {
        return (
            <div className={cn('min-h-screen', className)}>
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-12',
                        theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="max-w-lg mx-auto">
                    <button
                        onClick={() => setView('provider-select')}
                        className={cn(
                            'flex items-center gap-2 text-sm mb-8',
                            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Select another provider
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className={cn(
                            'w-12 h-12 rounded-lg flex items-center justify-center',
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        )}>
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={cn(
                                'text-lg font-semibold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                Connect Any Provider Account
                            </h2>
                            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                IMAP / SMTP
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={cn(
                                    'block text-sm mb-2',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    First Name
                                </label>
                                <Input
                                    value={form.firstName}
                                    onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))}
                                    placeholder="John"
                                    className={cn(
                                        theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn(
                                    'block text-sm mb-2',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    Last Name
                                </label>
                                <Input
                                    value={form.lastName}
                                    onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))}
                                    placeholder="Doe"
                                    className={cn(
                                        theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={cn(
                                'block text-sm mb-2',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                                Email <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                                placeholder="Email address to connect"
                                className={cn(
                                    theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                )}
                            />
                        </div>

                        <Button
                            onClick={() => setView('form-imap')}
                            disabled={!form.email}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-6"
                        >
                            Next <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // IMAP Form View
    if (view === 'form-imap') {
        return (
            <div className={cn('min-h-screen', className)}>
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-12',
                        theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="max-w-lg mx-auto">
                    <button
                        onClick={() => setView('provider-select')}
                        className={cn(
                            'flex items-center gap-2 text-sm mb-8',
                            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Select another provider
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className={cn(
                            'w-12 h-12 rounded-lg flex items-center justify-center',
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        )}>
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={cn(
                                'text-lg font-semibold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                IMAP
                            </h2>
                            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                IMAP Setup
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className={cn(
                                'block text-sm mb-2',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                                IMAP Username <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={form.imapUsername}
                                onChange={(e) => setForm(p => ({ ...p, imapUsername: e.target.value }))}
                                placeholder={form.email || "username@example.com"}
                                className={cn(
                                    theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                )}
                            />
                        </div>

                        <div>
                            <label className={cn(
                                'block text-sm mb-2',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                                IMAP Password <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="password"
                                value={form.imapPassword}
                                onChange={(e) => setForm(p => ({ ...p, imapPassword: e.target.value }))}
                                placeholder="IMAP Password"
                                className={cn(
                                    theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className={cn(
                                    'block text-sm mb-2',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    IMAP Host <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.imapHost}
                                    onChange={(e) => setForm(p => ({ ...p, imapHost: e.target.value }))}
                                    placeholder="imap.website.com"
                                    className={cn(
                                        theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn(
                                    'block text-sm mb-2',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    IMAP Port <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.imapPort}
                                    onChange={(e) => setForm(p => ({ ...p, imapPort: e.target.value }))}
                                    placeholder="993"
                                    className={cn(
                                        theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                    )}
                                />
                            </div>
                        </div>

                        {/* Test Result */}
                        {imapTestResult && (
                            <div className={cn(
                                'flex items-center gap-3 p-3 rounded-lg text-sm',
                                imapTestResult.success
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            )}>
                                {imapTestResult.success ? <Check className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                                <span>{imapTestResult.message}</span>
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className={cn('flex-1', theme === 'dark' ? 'border-gray-700 text-white' : '')}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={handleTestImap}
                                disabled={testingImap || !form.imapHost || !form.imapUsername || !form.imapPassword}
                                variant="outline"
                                className={cn('flex-1', theme === 'dark' ? 'border-gray-700 text-white' : '')}
                            >
                                {testingImap ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Test Connection
                            </Button>
                            <Button
                                onClick={() => setView('form-smtp')}
                                disabled={!imapTestResult?.success}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                            >
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // SMTP Form View
    if (view === 'form-smtp') {
        return (
            <div className={cn('min-h-screen', className)}>
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium mb-12',
                        theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="max-w-lg mx-auto">
                    <button
                        onClick={() => setView('provider-select')}
                        className={cn(
                            'flex items-center gap-2 text-sm mb-8',
                            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Select another provider
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className={cn(
                            'w-12 h-12 rounded-lg flex items-center justify-center',
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        )}>
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={cn(
                                'text-lg font-semibold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                SMTP
                            </h2>
                            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                SMTP Setup
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className={cn(
                                'block text-sm mb-2',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                                SMTP Username <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={form.smtpUsername}
                                onChange={(e) => setForm(p => ({ ...p, smtpUsername: e.target.value }))}
                                placeholder={form.email || "username@example.com"}
                                className={cn(
                                    theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                )}
                            />
                        </div>

                        <div>
                            <label className={cn(
                                'block text-sm mb-2',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                                SMTP Password <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="password"
                                value={form.smtpPassword}
                                onChange={(e) => setForm(p => ({ ...p, smtpPassword: e.target.value }))}
                                placeholder="SMTP Password"
                                className={cn(
                                    theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className={cn(
                                    'block text-sm mb-2',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    SMTP Host <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.smtpHost}
                                    onChange={(e) => setForm(p => ({ ...p, smtpHost: e.target.value }))}
                                    placeholder="smtp.website.com"
                                    className={cn(
                                        theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn(
                                    'block text-sm mb-2',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    SMTP Port <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.smtpPort}
                                    onChange={(e) => setForm(p => ({ ...p, smtpPort: e.target.value }))}
                                    placeholder="587"
                                    className={cn(
                                        theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
                                    )}
                                />
                            </div>
                        </div>

                        {/* Test Result */}
                        {smtpTestResult && (
                            <div className={cn(
                                'flex items-center gap-3 p-3 rounded-lg text-sm',
                                smtpTestResult.success
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            )}>
                                {smtpTestResult.success ? <Check className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                                <span>{smtpTestResult.message}</span>
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className={cn('flex-1', theme === 'dark' ? 'border-gray-700 text-white' : '')}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={handleTestSmtp}
                                disabled={testingSmtp || !form.smtpHost || !form.smtpUsername || !form.smtpPassword}
                                variant="outline"
                                className={cn('flex-1', theme === 'dark' ? 'border-gray-700 text-white' : '')}
                            >
                                {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Test Connection
                            </Button>
                            <Button
                                onClick={handleSaveAccount}
                                disabled={saving || !smtpTestResult?.success}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Save Account
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Google Setup Instructions
    if (view === 'google-setup') {
        return (
            <div className={cn('min-h-screen', className)}>
                <button onClick={() => setView('add-options')} className={cn('flex items-center gap-2 text-sm font-medium mb-12', theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600')}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"><GoogleLogo /></div>
                        <div>
                            <h2 className={cn('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>Connect Gmail / Google Workspace</h2>
                            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>Setup requires an App Password</p>
                        </div>
                    </div>
                    <div className={cn('p-6 rounded-xl border mb-6', theme === 'dark' ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200')}>
                        <h3 className={cn('font-medium mb-4', theme === 'dark' ? 'text-white' : 'text-gray-900')}>Steps to create App Password:</h3>
                        <ol className="space-y-3">
                            {['Enable 2-Step Verification on your Google Account', 'Go to myaccount.google.com → Security → App passwords', 'Select "Mail" as the app and your device', 'Click "Generate" to create a 16-digit password', 'Copy the password (you won\'t see it again)'].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                                    <span className={cn('text-sm', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg mb-4">Open Google App Passwords →</a>
                    <Button onClick={() => { setSelectedProvider('google'); setForm(p => ({ ...p, imapHost: 'imap.gmail.com', smtpHost: 'smtp.gmail.com', imapPort: '993', smtpPort: '587' })); setView('form-basic'); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                        I have my App Password, Continue →
                    </Button>
                </div>
            </div>
        );
    }

    // Microsoft Setup Instructions
    if (view === 'microsoft-setup') {
        return (
            <div className={cn('min-h-screen', className)}>
                <button onClick={() => setView('add-options')} className={cn('flex items-center gap-2 text-sm font-medium mb-12', theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600')}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"><MicrosoftLogo /></div>
                        <div>
                            <h2 className={cn('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>Connect Microsoft 365 / Outlook</h2>
                            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>Setup requires an App Password</p>
                        </div>
                    </div>
                    <div className={cn('p-6 rounded-xl border mb-6', theme === 'dark' ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200')}>
                        <h3 className={cn('font-medium mb-4', theme === 'dark' ? 'text-white' : 'text-gray-900')}>Steps to create App Password:</h3>
                        <ol className="space-y-3">
                            {['Sign in to account.microsoft.com', 'Go to Security → Advanced security options', 'Enable Two-step verification if not already', 'Find "App passwords" and click "Create a new app password"', 'Copy the generated password'].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                                    <span className={cn('text-sm', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg mb-4">Open Microsoft Security →</a>
                    <Button onClick={() => { setSelectedProvider('microsoft'); setForm(p => ({ ...p, imapHost: 'outlook.office365.com', smtpHost: 'smtp.office365.com', imapPort: '993', smtpPort: '587' })); setView('form-basic'); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                        I have my App Password, Continue →
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
