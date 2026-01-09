import { useState, useEffect } from 'react';
import {
    Mail, Loader2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/ScrollArea';
import { EmptyState } from '../dashboard/EmptyState';
import { CampaignHistory } from './CampaignHistory';
import { EmailAccounts } from './EmailAccounts';
import { TemplateManager } from './TemplateManager';
import { CampaignBuilder } from './CampaignBuilder';
import { SettingsPage } from '../settings/SettingsPage';
import { AISidebar } from '../ai/AISidebar';
import { useTheme } from '../../lib/ThemeContext';
import { useDashboardContext } from '../../layouts/DashboardShell';
import InboxView from './InboxView';
import SentView from './SentView';
import DraftsView from './DraftsView';
import { CampaignsList, CampaignWizard, CampaignDetail } from '../campaigns';
import type { Campaign as OrganizedCampaign } from '../campaigns';
import { LeadDiscovery } from '../discovery';
import { LeadListsPage } from '../../pages/LeadListsPage';

import AnalyticsPage from '../../pages/AnalyticsPage';

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
}

interface Campaign {
    id: string;
    name: string;
    subject: string;
    status: 'draft' | 'sending' | 'completed' | 'failed' | 'paused';
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    openCount?: number;
    clickCount?: number;
    replyCount?: number;
    createdAt: string;
    completedAt?: string;
    schedule?: any;
    options?: any;
    leads?: any[];
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

export default function UnifiedDashboard() {
    const { theme } = useTheme();
    const { activeSection, activeSubItem, setActiveSubItem, setNavigateToSettings, setActiveSection, setInboxFilterAccountIds, setInboxFilterCampaignId } = useDashboardContext();
    const isDark = theme === 'dark';

    const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<EmailStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiSidebarOpen, setAiSidebarOpen] = useState(false);

