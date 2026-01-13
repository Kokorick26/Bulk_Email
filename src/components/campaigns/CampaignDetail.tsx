import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Play, Pause, MoreHorizontal, Loader2,
    BarChart2, Users, List, Calendar, Settings, RotateCw, Send, CheckCircle, RefreshCw
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
import { LeadsTab, SequencesTab, ScheduleTab, OptionsTab, AnalyticsTab } from './tabs';
import type { Campaign, CampaignTab, Lead, Sequence, CampaignSchedule, CampaignOptions } from './types';
import { cache } from '../../lib/cache';

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
    { id: 'leads', label: 'Outbox', icon: Send },
    { id: 'sequences', label: 'Sequences', icon: List },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'options', label: 'Options', icon: Settings },
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
            // Try cache first
            let hasCachedData = false;
            try {
                const cachedData = await cache.get<any>('campaigns', campaignId);
                if (cachedData) {
                    const data = cachedData;
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
                    if (data.leads) setLeads(data.leads);
                    if (data.sequence) setSequence(data.sequence);
                    if (data.schedule) setSchedule(data.schedule);
                    if (data.options) setOptions(data.options);
                    setLoading(false);
                    hasCachedData = true;
                }
            } catch (err) {
                console.error('Cache read error:', err);
            }

            if (!hasCachedData) setLoading(true);

            try {
                const token = localStorage.getItem('bulkEmailToken');

                // Fetch campaign details
                const response = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();

                    // Update Cache
                    await cache.set('campaigns', campaignId, data);

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
                } else if (!hasCachedData) {
                    // Use mock data for demo only if no cache
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
                if (!hasCachedData) {
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
                }
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
                'w-56 flex-shrink-0 flex flex-col border-r',
                theme === 'dark' ? 'bg-[#0c0c0c] border-neutral-800' : 'bg-gray-50 border-gray-200'
            )}>
                {/* Back Link */}
                <div className={cn(
                    'px-3 py-2 border-b',
                    theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'
                )}>
                    <button
                        onClick={onBack}
                        className={cn(
                            'flex items-center gap-2 text-xs font-medium transition-colors w-full px-2 py-1.5 rounded',
                            theme === 'dark'
                                ? 'text-neutral-500 hover:text-white hover:bg-white/[0.04]'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        )}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Back to Campaigns
                    </button>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors text-left',
                                activeTab === tab.id
                                    ? theme === 'dark'
                                        ? 'bg-neutral-800 text-white'
                                        : 'bg-gray-200 text-gray-900'
                                    : theme === 'dark'
                                        ? 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5 opacity-70" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                {/* Header Actions */}
                <div className={cn(
                    'flex items-center justify-between px-4 py-3 border-b flex-shrink-0',
                    theme === 'dark' ? 'border-neutral-800 bg-[#0a0a0a]' : 'border-gray-200 bg-white'
                )}>
                    <div>
                        <h1 className={cn(
                            'text-base font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            {campaign?.name || 'Campaign'}
                        </h1>
                        <p className={cn(
                            'text-xs',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {failedLeadsCount > 0 && (
                            <Button
                                onClick={handleRetryCampaign}
                                variant="outline"
                                size="sm"
                                className={cn(
                                    'h-8 text-xs gap-1.5 text-red-500 border-red-500/20 hover:bg-red-500/10',
                                    theme === 'dark' ? 'hover:text-red-400' : 'hover:text-red-600'
                                )}
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                                Retry ({failedLeadsCount})
                            </Button>
                        )}

                        {campaign?.status === 'active' ? (
                            <Button
                                onClick={handlePauseCampaign}
                                variant="outline"
                                size="sm"
                                className={cn(
                                    'h-8 text-xs gap-1.5',
                                    theme === 'dark'
                                        ? 'border-neutral-700 text-gray-300 hover:bg-neutral-800'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                <Pause className="w-3.5 h-3.5" />
                                Pause
                            </Button>
                        ) : campaign?.status === 'paused' ? (
                            <Button
                                onClick={handleResumeCampaign}
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                <Play className="w-3.5 h-3.5" />
                                Resume
                            </Button>
                        ) : campaign?.status === 'completed' || campaign?.status === 'sent' ? (
                            <Button
                                onClick={handleResumeCampaign}
                                size="sm"
                                className={cn(
                                    'h-8 text-xs gap-1.5',
                                    theme === 'dark'
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                )}
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Restart
                            </Button>
                        ) : (
                            <Button
                                onClick={handleResumeCampaign}
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                                <Play className="w-3.5 h-3.5" />
                                Start
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
                                <DropdownMenuItem onClick={async () => {
                                    if (!confirm(`Duplicate campaign "${campaign?.name}"?`)) return;
                                    try {
                                        const token = localStorage.getItem('bulkEmailToken');
                                        const response = await fetch(`/api/bulk-email/campaigns/${campaignId}/duplicate`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                Authorization: `Bearer ${token}`
                                            }
                                        });
                                        if (response.ok) {
                                            const data = await response.json();
                                            alert(`Campaign duplicated! New campaign: "${data.name}"`);
                                            onBack(); // Go back to campaigns list to see the new one
                                        } else {
                                            const error = await response.json();
                                            alert(error.error || 'Failed to duplicate campaign');
                                        }
                                    } catch (err) {
                                        console.error('Error duplicating campaign:', err);
                                        alert('Failed to duplicate campaign');
                                    }
                                }}>Duplicate Campaign</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    if (leads.length === 0) {
                                        alert('No leads to export');
                                        return;
                                    }
                                    // Create CSV content
                                    const headers = ['Email', 'First Name', 'Last Name', 'Company', 'Status', 'Added At'];
                                    const csvRows = [headers.join(',')];

                                    leads.forEach(lead => {
                                        const row = [
                                            lead.email || '',
                                            lead.firstName || '',
                                            lead.lastName || '',
                                            lead.company || '',
                                            lead.status || '',
                                            lead.addedAt || ''
                                        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                                        csvRows.push(row.join(','));
                                    });

                                    const csvContent = csvRows.join('\n');
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${campaign?.name || 'campaign'}_leads_${new Date().toISOString().split('T')[0]}.csv`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                }}>Export Data</DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={async () => {
                                        if (!confirm(`Are you sure you want to delete "${campaign?.name}"? This action cannot be undone.`)) return;
                                        try {
                                            const token = localStorage.getItem('bulkEmailToken');
                                            const response = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                                                method: 'DELETE',
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            if (response.ok) {
                                                alert('Campaign deleted successfully');
                                                onBack(); // Go back to campaigns list
                                            } else {
                                                const error = await response.json();
                                                alert(error.error || 'Failed to delete campaign');
                                            }
                                        } catch (err) {
                                            console.error('Error deleting campaign:', err);
                                            alert('Failed to delete campaign');
                                        }
                                    }}
                                >Delete Campaign</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Content - Full height tabs vs scrolling */}
                {activeTab === 'leads' ? (
                    <div className="flex-1 overflow-hidden">
                        <LeadsTab
                            campaignId={campaignId}
                            leads={leads}
                            onLeadsUpdate={handleLeadsUpdate}
                            isLocked={campaign?.status === 'active'}
                        />
                    </div>
                ) : activeTab === 'sequences' ? (
                    <div className="flex-1 overflow-hidden">
                        <SequencesTab
                            campaignId={campaignId}
                            sequence={sequence}
                            onSequenceUpdate={setSequence}
                            leads={leads}
                            isLocked={campaign?.status === 'active'}
                        />
                    </div>
                ) : (
                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {activeTab === 'analytics' && (
                                <AnalyticsTab
                                    campaign={campaign!}
                                    leads={leads}
                                />
                            )}
                            {activeTab === 'schedule' && (
                                <ScheduleTab
                                    campaignId={campaignId}
                                    schedule={schedule}
                                    onScheduleUpdate={setSchedule}
                                    isLocked={campaign?.status === 'active'}
                                />
                            )}
                            {activeTab === 'options' && (
                                <OptionsTab
                                    campaignId={campaignId}
                                    options={options}
                                    onOptionsUpdate={setOptions}
                                    isLocked={campaign?.status === 'active'}
                                />
                            )}

                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}
