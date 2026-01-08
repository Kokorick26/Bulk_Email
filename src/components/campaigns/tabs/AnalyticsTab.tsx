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
    leads?: Lead[];
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
        'relative overflow-hidden p-4 rounded border transition-all duration-300',
        theme === 'dark'
            ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
            : 'bg-white border-gray-200 hover:border-gray-300'
    )}>
        <div className="relative flex flex-col justify-between">
            <div className="flex items-start justify-between mb-3">
                <div className={cn(
                    'p-2 rounded',
                    theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-50',
                    color === 'terracotta' && theme === 'dark' && 'text-orange-500',
                    color === 'blue' && theme === 'dark' && 'text-blue-400',
                    color === 'emerald' && theme === 'dark' && 'text-emerald-400',
                    color === 'purple' && theme === 'dark' && 'text-purple-400',
                    color === 'terracotta' && theme !== 'dark' && 'text-orange-600',
                    color === 'blue' && theme !== 'dark' && 'text-blue-600',
                    color === 'emerald' && theme !== 'dark' && 'text-emerald-600',
                    color === 'purple' && theme !== 'dark' && 'text-purple-600',
                )}>
                    <Icon className="w-4 h-4" />
                </div>
                {trend && (
                    <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        theme === 'dark' ? 'bg-neutral-800 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    )}>
                        {trend}
                    </span>
                )}
            </div>

            <div>
                <p className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider mb-0.5',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                    {label}
                </p>
                <h3 className={cn(
                    'text-2xl font-bold',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                    {value}
                </h3>
                {subValue && (
                    <p className={cn(
                        'text-[10px] mt-1 font-mono',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
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

    // If leads are provided, calculate from leads. Otherwise use campaign stats.
    const hasLeads = leads !== undefined;

    const sentCount = hasLeads
        ? leads!.filter(l => l.status === 'sent' || l.status === 'opened' || l.status === 'clicked' || l.status === 'replied').length
        : campaign.sentCount || 0;

    const openCount = hasLeads
        ? leads!.filter(l => l.status === 'opened' || l.status === 'clicked' || l.status === 'replied').length
        : campaign.openCount || 0;

    const clickCount = hasLeads
        ? leads!.filter(l => l.status === 'clicked' || l.status === 'replied').length
        : campaign.clickCount || 0;

    const replyCount = hasLeads
        ? leads!.filter(l => l.status === 'replied').length
        : campaign.replyCount || 0;

    const bounceCount = hasLeads
        ? leads!.filter(l => l.status === 'bounced').length
        : campaign.bounceCount || 0;

    const totalLeads = hasLeads
        ? leads!.length
        : campaign.totalRecipients || 0;

    const openRate = sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : '0.0';
    const clickRate = openCount > 0 ? ((clickCount / openCount) * 100).toFixed(1) : '0.0';
    const replyRate = sentCount > 0 ? ((replyCount / sentCount) * 100).toFixed(1) : '0.0';

    return (
        <div className={cn('space-y-4', className)}>
            {/* Compact Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Analytics
                    </h2>
                    <div className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1',
                        theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                    )}>
                        <Activity className={cn('w-2.5 h-2.5', theme === 'dark' ? 'text-emerald-500' : 'text-emerald-600')} />
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                            Live
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Progress Circle or Big Chart Area */}
                <div className={cn(
                    'lg:col-span-2 p-4 rounded border overflow-hidden',
                    theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={cn(
                            'text-sm font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>Campaign Progress</h3>
                        <BarChart3 className={cn('w-4 h-4 opacity-50')} />
                    </div>

                    {/* Custom Progress Visualization */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Overall Completion</span>
                                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{sentCount} / {totalLeads}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(sentCount / (totalLeads || 1)) * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-orange-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className={cn(
                                'p-3 rounded text-center',
                                theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-50'
                            )}>
                                <div className="text-lg font-bold text-emerald-500">{sentCount}</div>
                                <div className="text-[10px] uppercase tracking-wider opacity-60">Succeeded</div>
                            </div>
                            <div className={cn(
                                'p-3 rounded text-center',
                                theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-50'
                            )}>
                                <div className="text-lg font-bold text-red-400">{bounceCount}</div>
                                <div className="text-[10px] uppercase tracking-wider opacity-60">Bounced</div>
                            </div>
                            <div className={cn(
                                'p-3 rounded text-center',
                                theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-50'
                            )}>
                                <div className="text-lg font-bold text-blue-400">{totalLeads - sentCount - bounceCount}</div>
                                <div className="text-[10px] uppercase tracking-wider opacity-60">Pending</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement Funnel */}
                <div className={cn(
                    'p-4 rounded border overflow-hidden',
                    theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                )}>
                    <h3 className={cn(
                        'text-sm font-semibold mb-4',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>Engagement Funnel</h3>
                    <div className="space-y-4 relative">
                        {/* Connecting Line */}
                        <div className={cn(
                            'absolute left-[13px] top-3 bottom-3 w-0.5 z-0',
                            theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-200'
                        )} />

                        <div className="relative z-10 flex items-center gap-3">
                            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center bg-blue-500 text-white')}>
                                <Send className="w-3 h-3" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Sent</p>
                                <p className="text-base font-bold">{sentCount}</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center gap-3">
                            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center bg-purple-500 text-white')}>
                                <Eye className="w-3 h-3" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Opened</p>
                                <p className="text-base font-bold">{openCount}</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center gap-3">
                            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center bg-emerald-500 text-white')}>
                                <MessageSquareReply className="w-3 h-3" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Replied</p>
                                <p className="text-base font-bold">{replyCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
