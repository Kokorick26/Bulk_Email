import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Send, Server, History, FileText, Zap,
    BarChart2, TrendingUp, Mail, Loader2, RefreshCw,
    Inbox, Archive, Trash2, AlertCircle, FileEdit, Edit3,
    Settings, ChevronRight, Megaphone,
    Check, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { EmptyState } from '../dashboard/EmptyState';
import { ComposePanel } from './ComposePanel';
import { CampaignHistory } from './CampaignHistory';
import { SmtpAccounts } from './SmtpAccounts';
import { TemplateManager } from './TemplateManager';
import { CampaignBuilder } from './CampaignBuilder';
import { SettingsPage } from '../settings/SettingsPage';
import { AISidebar } from '../ai/AISidebar';
import { useTheme } from '../../lib/ThemeContext';
import { useDashboardContext } from '../../layouts/DashboardShell';
import InboxView from './InboxView';
import SentView from './SentView';
// New organized campaign components
import { CampaignsList, CampaignCreate, CampaignDetail } from '../campaigns';
import type { Campaign as OrganizedCampaign } from '../campaigns';

const API_BASE = '/api/bulk-email';

// Types
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

interface EmailStats {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
    totalSubscribers: number;
    totalSmtpAccounts: number;
}

type SidebarItem =
    | 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash'
    | 'overview' | 'compose' | 'campaign-builder' | 'campaigns' | 'templates' | 'history' | 'accounts' | 'settings';

