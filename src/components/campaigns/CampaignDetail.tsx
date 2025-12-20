import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Play, Pause, MoreHorizontal, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { LeadsTab, SequencesTab, ScheduleTab, OptionsTab, AnalyticsTab } from './tabs';
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

const tabs: { id: CampaignTab; label: string }[] = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'leads', label: 'Leads' },
    { id: 'sequences', label: 'Sequences' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'options', label: 'Options' },
];

export function CampaignDetail({ campaignId, onBack, onContextChange, className }: CampaignDetailProps) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<CampaignTab>('leads');
    const [loading, setLoading] = useState(true);

    // Campaign data
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [sequence, setSequence] = useState<Sequence | null>(null);
    const [schedule, setSchedule] = useState<CampaignSchedule | null>(null);
    const [options, setOptions] = useState<CampaignOptions | null>(null);

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
        // TODO: Implement resume campaign
        console.log('Resume campaign');
    };

    const handlePauseCampaign = async () => {
        // TODO: Implement pause campaign
        console.log('Pause campaign');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className={cn(
                    'w-8 h-8 animate-spin',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )} />
            </div>
        );
    }

    return (
        <div className={cn('min-h-[calc(100vh-100px)]', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className={cn(
                            'flex items-center gap-1 text-sm font-medium transition-colors',
                            theme === 'dark'
                                ? 'text-gray-400 hover:text-white'
                                : 'text-gray-600 hover:text-gray-900'
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h1 className={cn(
                        'text-xl font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        {campaign?.name || 'Campaign'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {campaign?.status === 'active' ? (
                        <Button
                            onClick={handlePauseCampaign}
                            variant="outline"
                            className={cn(
                                'gap-2',
                                theme === 'dark'
                                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <Pause className="w-4 h-4" />
                            Pause campaign
                        </Button>
                    ) : (
                        <Button
                            onClick={handleResumeCampaign}
                            className={cn(
                                'gap-2',
                                theme === 'dark'
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            )}
                        >
                            <Play className="w-4 h-4" />
                            Resume campaign
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
                            <DropdownMenuItem>Duplicate Campaign</DropdownMenuItem>
                            <DropdownMenuItem>Export Data</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">Delete Campaign</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabs */}
            <div className={cn(
                'border-b mb-6',
                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            )}>
                <div className="flex gap-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'relative pb-3 text-sm font-medium transition-colors',
                                activeTab === tab.id
                                    ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className={cn(
                                        'absolute bottom-0 left-0 right-0 h-0.5',
                                        theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                                    )}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
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
            </div>
        </div>
    );
}