    const [campaignView, setCampaignView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

    const organizedCampaigns: OrganizedCampaign[] = campaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status === 'sending' ? 'active' : c.status === 'paused' ? 'paused' : c.status === 'completed' ? 'completed' : c.status === 'failed' ? 'failed' : 'draft',
        createdAt: c.createdAt,
        completedAt: c.completedAt,
        totalRecipients: c.totalRecipients,
        sentCount: c.sentCount,
        failedCount: c.failedCount,
        openCount: c.openCount || 0,
        clickCount: c.clickCount || 0,
        replyCount: c.replyCount || 0,
        progress: c.totalRecipients > 0 ? (c.sentCount / c.totalRecipients) * 100 : 0,
        schedule: c.schedule,
        options: c.options,
        leads: c.leads,
    }));

    const [aiContext, setAiContext] = useState({
        recipientCount: 0,
        headers: [] as string[],
        recipients: [] as Array<{ email: string; name: string;[key: string]: string }>,
        currentSubject: '',
        currentBody: '',
    });

    const [personalizedEmails, setPersonalizedEmails] = useState<Array<{
        email: string;
        name: string;
        subject: string;
        body: string;
    }>>([]);

    const [pendingAIMessage, setPendingAIMessage] = useState<{
        message: string;
        selectedText?: string;
        recipientEmail?: string;
    } | null>(null);

    useEffect(() => {
        setNavigateToSettings(() => {
            // Navigate to settings - the context handles this now
        });
    }, [setNavigateToSettings]);

    // Handle sidebar item clicks for campaigns section
    useEffect(() => {
        if (activeSection === 'campaigns' && activeSubItem) {
            if (activeSubItem === 'new-campaign') {
                setCampaignView('create');
                setActiveSubItem(''); // Clear to allow re-clicking
            }
        }
    }, [activeSection, activeSubItem, setActiveSubItem]);

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

            if (smtpRes.ok) setSmtpAccounts(await smtpRes.json());
            if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
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

    const handleViewInbox = (campaignId: string, accountIds: string[]) => {
        // Set the filter and navigate to inbox
        setInboxFilterCampaignId(campaignId);
        setInboxFilterAccountIds(accountIds);
        setActiveSection('inbox');
    };

    if (loading && !stats) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className={cn("w-10 h-10 animate-spin mx-auto mb-4", isDark ? 'text-orange-500' : 'text-blue-600')} />
                    <p className={cn(isDark ? 'text-gray-400' : 'text-gray-500')}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        // Settings
        if (activeSection === 'settings') {
            return <SettingsPage />;
        }

        // Inbox
        if (activeSection === 'inbox') {
            // Show Drafts view if drafts folder is selected
            if (activeSubItem === 'drafts') {
                return (
                    <DraftsView
                        smtpAccounts={smtpAccounts.map(a => ({
                            id: a.id,
                            name: a.name,
                            fromEmail: a.fromEmail,
                        }))}
                        onBack={() => setActiveSubItem('all-mail')}
                    />
                );
            }
            return <InboxView smtpAccounts={smtpAccounts} campaigns={organizedCampaigns} onRefreshAccounts={fetchData} />;
        }

        // Campaigns
        if (activeSection === 'campaigns') {
            if (campaignView === 'create') {
                return (
                    <CampaignWizard
                        onBack={() => setCampaignView('list')}
                        onComplete={(campaignId: string) => {
                            setSelectedCampaignId(campaignId);
                            setCampaignView('detail');
                            fetchData();
                        }}
                    />
                );
            }
            if (campaignView === 'detail' && selectedCampaignId) {
                return (
                    <CampaignDetail
                        campaignId={selectedCampaignId}
                        onBack={() => { setCampaignView('list'); setSelectedCampaignId(null); }}
                        onContextChange={(ctx: typeof aiContext) => setAiContext(ctx)}
                    />
                );
            }
            return (
                <CampaignsList
                    campaigns={organizedCampaigns}
                    loading={loading}
                    onCreateNew={() => setCampaignView('create')}
                    onViewCampaign={(id: string) => { setSelectedCampaignId(id); setCampaignView('detail'); }}
                    onDeleteCampaign={handleDeleteCampaign}
                    onViewInbox={handleViewInbox}
                />
            );
        }

        // Discovery
        if (activeSection === 'discovery') {
            return <LeadDiscovery />;
        }

        // Lead Lists
        if (activeSection === 'lead-lists') {
            return (
                <LeadListsPage
                    onNavigateToCampaign={(campaignId) => {
                        setSelectedCampaignId(campaignId);
                        setCampaignView('detail');
                    }}
                />
            );
        }

        // Email Accounts
        if (activeSection === 'accounts') {
            return <EmailAccounts accounts={smtpAccounts} onRefresh={fetchData} />;
        }

        // Analytics
        if (activeSection === 'analytics') {
            return <AnalyticsPage />;
        }

        // Default: show campaigns
        return (
            <CampaignsList
                campaigns={organizedCampaigns}
                loading={loading}
                onCreateNew={() => setCampaignView('create')}
                onViewCampaign={(id: string) => { setSelectedCampaignId(id); setCampaignView('detail'); }}
                onDeleteCampaign={handleDeleteCampaign}
                onViewInbox={handleViewInbox}
            />
        );
    };

    const showAiSidebar = activeSection !== 'settings' && activeSection !== 'inbox';

    return (
        <div className="h-full flex overflow-hidden">
            {/* Main Content */}
            <main className={cn('flex-1 flex flex-col overflow-hidden', isDark ? 'bg-[#0f0f0f]' : 'bg-white')}>
                {renderContent()}
            </main>

            {/* AI Sidebar */}
            {showAiSidebar && (
                <AISidebar
                    isOpen={aiSidebarOpen}
                    onClose={() => setAiSidebarOpen(false)}
                    context={aiContext}
                    onInsertSubject={(subject) => { setAiContext(prev => ({ ...prev, currentSubject: subject })); toast.success('Subject updated'); }}
                    onInsertBody={(body) => { setAiContext(prev => ({ ...prev, currentBody: body })); toast.success('Body updated'); }}
                    onPersonalizedEmails={(emails) => { setPersonalizedEmails(emails); toast.success(`${emails.length} emails ready`); }}
                    pendingMessage={pendingAIMessage}
                    onPendingMessageHandled={() => setPendingAIMessage(null)}
                />
            )}

            {/* Floating AI Button */}
            {showAiSidebar && !aiSidebarOpen && (
                <button
                    onClick={() => setAiSidebarOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-xl shadow-orange-500/30 hover:scale-105 transition-transform"
                >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-semibold">Iris AI</span>
                </button>
            )}
        </div>
    );
}