export default function UnifiedDashboard() {
    // Hooks
    const { theme } = useTheme();
    const { sidebarCollapsed, setNavigateToSettings } = useDashboardContext();

    // State
    const [activeItem, setActiveItem] = useState<SidebarItem>('campaigns');
    const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<EmailStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiSidebarOpen, setAiSidebarOpen] = useState(true);

    // New campaign flow states
    const [campaignView, setCampaignView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

    // Convert campaigns to organized format
    const organizedCampaigns: OrganizedCampaign[] = campaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status === 'sending' ? 'active' : c.status === 'completed' ? 'completed' : c.status === 'failed' ? 'failed' : 'draft',
        createdAt: c.createdAt,
        completedAt: c.completedAt,
        totalRecipients: c.totalRecipients,
        sentCount: c.sentCount,
        failedCount: c.failedCount,
        progress: c.totalRecipients > 0 ? (c.sentCount / c.totalRecipients) * 100 : 0,
    }));

    // AI Context for the sidebar
    const [aiContext, setAiContext] = useState({
        recipientCount: 0,
        headers: [] as string[],
        recipients: [] as Array<{ email: string; name: string;[key: string]: string }>,
        currentSubject: '',
        currentBody: '',
    });

    // Store AI-generated personalized emails for each recipient
    const [personalizedEmails, setPersonalizedEmails] = useState<Array<{
        email: string;
        name: string;
        subject: string;
        body: string;
    }>>([]);

    // Message to send to AI (for text selection feature)
    const [pendingAIMessage, setPendingAIMessage] = useState<{
        message: string;
        selectedText?: string;
        recipientEmail?: string;
    } | null>(null);

    // Register settings navigation for header button - run only once on mount
    useEffect(() => {
        setNavigateToSettings(() => setActiveItem('settings'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Determine if we're in inbox or campaigns section
    const isInboxSection = ['inbox', 'sent', 'drafts', 'archive', 'spam', 'trash'].includes(activeItem);
    const isCampaignSection = ['overview', 'compose', 'campaign-builder', 'templates', 'history', 'accounts'].includes(activeItem);

    // Fetch data from real API
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [smtpRes, campaignsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/smtp-accounts`, { headers }),
                fetch(`${API_BASE}/campaigns`, { headers }),
                fetch(`${API_BASE}/stats`, { headers }),
            ]);

            if (smtpRes.ok) {
                const smtpData = await smtpRes.json();
                setSmtpAccounts(smtpData);
            }
            if (campaignsRes.ok) {
                const campaignData = await campaignsRes.json();
                setCampaigns(campaignData);
            }
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm('Delete this campaign?')) return;
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/campaigns/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Campaign deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete campaign');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const activeCampaigns = stats?.activeCampaigns || 0;

    if (loading && !stats) {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8] mx-auto mb-4" />
                    <p className="text-[#5f6368]">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Sidebar items configuration
    const inboxItems = [
        { id: 'inbox' as const, label: 'Inbox', icon: Inbox },
        { id: 'sent' as const, label: 'Sent', icon: Send },
        { id: 'drafts' as const, label: 'Drafts', icon: FileEdit },
        { id: 'archive' as const, label: 'Archive', icon: Archive },
        { id: 'spam' as const, label: 'Spam', icon: AlertCircle },
        { id: 'trash' as const, label: 'Trash', icon: Trash2 },
    ];

    const campaignItems = [
        { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
        { id: 'campaigns' as const, label: 'Campaigns', icon: Megaphone },
        { id: 'compose' as const, label: 'Quick Compose', icon: Edit3 },
        { id: 'templates' as const, label: 'Templates', icon: FileText },
        { id: 'accounts' as const, label: 'SMTP Accounts', icon: Server },
    ];

    // Render content based on active item
    const renderContent = () => {
        // Settings page (full width, no AI sidebar)
        if (activeItem === 'settings') {
            return <SettingsPage />;
        }

        // Inbox sections - use new InboxView and SentView components
        if (activeItem === 'inbox') {
            return (
                <InboxView
                    smtpAccounts={smtpAccounts}
                    onRefreshAccounts={fetchData}
                />
            );
        }

        if (activeItem === 'sent') {
            return (
                <SentView smtpAccounts={smtpAccounts} />
            );
        }

        // Other inbox sections (drafts, archive, spam, trash) - show empty state for now
        if (['drafts', 'archive', 'spam', 'trash'].includes(activeItem)) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                        icon={<Mail className="w-16 h-16" />}
                        title="Coming Soon"
                        description={`The ${activeItem} feature is under development.`}
                        action={
                            <button
                                onClick={() => setActiveItem('inbox')}
                                className="mt-4 px-6 py-2.5 bg-[#1a73e8] text-white rounded-lg font-medium hover:bg-[#1557b0] transition-colors"
                            >
                                Go to Inbox
                            </button>
                        }
                    />
                </div>
            );
        }

        // Campaign Overview
        if (activeItem === 'overview') {
            return (
                <ScrollArea className="flex-1">
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed]">Dashboard</h1>
                                <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mt-1">Your campaign performance overview</p>
                            </div>
                            <Button
                                onClick={fetchData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 border border-[#dadce0] rounded-lg text-[#202124] hover:bg-[#f1f3f4] transition-colors bg-white"
                            >
                                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                                Refresh
                            </Button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="gmail-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                                        <BarChart2 className="w-5 h-5 text-[#1a73e8]" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-medium text-[#202124] dark:text-[#e8eaed]">
                                            {stats?.totalCampaigns || 0}
                                        </div>
                                        <div className="text-sm text-[#5f6368]">Total Campaigns</div>
                                    </div>
                                </div>
                            </div>
                            <div className="gmail-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#e6f4ea] flex items-center justify-center">
                                        <Send className="w-5 h-5 text-[#1e8e3e]" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-medium text-[#202124] dark:text-[#e8eaed]">
                                            {stats?.totalEmailsSent || 0}
                                        </div>
                                        <div className="text-sm text-[#5f6368]">Emails Sent</div>
                                    </div>
                                </div>
                            </div>
                            <div className="gmail-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#fef7e0] flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-[#f9ab00]" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-medium text-[#202124] dark:text-[#e8eaed]">
                                            {stats?.totalEmailsSent
                                                ? Math.round((stats.totalEmailsSent / (stats.totalEmailsSent + stats.totalEmailsFailed)) * 100)
                                                : 0}%
                                        </div>
                                        <div className="text-sm text-[#5f6368]">Success Rate</div>
                                    </div>
                                </div>
                            </div>
                            <div className="gmail-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#fce8e6] flex items-center justify-center">
                                        <Server className="w-5 h-5 text-[#d93025]" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-medium text-[#202124] dark:text-[#e8eaed]">
                                            {stats?.totalSmtpAccounts || smtpAccounts.length || 0}
                                        </div>
                                        <div className="text-sm text-[#5f6368]">SMTP Accounts</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="gmail-card p-6 mb-6">
                            <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setActiveItem('campaign-builder')}
                                    className="flex items-center gap-4 p-4 rounded-lg border border-[#dadce0] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#c2e7ff] flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-[#001d35]" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-[#202124] dark:text-[#e8eaed]">Campaign Builder</div>
                                        <div className="text-sm text-[#5f6368]">AI-powered campaigns</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveItem('compose')}
                                    className="flex items-center gap-4 p-4 rounded-lg border border-[#dadce0] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                                        <Edit3 className="w-5 h-5 text-[#1a73e8]" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-[#202124] dark:text-[#e8eaed]">Quick Compose</div>
                                        <div className="text-sm text-[#5f6368]">Send a single email</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveItem('accounts')}
                                    className="flex items-center gap-4 p-4 rounded-lg border border-[#dadce0] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#f1f3f4] flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-[#5f6368]" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-[#202124] dark:text-[#e8eaed]">SMTP Settings</div>
                                        <div className="text-sm text-[#5f6368]">Configure accounts</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Recent Campaigns */}
                        <div className="gmail-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed]">Recent Campaigns</h3>
                                {campaigns.length > 5 && (
                                    <button
                                        onClick={() => setActiveItem('history')}
                                        className="text-sm text-[#1a73e8] hover:underline flex items-center gap-1"
                                    >
                                        View all
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {campaigns.length === 0 ? (
                                <div className="text-center py-8">
                                    <Mail className="w-12 h-12 text-[#dadce0] mx-auto mb-3" />
                                    <p className="text-[#5f6368]">No campaigns yet</p>
                                    <button
                                        onClick={() => setActiveItem('campaign-builder')}
                                        className="mt-3 text-[#1a73e8] hover:underline"
                                    >
                                        Create your first campaign
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#f1f3f4]">
                                    {campaigns.slice(0, 5).map((campaign) => (
                                        <div
                                            key={campaign.id}
                                            className="flex items-center justify-between py-3 hover:bg-[#f8f9fa] -mx-2 px-2 rounded cursor-pointer"
                                            onClick={() => setActiveItem('history')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-2 h-2 rounded-full',
                                                    campaign.status === 'completed' && 'bg-[#1e8e3e]',
                                                    campaign.status === 'failed' && 'bg-[#d93025]',
                                                    campaign.status === 'sending' && 'bg-[#1a73e8]',
                                                    campaign.status === 'draft' && 'bg-[#5f6368]'
                                                )} />
                                                <div>
                                                    <div className="font-medium text-[#202124] dark:text-[#e8eaed]">{campaign.name}</div>
                                                    <div className="text-sm text-[#5f6368]">{campaign.subject}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-[#202124] dark:text-[#e8eaed]">
                                                    {campaign.sentCount}/{campaign.totalRecipients}
                                                </div>
                                                <div className="text-xs text-[#5f6368]">
                                                    {formatDate(campaign.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            );
        }

        // Compose
        if (activeItem === 'compose') {
            return (
                <ScrollArea className="flex-1">
                    <div className="px-8 py-6">
                        <ComposePanel
                            smtpAccounts={smtpAccounts}
                            onSuccess={() => {
                                fetchData();
                                setActiveItem('history');
                            }}
                        />
                    </div>
                </ScrollArea>
            );
        }

        // NEW: Organized Campaigns View (like reference images)
        if (activeItem === 'campaigns') {
            if (campaignView === 'create') {
                return (
                    <ScrollArea className="flex-1">
                        <div className="px-8 py-6">
                            <CampaignCreate
                                onBack={() => setCampaignView('list')}
                                onComplete={(campaignId: string) => {
                                    setSelectedCampaignId(campaignId);
                                    setCampaignView('detail');
                                    fetchData();
                                }}
                            />
                        </div>
                    </ScrollArea>
                );
            }

            if (campaignView === 'detail' && selectedCampaignId) {
                return (
                    <ScrollArea className="flex-1">
                        <div className="px-8 py-6">
                            <CampaignDetail
                                campaignId={selectedCampaignId}
                                onBack={() => {
                                    setCampaignView('list');
                                    setSelectedCampaignId(null);
                                }}
                            />
                        </div>
                    </ScrollArea>
                );
            }

            // Default: List view
            return (
                <ScrollArea className="flex-1">
                    <div className="px-8 py-6">
                        <CampaignsList
                            campaigns={organizedCampaigns}
                            loading={loading}
                            onCreateNew={() => setCampaignView('create')}
                            onViewCampaign={(id: string) => {
                                setSelectedCampaignId(id);
                                setCampaignView('detail');
                            }}
                            onDeleteCampaign={handleDeleteCampaign}
                        />
                    </div>
                </ScrollArea>
            );
        }

        // Campaign Builder with AI context updates (legacy)
        if (activeItem === 'campaign-builder') {
            return (
                <ScrollArea className="flex-1">
                    <div className="px-6 py-4">
                        <CampaignBuilder
                            smtpAccounts={smtpAccounts}
                            onSuccess={fetchData}
                            onContextChange={(ctx) => setAiContext(ctx)}
                            aiSubject={aiContext.currentSubject}
                            aiBody={aiContext.currentBody}
                            aiPersonalizedEmails={personalizedEmails}
                            onSendToAI={(message, selectedText, recipientEmail) => {
                                setPendingAIMessage({ message, selectedText, recipientEmail });
                            }}
                        />
                    </div>
                </ScrollArea>
            );
        }

        // Templates
        if (activeItem === 'templates') {
            return (
                <ScrollArea className="flex-1">
                    <div className="px-8 py-6">
                        <TemplateManager />
                    </div>
                </ScrollArea>
            );
        }

        // History
        if (activeItem === 'history') {
            return (
                <ScrollArea className="flex-1">
                    <div className="px-8 py-6">
                        <CampaignHistory
                            campaigns={campaigns}
                            loading={loading}
                            onRefresh={fetchData}
                            onDelete={handleDeleteCampaign}
                        />
                    </div>
                </ScrollArea>
            );
        }

        // Accounts
        if (activeItem === 'accounts') {
            return (
                <ScrollArea className="flex-1">
                    <div className="px-8 py-6">
                        <SmtpAccounts
                            accounts={smtpAccounts}
                            onRefresh={fetchData}
                        />
                    </div>
                </ScrollArea>
            );
        }

        return null;
    };

    // Check if AI sidebar should be shown (not on settings page)
    const showAiSidebar = activeItem !== 'settings' && isCampaignSection;

    return (
        <div className="h-[calc(100vh-64px)] flex overflow-hidden">
            {/* Gmail-style Sidebar */}
            <div className={cn(
                'shrink-0 flex flex-col py-2 overflow-hidden hidden md:flex',
                sidebarCollapsed ? 'w-[72px]' : 'w-[256px]',
                theme === 'dark' ? 'bg-[#202124]' : 'bg-white'
            )}>
                <ScrollArea className="flex-1 pt-2">
                    {/* Mail Section */}
                    <div className={cn('mb-4', sidebarCollapsed && 'flex flex-col items-center')}>
                        {inboxItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveItem(item.id)}
                                title={sidebarCollapsed ? item.label : undefined}
                                className={cn(
                                    'flex items-center text-sm transition-colors',
                                    sidebarCollapsed
                                        ? 'w-10 h-10 justify-center rounded-full my-1'
                                        : 'w-full gap-3 px-6 py-2.5 rounded-r-full mr-3',
                                    activeItem === item.id
                                        ? theme === 'dark'
                                            ? 'bg-[#3c4043] text-[#8ab4f8] font-medium'
                                            : 'bg-[#d3e3fd] text-[#001d35] font-medium'
                                        : theme === 'dark'
                                            ? 'hover:bg-[#3c4043] text-[#e8eaed]'
                                            : 'hover:bg-[#e8eaed] text-[#202124]'
                                )}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className={cn(
                        'h-px my-3',
                        theme === 'dark' ? 'bg-[#3c4043]' : 'bg-[#dadce0]',
                        sidebarCollapsed ? 'mx-2' : 'mx-4'
                    )} />

                    {/* Campaigns Section */}
                    {!sidebarCollapsed && (
                        <div className="px-4 py-2">
                            <span className={cn(
                                'text-xs font-medium uppercase tracking-wide',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                Campaigns
                            </span>
                        </div>
                    )}

                    {/* Campaign items */}
                    <div className={cn(sidebarCollapsed && 'flex flex-col items-center')}>
                        {campaignItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveItem(item.id)}
                                title={sidebarCollapsed ? item.label : undefined}
                                className={cn(
                                    'flex items-center text-sm transition-colors',
                                    sidebarCollapsed
                                        ? 'w-10 h-10 justify-center rounded-full my-1'
                                        : 'w-full gap-3 px-6 py-2.5 rounded-r-full mr-3',
                                    activeItem === item.id
                                        ? theme === 'dark'
                                            ? 'bg-[#3c4043] text-[#8ab4f8] font-medium'
                                            : 'bg-[#d3e3fd] text-[#001d35] font-medium'
                                        : theme === 'dark'
                                            ? 'hover:bg-[#3c4043] text-[#e8eaed]'
                                            : 'hover:bg-[#e8eaed] text-[#202124]'
                                )}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                            </button>
                        ))}

                        {/* Settings */}
                        <button
                            onClick={() => setActiveItem('settings')}
                            title={sidebarCollapsed ? 'Settings' : undefined}
                            className={cn(
                                'flex items-center text-sm transition-colors mt-4',
                                sidebarCollapsed
                                    ? 'w-10 h-10 justify-center rounded-full my-1'
                                    : 'w-full gap-3 px-6 py-2.5 rounded-r-full mr-3',
                                activeItem === 'settings'
                                    ? theme === 'dark'
                                        ? 'bg-[#3c4043] text-[#8ab4f8] font-medium'
                                        : 'bg-[#d3e3fd] text-[#001d35] font-medium'
                                    : theme === 'dark'
                                        ? 'hover:bg-[#3c4043] text-[#e8eaed]'
                                        : 'hover:bg-[#e8eaed] text-[#202124]'
                            )}
                        >
                            <Settings className="w-5 h-5 shrink-0" />
                            {!sidebarCollapsed && <span className="flex-1 text-left">Settings</span>}
                        </button>
                    </div>
                </ScrollArea>

                {/* AI Toggle Button at bottom */}
                {isCampaignSection && !sidebarCollapsed && (
                    <div className={cn(
                        'px-4 py-3 border-t',
                        theme === 'dark' ? 'border-[#3c4043]' : 'border-[#dadce0]'
                    )}>
                        <button
                            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                                aiSidebarOpen
                                    ? theme === 'dark'
                                        ? 'bg-[#1a73e8]/20 text-[#8ab4f8]'
                                        : 'bg-[#e8f0fe] text-[#1a73e8]'
                                    : theme === 'dark'
                                        ? 'text-[#9aa0a6] hover:bg-[#3c4043]'
                                        : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                            )}
                        >
                            <Sparkles className="w-5 h-5" />
                            <span className="flex-1 text-left">Iris AI</span>
                            <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                aiSidebarOpen ? 'bg-[#1a73e8] text-white' : theme === 'dark' ? 'bg-[#3c4043] text-[#9aa0a6]' : 'bg-[#f1f3f4] text-[#5f6368]'
                            )}>
                                {aiSidebarOpen ? 'On' : 'Off'}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className={cn(
                'flex-1 flex overflow-hidden rounded-tl-2xl',
                theme === 'dark' ? 'bg-[#171717]' : 'bg-[#f6f8fc]'
            )}>
                {renderContent()}
            </div>

            {/* AI Sidebar - Always visible when open on campaign pages */}
            {showAiSidebar && (
                <AISidebar
                    isOpen={aiSidebarOpen}
                    onClose={() => setAiSidebarOpen(false)}
                    context={aiContext}
                    onInsertSubject={(subject) => {
                        setAiContext(prev => ({ ...prev, currentSubject: subject }));
                        toast.success('Subject line updated');
                    }}
                    onInsertBody={(body) => {
                        setAiContext(prev => ({ ...prev, currentBody: body }));
                        toast.success('Email body updated');
                    }}
                    onPersonalizedEmails={(emails) => {
                        setPersonalizedEmails(emails);
                        toast.success(`${emails.length} personalized emails ready for preview`);
                    }}
                    pendingMessage={pendingAIMessage}
                    onPendingMessageHandled={() => setPendingAIMessage(null)}
                />
            )}
        </div>
    );
}
