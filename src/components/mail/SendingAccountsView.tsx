import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Clock, Send, User, Building, RefreshCw,
    ChevronRight, Eye, Edit3, X, Check, Loader2,
    Calendar, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';

interface SmtpAccount {
    id: string;
    name: string;
    fromEmail: string;
}

interface Lead {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    status: string;
    timezone?: string;
    scheduledTime?: string;
    sendingAccountId?: string;
    customSubject?: string;
    customBody?: string;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
    leads?: Lead[];
    sequence?: {
        steps?: Array<{
            subject?: string;
            body?: string;
            variants?: Array<{ subject?: string; body?: string }>;
        }>;
    };
}

interface GroupedEmails {
    account: SmtpAccount;
    campaigns: Array<{
        campaign: Campaign;
        leads: Lead[];
    }>;
    totalEmails: number;
}

export default function SendingAccountsView() {
    const { theme } = useTheme();
    const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<SmtpAccount | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editableSubject, setEditableSubject] = useState('');
    const [editableBody, setEditableBody] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch SMTP accounts
            const smtpRes = await fetch('/api/bulk-email/smtp-accounts', { headers });
            if (smtpRes.ok) {
                const data = await smtpRes.json();
                setSmtpAccounts(data);
                if (data.length > 0 && !selectedAccount) {
                    setSelectedAccount(data[0]);
                }
            }

            // Fetch all campaigns with their leads
            const campaignsRes = await fetch('/api/bulk-email/campaigns', { headers });
            if (campaignsRes.ok) {
                const campaignList = await campaignsRes.json();
                // Fetch detailed info for each campaign
                const detailedCampaigns = await Promise.all(
                    campaignList.map(async (c: Campaign) => {
                        try {
                            const detailRes = await fetch(`/api/bulk-email/campaigns/${c.id}`, { headers });
                            if (detailRes.ok) {
                                return await detailRes.json();
                            }
                        } catch { }
                        return c;
                    })
                );
                setCampaigns(detailedCampaigns);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedAccount]);

    useEffect(() => {
        fetchData();
    }, []);

    // Group pending emails by sending account
    const groupedEmails: GroupedEmails[] = smtpAccounts.map(account => {
        const campaignsWithLeads = campaigns
            .map(campaign => {
                const leads = (campaign.leads || []).filter(lead => {
                    if (lead.status !== 'pending') return false;
                    // Check if this lead is assigned to this account
                    const assignedAccountId = lead.sendingAccountId || smtpAccounts[0]?.id;
                    return assignedAccountId === account.id;
                });
                return { campaign, leads };
            })
            .filter(c => c.leads.length > 0);

        return {
            account,
            campaigns: campaignsWithLeads,
            totalEmails: campaignsWithLeads.reduce((sum, c) => sum + c.leads.length, 0)
        };
    }).filter(g => g.totalEmails > 0);

    // Auto-distribute leads across accounts for display purposes
    const allPendingLeads = campaigns.flatMap((campaign, campIndex) =>
        (campaign.leads || [])
            .filter(lead => lead.status === 'pending')
            .map((lead, leadIndex) => ({
                ...lead,
                campaign,
                assignedAccountIndex: leadIndex % smtpAccounts.length
            }))
    );

    const getAccountScheduledEmails = (account: SmtpAccount) => {
        const accountIndex = smtpAccounts.findIndex(a => a.id === account.id);
        return allPendingLeads.filter(lead =>
            (lead.sendingAccountId === account.id) ||
            (!lead.sendingAccountId && lead.assignedAccountIndex === accountIndex)
        );
    };

    // Personalize email content
    const personalizeContent = (content: string, lead: Lead): string => {
        if (!content) return '';
        let personalized = content;
        personalized = personalized.replace(/\{\{firstName\}\}/gi, lead.firstName || '');
        personalized = personalized.replace(/\{\{lastName\}\}/gi, lead.lastName || '');
        personalized = personalized.replace(/\{\{email\}\}/gi, lead.email || '');
        personalized = personalized.replace(/\{\{company\}\}/gi, lead.company || '');
        personalized = personalized.replace(/\{\{name\}\}/gi,
            lead.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : lead.email.split('@')[0]
        );
        return personalized;
    };

    // Open email preview
    const openEmailPreview = (lead: Lead & { campaign: Campaign }) => {
        setSelectedLead(lead);
        setSelectedCampaign(lead.campaign);

        const step = lead.campaign.sequence?.steps?.[0];
        if (step) {
            const variant = step.variants?.[0] || step;
            const subject = lead.customSubject || personalizeContent(variant.subject || step.subject || '', lead);
            const body = lead.customBody || personalizeContent(variant.body || step.body || '', lead);
            setEditableSubject(subject);
            setEditableBody(body);
        } else {
            setEditableSubject('');
            setEditableBody('');
        }

        setIsEditMode(false);
        setShowEmailPreview(true);
    };

    // Save custom email
    const saveCustomEmail = async () => {
        if (!selectedLead || !selectedCampaign) return;
        setSavingEmail(true);

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const campaignLeads = selectedCampaign.leads || [];
            const updatedLeads = campaignLeads.map(l => {
                if (l.id === selectedLead.id) {
                    return {
                        ...l,
                        customSubject: editableSubject,
                        customBody: editableBody
                    };
                }
                return l;
            });

            await fetch(`/api/bulk-email/campaigns/${selectedCampaign.id}/leads`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ leads: updatedLeads })
            });

            setIsEditMode(false);
            setShowEmailPreview(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save custom email:', err);
        } finally {
            setSavingEmail(false);
        }
    };

    // Format time for display
    const formatScheduledTime = (index: number): string => {
        if (index === 0) return 'Now';
        const minutes = index * 10;
        if (minutes < 60) return `+${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        if (remainingMins === 0) return `+${hours}h`;
        return `+${hours}h ${remainingMins}m`;
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className={cn(
                        "w-8 h-8 animate-spin mx-auto mb-4",
                        theme === 'dark' ? 'text-[var(--terracotta)]' : 'text-blue-600'
                    )} />
                    <p className={cn(
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>Loading sending accounts...</p>
                </div>
            </div>
        );
    }

    if (smtpAccounts.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Mail className={cn(
                        "w-16 h-16 mx-auto mb-4",
                        theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                    )} />
                    <h2 className={cn(
                        "text-xl font-semibold mb-2",
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>No Email Accounts</h2>
                    <p className={cn(
                        "text-sm mb-6",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>Add your first email account to start sending campaigns.</p>
                </div>
            </div>
        );
    }

    const totalPendingEmails = allPendingLeads.length;

    return (
        <div className="flex flex-1 min-h-0">
            {/* Accounts Sidebar */}
            <div className={cn(
                'w-72 flex-shrink-0 flex flex-col border-r',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-gray-50 border-gray-200'
            )}>
                {/* Header */}
                <div className={cn(
                    'p-4 border-b',
                    theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                )}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className={cn(
                            'text-lg font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Sending Accounts
                        </h2>
                        <button
                            onClick={fetchData}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                theme === 'dark'
                                    ? 'hover:bg-white/10 text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-500'
                            )}
                        >
                            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        </button>
                    </div>
                    {totalPendingEmails > 0 && (
                        <div className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg',
                            theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                        )}>
                            <Clock className={cn(
                                'w-4 h-4',
                                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            )} />
                            <span className={cn(
                                'text-sm font-medium',
                                theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                            )}>
                                {totalPendingEmails} emails scheduled
                            </span>
                        </div>
                    )}
                </div>

                {/* Accounts List */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {smtpAccounts.map(account => {
                            const accountEmails = getAccountScheduledEmails(account);
                            const isActive = selectedAccount?.id === account.id;

                            return (
                                <button
                                    key={account.id}
                                    onClick={() => setSelectedAccount(account)}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group',
                                        isActive
                                            ? theme === 'dark'
                                                ? 'bg-[var(--terracotta)]/10 border border-[var(--terracotta)]/30'
                                                : 'bg-blue-50 border border-blue-200'
                                            : theme === 'dark'
                                                ? 'hover:bg-white/5 border border-transparent'
                                                : 'hover:bg-gray-100 border border-transparent'
                                    )}
                                >
                                    <div className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                                        isActive
                                            ? theme === 'dark'
                                                ? 'bg-[var(--terracotta)] text-white'
                                                : 'bg-blue-600 text-white'
                                            : theme === 'dark'
                                                ? 'bg-gray-700 text-gray-300'
                                                : 'bg-gray-200 text-gray-600'
                                    )}>
                                        {account.fromEmail.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            'text-sm font-medium truncate',
                                            isActive
                                                ? theme === 'dark' ? 'text-[var(--terracotta)]' : 'text-blue-700'
                                                : theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {account.name || account.fromEmail.split('@')[0]}
                                        </p>
                                        <p className={cn(
                                            'text-xs truncate',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            {account.fromEmail}
                                        </p>
                                    </div>
                                    {accountEmails.length > 0 && (
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-xs font-semibold',
                                            isActive
                                                ? theme === 'dark'
                                                    ? 'bg-[var(--terracotta)] text-white'
                                                    : 'bg-blue-600 text-white'
                                                : theme === 'dark'
                                                    ? 'bg-gray-700 text-gray-300'
                                                    : 'bg-gray-200 text-gray-600'
                                        )}>
                                            {accountEmails.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content - Scheduled Emails */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedAccount ? (
                    <>
                        {/* Account Header */}
                        <div className={cn(
                            'px-6 py-4 border-b flex items-center justify-between',
                            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
                                    theme === 'dark'
                                        ? 'bg-[var(--terracotta)] text-white'
                                        : 'bg-blue-600 text-white'
                                )}>
                                    {selectedAccount.fromEmail.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className={cn(
                                        'text-xl font-semibold',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {selectedAccount.name || selectedAccount.fromEmail.split('@')[0]}
                                    </h1>
                                    <p className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    )}>
                                        {selectedAccount.fromEmail}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Scheduled Emails List */}
                        <ScrollArea className="flex-1">
                            <div className="p-6">
                                {(() => {
                                    const accountEmails = getAccountScheduledEmails(selectedAccount);

                                    if (accountEmails.length === 0) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-16">
                                                <div className={cn(
                                                    'w-20 h-20 rounded-full flex items-center justify-center mb-6',
                                                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                                                )}>
                                                    <Send className={cn(
                                                        'w-10 h-10',
                                                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                    )} />
                                                </div>
                                                <h2 className={cn(
                                                    'text-xl font-semibold mb-2',
                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                )}>
                                                    No Scheduled Emails
                                                </h2>
                                                <p className={cn(
                                                    'text-sm text-center max-w-sm',
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                )}>
                                                    There are no pending emails scheduled for this account.
                                                </p>
                                            </div>
                                        );
                                    }

                                    // Group by campaign
                                    const byCampaign = accountEmails.reduce((acc, lead) => {
                                        const cid = lead.campaign.id;
                                        if (!acc[cid]) {
                                            acc[cid] = { campaign: lead.campaign, leads: [] };
                                        }
                                        acc[cid].leads.push(lead);
                                        return acc;
                                    }, {} as Record<string, { campaign: Campaign; leads: typeof accountEmails }>);

                                    return (
                                        <div className="space-y-6">
                                            {Object.values(byCampaign).map(({ campaign, leads }) => (
                                                <div
                                                    key={campaign.id}
                                                    className={cn(
                                                        'rounded-xl border overflow-hidden',
                                                        theme === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-200 bg-white'
                                                    )}
                                                >
                                                    {/* Campaign Header */}
                                                    <div className={cn(
                                                        'px-4 py-3 border-b flex items-center justify-between',
                                                        theme === 'dark' ? 'border-gray-800 bg-gradient-to-r from-[var(--terracotta)]/10 to-transparent' : 'border-gray-100 bg-gradient-to-r from-blue-50 to-transparent'
                                                    )}>
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className={cn(
                                                                'w-4 h-4',
                                                                theme === 'dark' ? 'text-[var(--terracotta)]' : 'text-blue-600'
                                                            )} />
                                                            <div>
                                                                <p className={cn(
                                                                    'text-sm font-medium',
                                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                                )}>
                                                                    {campaign.name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={cn(
                                                            'px-2 py-1 rounded-lg text-xs font-semibold',
                                                            theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                                                        )}>
                                                            {leads.length} {leads.length === 1 ? 'email' : 'emails'}
                                                        </span>
                                                    </div>

                                                    {/* Leads List */}
                                                    <div className="divide-y divide-gray-800">
                                                        {leads.map((lead, idx) => (
                                                            <div
                                                                key={lead.id}
                                                                onClick={() => openEmailPreview(lead)}
                                                                className={cn(
                                                                    'px-4 py-3 flex items-center justify-between cursor-pointer group transition-all',
                                                                    theme === 'dark' ? 'hover:bg-[var(--terracotta)]/5' : 'hover:bg-blue-50'
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                    <span className={cn(
                                                                        'text-xs font-mono w-6 flex-shrink-0',
                                                                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                                    )}>
                                                                        {idx + 1}
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={cn(
                                                                            'text-sm font-medium truncate',
                                                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                                        )}>
                                                                            {lead.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : lead.email.split('@')[0]}
                                                                        </p>
                                                                        <p className={cn(
                                                                            'text-xs truncate',
                                                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                                        )}>
                                                                            {lead.email}
                                                                        </p>
                                                                    </div>
                                                                    {lead.company && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Building className={cn(
                                                                                'w-3 h-3',
                                                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                                            )} />
                                                                            <span className={cn(
                                                                                'text-xs',
                                                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                                            )}>
                                                                                {lead.company}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className={cn(
                                                                            'text-xs font-medium',
                                                                            idx === 0
                                                                                ? 'text-emerald-500'
                                                                                : theme === 'dark' ? 'text-[var(--terracotta)]' : 'text-blue-600'
                                                                        )}>
                                                                            {idx === 0 ? '🚀 Now' : formatScheduledTime(idx)}
                                                                        </span>
                                                                        {lead.timezone && (
                                                                            <span className={cn(
                                                                                'text-xs',
                                                                                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                                            )}>
                                                                                {lead.timezone.split('/').pop()?.replace('_', ' ')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Eye className={cn(
                                                                            'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
                                                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                                        )} />
                                                                        <Edit3 className={cn(
                                                                            'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
                                                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                                        )} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Footer Note */}
                                            <div className={cn(
                                                'px-4 py-3 rounded-lg flex items-start gap-3',
                                                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                                            )}>
                                                <AlertCircle className={cn(
                                                    'w-4 h-4 mt-0.5 flex-shrink-0',
                                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                )} />
                                                <p className={cn(
                                                    'text-xs',
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                )}>
                                                    First email sends instantly, then every 10 minutes. Emails are distributed across accounts for better deliverability. Click on any email to preview or edit before sending.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                            Select an account to view scheduled emails
                        </p>
                    </div>
                )}
            </div>

            {/* Email Preview Modal */}
            <AnimatePresence>
                {showEmailPreview && selectedLead && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowEmailPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className={cn(
                                'w-full max-w-2xl rounded-2xl border shadow-2xl max-h-[90vh] overflow-hidden flex flex-col',
                                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                            )}
                        >
                            {/* Modal Header */}
                            <div className={cn(
                                'px-6 py-4 border-b flex items-center justify-between',
                                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                            )}>
                                <div>
                                    <h2 className={cn(
                                        'text-lg font-semibold',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {isEditMode ? 'Edit Email' : 'Email Preview'}
                                    </h2>
                                    <p className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    )}>
                                        To: {selectedLead.firstName ? `${selectedLead.firstName} ${selectedLead.lastName || ''}`.trim() : selectedLead.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isEditMode ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditMode(true)}
                                            className="gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsEditMode(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={saveCustomEmail}
                                                disabled={savingEmail}
                                                className={cn(
                                                    'gap-2',
                                                    theme === 'dark'
                                                        ? 'bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)]'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                )}
                                            >
                                                {savingEmail ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                                Save
                                            </Button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowEmailPreview(false)}
                                        className={cn(
                                            'p-2 rounded-lg transition-colors',
                                            theme === 'dark'
                                                ? 'hover:bg-white/10 text-gray-400'
                                                : 'hover:bg-gray-100 text-gray-500'
                                        )}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Email Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Subject */}
                                <div>
                                    <label className={cn(
                                        'block text-sm font-medium mb-2',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        Subject
                                    </label>
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            value={editableSubject}
                                            onChange={e => setEditableSubject(e.target.value)}
                                            className={cn(
                                                'w-full px-4 py-3 rounded-lg border text-sm',
                                                theme === 'dark'
                                                    ? 'bg-[#252525] border-gray-700 text-white'
                                                    : 'bg-white border-gray-200 text-gray-900'
                                            )}
                                        />
                                    ) : (
                                        <div className={cn(
                                            'px-4 py-3 rounded-lg',
                                            theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-50'
                                        )}>
                                            <p className={cn(
                                                'text-sm',
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            )}>
                                                {editableSubject || '(No subject)'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div>
                                    <label className={cn(
                                        'block text-sm font-medium mb-2',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        Body
                                    </label>
                                    {isEditMode ? (
                                        <textarea
                                            value={editableBody}
                                            onChange={e => setEditableBody(e.target.value)}
                                            rows={12}
                                            className={cn(
                                                'w-full px-4 py-3 rounded-lg border text-sm resize-none',
                                                theme === 'dark'
                                                    ? 'bg-[#252525] border-gray-700 text-white'
                                                    : 'bg-white border-gray-200 text-gray-900'
                                            )}
                                        />
                                    ) : (
                                        <div className={cn(
                                            'px-4 py-4 rounded-lg min-h-[200px]',
                                            theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-50'
                                        )}>
                                            <div
                                                className={cn(
                                                    'text-sm prose max-w-none',
                                                    theme === 'dark' ? 'prose-invert text-gray-300' : 'text-gray-700'
                                                )}
                                                dangerouslySetInnerHTML={{ __html: editableBody.replace(/\n/g, '<br>') || '(No content)' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
