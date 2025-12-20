import { motion } from 'framer-motion';
import {
    Send, Eye, MousePointer, MessageSquareReply, Ban,
    TrendingUp, Users, CheckCircle, XCircle, Clock
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
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string | number;
    subtext?: string;
    theme: 'dark' | 'light';
}

function StatCard({ icon, iconBg, label, value, subtext, theme }: StatCardProps) {
    return (
        <div className={cn(
            'p-5 rounded-xl border',
            theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
        )}>
            <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
                    {icon}
                </div>
                <span className={cn(
                    'text-sm font-medium',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                    {label}
                </span>
            </div>
            <div className={cn(
                'text-3xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
                {value}
            </div>
            {subtext && (
                <p className={cn(
                    'text-sm mt-1',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                    {subtext}
                </p>
            )}
        </div>
    );
}

export function AnalyticsTab({ campaign, leads, className }: AnalyticsTabProps) {
    const { theme } = useTheme();

    // Calculate statistics
    const sentCount = campaign.sentCount || 0;
    const openCount = campaign.openCount || 0;
    const clickCount = campaign.clickCount || 0;
    const replyCount = campaign.replyCount || 0;
    const bounceCount = campaign.bounceCount || 0;
    const totalRecipients = campaign.totalRecipients || 0;

    const openRate = sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : '0';
    const clickRate = sentCount > 0 ? ((clickCount / sentCount) * 100).toFixed(1) : '0';
    const replyRate = sentCount > 0 ? ((replyCount / sentCount) * 100).toFixed(1) : '0';
    const bounceRate = sentCount > 0 ? ((bounceCount / sentCount) * 100).toFixed(1) : '0';

    const stats = [
        {
            icon: <Send className="w-5 h-5 text-blue-400" />,
            iconBg: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100',
            label: 'Sent',
            value: sentCount,
            subtext: `of ${totalRecipients} recipients`
        },
        {
            icon: <Eye className="w-5 h-5 text-emerald-400" />,
            iconBg: theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100',
            label: 'Opens',
            value: openCount,
            subtext: `${openRate}% open rate`
        },
        {
            icon: <MousePointer className="w-5 h-5 text-purple-400" />,
            iconBg: theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100',
            label: 'Clicks',
            value: clickCount,
            subtext: `${clickRate}% click rate`
        },
        {
            icon: <MessageSquareReply className="w-5 h-5 text-amber-400" />,
            iconBg: theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100',
            label: 'Replies',
            value: replyCount,
            subtext: `${replyRate}% reply rate`
        }
    ];

    return (
        <div className={cn('space-y-6', className)}>
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <StatCard {...stat} theme={theme} />
                    </motion.div>
                ))}
            </div>

            {/* Progress Overview */}
            <div className={cn(
                'p-6 rounded-xl border',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
            )}>
                <h3 className={cn(
                    'text-lg font-semibold mb-4',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                    Campaign Progress
                </h3>

                <div className="space-y-4">
                    {/* Overall Progress */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                                'text-sm font-medium',
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                                Emails Sent
                            </span>
                            <span className={cn(
                                'text-sm',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            )}>
                                {sentCount} / {totalRecipients}
                            </span>
                        </div>
                        <Progress
                            value={totalRecipients > 0 ? (sentCount / totalRecipients) * 100 : 0}
                            className="h-2"
                        />
                    </div>

                    {/* Status Breakdown */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        <div className={cn(
                            'p-4 rounded-lg',
                            theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-50'
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Delivered
                                </span>
                            </div>
                            <span className={cn(
                                'text-xl font-bold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                {sentCount - bounceCount}
                            </span>
                        </div>

                        <div className={cn(
                            'p-4 rounded-lg',
                            theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-50'
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Bounced
                                </span>
                            </div>
                            <span className={cn(
                                'text-xl font-bold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                {bounceCount}
                            </span>
                        </div>

                        <div className={cn(
                            'p-4 rounded-lg',
                            theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-50'
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Pending
                                </span>
                            </div>
                            <span className={cn(
                                'text-xl font-bold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                {totalRecipients - sentCount}
                            </span>
                        </div>

                        <div className={cn(
                            'p-4 rounded-lg',
                            theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-50'
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-amber-400" />
                                <span className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Opportunities
                                </span>
                            </div>
                            <span className={cn(
                                'text-xl font-bold text-emerald-400'
                            )}>
                                {replyCount + clickCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {totalRecipients === 0 && (
                <div className={cn(
                    'flex flex-col items-center justify-center py-16 rounded-xl border',
                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                )}>
                    <div className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                    )}>
                        <TrendingUp className={cn(
                            'w-8 h-8',
                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        )} />
                    </div>
                    <p className={cn(
                        'text-lg font-medium mb-1',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                        No data yet
                    </p>
                    <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    )}>
                        Add leads and start your campaign to see analytics
                    </p>
                </div>
            )}
        </div>
    );
}
