import { useState, useEffect, useCallback } from 'react';
import {
    Sun, Moon, Bell, Shield, Mail, User, Download, Upload, Save,
    Check, Loader2, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { useDashboardContext } from '../../layouts/DashboardShell';
import { ScrollArea } from '../ui/ScrollArea';
import { Button } from '../ui/Button';
import ImapConfigDialog from '../mail/ImapConfigDialog';

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
}

// Map sidebar items to tab IDs
const SIDEBAR_TO_TAB: Record<string, string> = {
    'profile': 'account',
    'notifications': 'notifications',
    'preferences': 'appearance',
    'integrations': 'email',
};

export function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { activeSubItem, setActiveSubItem } = useDashboardContext();
    const isDark = theme === 'dark';
    const [saving, setSaving] = useState(false);
    const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [showImapConfig, setShowImapConfig] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<SmtpAccount | null>(null);

    // Derive active tab from context or default
    const activeTab = SIDEBAR_TO_TAB[activeSubItem] || 'appearance';
    const setActiveTab = (tab: string) => {
        // Reverse map to set the correct sub-item
        const entry = Object.entries(SIDEBAR_TO_TAB).find(([_, v]) => v === tab);
        if (entry) setActiveSubItem(entry[0]);
    };

    // Settings state
    const [settings, setSettings] = useState({
        compactMode: false,
        showAvatars: true,
        animationsEnabled: true,
        emailNotifications: true,
        campaignComplete: true,
        failureAlerts: true,
        weeklyDigest: false,
        defaultThrottling: 4,
        trackOpens: true,
        trackClicks: true,
        autoRetry: true,
        maxEmailsPerAccountPerDay: 15,
        twoFactorEnabled: false,
        sessionTimeout: 30,
        displayName: 'User',
        email: 'user@example.com',
        timezone: 'UTC',
        language: 'en',
    });

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch('/api/bulk-email/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                localStorage.setItem('bulkmail-settings', JSON.stringify(settings));
                toast.success('Settings saved successfully');
            } else {
                toast.error('Failed to save settings to server');
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
            localStorage.setItem('bulkmail-settings', JSON.stringify(settings));
            toast.success('Settings saved locally');
        }
        setSaving(false);
    };

    const fetchSmtpAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch('/api/bulk-email/smtp-accounts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSmtpAccounts(data);
            }
        } catch (err) {
            console.error('Failed to fetch SMTP accounts:', err);
        } finally {
            setLoadingAccounts(false);
        }
    }, []);

    const fetchUserSettings = useCallback(async () => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch('/api/bulk-email/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const serverSettings = await res.json();
                setSettings(prev => ({ ...prev, ...serverSettings }));
            }
        } catch (err) {
            console.error('Failed to fetch user settings:', err);
            const saved = localStorage.getItem('bulkmail-settings');
            if (saved) {
                try {
                    setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
                } catch { }
            }
        }
    }, []);

    useEffect(() => {
        fetchUserSettings();
        fetchSmtpAccounts();
    }, [fetchSmtpAccounts, fetchUserSettings]);

    const handleConfigureImap = (account: SmtpAccount) => {
        setSelectedAccount(account);
        setShowImapConfig(true);
    };

    const handleImapSuccess = () => {
        setShowImapConfig(false);
        fetchSmtpAccounts();
        toast.success('IMAP configured successfully!');
    };

    // Toggle Switch
    const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
        <button
            onClick={onToggle}
            className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                enabled ? 'bg-orange-500' : isDark ? 'bg-neutral-700' : 'bg-gray-300'
            )}
        >
            <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
                enabled && 'translate-x-5'
            )} />
        </button>
    );

    // Setting Row
    const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
        <div className={cn(
            'flex items-center justify-between py-4 border-b last:border-b-0',
            isDark ? 'border-neutral-800' : 'border-gray-200'
        )}>
            <div className="flex-1 mr-6">
                <div className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{label}</div>
                {description && (
                    <div className={cn('text-[12px] mt-0.5', isDark ? 'text-neutral-500' : 'text-gray-500')}>{description}</div>
                )}
            </div>
            {children}
        </div>
    );

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: Sun },
        { id: 'account', label: 'Account', icon: User },
        { id: 'email', label: 'Email Accounts', icon: Mail },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className={cn(
                'flex items-center justify-between px-6 py-4 border-b flex-shrink-0',
                isDark ? 'border-neutral-800' : 'border-gray-200'
            )}>
                <h1 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Settings</h1>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="max-w-2xl p-6">
                    {/* Appearance */}
                    {activeTab === 'appearance' && (
                        <div>
                            <h2 className={cn('text-base font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Theme</h2>

                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={cn(
                                        'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-colors',
                                        theme === 'light'
                                            ? 'border-orange-500 bg-orange-50'
                                            : isDark ? 'border-neutral-700 hover:border-neutral-600' : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    <Sun className={cn('w-5 h-5', theme === 'light' ? 'text-orange-500' : isDark ? 'text-neutral-400' : 'text-gray-400')} />
                                    <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Light</span>
                                    {theme === 'light' && <Check className="w-4 h-4 text-orange-500 ml-auto" />}
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-colors',
                                        theme === 'dark'
                                            ? 'border-orange-500 bg-orange-500/10'
                                            : isDark ? 'border-neutral-700 hover:border-neutral-600' : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    <Moon className={cn('w-5 h-5', theme === 'dark' ? 'text-orange-500' : isDark ? 'text-neutral-400' : 'text-gray-400')} />
                                    <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Dark</span>
                                    {theme === 'dark' && <Check className="w-4 h-4 text-orange-500 ml-auto" />}
                                </button>
                            </div>

                            <div className={cn('rounded-xl border p-5', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                                <SettingRow label="Compact mode" description="Use smaller spacing and fonts">
                                    <Toggle enabled={settings.compactMode} onToggle={() => updateSetting('compactMode', !settings.compactMode)} />
                                </SettingRow>
                                <SettingRow label="Show avatars" description="Display user avatars throughout the app">
                                    <Toggle enabled={settings.showAvatars} onToggle={() => updateSetting('showAvatars', !settings.showAvatars)} />
                                </SettingRow>
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex-1 mr-6">
                                        <div className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Animations</div>
                                        <div className={cn('text-[12px] mt-0.5', isDark ? 'text-neutral-500' : 'text-gray-500')}>Enable smooth transitions</div>
                                    </div>
                                    <Toggle enabled={settings.animationsEnabled} onToggle={() => updateSetting('animationsEnabled', !settings.animationsEnabled)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account */}
                    {activeTab === 'account' && (
                        <div>
                            <h2 className={cn('text-base font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Profile</h2>

                            <div className={cn('rounded-xl border p-5', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                                <div className="space-y-4">
                                    <div>
                                        <label className={cn('block text-[13px] font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.displayName}
                                            onChange={(e) => updateSetting('displayName', e.target.value)}
                                            className={cn(
                                                'w-full h-10 px-3 rounded-lg border text-[13px] outline-none transition-colors',
                                                isDark
                                                    ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                                    : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className={cn('block text-[13px] font-medium mb-1.5', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={settings.email}
                                            onChange={(e) => updateSetting('email', e.target.value)}
                                            className={cn(
                                                'w-full h-10 px-3 rounded-lg border text-[13px] outline-none transition-colors',
                                                isDark
                                                    ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                                    : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={cn('rounded-xl border mt-6 p-5', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                                <h3 className={cn('text-[13px] font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Data Export</h3>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="gap-2">
                                        <Download className="w-4 h-4" />
                                        Export Data
                                    </Button>
                                    <Button variant="outline" className="gap-2">
                                        <Upload className="w-4 h-4" />
                                        Import Data
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Accounts */}
                    {activeTab === 'email' && (
                        <div>
                            <h2 className={cn('text-base font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Connected Accounts</h2>

                            <div className={cn('rounded-xl border', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                                {loadingAccounts ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className={cn('w-6 h-6 animate-spin', isDark ? 'text-orange-500' : 'text-blue-500')} />
                                    </div>
                                ) : smtpAccounts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Mail className={cn('w-10 h-10 mb-3', isDark ? 'text-neutral-600' : 'text-gray-300')} />
                                        <p className={cn('text-sm', isDark ? 'text-neutral-500' : 'text-gray-500')}>No accounts configured</p>
                                    </div>
                                ) : (
                                    <div>
                                        {smtpAccounts.map((account) => (
                                            <div
                                                key={account.id}
                                                className={cn(
                                                    'flex items-center justify-between p-4 border-b last:border-b-0',
                                                    isDark ? 'border-neutral-800' : 'border-gray-200'
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                                        isDark ? 'bg-neutral-800' : 'bg-gray-100'
                                                    )}>
                                                        <Mail className={cn('w-5 h-5', isDark ? 'text-orange-400' : 'text-orange-600')} />
                                                    </div>
                                                    <div>
                                                        <div className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                                                            {account.name}
                                                        </div>
                                                        <div className={cn('text-[12px]', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                                                            {account.fromEmail}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {account.imapConfigured ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                                <span className="text-[12px] text-emerald-500">IMAP Configured</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 text-amber-500" />
                                                                <span className="text-[12px] text-amber-500">IMAP Not Set</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleConfigureImap(account)}
                                                    >
                                                        {account.imapConfigured ? 'Update' : 'Configure'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === 'notifications' && (
                        <div>
                            <h2 className={cn('text-base font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Notifications</h2>

                            <div className={cn('rounded-xl border p-5', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                                <SettingRow label="Email notifications" description="Receive notifications via email">
                                    <Toggle enabled={settings.emailNotifications} onToggle={() => updateSetting('emailNotifications', !settings.emailNotifications)} />
                                </SettingRow>
                                <SettingRow label="Campaign completed" description="Notify when a campaign finishes">
                                    <Toggle enabled={settings.campaignComplete} onToggle={() => updateSetting('campaignComplete', !settings.campaignComplete)} />
                                </SettingRow>
                                <SettingRow label="Failure alerts" description="Alert on delivery failures">
                                    <Toggle enabled={settings.failureAlerts} onToggle={() => updateSetting('failureAlerts', !settings.failureAlerts)} />
                                </SettingRow>
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex-1 mr-6">
                                        <div className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Weekly digest</div>
                                        <div className={cn('text-[12px] mt-0.5', isDark ? 'text-neutral-500' : 'text-gray-500')}>Summary of weekly activity</div>
                                    </div>
                                    <Toggle enabled={settings.weeklyDigest} onToggle={() => updateSetting('weeklyDigest', !settings.weeklyDigest)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === 'security' && (
                        <div>
                            <h2 className={cn('text-base font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Security</h2>

                            <div className={cn('rounded-xl border p-5', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                                <SettingRow label="Two-factor authentication" description="Add an extra layer of security">
                                    <Toggle enabled={settings.twoFactorEnabled} onToggle={() => updateSetting('twoFactorEnabled', !settings.twoFactorEnabled)} />
                                </SettingRow>
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex-1 mr-6">
                                        <div className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Session timeout</div>
                                        <div className={cn('text-[12px] mt-0.5', isDark ? 'text-neutral-500' : 'text-gray-500')}>Auto logout after inactivity</div>
                                    </div>
                                    <select
                                        value={settings.sessionTimeout}
                                        onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                                        className={cn(
                                            'h-9 px-3 rounded-lg border text-[13px] outline-none',
                                            isDark
                                                ? 'bg-neutral-800 border-neutral-700 text-white'
                                                : 'bg-white border-gray-200 text-gray-900'
                                        )}
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>1 hour</option>
                                        <option value={120}>2 hours</option>
                                    </select>
                                </div>
                            </div>

                            <div className={cn('rounded-xl border mt-6 p-5', isDark ? 'border-red-900/50' : 'border-red-200')}>
                                <h3 className="text-[13px] font-semibold text-red-500 mb-2">Danger Zone</h3>
                                <p className={cn('text-[12px] mb-4', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                                    Permanently delete your account and all data
                                </p>
                                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <ImapConfigDialog
                open={showImapConfig}
                onOpenChange={setShowImapConfig}
                account={selectedAccount}
                onSuccess={handleImapSuccess}
            />
        </div>
    );
}
