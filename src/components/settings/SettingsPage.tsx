import { useState, useEffect, useCallback } from 'react';
import {
    Sun, Moon, Bell, Shield, Mail, Inbox,
    User, Download, Upload, Save, Server,
    Check, Loader2, LogOut, Trash2, Plus,
    Settings2, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { ScrollArea } from '../ui/ScrollArea';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
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

export function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [saving, setSaving] = useState(false);
    const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [showImapConfig, setShowImapConfig] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<SmtpAccount | null>(null);

    // Settings state
    const [settings, setSettings] = useState({
        // Appearance
        compactMode: false,
        showAvatars: true,
        animationsEnabled: true,

        // Notifications
        emailNotifications: true,
        campaignComplete: true,
        failureAlerts: true,
        weeklyDigest: false,

        // Email Settings
        defaultThrottling: 4,
        trackOpens: true,
        trackClicks: true,
        autoRetry: true,

        // Security
        twoFactorEnabled: false,
        sessionTimeout: 30,

        // Account
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        localStorage.setItem('bulkmail-settings', JSON.stringify(settings));
        toast.success('Settings saved successfully');
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

    useEffect(() => {
        const saved = localStorage.getItem('bulkmail-settings');
        if (saved) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
            } catch { }
        }
        fetchSmtpAccounts();
    }, [fetchSmtpAccounts]);

    const handleConfigureImap = (account: SmtpAccount) => {
        setSelectedAccount(account);
        setShowImapConfig(true);
    };

    const handleImapSuccess = () => {
        setShowImapConfig(false);
        fetchSmtpAccounts();
        toast.success('IMAP configured successfully!');
    };

    // Toggle Switch Component
    const ToggleSwitch = ({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
        <button
            onClick={onToggle}
            disabled={disabled}
            className={cn(
                'relative w-12 h-7 rounded-full transition-all duration-300 ease-out',
                enabled
                    ? 'bg-[#1a73e8] dark:bg-[#8ab4f8]'
                    : 'bg-[#dadce0] dark:bg-[#5f6368]',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <span
                className={cn(
                    'absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ease-out',
                    enabled && 'translate-x-5'
                )}
            />
        </button>
    );

    // Setting Row Component
    const SettingRow = ({
        label,
        description,
        children,
    }: {
        label: string;
        description?: string;
        children: React.ReactNode;
    }) => (
        <div className="flex items-center justify-between py-5 border-b border-border last:border-0">
            <div className="flex-1 mr-6">
                <div className="text-sm font-medium text-foreground">{label}</div>
                {description && (
                    <div className="text-sm text-muted-foreground mt-1">{description}</div>
                )}
            </div>
            {children}
        </div>
    );

    return (
        <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account preferences and configurations</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </div>

            {/* Content with Tabs */}
            <ScrollArea className="flex-1">
                <div className="p-8">
                    <Tabs defaultValue="appearance" className="w-full">
                        <TabsList className="mb-8 bg-muted/50 p-1 h-auto flex-wrap">
                            <TabsTrigger value="appearance" className="gap-2 py-2.5 px-4">
                                <Sun className="w-4 h-4" />
                                Appearance
                            </TabsTrigger>
                            <TabsTrigger value="account" className="gap-2 py-2.5 px-4">
                                <User className="w-4 h-4" />
                                Account
                            </TabsTrigger>
                            <TabsTrigger value="email" className="gap-2 py-2.5 px-4">
                                <Mail className="w-4 h-4" />
                                Email Accounts
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="gap-2 py-2.5 px-4">
                                <Bell className="w-4 h-4" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value="security" className="gap-2 py-2.5 px-4">
                                <Shield className="w-4 h-4" />
                                Security
                            </TabsTrigger>
                            <TabsTrigger value="data" className="gap-2 py-2.5 px-4">
                                <Download className="w-4 h-4" />
                                Data
                            </TabsTrigger>
                        </TabsList>

                        {/* Appearance Tab */}
                        <TabsContent value="appearance" className="space-y-8 mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Theme Selection */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Theme</CardTitle>
                                        <CardDescription>Choose your preferred appearance</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { value: 'light', label: 'Light Mode', icon: Sun, desc: 'Bright and clean' },
                                                { value: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Easy on the eyes' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setTheme(option.value as 'light' | 'dark')}
                                                    className={cn(
                                                        'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200',
                                                        theme === option.value
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-primary/50'
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-full flex items-center justify-center",
                                                        theme === option.value ? 'bg-primary/10' : 'bg-muted'
                                                    )}>
                                                        <option.icon className={cn(
                                                            'w-7 h-7',
                                                            theme === option.value ? 'text-primary' : 'text-muted-foreground'
                                                        )} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className={cn(
                                                            'text-sm font-semibold block',
                                                            theme === option.value ? 'text-primary' : 'text-foreground'
                                                        )}>
                                                            {option.label}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">{option.desc}</span>
                                                    </div>
                                                    {theme === option.value && (
                                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                            <Check className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Display Options */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Display Options</CardTitle>
                                        <CardDescription>Customize your interface</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <SettingRow label="Compact mode" description="Reduce spacing for a denser layout">
                                            <ToggleSwitch
                                                enabled={settings.compactMode}
                                                onToggle={() => updateSetting('compactMode', !settings.compactMode)}
                                            />
                                        </SettingRow>
                                        <SettingRow label="Show avatars" description="Display profile pictures">
                                            <ToggleSwitch
                                                enabled={settings.showAvatars}
                                                onToggle={() => updateSetting('showAvatars', !settings.showAvatars)}
                                            />
                                        </SettingRow>
                                        <SettingRow label="Enable animations" description="Smooth transitions">
                                            <ToggleSwitch
                                                enabled={settings.animationsEnabled}
                                                onToggle={() => updateSetting('animationsEnabled', !settings.animationsEnabled)}
                                            />
                                        </SettingRow>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Account Tab */}
                        <TabsContent value="account" className="space-y-8 mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Profile</CardTitle>
                                        <CardDescription>Manage your personal information</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-border">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                                {settings.displayName[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-semibold text-foreground">{settings.displayName}</h3>
                                                <p className="text-sm text-muted-foreground">{settings.email}</p>
                                                <Button variant="outline" size="sm">Change photo</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Display name</label>
                                                <Input
                                                    type="text"
                                                    value={settings.displayName}
                                                    onChange={(e) => updateSetting('displayName', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Email address</label>
                                                <Input
                                                    type="email"
                                                    value={settings.email}
                                                    onChange={(e) => updateSetting('email', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Preferences</CardTitle>
                                        <CardDescription>Regional and language settings</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
                                                <select
                                                    value={settings.timezone}
                                                    onChange={(e) => updateSetting('timezone', e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:border-primary outline-none transition-all"
                                                >
                                                    <option value="UTC">UTC</option>
                                                    <option value="America/New_York">Eastern Time</option>
                                                    <option value="America/Los_Angeles">Pacific Time</option>
                                                    <option value="Europe/London">London</option>
                                                    <option value="Asia/Kolkata">India Standard Time</option>
                                                    <option value="Asia/Tokyo">Japan Standard Time</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                                                <select
                                                    value={settings.language}
                                                    onChange={(e) => updateSetting('language', e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:border-primary outline-none transition-all"
                                                >
                                                    <option value="en">English</option>
                                                    <option value="es">Español</option>
                                                    <option value="fr">Français</option>
                                                    <option value="de">Deutsch</option>
                                                    <option value="ja">日本語</option>
                                                    <option value="hi">हिन्दी</option>
                                                </select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Email Accounts Tab */}
                        <TabsContent value="email" className="space-y-8 mt-0">
                            {/* IMAP Configuration Section */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Inbox className="w-5 h-5" />
                                                Email Accounts - IMAP Configuration
                                            </CardTitle>
                                            <CardDescription>Configure IMAP to receive emails in your inbox</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loadingAccounts ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        </div>
                                    ) : smtpAccounts.length === 0 ? (
                                        <div className="text-center py-12 border border-dashed border-border rounded-xl">
                                            <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground mb-2">No email accounts found</p>
                                            <p className="text-sm text-muted-foreground">Add SMTP accounts first in the SMTP Accounts section</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {smtpAccounts.map((account) => (
                                                <div
                                                    key={account.id}
                                                    className="p-5 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-start gap-4 mb-4">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                                            account.imapConfigured ? "bg-green-500/10" : "bg-muted"
                                                        )}>
                                                            <Mail className={cn(
                                                                "w-6 h-6",
                                                                account.imapConfigured ? "text-green-500" : "text-muted-foreground"
                                                            )} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-foreground truncate">{account.name}</h4>
                                                            <p className="text-sm text-muted-foreground truncate">{account.fromEmail}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        {account.imapConfigured ? (
                                                            <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                IMAP Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                IMAP Not Configured
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {account.imapConfigured && account.imapHost && (
                                                        <p className="text-xs text-muted-foreground mb-4 font-mono">
                                                            {account.imapHost}:{account.imapPort}
                                                        </p>
                                                    )}

                                                    <Button
                                                        variant={account.imapConfigured ? "outline" : "default"}
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => handleConfigureImap(account)}
                                                    >
                                                        <Settings2 className="w-4 h-4 mr-2" />
                                                        {account.imapConfigured ? 'Edit IMAP' : 'Configure IMAP'}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Sending Defaults */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Sending Defaults</CardTitle>
                                        <CardDescription>Configure default email sending behavior</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Default delay between emails
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="60"
                                                    value={settings.defaultThrottling}
                                                    onChange={(e) => updateSetting('defaultThrottling', parseInt(e.target.value) || 4)}
                                                    className="w-24"
                                                />
                                                <span className="text-sm text-muted-foreground">minutes</span>
                                            </div>
                                        </div>
                                        <SettingRow label="Auto-retry failed emails" description="Automatically retry after delay">
                                            <ToggleSwitch
                                                enabled={settings.autoRetry}
                                                onToggle={() => updateSetting('autoRetry', !settings.autoRetry)}
                                            />
                                        </SettingRow>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Email Tracking</CardTitle>
                                        <CardDescription>Monitor campaign engagement</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <SettingRow label="Track email opens" description="Know when emails are opened">
                                            <ToggleSwitch
                                                enabled={settings.trackOpens}
                                                onToggle={() => updateSetting('trackOpens', !settings.trackOpens)}
                                            />
                                        </SettingRow>
                                        <SettingRow label="Track link clicks" description="Monitor link engagement">
                                            <ToggleSwitch
                                                enabled={settings.trackClicks}
                                                onToggle={() => updateSetting('trackClicks', !settings.trackClicks)}
                                            />
                                        </SettingRow>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="space-y-8 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Email Notifications</CardTitle>
                                    <CardDescription>Control what notifications you receive</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <SettingRow label="Email notifications" description="Receive important updates via email">
                                        <ToggleSwitch
                                            enabled={settings.emailNotifications}
                                            onToggle={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                                        />
                                    </SettingRow>
                                    <SettingRow label="Campaign complete" description="Notify when a campaign finishes">
                                        <ToggleSwitch
                                            enabled={settings.campaignComplete}
                                            onToggle={() => updateSetting('campaignComplete', !settings.campaignComplete)}
                                            disabled={!settings.emailNotifications}
                                        />
                                    </SettingRow>
                                    <SettingRow label="Failure alerts" description="Notify when emails fail to send">
                                        <ToggleSwitch
                                            enabled={settings.failureAlerts}
                                            onToggle={() => updateSetting('failureAlerts', !settings.failureAlerts)}
                                            disabled={!settings.emailNotifications}
                                        />
                                    </SettingRow>
                                    <SettingRow label="Weekly digest" description="Weekly performance summary">
                                        <ToggleSwitch
                                            enabled={settings.weeklyDigest}
                                            onToggle={() => updateSetting('weeklyDigest', !settings.weeklyDigest)}
                                            disabled={!settings.emailNotifications}
                                        />
                                    </SettingRow>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-8 mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Password</CardTitle>
                                        <CardDescription>Keep your account secure</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                                            <Button variant="outline">Change password</Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Two-Factor Authentication</CardTitle>
                                        <CardDescription>Add extra security</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <SettingRow label="Enable 2FA" description="Require verification code">
                                            <ToggleSwitch
                                                enabled={settings.twoFactorEnabled}
                                                onToggle={() => {
                                                    if (!settings.twoFactorEnabled) {
                                                        toast.info('2FA setup would open here');
                                                    }
                                                    updateSetting('twoFactorEnabled', !settings.twoFactorEnabled);
                                                }}
                                            />
                                        </SettingRow>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Session Management</CardTitle>
                                        <CardDescription>Control active sessions</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-foreground mb-2">Session timeout</label>
                                            <select
                                                value={settings.sessionTimeout}
                                                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:border-primary outline-none"
                                            >
                                                <option value={15}>15 minutes</option>
                                                <option value={30}>30 minutes</option>
                                                <option value={60}>1 hour</option>
                                                <option value={120}>2 hours</option>
                                                <option value={480}>8 hours</option>
                                            </select>
                                        </div>
                                        <Button variant="destructive" className="gap-2">
                                            <LogOut className="w-4 h-4" />
                                            Sign out all devices
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Data Tab */}
                        <TabsContent value="data" className="space-y-8 mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Export Data</CardTitle>
                                        <CardDescription>Download your data</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Download campaigns, settings, and templates.
                                        </p>
                                        <Button variant="outline" className="w-full gap-2">
                                            <Download className="w-4 h-4" />
                                            Export all data
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Import Data</CardTitle>
                                        <CardDescription>Restore from backup</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Import settings and templates.
                                        </p>
                                        <Button variant="outline" className="w-full gap-2">
                                            <Upload className="w-4 h-4" />
                                            Import data
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-destructive/50">
                                    <CardHeader>
                                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                        <CardDescription>Irreversible actions</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Permanently delete all data.
                                        </p>
                                        <Button
                                            variant="destructive"
                                            className="w-full gap-2"
                                            onClick={() => toast.error('This would delete all data')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete all data
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>

            {/* IMAP Config Dialog */}
            <ImapConfigDialog
                open={showImapConfig}
                onOpenChange={setShowImapConfig}
                account={selectedAccount}
                onSuccess={handleImapSuccess}
            />
        </div>
    );
}
