import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Send, Plus, Trash2, Edit3, Loader2,
    Users, CheckCircle, XCircle,
    RefreshCw, Save, X,
    Server, Settings, Check,
    History, TrendingUp,
    BarChart2, ArrowUpRight, TestTube,
    Copy, FileText, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const API_BASE = '/api/bulk-email';

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
}

interface Campaign {
    id: string;
    name: string;
    subject: string;
    status: 'draft' | 'sending' | 'completed' | 'failed';
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    createdAt: string;
    completedAt?: string;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
}

interface EmailStats {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
    totalSubscribers: number;
    totalSmtpAccounts: number;
}

type PageType = 'dashboard' | 'compose' | 'accounts' | 'history' | 'templates';

interface Props {
    currentPage: PageType;
    setCurrentPage: (page: PageType) => void;
}

export default function BulkEmailManager({ currentPage, setCurrentPage }: Props) {
    const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [stats, setStats] = useState<EmailStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Forms
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState<SmtpAccount | null>(null);
    const [accountForm, setAccountForm] = useState({
        name: '', host: '', port: '587', username: '', password: '', fromEmail: '', fromName: '', isDefault: false,
    });
    const [testingAccount, setTestingAccount] = useState<string | null>(null);
    const [testEmail, setTestEmail] = useState('');
    const [selectedSmtpId, setSelectedSmtpId] = useState<string>('');
    const [composeForm, setComposeForm] = useState({ recipients: '', subject: '', htmlContent: '', textContent: '' });
    const [sendOneByOne, setSendOneByOne] = useState(false);
    const [sending, setSending] = useState(false);
    const [savingAccount, setSavingAccount] = useState(false);
    const [useHtmlMode, setUseHtmlMode] = useState(false);

    useEffect(() => { fetchData(); }, []);
    // Auto-polling disabled to reduce DynamoDB usage
    // Data refreshes when user clicks "Refresh" button or navigates to page

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const headers = { Authorization: `Bearer ${token}` };
            const [smtpRes, campaignsRes, templatesRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/smtp-accounts`, { headers }),
                fetch(`${API_BASE}/campaigns`, { headers }),
                fetch(`${API_BASE}/templates`, { headers }),
                fetch(`${API_BASE}/stats`, { headers }),
            ]);
            if (smtpRes.ok) setSmtpAccounts(await smtpRes.json());
            if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
            if (templatesRes.ok) setTemplates(await templatesRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (err) { console.error('Error:', err); }
        finally { setLoading(false); }
    };

    const handleSaveAccount = async () => {
        setSavingAccount(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const url = editingAccount ? `${API_BASE}/smtp-accounts/${editingAccount.id}` : `${API_BASE}/smtp-accounts`;
            const res = await fetch(url, {
                method: editingAccount ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(accountForm),
            });
            if (!res.ok) throw new Error('Failed');
            toast.success(editingAccount ? 'Updated!' : 'Created!');
            setShowAccountForm(false);
            setEditingAccount(null);
            setAccountForm({ name: '', host: '', port: '587', username: '', password: '', fromEmail: '', fromName: '', isDefault: false });
            fetchData();
        } catch { toast.error('Failed to save'); }
        finally { setSavingAccount(false); }
    };

    const handleTestAccount = async (id: string) => {
        if (!testEmail) { toast.error('Enter test email'); return; }
        setTestingAccount(id);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/smtp-accounts/${id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ testEmail }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            toast.success('Test sent!');
        } catch (err: any) { toast.error(err.message); }
        finally { setTestingAccount(null); }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Delete account?')) return;
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/smtp-accounts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            toast.success('Deleted');
            fetchData();
        } catch { toast.error('Failed'); }
    };

    const handleQuickSend = async () => {
        const hasContent = useHtmlMode ? composeForm.htmlContent : composeForm.textContent;
        if (!composeForm.recipients || !composeForm.subject || !hasContent) {
            toast.error('Fill all fields'); return;
        }
        const emailCount = composeForm.recipients.split(/[,;\n]/).filter(e => e.trim() && e.includes('@')).length;
        if (emailCount === 0) { toast.error('No valid emails'); return; }
        if (!confirm(`Send to ${emailCount} recipients?`)) return;

        let html = composeForm.htmlContent;
        let text = composeForm.textContent;
        if (!useHtmlMode && text) {
            html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333">${text.replace(/\n/g, '<br>')}</div>`;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/quick-send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ smtpAccountId: selectedSmtpId || null, recipients: composeForm.recipients, subject: composeForm.subject, htmlContent: html, textContent: text, sendOneByOne }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            toast.success(`Sending to ${emailCount} recipients`);
            setComposeForm({ recipients: '', subject: '', htmlContent: '', textContent: '' });
            setCurrentPage('history');
            fetchData();
        } catch (err: any) { toast.error(err.message); }
        finally { setSending(false); }
    };

    const validEmailCount = composeForm.recipients.split(/[,;\n]/).filter(e => e.trim() && e.includes('@')).length;

    if (loading && !stats) {
        return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>;
    }

    return (
        <div className="space-y-8">
            {/* Dashboard */}
            {currentPage === 'dashboard' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-white">Overview</h1>
                            <p className="text-white/40 mt-1">Your email performance at a glance</p>
                        </div>
                        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            Refresh
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Campaigns', value: stats?.totalCampaigns || 0, icon: BarChart2, change: '+12%' },
                            { label: 'Emails Sent', value: stats?.totalEmailsSent || 0, icon: Send, change: '+8%' },
                            { label: 'Success Rate', value: stats?.totalEmailsSent ? Math.round((stats.totalEmailsSent / (stats.totalEmailsSent + stats.totalEmailsFailed)) * 100) : 0, icon: TrendingUp, suffix: '%', change: '+5%' },
                            { label: 'SMTP Accounts', value: stats?.totalSmtpAccounts || 0, icon: Server, change: '0' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass rounded-xl p-5 hover-lift"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-white/40">{stat.label}</p>
                                        <p className="text-2xl font-semibold text-white mt-1">{stat.value.toLocaleString()}{stat.suffix}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                                        <stat.icon className="w-5 h-5 text-white/50" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 mt-3 text-sm text-white/30">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {stat.change} this week
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button onClick={() => setCurrentPage('compose')} className="flex items-center gap-4 p-4 rounded-xl bg-white text-black hover:bg-white/90 transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center">
                                    <Send className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium">Compose Email</div>
                                    <div className="text-sm text-black/50">Start new campaign</div>
                                </div>
                            </button>
                            <button onClick={() => setCurrentPage('accounts')} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-white/50" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium text-white">SMTP Settings</div>
                                    <div className="text-sm text-white/40">Configure accounts</div>
                                </div>
                            </button>
                            <button onClick={() => setCurrentPage('history')} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center">
                                    <History className="w-5 h-5 text-white/50" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium text-white">View History</div>
                                    <div className="text-sm text-white/40">Past campaigns</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Recent Campaigns */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-white/[0.05]">
                            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Recent Campaigns</h3>
                        </div>
                        {campaigns.length === 0 ? (
                            <div className="p-12 text-center text-white/30">No campaigns yet</div>
                        ) : (
                            <div className="divide-y divide-white/[0.05]">
                                {campaigns.slice(0, 5).map((c) => (
                                    <div key={c.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("status-dot", c.status === 'completed' && "status-success", c.status === 'failed' && "status-error", c.status === 'sending' && "status-active")} />
                                            <div>
                                                <div className="text-white font-medium">{c.name}</div>
                                                <div className="text-sm text-white/40">{c.subject}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white">{c.sentCount} / {c.totalRecipients}</div>
                                            <div className="text-sm text-white/40">{new Date(c.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Compose */}
            {currentPage === 'compose' && (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Compose</h1>
                        <p className="text-white/40 mt-1">Send emails to your recipients</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Sender */}
                            <div className="glass rounded-xl p-5">
                                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Sender Account</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setSelectedSmtpId('')}
                                        className={cn("p-4 rounded-xl border text-left transition-all", selectedSmtpId === '' ? "bg-white text-black border-white" : "border-white/[0.08] hover:border-white/20")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Settings className="w-5 h-5" />
                                            <div>
                                                <div className="font-medium">System Default</div>
                                                <div className={cn("text-sm", selectedSmtpId === '' ? "text-black/50" : "text-white/40")}>From .env config</div>
                                            </div>
                                        </div>
                                    </button>
                                    {smtpAccounts.map((acc) => (
                                        <button
                                            key={acc.id}
                                            onClick={() => setSelectedSmtpId(acc.id)}
                                            className={cn("p-4 rounded-xl border text-left transition-all", selectedSmtpId === acc.id ? "bg-white text-black border-white" : "border-white/[0.08] hover:border-white/20")}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-5 h-5" />
                                                <div>
                                                    <div className="font-medium">{acc.name}</div>
                                                    <div className={cn("text-sm", selectedSmtpId === acc.id ? "text-black/50" : "text-white/40")}>{acc.fromEmail}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recipients */}
                            <div className="glass rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Recipients</h3>
                                    {validEmailCount > 0 && <span className="text-sm text-white/40">{validEmailCount} emails</span>}
                                </div>
                                <textarea
                                    value={composeForm.recipients}
                                    onChange={(e) => setComposeForm(p => ({ ...p, recipients: e.target.value }))}
                                    placeholder="email@example.com, another@example.com..."
                                    rows={4}
                                    className="input font-mono text-sm resize-none"
                                />
                            </div>

                            {/* Content */}
                            <div className="glass rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Content</h3>
                                    <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03]">
                                        <button onClick={() => setUseHtmlMode(false)} className={cn("px-3 py-1.5 text-sm rounded-md transition-all", !useHtmlMode ? "bg-white text-black" : "text-white/50 hover:text-white")}>Plain Text</button>
                                        <button onClick={() => setUseHtmlMode(true)} className={cn("px-3 py-1.5 text-sm rounded-md transition-all", useHtmlMode ? "bg-white text-black" : "text-white/50 hover:text-white")}>HTML</button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-white/40 mb-2 block">Subject</label>
                                        <input type="text" value={composeForm.subject} onChange={(e) => setComposeForm(p => ({ ...p, subject: e.target.value }))} placeholder="Your subject line" className="input" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/40 mb-2 block">{useHtmlMode ? 'HTML Body' : 'Message'}</label>
                                        <textarea
                                            value={useHtmlMode ? composeForm.htmlContent : composeForm.textContent}
                                            onChange={(e) => setComposeForm(p => ({ ...p, [useHtmlMode ? 'htmlContent' : 'textContent']: e.target.value }))}
                                            placeholder={useHtmlMode ? '<h1>Hello!</h1>' : 'Write your message...'}
                                            rows={10}
                                            className={cn("input resize-none", useHtmlMode && "font-mono text-sm")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="glass rounded-xl p-5">
                                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Options</h3>
                                <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] cursor-pointer">
                                    <input type="checkbox" checked={sendOneByOne} onChange={(e) => setSendOneByOne(e.target.checked)} className="w-4 h-4 rounded bg-white/10" />
                                    <div>
                                        <div className="text-white text-sm">Send One-by-One</div>
                                        <div className="text-xs text-white/40">Slower but reliable</div>
                                    </div>
                                </label>
                                <button
                                    onClick={handleQuickSend}
                                    disabled={sending || !composeForm.recipients || !composeForm.subject || (useHtmlMode ? !composeForm.htmlContent : !composeForm.textContent)}
                                    className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-black font-medium py-3.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {sending ? 'Sending...' : 'Send Emails'}
                                </button>
                            </div>

                            <div className="glass rounded-xl p-5">
                                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Tips
                                </h3>
                                <ul className="space-y-3 text-sm text-white/40">
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />Separate emails with commas, semicolons, or new lines</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />Plain text auto-converts to HTML</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />One-by-one is better for large lists</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Accounts */}
            {currentPage === 'accounts' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-white">SMTP Accounts</h1>
                            <p className="text-white/40 mt-1">Manage your email sending accounts</p>
                        </div>
                        <button onClick={() => { setEditingAccount(null); setAccountForm({ name: '', host: '', port: '587', username: '', password: '', fromEmail: '', fromName: '', isDefault: false }); setShowAccountForm(true); }} className="btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Account
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {smtpAccounts.map((acc, i) => (
                            <motion.div key={acc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white flex items-center gap-2">
                                                {acc.name}
                                                {acc.isDefault && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">Default</span>}
                                            </div>
                                            <div className="text-sm text-white/40">{acc.fromEmail}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingAccount(acc); setAccountForm({ name: acc.name, host: acc.host, port: String(acc.port), username: acc.username, password: acc.password, fromEmail: acc.fromEmail, fromName: acc.fromName, isDefault: acc.isDefault }); setShowAccountForm(true); }} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-all">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm space-y-2 border-t border-white/[0.05] pt-4">
                                    <div className="flex justify-between"><span className="text-white/40">Host</span><span className="text-white font-mono">{acc.host}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Port</span><span className="text-white font-mono">{acc.port}</span></div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/[0.05] flex gap-2">
                                    <input type="email" placeholder="test@email.com" value={testingAccount === acc.id ? testEmail : ''} onChange={(e) => setTestEmail(e.target.value)} onFocus={() => setTestingAccount(acc.id)} className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-white/20" />
                                    <button onClick={() => handleTestAccount(acc.id)} disabled={testingAccount === acc.id} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm">
                                        {testingAccount === acc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                                        Test
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {smtpAccounts.length === 0 && (
                        <div className="glass rounded-xl p-12 text-center">
                            <Server className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No Accounts</h3>
                            <p className="text-white/40 mb-6">Add your first SMTP account</p>
                            <button onClick={() => setShowAccountForm(true)} className="btn-primary">Add Account</button>
                        </div>
                    )}
                </div>
            )}

            {/* History */}
            {currentPage === 'history' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-white">History</h1>
                            <p className="text-white/40 mt-1">Your past email campaigns</p>
                        </div>
                        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            Refresh
                        </button>
                    </div>

                    <div className="glass rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.05]">
                                    <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Campaign</th>
                                    <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                                    <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Progress</th>
                                    <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c) => (
                                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-white">{c.name}</div>
                                            <div className="text-sm text-white/40">{c.subject}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", c.status === 'completed' && "bg-emerald-500/10 text-emerald-400", c.status === 'sending' && "bg-white/10 text-white", c.status === 'failed' && "bg-red-500/10 text-red-400", c.status === 'draft' && "bg-white/5 text-white/40")}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-white">{c.sentCount}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <XCircle className="w-4 h-4 text-red-400" />
                                                    <span className="text-white">{c.failedCount}</span>
                                                </div>
                                                <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full max-w-[80px]">
                                                    <div className="h-full bg-white rounded-full" style={{ width: `${c.totalRecipients > 0 ? (c.sentCount / c.totalRecipients) * 100 : 0}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-white/40 text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {campaigns.length === 0 && <div className="p-12 text-center text-white/30">No campaigns yet</div>}
                    </div>
                </div>
            )}

            {/* Templates */}
            {currentPage === 'templates' && (
                <div className="space-y-6">
                    <div><h1 className="text-2xl font-semibold text-white">Templates</h1><p className="text-white/40 mt-1">Reusable email templates</p></div>
                    <div className="glass rounded-xl p-12 text-center">
                        <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Coming Soon</h3>
                        <p className="text-white/40">Template management is under development</p>
                    </div>
                </div>
            )}

            {/* Account Modal */}
            <AnimatePresence>
                {showAccountForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAccountForm(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg glass-elevated rounded-2xl p-6 glow">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white">{editingAccount ? 'Edit Account' : 'New Account'}</h2>
                                <button onClick={() => setShowAccountForm(false)} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.05]"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-sm text-white/40 mb-1 block">Name</label><input type="text" value={accountForm.name} onChange={(e) => setAccountForm(p => ({ ...p, name: e.target.value }))} placeholder="My SMTP" className="input" /></div>
                                    <div><label className="text-sm text-white/40 mb-1 block">From Name</label><input type="text" value={accountForm.fromName} onChange={(e) => setAccountForm(p => ({ ...p, fromName: e.target.value }))} placeholder="John Doe" className="input" /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2"><label className="text-sm text-white/40 mb-1 block">Host</label><input type="text" value={accountForm.host} onChange={(e) => setAccountForm(p => ({ ...p, host: e.target.value }))} placeholder="smtp.example.com" className="input" /></div>
                                    <div><label className="text-sm text-white/40 mb-1 block">Port</label><input type="text" value={accountForm.port} onChange={(e) => setAccountForm(p => ({ ...p, port: e.target.value }))} placeholder="587" className="input" /></div>
                                </div>
                                <div><label className="text-sm text-white/40 mb-1 block">From Email</label><input type="email" value={accountForm.fromEmail} onChange={(e) => setAccountForm(p => ({ ...p, fromEmail: e.target.value }))} placeholder="hello@example.com" className="input" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-sm text-white/40 mb-1 block">Username</label><input type="text" value={accountForm.username} onChange={(e) => setAccountForm(p => ({ ...p, username: e.target.value }))} placeholder="username" className="input" /></div>
                                    <div><label className="text-sm text-white/40 mb-1 block">Password</label><input type="password" value={accountForm.password} onChange={(e) => setAccountForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="input" /></div>
                                </div>
                                <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] cursor-pointer">
                                    <input type="checkbox" checked={accountForm.isDefault} onChange={(e) => setAccountForm(p => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 rounded" />
                                    <span className="text-white text-sm">Set as default</span>
                                </label>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowAccountForm(false)} className="flex-1 btn-secondary">Cancel</button>
                                <button onClick={handleSaveAccount} disabled={savingAccount} className="flex-1 btn-primary flex items-center justify-center gap-2">
                                    {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {editingAccount ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
