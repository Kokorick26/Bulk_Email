import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Play, Pause, MoreHorizontal, Loader2,
    BarChart2, Users, List, Calendar, Settings, History, Server, RotateCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { LeadsTab, SequencesTab, ScheduleTab, OptionsTab, AnalyticsTab, AccountsTab, HistoryTab } from './tabs';
import type { Campaign, CampaignTab, Lead, Sequence, CampaignSchedule, CampaignOptions } from './types';

interface AIContext {
    recipientCount: number;
    headers: string[];
    recipients: Array<{ email: string; name: string;[key: string]: string }>;
    currentSubject: string;
    currentBody: string;
}

interface CampaignDetailProps {
    campaignId: string;
    onBack: () => void;
    onContextChange?: (context: AIContext) => void;
    className?: string;
}

const tabs: { id: CampaignTab; label: string; icon: any }[] = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'sequences', label: 'Sequences', icon: List },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'options', label: 'Options', icon: Settings },
    { id: 'accounts', label: 'Accounts', icon: Server },
    { id: 'history', label: 'Email History', icon: History },
];

export function CampaignDetail({ campaignId, onBack, onContextChange, className }: CampaignDetailProps) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<CampaignTab>('leads');
    const [loading, setLoading] = useState(true);

    // Campaign data
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [sequence, setSequence] = useState<Sequence | null>(null);
    const [schedule, setSchedule] = useState<CampaignSchedule | undefined>(undefined);
    const [options, setOptions] = useState<CampaignOptions | undefined>(undefined);

    // Update AI context when leads or sequence changes
    useEffect(() => {
        if (onContextChange) {
            const firstStep = sequence?.steps?.[0];
            const headers = leads.length > 0
                ? Object.keys(leads[0]).filter(k => k !== 'id' && k !== 'status')
                : ['firstName', 'lastName', 'email', 'company'];

            const recipients = leads.map(lead => ({
                email: lead.email,
                name: lead.firstName || '',
                firstName: lead.firstName || '',
                lastName: lead.lastName || '',
                company: lead.company || '',
                ...lead.customFields
            }));

            onContextChange({
                recipientCount: leads.length,
                headers,
                recipients,
                currentSubject: firstStep?.subject || '',
                currentBody: firstStep?.body || '',
            });
        }
    }, [leads, sequence, onContextChange]);

    useEffect(() => {
        const fetchCampaignData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('bulkEmailToken');

                // Fetch campaign details
                const response = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCampaign({
                        id: data.id || campaignId,
                        name: data.name || 'My Campaign',
                        status: data.status || 'draft',
                        createdAt: data.createdAt || new Date().toISOString(),
                        totalRecipients: data.totalRecipients || 0,
                        sentCount: data.sentCount || 0,
                        failedCount: data.failedCount || 0,
                        openCount: data.openCount || 0,
                        clickCount: data.clickCount || 0,
                        replyCount: data.replyCount || 0,
                        progress: data.progress || 0,
                    });

                    // Load related data from the campaign
                    if (data.leads) setLeads(data.leads);
                    if (data.sequence) setSequence(data.sequence);
                    if (data.schedule) setSchedule(data.schedule);
                    if (data.options) setOptions(data.options);
                } else {
                    // Use mock data for demo
                    setCampaign({
                        id: campaignId,
                        name: 'My Campaign',
                        status: 'draft',
                        createdAt: new Date().toISOString(),
                        totalRecipients: 0,
                        sentCount: 0,
                        failedCount: 0,
                        progress: 0,
                    });
                }
            } catch (error) {
                console.error('Error fetching campaign:', error);
                // Use mock data
                setCampaign({
                    id: campaignId,
                    name: 'My Campaign',
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    totalRecipients: 0,
                    sentCount: 0,
                    failedCount: 0,
                    progress: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCampaignData();
    }, [campaignId]);

    const handleLeadsUpdate = (newLeads: Lead[]) => {
        setLeads(newLeads);
        if (campaign) {
            setCampaign({ ...campaign, totalRecipients: newLeads.length });
        }
    };

    const handleResumeCampaign = async () => {
        if (!campaign) return;

        // Validate before starting
        if (leads.length === 0) {
            alert('Please add leads before starting the campaign.');
            setActiveTab('leads');
            return;
        }

        if (!sequence || !sequence.steps || sequence.steps.length === 0) {
            alert('Please create at least one email step before starting the campaign.');
            setActiveTab('sequences');
            return;
        }

        const firstStep = sequence.steps[0];
        if (!firstStep.subject || !firstStep.body) {
            alert('Please add a subject and body to the first email step.');
            setActiveTab('sequences');
            return;
        }

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`/api/bulk-email/campaigns/${campaignId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setCampaign({ ...campaign, status: 'active' });
                alert(`Campaign started! Sending to ${data.totalLeads} leads with ${data.totalSteps} steps.`);
            } else {
                alert(data.error || 'Failed to start campaign');
            }
        } catch (error) {
            console.error('Error resuming campaign:', error);
            alert('Failed to start campaign. Please try again.');
        }
    };

    const handlePauseCampaign = async () => {
        if (!campaign) return;
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`/api/bulk-email/campaigns/${campaignId}/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                setCampaign({ ...campaign, status: 'paused' });
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to pause campaign');
            }
        } catch (error) {
            console.error('Error pausing campaign:', error);
            alert('Failed to pause campaign. Please try again.');
        }
    };

    const handleRetryCampaign = async () => {
        if (!campaign) return;

        const failedCount = leads.filter(l => (l.status as string) === 'failed' || l.status === 'bounced').length;
        if (failedCount === 0) {
            alert('No failed leads to retry. Use "Resume" to start pending leads.');
            return;
        }

        if (!confirm(`Are you sure you want to retry ${failedCount} failed leads?`)) return;

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`/api/bulk-email/campaigns/${campaignId}/retry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setCampaign({ ...campaign, status: 'active', failedCount: 0 }); // Optimistic update
                alert(data.message || 'Campaign retried started');
            } else {
                alert(data.error || 'Failed to retry campaign');
            }
        } catch (error) {
            console.error('Error retrying campaign:', error);
            alert('Failed to retry campaign. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className={cn(
                    'w-8 h-8 animate-spin',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )} />
            </div>
        );
    }

    // Calculate failure count ONLY from actual lead statuses, not accumulated counter
    const failedLeadsCount = leads.filter(l => (l.status as string) === 'failed' || l.status === 'bounced').length;

    return (
        <div className={cn('flex flex-1 h-full overflow-hidden', className)}>
            {/* ... Sidebar ... */}
            {/* Same sidebar code as before, we are focusing on Main Content Header for replace context */}
            <div className={cn(
                'w-64 flex-shrink-0 flex flex-col border-r',
                theme === 'dark' ? 'bg-[#0c0c0c] border-neutral-800' : 'bg-gray-50 border-gray-200'
            )}>
                {/* Back Link */}
                <div className={cn(
                    'p-4 border-b',
                    theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'
                )}>
                    <button
                        onClick={onBack}
                        className={cn(
                            'flex items-center gap-2 text-sm font-medium transition-colors w-full px-2 py-1.5 rounded-lg',
                            theme === 'dark'
                                ? 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Campaigns
                    </button>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                                activeTab === tab.id
                                    ? theme === 'dark'
                                        ? 'bg-orange-500/10 text-orange-400'
                                        : 'bg-orange-50 text-orange-600'
                                    : theme === 'dark'
                                        ? 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                        >
                            <tab.icon className={cn(
                                "w-4 h-4",
                                activeTab === tab.id
                                    ? "opacity-100"
                                    : "opacity-70 group-hover:opacity-100"
                            )} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                {/* Header Actions */}
                <div className={cn(
                    'flex items-center justify-between px-6 py-4 border-b flex-shrink-0',
                    theme === 'dark' ? 'border-neutral-800 bg-[#080808]' : 'border-gray-200 bg-white'
                )}>
                    <div>
                        <h1 className={cn(
                            'text-xl font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            {campaign?.name || 'Campaign'}
                        </h1>
                        <p className={cn(
                            'text-sm mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {failedLeadsCount > 0 && (
                            <Button
                                onClick={handleRetryCampaign}
                                variant="outline"
                                size="sm"
                                className={cn(
                                    'gap-2 text-red-500 border-red-500/20 hover:bg-red-500/10',
                                    theme === 'dark' ? 'hover:text-red-400' : 'hover:text-red-600'
                                )}
                            >
                                <RotateCw className="w-4 h-4" />
                                Retry Failed ({failedLeadsCount})
                            </Button>
                        )}

                        {campaign?.status === 'active' ? (
                            <Button
                                onClick={handlePauseCampaign}
                                variant="outline"
                                size="sm"
                                className={cn(
                                    'gap-2',
                                    theme === 'dark'
                                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                <Pause className="w-4 h-4" />
                                Pause
                            </Button>
                        ) : (
                            <Button
                                onClick={handleResumeCampaign}
                                size="sm"
                                className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:opacity-90"
                            >
                                <Play className="w-4 h-4" />
                                Resume
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    'p-2 rounded-lg border transition-colors',
                                    theme === 'dark'
                                        ? 'border-gray-700 text-gray-400 hover:bg-gray-800'
                                        : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                                )}>
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={async () => {
                                    if (!confirm('Reset all campaign statistics (sent, failed, open counts)?')) return;
                                    const token = localStorage.getItem('bulkEmailToken');
                                    await fetch(`/api/bulk-email/campaigns/${campaignId}/reset-stats`, {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    window.location.reload();
                                }}>Reset Stats</DropdownMenuItem>
                                <DropdownMenuItem>Duplicate Campaign</DropdownMenuItem>
                                <DropdownMenuItem>Export Data</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500">Delete Campaign</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1">
                    <div className="p-6">
                        {activeTab === 'analytics' && (
                            <AnalyticsTab
                                campaign={campaign!}
                                leads={leads}
                            />
                        )}
                        {activeTab === 'leads' && (
                            <LeadsTab
                                campaignId={campaignId}
                                leads={leads}
                                onLeadsUpdate={handleLeadsUpdate}
                            />
                        )}
                        {activeTab === 'sequences' && (
                            <SequencesTab
                                campaignId={campaignId}
                                sequence={sequence}
                                onSequenceUpdate={setSequence}
                                leads={leads}
                            />
                        )}
                        {activeTab === 'schedule' && (
                            <ScheduleTab
                                campaignId={campaignId}
                                schedule={schedule}
                                onScheduleUpdate={setSchedule}
                            />
                        )}
                        {activeTab === 'options' && (
                            <OptionsTab
                                campaignId={campaignId}
                                options={options}
                                onOptionsUpdate={setOptions}
                            />
                        )}
                        {activeTab === 'accounts' && (
                            <AccountsTab
                                campaignId={campaignId}
                                leads={leads}
                                sequence={sequence}
                                onLeadsUpdate={handleLeadsUpdate}
                            />
                        )}
                        {activeTab === 'history' && (
                            <HistoryTab
                                campaignId={campaignId}
                            />
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
