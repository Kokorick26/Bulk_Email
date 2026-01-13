import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Send, CheckCircle, Clock, XCircle, MessageSquare, Eye,
    RefreshCw, Mail, Calendar, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import { ScrollArea } from '../../ui/ScrollArea';

interface EmailLog {
    id: string;
    email: string;
    recipientName?: string;
    status: string;
    sentAt: string;
    stepIndex?: number;
    subject?: string;
    fromEmail?: string;
}

interface Lead {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: string;
}

interface StatusTabProps {
    campaignId: string;
    className?: string;
}

export function StatusTab({ campaignId, className }: StatusTabProps) {
    const { theme } = useTheme();
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

    // Stats
    const [stats, setStats] = useState({
        totalEmails: 0,
        sent: 0,
        opened: 0,
        replied: 0,
        failed: 0
    });

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const logs = data.logs || [];
                const campaignLeads = data.leads || [];

                // Sort logs by sentAt descending (most recent first)
                const sortedLogs = logs.sort((a: EmailLog, b: EmailLog) =>
                    new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
                );

                setEmailLogs(sortedLogs);
                setLeads(campaignLeads);

                // Calculate stats
                const totalEmails = logs.length;
                const sent = logs.filter((l: EmailLog) => l.status === 'sent').length;
                const opened = campaignLeads.filter((l: Lead) => l.status === 'opened').length;
                const replied = campaignLeads.filter((l: Lead) => l.status === 'replied').length;
                const failed = logs.filter((l: EmailLog) => l.status === 'failed').length;

                setStats({ totalEmails, sent, opened, replied, failed });

                // Expand all dates by default
                const dates = new Set<string>();
                logs.forEach((log: EmailLog) => {
                    dates.add(new Date(log.sentAt).toDateString());
                });
                setExpandedDates(dates);
            }
        } catch (err) {
            console.error('Failed to fetch campaign data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [campaignId]);

    // Get lead name by email
    const getLeadName = (email: string): string => {
        const lead = leads.find(l => l.email.toLowerCase() === email.toLowerCase());
        if (lead?.firstName) {
            return `${lead.firstName} ${lead.lastName || ''}`.trim();
        }
        return '';
    };

    // Get lead status (for replied/opened which is tracked on lead, not log)
    const getLeadStatus = (email: string): string | null => {
        const lead = leads.find(l => l.email.toLowerCase() === email.toLowerCase());
        if (lead?.status === 'replied' || lead?.status === 'opened') {
            return lead.status;
        }
        return null;
    };

    // Group logs by date
    const groupLogsByDate = (logs: EmailLog[]): Map<string, EmailLog[]> => {
        const grouped = new Map<string, EmailLog[]>();

        logs.forEach(log => {
            const date = new Date(log.sentAt).toDateString();
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date)!.push(log);
        });

        return grouped;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(Date.now() - 86400000);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string): string => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'sent': return { bg: 'bg-emerald-500', lightBg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: Send, label: 'Sent' };
            case 'opened': return { bg: 'bg-blue-500', lightBg: 'bg-blue-500/10', text: 'text-blue-500', icon: Eye, label: 'Opened' };
            case 'clicked': return { bg: 'bg-purple-500', lightBg: 'bg-purple-500/10', text: 'text-purple-500', icon: CheckCircle, label: 'Clicked' };
            case 'replied': return { bg: 'bg-amber-500', lightBg: 'bg-amber-500/10', text: 'text-amber-500', icon: MessageSquare, label: 'Replied' };
            case 'failed': return { bg: 'bg-red-500', lightBg: 'bg-red-500/10', text: 'text-red-500', icon: XCircle, label: 'Failed' };
            default: return { bg: 'bg-gray-500', lightBg: 'bg-gray-500/10', text: 'text-gray-500', icon: Clock, label: status };
        }
    };

    const toggleDate = (date: string) => {
        setExpandedDates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(date)) {
                newSet.delete(date);
            } else {
                newSet.add(date);
            }
            return newSet;
        });
    };

    // Filter logs
    const filteredLogs = statusFilter === 'all'
        ? emailLogs
        : emailLogs.filter(log => {
            if (statusFilter === 'replied' || statusFilter === 'opened') {
                const leadStatus = getLeadStatus(log.email);
                return leadStatus === statusFilter;
            }
            return log.status === statusFilter;
        });

    const groupedLogs = groupLogsByDate(filteredLogs);

    if (loading) {
        return (
            <div className={cn('flex-1 flex items-center justify-center', className)}>
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col h-full overflow-hidden', className)}>
            {/* Sticky Header Section */}
            <div className={cn(
                'flex-shrink-0 border-b',
                theme === 'dark' ? 'bg-[#0d0d0d] border-neutral-800' : 'bg-white border-gray-200'
            )}>
                {/* Header Row */}
                <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-4">
                        <h2 className={cn(
                            'text-sm font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Email Activity
                        </h2>

                        {/* Inline Stats */}
                        <div className="flex items-center gap-3">
                            {[
                                { value: stats.totalEmails, label: 'Total', color: 'text-blue-500' },
                                { value: stats.sent, label: 'Sent', color: 'text-emerald-500' },
                                { value: stats.opened, label: 'Opened', color: 'text-cyan-500' },
                                { value: stats.replied, label: 'Replied', color: 'text-amber-500' },
                                { value: stats.failed, label: 'Failed', color: 'text-red-500' }
                            ].map((stat) => (
                                <div key={stat.label} className="flex items-center gap-1">
                                    <span className={cn('text-sm font-bold', stat.color)}>
                                        {stat.value}
                                    </span>
                                    <span className={cn(
                                        'text-[10px]',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={() => { setLoading(true); fetchData(); }}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                    </Button>
                </div>

                {/* Filter Pills */}
                <div className={cn(
                    'flex items-center gap-1.5 px-4 py-2 border-t',
                    theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800/50' : 'bg-gray-50 border-gray-100'
                )}>
                    {['all', 'sent', 'opened', 'replied', 'failed'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={cn(
                                'px-2.5 py-1 text-[11px] font-medium rounded transition-colors capitalize',
                                statusFilter === filter
                                    ? 'bg-orange-500 text-white'
                                    : theme === 'dark'
                                        ? 'bg-neutral-800 text-gray-400 hover:bg-neutral-700 hover:text-gray-300'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Email Timeline */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {groupedLogs.size === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Mail className={cn('w-10 h-10 mb-3', theme === 'dark' ? 'text-neutral-700' : 'text-gray-300')} />
                            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                {statusFilter !== 'all' ? `No ${statusFilter} emails` : 'No emails sent yet'}
                            </p>
                        </div>
                    ) : (
                        Array.from(groupedLogs.entries()).map(([date, logs]) => {
                            const isExpanded = expandedDates.has(date);

                            return (
                                <div key={date} className={cn(
                                    'rounded-lg overflow-hidden border',
                                    theme === 'dark' ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-gray-200'
                                )}>
                                    {/* Date Header */}
                                    <button
                                        onClick={() => toggleDate(date)}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2.5 transition-colors',
                                            theme === 'dark'
                                                ? 'hover:bg-neutral-800'
                                                : 'hover:bg-gray-50'
                                        )}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                        )}
                                        <Calendar className={cn('w-3.5 h-3.5', theme === 'dark' ? 'text-orange-500' : 'text-orange-600')} />
                                        <span className={cn(
                                            'text-xs font-semibold',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {formatDate(date)}
                                        </span>
                                        <span className={cn(
                                            'text-[10px] px-1.5 py-0.5 rounded-full ml-auto',
                                            theme === 'dark' ? 'bg-neutral-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                                        )}>
                                            {logs.length}
                                        </span>
                                    </button>

                                    {/* Email List */}
                                    {isExpanded && (
                                        <div className={cn(
                                            'border-t',
                                            theme === 'dark' ? 'border-neutral-800' : 'border-gray-100'
                                        )}>
                                            {logs.map((log, idx) => {
                                                const leadName = getLeadName(log.email);
                                                const leadStatus = getLeadStatus(log.email);
                                                const displayStatus = leadStatus || log.status;
                                                const statusConfig = getStatusConfig(displayStatus);
                                                const StatusIcon = statusConfig.icon;
                                                const isLast = idx === logs.length - 1;

                                                return (
                                                    <motion.div
                                                        key={log.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: idx * 0.02 }}
                                                        className={cn(
                                                            'flex items-start gap-3 px-3 py-2.5 transition-colors',
                                                            !isLast && (theme === 'dark' ? 'border-b border-neutral-800/50' : 'border-b border-gray-50'),
                                                            theme === 'dark' ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'
                                                        )}
                                                    >
                                                        {/* Status Icon */}
                                                        <div className={cn(
                                                            'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                                            statusConfig.bg
                                                        )}>
                                                            <StatusIcon className="w-3.5 h-3.5 text-white" />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Top row: Name/Email + Time */}
                                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className={cn(
                                                                        'text-sm font-medium truncate',
                                                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                                    )}>
                                                                        {leadName || log.email.split('@')[0]}
                                                                    </span>
                                                                    <span className={cn(
                                                                        'text-xs truncate hidden sm:block',
                                                                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                                    )}>
                                                                        {log.email}
                                                                    </span>
                                                                </div>
                                                                <span className={cn(
                                                                    'text-[10px] font-medium flex-shrink-0',
                                                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                                )}>
                                                                    {formatTime(log.sentAt)}
                                                                </span>
                                                            </div>

                                                            {/* Subject */}
                                                            {log.subject && (
                                                                <p className={cn(
                                                                    'text-xs truncate mb-1',
                                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                                )}>
                                                                    {log.subject}
                                                                </p>
                                                            )}

                                                            {/* Bottom row: Step + Status */}
                                                            <div className="flex items-center gap-2">
                                                                {log.stepIndex !== undefined && (
                                                                    <span className={cn(
                                                                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                                                        theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                                                                    )}>
                                                                        Step {log.stepIndex + 1}
                                                                    </span>
                                                                )}
                                                                <span className={cn(
                                                                    'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase',
                                                                    statusConfig.lightBg, statusConfig.text
                                                                )}>
                                                                    {statusConfig.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
