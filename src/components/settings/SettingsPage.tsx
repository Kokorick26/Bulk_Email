import { useState, useEffect } from 'react';
import {
    Sun, Moon, Monitor, Bell, BellOff, Shield, Key, Mail,
    User, Globe, Clock, Trash2, Download, Upload, Save,
    ChevronRight, Check, AlertCircle, Loader2, Eye, EyeOff,
    RefreshCw, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { ScrollArea } from '../ui/ScrollArea';

interface SettingsSection {
    id: string;
    label: string;
    icon: any;
}

const sections: SettingsSection[] = [
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Storage', icon: Download },
];

export function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [activeSection, setActiveSection] = useState('appearance');
    const [saving, setSaving] = useState(false);

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
        defaultSender: 'system-default',
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
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        localStorage.setItem('bulkmail-settings', JSON.stringify(settings));
        toast.success('Settings saved successfully');
        setSaving(false);
    };

    useEffect(() => {
        const saved = localStorage.getItem('bulkmail-settings');
        if (saved) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
            } catch { }
        }
    }, []);

    const ToggleSwitch = ({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
        <button
            onClick={onToggle}
            disabled={disabled}
            className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                enabled
                    ? 'bg-[#1a73e8] dark:bg-[#8ab4f8]'
                    : 'bg-[#dadce0] dark:bg-[#5f6368]',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <span
                className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                    enabled && 'translate-x-5'
                )}
            />
        </button>
    );

    const SettingRow = ({
        label,
        description,
        children
    }: {
        label: string;
        description?: string;
        children: React.ReactNode;
    }) => (
        <div className="flex items-center justify-between py-4 border-b border-[#f1f3f4] dark:border-[#3c4043] last:border-0">
            <div className="flex-1 mr-4">
                <div className="text-sm font-medium text-[#202124] dark:text-[#e8eaed]">{label}</div>
                {description && (
                    <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">{description}</div>
                )}
            </div>
            {children}
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'appearance':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Theme</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'light', label: 'Light', icon: Sun },
                                    { value: 'dark', label: 'Dark', icon: Moon },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setTheme(option.value as 'light' | 'dark')}
                                        className={cn(
                                            'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                                            theme === option.value
                                                ? 'border-[#1a73e8] bg-[#e8f0fe] dark:bg-[#1a73e8]/20'
                                                : 'border-[#dadce0] dark:border-[#5f6368] hover:border-[#1a73e8] dark:hover:border-[#8ab4f8]'
                                        )}
                                    >
                                        <option.icon className={cn(
                                            'w-6 h-6',
                                            theme === option.value
                                                ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                                                : 'text-[#5f6368]'
                                        )} />
                                        <span className={cn(
                                            'text-sm font-medium',
                                            theme === option.value
                                                ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                                                : 'text-[#5f6368]'
                                        )}>
                                            {option.label}
                                        </span>
                                        {theme === option.value && (
                                            <Check className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-[#f1f3f4] dark:border-[#3c4043] pt-6">
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-2">Display Options</h3>

                            <SettingRow label="Compact mode" description="Reduce spacing for a denser layout">
                                <ToggleSwitch
                                    enabled={settings.compactMode}
                                    onToggle={() => updateSetting('compactMode', !settings.compactMode)}
                                />
                            </SettingRow>

                            <SettingRow label="Show avatars" description="Display profile pictures in email list">
                                <ToggleSwitch
                                    enabled={settings.showAvatars}
                                    onToggle={() => updateSetting('showAvatars', !settings.showAvatars)}
                                />
                            </SettingRow>

                            <SettingRow label="Enable animations" description="Smooth transitions and effects">
                                <ToggleSwitch
                                    enabled={settings.animationsEnabled}
                                    onToggle={() => updateSetting('animationsEnabled', !settings.animationsEnabled)}
                                />
                            </SettingRow>
                        </div>
                    </div>
                );

            case 'account':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Profile</h3>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-2xl font-medium">
                                    {settings.displayName[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <button className="text-sm text-[#1a73e8] dark:text-[#8ab4f8] hover:underline">
                                        Change photo
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-1.5">Display name</label>
                                    <input
                                        type="text"
                                        value={settings.displayName}
                                        onChange={(e) => updateSetting('displayName', e.target.value)}
                                        className="w-full px-3 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-[#202124] dark:text-[#e8eaed] bg-white dark:bg-[#202124] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-1.5">Email address</label>
                                    <input
                                        type="email"
                                        value={settings.email}
                                        onChange={(e) => updateSetting('email', e.target.value)}
                                        className="w-full px-3 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-[#202124] dark:text-[#e8eaed] bg-white dark:bg-[#202124] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[#f1f3f4] dark:border-[#3c4043] pt-6">
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Preferences</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-1.5">Timezone</label>
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => updateSetting('timezone', e.target.value)}
                                        className="w-full px-3 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-[#202124] dark:text-[#e8eaed] bg-white dark:bg-[#202124] focus:border-[#1a73e8] outline-none"
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
                                    <label className="block text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-1.5">Language</label>
                                    <select
                                        value={settings.language}
                                        onChange={(e) => updateSetting('language', e.target.value)}
                                        className="w-full px-3 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-[#202124] dark:text-[#e8eaed] bg-white dark:bg-[#202124] focus:border-[#1a73e8] outline-none"
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
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-2">Email Notifications</h3>

                            <SettingRow label="Email notifications" description="Receive important updates via email">
                                <ToggleSwitch
                                    enabled={settings.emailNotifications}
                                    onToggle={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                                />
                            </SettingRow>

                            <SettingRow label="Campaign complete" description="Notify when a campaign finishes sending">
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

                            <SettingRow label="Weekly digest" description="Summary of campaign performance each week">
                                <ToggleSwitch
                                    enabled={settings.weeklyDigest}
                                    onToggle={() => updateSetting('weeklyDigest', !settings.weeklyDigest)}
                                    disabled={!settings.emailNotifications}
                                />
                            </SettingRow>
                        </div>
                    </div>
                );

            case 'email':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Sending Defaults</h3>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-1.5">
                                        Default delay between emails (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={settings.defaultThrottling}
                                        onChange={(e) => updateSetting('defaultThrottling', parseInt(e.target.value) || 4)}
                                        className="w-32 px-3 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-[#202124] dark:text-[#e8eaed] bg-white dark:bg-[#202124] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[#f1f3f4] dark:border-[#3c4043] pt-6">
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-2">Tracking</h3>

                            <SettingRow label="Track email opens" description="Monitor when recipients open emails">
                                <ToggleSwitch
                                    enabled={settings.trackOpens}
                                    onToggle={() => updateSetting('trackOpens', !settings.trackOpens)}
                                />
                            </SettingRow>

                            <SettingRow label="Track link clicks" description="Monitor when recipients click links">
                                <ToggleSwitch
                                    enabled={settings.trackClicks}
                                    onToggle={() => updateSetting('trackClicks', !settings.trackClicks)}
                                />
                            </SettingRow>

                            <SettingRow label="Auto-retry failed emails" description="Automatically retry sending failed emails">
                                <ToggleSwitch
                                    enabled={settings.autoRetry}
                                    onToggle={() => updateSetting('autoRetry', !settings.autoRetry)}
                                />
                            </SettingRow>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Password</h3>
                            <button className="px-4 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-sm font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors">
                                Change password
                            </button>
                        </div>

                        <div className="border-t border-[#f1f3f4] dark:border-[#3c4043] pt-6">
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-2">Two-Factor Authentication</h3>

                            <SettingRow
                                label="Enable 2FA"
                                description="Add an extra layer of security to your account"
                            >
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
                        </div>

                        <div className="border-t border-[#f1f3f4] dark:border-[#3c4043] pt-6">
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Session</h3>

                            <div className="mb-4">
                                <label className="block text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-1.5">
                                    Session timeout (minutes)
                                </label>
                                <select
                                    value={settings.sessionTimeout}
                                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                                    className="w-40 px-3 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-[#202124] dark:text-[#e8eaed] bg-white dark:bg-[#202124] focus:border-[#1a73e8] outline-none"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={120}>2 hours</option>
                                    <option value={480}>8 hours</option>
                                </select>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#d93025] hover:bg-[#fce8e6] dark:hover:bg-[#d93025]/20 rounded-lg transition-colors">
                                <LogOut className="w-4 h-4" />
                                Sign out of all devices
                            </button>
                        </div>
                    </div>
                );

            case 'data':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Export Data</h3>
                            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-4">
                                Download a copy of your campaign history and settings.
                            </p>
                            <button className="flex items-center gap-2 px-4 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-sm font-medium text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors">
                                <Download className="w-4 h-4" />
                                Export all data
                            </button>
                        </div>

                        <div className="border-t border-[#f1f3f4] dark:border-[#3c4043] pt-6">
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Import Data</h3>
                            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-4">
                                Import settings and templates from a backup file.
                            </p>
                            <button className="flex items-center gap-2 px-4 py-2 border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-sm font-medium text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors">
                                <Upload className="w-4 h-4" />
                                Import data
                            </button>
                        </div>

                        <div className="border-t border-[#f1f3f4] dark:border-[#3c4043] pt-6">
                            <h3 className="text-base font-medium text-[#d93025] mb-4">Danger Zone</h3>
                            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-4">
                                Permanently delete all your data. This action cannot be undone.
                            </p>
                            <button
                                onClick={() => toast.error('This would delete all data')}
                                className="flex items-center gap-2 px-4 py-2 bg-[#d93025] text-white rounded-lg text-sm font-medium hover:bg-[#b3261e] transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete all data
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-full flex">
            {/* Settings Sidebar */}
            <div className="w-64 border-r border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] shrink-0">
                <div className="p-4 border-b border-[#f1f3f4] dark:border-[#3c4043]">
                    <h2 className="text-lg font-medium text-[#202124] dark:text-[#e8eaed]">Settings</h2>
                </div>
                <nav className="p-2">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                                activeSection === section.id
                                    ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]'
                                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]'
                            )}
                        >
                            <section.icon className="w-5 h-5" />
                            {section.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 flex flex-col bg-[#f6f8fc] dark:bg-[#171717]">
                <div className="flex items-center justify-between px-8 py-4 bg-white dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043]">
                    <h2 className="text-lg font-medium text-[#202124] dark:text-[#e8eaed]">
                        {sections.find(s => s.id === activeSection)?.label}
                    </h2>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            saving
                                ? 'bg-[#f1f3f4] text-[#9aa0a6] cursor-not-allowed'
                                : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                        )}
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="max-w-2xl mx-auto px-8 py-6">
                        <div className="bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043] p-6">
                            {renderContent()}
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
