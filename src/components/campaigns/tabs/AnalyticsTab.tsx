import { motion } from 'framer-motion';
import {
    Send, Eye, MousePointer, MessageSquareReply, Ban,
    TrendingUp, Users, CheckCircle, XCircle, Clock, Activity, BarChart3
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Progress } from '../../ui/Progress';
import type { Campaign, Lead } from '../types';

interface AnalyticsTabProps {
    campaign: Campaign;
    leads: Lead[];
    className?: string;
}

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon: any;
    color: string;
    theme: string;
    trend?: string;
}

const StatBlock = ({ label, value, subValue, icon: Icon, color, theme, trend }: StatCardProps) => (
    <div className={cn(
        'relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 group',
        theme === 'dark'
            ? 'bg-[#12151a] border-[#252a33] hover:border-[#d97757]/30'
            : 'bg-white border-gray-100 hover:border-blue-200 shadow-lg hover:shadow-xl'
    )}>
        {/* Background Gradient/Glow */}
        <div className={cn(
            'absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity duration-500 group-hover:opacity-20',
            color === 'terracotta' ? 'bg-[#d97757]' :
                color === 'blue' ? 'bg-blue-500' :
                    color === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'
        )} />

        <div className="relative flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-4">
                <div className={cn(
                    'p-3 rounded-2xl',
                    theme === 'dark' ? 'bg-[#1a1e25]' : 'bg-gray-50',
                    color === 'terracotta' && theme === 'dark' && 'text-[#d97757]',
                    color === 'blue' && theme === 'dark' && 'text-blue-400',
                    color === 'emerald' && theme === 'dark' && 'text-emerald-400',
                    color === 'purple' && theme === 'dark' && 'text-purple-400',
                )}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className={cn(
                        'text-xs font-bold px-2 py-1 rounded-full',
                        theme === 'dark' ? 'bg-[#252a33] text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    )}>
                        {trend}
                    </span>
                )}
            </div>

            <div>
                <p className={cn(
                    'text-xs font-bold uppercase tracking-widest mb-1 opacity-60',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                    {label}
                </p>
                <h3 className={cn(
                    'text-4xl font-[Syne] font-bold tracking-tight',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                    {value}
                </h3>
                {subValue && (
                    <p className={cn(
                        'text-xs mt-2 font-mono opacity-80',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>
                        {subValue}
                    </p>
                )}
            </div>
        </div>
    </div>
);

export function AnalyticsTab({ campaign, leads, className }: AnalyticsTabProps) {
    const { theme } = useTheme();

    const sentCount = leads.filter(l => l.status === 'sent' || l.status === 'opened' || l.status === 'clicked' || l.status === 'replied').length;
    const openCount = leads.filter(l => l.status === 'opened' || l.status === 'clicked' || l.status === 'replied').length;
    const clickCount = leads.filter(l => l.status === 'clicked' || l.status === 'replied').length;
    const replyCount = leads.filter(l => l.status === 'replied').length;
    const bounceCount = leads.filter(l => l.status === 'bounced').length;
    const totalLeads = leads.length;

    const openRate = sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : '0.0';
    const clickRate = openCount > 0 ? ((clickCount / openCount) * 100).toFixed(1) : '0.0';
    const replyRate = sentCount > 0 ? ((replyCount / sentCount) * 100).toFixed(1) : '0.0';

    return (
        <div className={cn(
            'max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700',
            className
        )}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-2">
                <div className="space-y-2">
                    <h2 className={cn(
                        'text-3xl md:text-4xl font-[Syne] font-bold tracking-tight',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Campaign <span className="text-[#d97757]">Performance</span>
                    </h2>
                    <p className={cn(
                        'text-sm font-light',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                        Real-time metrics on engagement and delivery.
                    </p>
                </div>
                <div className={cn(
                    'px-4 py-2 rounded-xl border flex items-center gap-2',
                    theme === 'dark' ? 'bg-[#1a1e25] border-[#252a33]' : 'bg-white border-gray-200'
                )}>
                    <Activity className={cn('w-4 h-4', theme === 'dark' ? 'text-[#d97757]' : 'text-blue-600')} />
                    <span className={cn('text-xs font-mono', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
                        Last updated: Just now
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBlock
                    label="Sent Emails"
                    value={sentCount}
                    subValue={`${((sentCount / (totalLeads || 1)) * 100).toFixed(0)}% of total leads`}
                    icon={Send}
                    color="terracotta"
                    theme={theme}
                />
                <StatBlock
                    label="Open Rate"
                    value={`${openRate}%`}
                    subValue={`${openCount} unique opens`}
                    icon={Eye}
                    color="blue"
                    theme={theme}
                />
                <StatBlock
                    label="Click Rate"
                    value={`${clickRate}%`}
                    subValue={`${clickCount} unique clicks`}
                    icon={MousePointer}
                    color="purple"
                    theme={theme}
                />
                <StatBlock
                    label="Reply Rate"
                    value={`${replyRate}%`}
                    subValue={`${replyCount} replies received`}
                    icon={MessageSquareReply}
                    color="emerald"
                    theme={theme}
                    trend={parseFloat(replyRate) > 5 ? '+2.4%' : undefined}
                />
            </div>

            {/* Detailed Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Progress Circle or Big Chart Area */}
                <div className={cn(
                    'lg:col-span-2 p-8 rounded-3xl border overflow-hidden relative',
                    theme === 'dark' ? 'bg-[#12151a] border-[#252a33]' : 'bg-white border-gray-100 shadow-xl'
                )}>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-[Syne] text-xl font-bold">Campaign Progress</h3>
                        <BarChart3 className={cn('w-5 h-5 opacity-50')} />
                    </div>

                    {/* Custom Progress Visualization */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Overall Completion</span>
                                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{sentCount} / {totalLeads}</span>
                            </div>
                            <div className="h-4 rounded-full bg-gray-100 dark:bg-[#1a1e25] overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(sentCount / (totalLeads || 1)) * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[#d97757] to-[#c46144]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className={cn(
                                'p-4 rounded-2xl text-center',
                                theme === 'dark' ? 'bg-[#1a1e25]' : 'bg-gray-50'
                            )}>
                                <div className="text-2xl font-[Syne] font-bold text-emerald-500">{sentCount}</div>
                                <div className="text-xs uppercase tracking-wider opacity-60 mt-1">Succeeded</div>
                            </div>
                            <div className={cn(
                                'p-4 rounded-2xl text-center',
                                theme === 'dark' ? 'bg-[#1a1e25]' : 'bg-gray-50'
                            )}>
                                <div className="text-2xl font-[Syne] font-bold text-red-400">{bounceCount}</div>
                                <div className="text-xs uppercase tracking-wider opacity-60 mt-1">Bounced</div>
                            </div>
                            <div className={cn(
                                'p-4 rounded-2xl text-center',
                                theme === 'dark' ? 'bg-[#1a1e25]' : 'bg-gray-50'
                            )}>
                                <div className="text-2xl font-[Syne] font-bold text-blue-400">{totalLeads - sentCount - bounceCount}</div>
                                <div className="text-xs uppercase tracking-wider opacity-60 mt-1">Pending</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement Funnel */}
                <div className={cn(
                    'p-8 rounded-3xl border overflow-hidden relative',
                    theme === 'dark' ? 'bg-[#0a0c0f] border-[#252a33]' : 'bg-white border-gray-100 shadow-xl'
                )}>
                    <h3 className="font-[Syne] text-xl font-bold mb-6">Engagement Funnel</h3>
                    <div className="space-y-6 relative">
                        {/* Connecting Line */}
                        <div className={cn(
                            'absolute left-[15px] top-4 bottom-4 w-0.5 z-0',
                            theme === 'dark' ? 'bg-[#252a33]' : 'bg-gray-200'
                        )} />

                        <div className="relative z-10 flex items-center gap-4">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#12151a] dark:border-[#0a0c0f] bg-blue-500 text-white shadow')}>
                                <Send className="w-3 h-3" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Sent</p>
                                <p className="text-lg font-bold">{sentCount}</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#12151a] dark:border-[#0a0c0f] bg-purple-500 text-white shadow')}>
                                <Eye className="w-3 h-3" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Opened</p>
                                <p className="text-lg font-bold">{openCount}</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#12151a] dark:border-[#0a0c0f] bg-emerald-500 text-white shadow')}>
                                <MessageSquareReply className="w-3 h-3" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Replied</p>
                                <p className="text-lg font-bold">{replyCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
