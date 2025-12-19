import { useState, useEffect } from 'react';
import { Loader2, Server, CheckCircle2, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { useTheme } from '../../lib/ThemeContext';

const API_BASE = '/api/inbox';

interface SmtpAccount {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    fromEmail: string;
    imapHost?: string;
    imapPort?: number;
    imapUser?: string;
    imapPassword?: string;
    imapTls?: boolean;
    imapConfigured?: boolean;
}

interface ImapConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account: SmtpAccount | null;
    onSuccess: () => void;
}

// Common IMAP presets
const IMAP_PRESETS: Record<string, { host: string; port: number; tls: boolean }> = {
    'zoho.com': { host: 'imappro.zoho.com', port: 993, tls: true },
    'zoho.eu': { host: 'imappro.zoho.eu', port: 993, tls: true },
    'gmail.com': { host: 'imap.gmail.com', port: 993, tls: true },
    'outlook.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'hotmail.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993, tls: true },
    'icloud.com': { host: 'imap.mail.me.com', port: 993, tls: true },
};

export default function ImapConfigDialog({ open, onOpenChange, account, onSuccess }: ImapConfigDialogProps) {
    const { theme } = useTheme();
    const [form, setForm] = useState({
        imapHost: '',
        imapPort: '993',
        imapUser: '',
        imapPassword: '',
        imapTls: true,
    });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Auto-fill based on SMTP account
    useEffect(() => {
        if (account) {
            // Try to detect IMAP preset based on SMTP host
            let detectedPreset: { host: string; port: number; tls: boolean } | null = null;

            for (const [domain, preset] of Object.entries(IMAP_PRESETS)) {
                if (account.host.includes(domain) || account.fromEmail.includes(domain)) {
                    detectedPreset = preset;
                    break;
                }
            }

            setForm({
                imapHost: account.imapHost || detectedPreset?.host || account.host.replace('smtp', 'imap'),
                imapPort: String(account.imapPort || detectedPreset?.port || 993),
                imapUser: account.imapUser || account.username,
                imapPassword: account.imapPassword || '',
                imapTls: account.imapTls !== undefined ? account.imapTls : (detectedPreset?.tls ?? true),
            });
            setTestResult(null);
        }
    }, [account]);

    const handleTest = async () => {
        if (!account) return;

        setTesting(true);
        setTestResult(null);

        try {
            // First save the config
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/smtp-accounts/${account.id}/imap`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });

            // Then test the connection
            const res = await fetch(`${API_BASE}/smtp-accounts/${account.id}/test-imap`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (res.ok) {
                setTestResult({ success: true, message: `Connected! Found ${data.mailboxes?.length || 0} mailboxes.` });
            } else {
                setTestResult({ success: false, message: data.error || 'Connection failed' });
            }
        } catch (err: any) {
            setTestResult({ success: false, message: err.message || 'Connection failed' });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!account) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/smtp-accounts/${account.id}/imap`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }

            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save IMAP configuration');
        } finally {
            setSaving(false);
        }
    };

    const applyPreset = (preset: { host: string; port: number; tls: boolean }) => {
        setForm(prev => ({
            ...prev,
            imapHost: preset.host,
            imapPort: String(preset.port),
            imapTls: preset.tls,
        }));
        setTestResult(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                'max-w-lg',
                theme === 'dark' ? 'bg-[#303134] border-[#3c4043]' : ''
            )}>
                <DialogHeader>
                    <DialogTitle className={cn(
                        'flex items-center gap-3',
                        theme === 'dark' ? 'text-[#e8eaed]' : ''
                    )}>
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            theme === 'dark' ? 'bg-[#3c4043]' : 'bg-[#e8f0fe]'
                        )}>
                            <Server className="w-5 h-5 text-[#1a73e8]" />
                        </div>
                        Configure IMAP for {account?.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Info Banner */}
                    <div className={cn(
                        'flex items-start gap-3 p-3 rounded-lg text-sm',
                        theme === 'dark' ? 'bg-[#1a73e8]/10 text-[#8ab4f8]' : 'bg-[#e8f0fe] text-[#1a73e8]'
                    )}>
                        <Info className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            IMAP allows you to receive and view incoming emails. The credentials are usually the same as your SMTP settings.
                        </div>
                    </div>

                    {/* Presets */}
                    <div>
                        <label className={cn(
                            'text-sm mb-2 block',
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            Quick Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(IMAP_PRESETS).slice(0, 5).map(([domain, preset]) => (
                                <button
                                    key={domain}
                                    onClick={() => applyPreset(preset)}
                                    className={cn(
                                        'px-3 py-1 text-xs rounded-full border transition-colors',
                                        form.imapHost === preset.host
                                            ? theme === 'dark'
                                                ? 'bg-[#1a73e8] border-[#1a73e8] text-white'
                                                : 'bg-[#1a73e8] border-[#1a73e8] text-white'
                                            : theme === 'dark'
                                                ? 'border-[#3c4043] text-[#9aa0a6] hover:bg-[#3c4043]'
                                                : 'border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4]'
                                    )}
                                >
                                    {domain.replace('.com', '').replace('.eu', '')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* IMAP Host & Port */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className={cn(
                                'text-sm mb-1.5 block',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                IMAP Host
                            </label>
                            <Input
                                value={form.imapHost}
                                onChange={(e) => {
                                    setForm(p => ({ ...p, imapHost: e.target.value }));
                                    setTestResult(null);
                                }}
                                placeholder="imap.example.com"
                                className={cn(
                                    theme === 'dark'
                                        ? 'bg-[#202124] border-[#3c4043] text-[#e8eaed]'
                                        : ''
                                )}
                            />
                        </div>
                        <div>
                            <label className={cn(
                                'text-sm mb-1.5 block',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                Port
                            </label>
                            <Input
                                value={form.imapPort}
                                onChange={(e) => {
                                    setForm(p => ({ ...p, imapPort: e.target.value }));
                                    setTestResult(null);
                                }}
                                placeholder="993"
                                className={cn(
                                    theme === 'dark'
                                        ? 'bg-[#202124] border-[#3c4043] text-[#e8eaed]'
                                        : ''
                                )}
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label className={cn(
                            'text-sm mb-1.5 block',
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            Username (usually your email)
                        </label>
                        <Input
                            value={form.imapUser}
                            onChange={(e) => {
                                setForm(p => ({ ...p, imapUser: e.target.value }));
                                setTestResult(null);
                            }}
                            placeholder="your-email@example.com"
                            className={cn(
                                theme === 'dark'
                                    ? 'bg-[#202124] border-[#3c4043] text-[#e8eaed]'
                                    : ''
                            )}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className={cn(
                            'text-sm mb-1.5 block',
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            Password / App Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={form.imapPassword}
                                onChange={(e) => {
                                    setForm(p => ({ ...p, imapPassword: e.target.value }));
                                    setTestResult(null);
                                }}
                                placeholder="••••••••"
                                className={cn(
                                    'pr-10',
                                    theme === 'dark'
                                        ? 'bg-[#202124] border-[#3c4043] text-[#e8eaed]'
                                        : ''
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={cn(
                                    'absolute right-3 top-1/2 -translate-y-1/2',
                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                )}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            For Gmail/Google Workspace, use an App Password
                        </p>
                    </div>

                    {/* TLS Toggle */}
                    <label className={cn(
                        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                        theme === 'dark' ? 'bg-[#202124] hover:bg-[#3c4043]' : 'bg-[#f1f3f4] hover:bg-[#e8eaed]'
                    )}>
                        <input
                            type="checkbox"
                            checked={form.imapTls}
                            onChange={(e) => {
                                setForm(p => ({ ...p, imapTls: e.target.checked }));
                                setTestResult(null);
                            }}
                            className="w-4 h-4 rounded accent-[#1a73e8]"
                        />
                        <span className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                        )}>
                            Use TLS/SSL (recommended)
                        </span>
                    </label>

                    {/* Test Result */}
                    {testResult && (
                        <div className={cn(
                            'flex items-start gap-3 p-3 rounded-lg text-sm',
                            testResult.success
                                ? theme === 'dark'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-green-50 text-green-700'
                                : theme === 'dark'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-red-50 text-red-700'
                        )}>
                            {testResult.success ? (
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 shrink-0" />
                            )}
                            <div>{testResult.message}</div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={cn(
                            theme === 'dark'
                                ? 'border-[#3c4043] text-[#e8eaed] hover:bg-[#3c4043]'
                                : ''
                        )}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleTest}
                        disabled={testing || !form.imapHost || !form.imapUser}
                        className={cn(
                            theme === 'dark'
                                ? 'border-[#3c4043] text-[#e8eaed] hover:bg-[#3c4043]'
                                : ''
                        )}
                    >
                        {testing ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Test Connection
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !form.imapHost || !form.imapUser || !testResult?.success}
                        className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
