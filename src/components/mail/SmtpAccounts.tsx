import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, Edit3, Trash2, TestTube, Loader2, Server, X, Save, Inbox, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { EmptyState } from '../dashboard/EmptyState';
import ImapConfigDialog from './ImapConfigDialog';

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
    imapConfigured?: boolean;
    imapHost?: string;
    imapPort?: number;
}

interface SmtpAccountsProps {
    accounts: SmtpAccount[];
    onRefresh: () => void;
    className?: string;
}

const emptyForm = {
    name: '',
    host: '',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    isDefault: false,
};

export function SmtpAccounts({ accounts, onRefresh, className }: SmtpAccountsProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState<SmtpAccount | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testEmail, setTestEmail] = useState('');
    const [showImapConfig, setShowImapConfig] = useState(false);
    const [accountToConfigImap, setAccountToConfigImap] = useState<SmtpAccount | null>(null);

    const handleOpenForm = (account?: SmtpAccount) => {
        if (account) {
            setEditingAccount(account);
            setForm({
                name: account.name,
                host: account.host,
                port: String(account.port),
                username: account.username,
                password: account.password,
                fromEmail: account.fromEmail,
                fromName: account.fromName,
                isDefault: account.isDefault,
            });
        } else {
            setEditingAccount(null);
            setForm(emptyForm);
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingAccount(null);
        setForm(emptyForm);
    };

    const handleSave = async () => {
        if (!form.name || !form.host || !form.username || !form.password || !form.fromEmail) {
            toast.error('Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const url = editingAccount
                ? `${API_BASE}/smtp-accounts/${editingAccount.id}`
                : `${API_BASE}/smtp-accounts`;

            const res = await fetch(url, {
                method: editingAccount ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success(editingAccount ? 'Account updated!' : 'Account created!');
            handleCloseForm();
            onRefresh();
        } catch {
            toast.error('Failed to save account');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async (id: string) => {
        if (!testEmail) {
            toast.error('Enter a test email address');
            return;
        }

        setTestingId(id);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/smtp-accounts/${id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ testEmail }),
            });

            if (!res.ok) throw new Error((await res.json()).error);
            toast.success('Test email sent successfully!');
        } catch (err: any) {
            toast.error(err.message || 'Test failed');
        } finally {
            setTestingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this SMTP account?')) return;

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

    return (
        <div className={cn('space-y-6', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">SMTP Accounts</h2>
                    <p className="text-white/40 mt-1">Manage your email sending accounts</p>
                </div>
                <Button onClick={() => handleOpenForm()}>
                    <Plus className="w-4 h-4" />
                    Add Account
                </Button>
            </div>

            {accounts.length === 0 ? (
                <Card className="border-dashed">
                    <EmptyState
                        icon={<Server className="w-8 h-8" />}
                        title="No SMTP Accounts"
                        description="Add your first SMTP account to start sending emails"
                        action={
                            <Button onClick={() => handleOpenForm()}>
                                <Plus className="w-4 h-4" />
                                Add Account
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {accounts.map((account, index) => (
                        <motion.div
                            key={account.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="h-full">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    {account.name}
                                                    {account.isDefault && (
                                                        <Badge variant="secondary">Default</Badge>
                                                    )}
                                                </CardTitle>
                                                <p className="text-sm text-white/40">{account.fromEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenForm(account)}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(account.id)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-white/5 pt-4">
                                        <div>
                                            <span className="text-white/40 block">Host</span>
                                            <span className="text-white font-mono">{account.host}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/40 block">Port</span>
                                            <span className="text-white font-mono">{account.port}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Input
                                            type="email"
                                            placeholder="test@email.com"
                                            value={testingId === account.id ? testEmail : ''}
                                            onChange={(e) => setTestEmail(e.target.value)}
                                            onFocus={() => setTestingId(account.id)}
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleTest(account.id)}
                                            disabled={testingId === account.id && !testEmail}
                                        >
                                            {testingId === account.id && testEmail ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <TestTube className="w-4 h-4" />
                                            )}
                                            Test
                                        </Button>
                                    </div>

                                    {/* IMAP Configuration Status */}
                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Inbox className={cn(
                                                "w-4 h-4",
                                                account.imapConfigured ? "text-green-400" : "text-white/30"
                                            )} />
                                            <span className={cn(
                                                "text-sm",
                                                account.imapConfigured ? "text-green-400" : "text-white/40"
                                            )}>
                                                {account.imapConfigured ? 'Inbox Enabled' : 'Inbox Not Configured'}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setAccountToConfigImap(account);
                                                setShowImapConfig(true);
                                            }}
                                            className="text-white/60 hover:text-white"
                                        >
                                            <Settings2 className="w-4 h-4 mr-1" />
                                            {account.imapConfigured ? 'Edit IMAP' : 'Configure IMAP'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Account Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAccount ? 'Edit Email Account' : 'New Email Account'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* SMTP Configuration Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <Server className="w-5 h-5" />
                                <span>SMTP Configuration (Sending)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">Account Name *</label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="My Email Account"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">From Name</label>
                                    <Input
                                        value={form.fromName}
                                        onChange={(e) => setForm(p => ({ ...p, fromName: e.target.value }))}
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <label className="text-sm text-white/60 mb-1.5 block">SMTP Host *</label>
                                    <Input
                                        value={form.host}
                                        onChange={(e) => setForm(p => ({ ...p, host: e.target.value }))}
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">Port</label>
                                    <Input
                                        value={form.port}
                                        onChange={(e) => setForm(p => ({ ...p, port: e.target.value }))}
                                        placeholder="587"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-white/60 mb-1.5 block">From Email *</label>
                                <Input
                                    type="email"
                                    value={form.fromEmail}
                                    onChange={(e) => setForm(p => ({ ...p, fromEmail: e.target.value }))}
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">Username *</label>
                                    <Input
                                        value={form.username}
                                        onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                                        placeholder="your-email@gmail.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">Password *</label>
                                    <Input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/10 pt-6">
                            <div className="flex items-center gap-2 text-white font-medium mb-4">
                                <Inbox className="w-5 h-5" />
                                <span>IMAP Configuration (Receiving)</span>
                                <Badge variant="secondary" className="text-xs">Optional</Badge>
                            </div>
                            <p className="text-sm text-white/40 mb-4">
                                Configure IMAP to receive emails and view your inbox within BulkMail.
                            </p>

                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="col-span-3">
                                    <label className="text-sm text-white/60 mb-1.5 block">IMAP Host</label>
                                    <Input
                                        value={(form as any).imapHost || ''}
                                        onChange={(e) => setForm(p => ({ ...p, imapHost: e.target.value } as any))}
                                        placeholder="imap.gmail.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">Port</label>
                                    <Input
                                        value={(form as any).imapPort || '993'}
                                        onChange={(e) => setForm(p => ({ ...p, imapPort: e.target.value } as any))}
                                        placeholder="993"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">IMAP Username</label>
                                    <Input
                                        value={(form as any).imapUser || ''}
                                        onChange={(e) => setForm(p => ({ ...p, imapUser: e.target.value } as any))}
                                        placeholder="Same as SMTP username"
                                    />
                                    <p className="text-xs text-white/30 mt-1">Leave blank to use SMTP username</p>
                                </div>
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">IMAP Password</label>
                                    <Input
                                        type="password"
                                        value={(form as any).imapPassword || ''}
                                        onChange={(e) => setForm(p => ({ ...p, imapPassword: e.target.value } as any))}
                                        placeholder="Same as SMTP password"
                                    />
                                    <p className="text-xs text-white/30 mt-1">Leave blank to use SMTP password</p>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={(form as any).imapTls !== false}
                                    onChange={(e) => setForm(p => ({ ...p, imapTls: e.target.checked } as any))}
                                    className="w-4 h-4 rounded accent-white"
                                />
                                <span className="text-white text-sm">Use TLS/SSL for IMAP connection</span>
                            </label>
                        </div>

                        {/* Default Account */}
                        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={form.isDefault}
                                onChange={(e) => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                                className="w-4 h-4 rounded accent-white"
                            />
                            <span className="text-white text-sm">Set as default account for sending</span>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseForm}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {editingAccount ? 'Update Account' : 'Create Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* IMAP Configuration Dialog */}
            <ImapConfigDialog
                open={showImapConfig}
                onOpenChange={setShowImapConfig}
                account={accountToConfigImap}
                onSuccess={() => {
                    setShowImapConfig(false);
                    onRefresh();
                }}
            />
        </div>
    );
}
