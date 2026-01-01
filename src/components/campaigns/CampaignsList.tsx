import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Search, MoreHorizontal, Play, Pause, Trash2, Copy,
    TrendingUp, Eye, Loader2, ChevronRight, Megaphone, Send,
    Clock, Users, MousePointer, ArrowUpRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { ScrollArea } from '../ui/ScrollArea';
import { Progress } from '../ui/Progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '../ui/DropdownMenu';
import type { Campaign, CampaignFilter } from './types';

interface CampaignsListProps {
    campaigns: Campaign[];
    loading?: boolean;
    onCreateNew: () => void;
    onViewCampaign: (id: string) => void;
    onDeleteCampaign: (id: string) => void;
    onDuplicateCampaign?: (id: string) => void;
    onPauseCampaign?: (id: string) => void;
    onResumeCampaign?: (id: string) => void;
    className?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-400' },
    paused: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-400' },
    completed: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-400' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-400' },
    scheduled: { bg: 'bg-purple-500/10', text: 'text-purple-500', dot: 'bg-purple-400' },
};

export function CampaignsList({
    campaigns,
    loading,
    onCreateNew,
    onViewCampaign,
    onDeleteCampaign,
    onDuplicateCampaign,
    onPauseCampaign,
    onResumeCampaign,
    className
}: CampaignsListProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = campaigns
        .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const selected = selectedId ? campaigns.find(c => c.id === selectedId) : filtered[0];

    useEffect(() => {
        if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
    }, [filtered, selectedId]);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        <div className={cn('flex flex-1 min-h-0', className)}>
            {/* ═══════════════════════════════════════════════════════════════════
                LEFT PANEL - Campaign List
                ═══════════════════════════════════════════════════════════════════ */}
            <div className={cn(
                'w-[320px] flex-shrink-0 flex flex-col border-r',
                isDark ? 'bg-[#0c0c0c] border-neutral-800' : 'bg-white border-gray-200'
            )}>
                {/* Header */}
                <div className={cn('p-4 border-b', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className={cn('text-[15px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                            Campaigns
                        </h2>
                        <button
                            onClick={onCreateNew}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:opacity-90 transition-opacity"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New
                        </button>
                    </div>
                    {/* Search */}
                    <div className={cn(
                        'flex items-center gap-2 h-9 px-3 rounded-lg',
                        isDark ? 'bg-white/[0.04]' : 'bg-gray-100'
                    )}>
                        <Search className={cn('w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'flex-1 bg-transparent border-0 outline-none text-[13px]',
                                isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                    </div>
                </div>

                {/* List */}
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className={cn('w-5 h-5 animate-spin', isDark ? 'text-gray-500' : 'text-gray-400')} />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <div className={cn(
                                    'w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center',
                                    isDark ? 'bg-white/[0.04]' : 'bg-gray-100'
                                )}>
                                    <Megaphone className={cn('w-6 h-6', isDark ? 'text-gray-500' : 'text-gray-400')} />
                                </div>
                                <p className={cn('text-[13px] font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                                    No campaigns yet
                                </p>
                                <p className={cn('text-[12px] mb-3', isDark ? 'text-gray-500' : 'text-gray-400')}>
                                    Start your first outreach
                                </p>
                                <button
                                    onClick={onCreateNew}
                                    className="text-[12px] text-orange-500 hover:underline font-medium"
                                >
                                    Create campaign →
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filtered.map(campaign => {
                                    const status = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;
                                    const isActive = selected?.id === campaign.id;
                                    const progress = campaign.totalRecipients > 0
                                        ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
                                        : 0;

                                    return (
                                        <button
                                            key={campaign.id}
                                            onClick={() => setSelectedId(campaign.id)}
                                            className={cn(
                                                'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all group',
                                                isActive
                                                    ? isDark ? 'bg-white/[0.08]' : 'bg-gray-100'
                                                    : isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                                isDark ? 'bg-white/[0.06]' : 'bg-gray-100'
                                            )}>
                                                <Megaphone className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={cn(
                                                        'text-[13px] font-medium truncate',
                                                        isDark ? 'text-white' : 'text-gray-900'
                                                    )}>
                                                        {campaign.name}
                                                    </p>
                                                    <span className={cn(
                                                        'w-1.5 h-1.5 rounded-full shrink-0',
                                                        status.dot,
                                                        campaign.status === 'active' && 'animate-pulse'
                                                    )} />
                                                </div>
                                                <div className={cn(
                                                    'flex items-center gap-2 mt-1 text-[11px]',
                                                    isDark ? 'text-gray-500' : 'text-gray-400'
                                                )}>
                                                    <span>{campaign.totalRecipients} leads</span>
                                                    {progress > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{progress}% sent</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className={cn(
                                                'w-4 h-4 shrink-0 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity',
                                                isDark ? 'text-gray-500' : 'text-gray-400'
                                            )} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                RIGHT PANEL - Campaign Details
                ═══════════════════════════════════════════════════════════════════ */}
            <div className={cn('flex-1 flex flex-col overflow-hidden', isDark ? 'bg-[#080808]' : 'bg-gray-50/50')}>
                {selected ? (
                    <>
                        {/* Header */}
                        <div className={cn(
                            'flex items-center justify-between px-6 py-4 border-b',
                            isDark ? 'bg-[#0c0c0c] border-neutral-800' : 'bg-white border-gray-200'
                        )}>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className={cn('text-[17px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                        {selected.name}
                                    </h1>
                                    <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                                        STATUS_STYLES[selected.status]?.bg,
                                        STATUS_STYLES[selected.status]?.text
                                    )}>
                                        <span className={cn('w-1 h-1 rounded-full', STATUS_STYLES[selected.status]?.dot)} />
                                        {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                                    </span>
                                </div>
                                <p className={cn('text-[12px] mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                                    Created {formatDate(selected.createdAt)} • {selected.totalRecipients} recipients
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selected.status === 'active' && onPauseCampaign && (
                                    <button
                                        onClick={() => onPauseCampaign(selected.id)}
                                        className={cn(
                                            'flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors',
                                            isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                        )}
                                    >
                                        <Pause className="w-3.5 h-3.5" />
                                        Pause
                                    </button>
                                )}
                                {selected.status === 'paused' && onResumeCampaign && (
                                    <button
                                        onClick={() => onResumeCampaign(selected.id)}
                                        className={cn(
                                            'flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors',
                                            isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                        )}
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        Resume
                                    </button>
                                )}
                                <button
                                    onClick={() => onViewCampaign(selected.id)}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:opacity-90 transition-opacity"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    View Details
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className={cn(
                                            'w-8 h-8 flex items-center justify-center rounded-lg border transition-colors',
                                            isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                        )}>
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className={cn('rounded-xl p-1 border', isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-gray-200')}>
                                        {onDuplicateCampaign && (
                                            <DropdownMenuItem onClick={() => onDuplicateCampaign(selected.id)} className={cn('rounded-lg text-[13px]', isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50')}>
                                                <Copy className="w-4 h-4 mr-2 opacity-50" />
                                                Duplicate
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator className={isDark ? 'bg-white/5' : 'bg-gray-100'} />
                                        <DropdownMenuItem onClick={() => onDeleteCampaign(selected.id)} className={cn('rounded-lg text-[13px]', isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50')}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="p-6">
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: 'Progress', value: `${selected.totalRecipients > 0 ? Math.round((selected.sentCount / selected.totalRecipients) * 100) : 0}%`, icon: TrendingUp },
                                    { label: 'Emails Sent', value: selected.sentCount.toLocaleString(), sub: `of ${selected.totalRecipients}`, icon: Send },
                                    { label: 'Replied', value: '0', sub: '0% reply rate', icon: ArrowUpRight },
                                    { label: 'Clicked', value: '0', sub: '0% click rate', icon: MousePointer },
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'p-4 rounded-xl border',
                                            isDark ? 'bg-[#0c0c0c] border-neutral-800' : 'bg-white border-gray-200'
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={cn(
                                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                                isDark ? 'bg-orange-500/10' : 'bg-orange-50'
                                            )}>
                                                <stat.icon className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <span className={cn('text-[12px] font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
                                                {stat.label}
                                            </span>
                                        </div>
                                        <p className={cn('text-2xl font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                            {stat.value}
                                        </p>
                                        {stat.sub && (
                                            <p className={cn('text-[11px] mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                                                {stat.sub}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Quick Overview */}
                            <div className={cn(
                                'mt-6 p-5 rounded-xl border',
                                isDark ? 'bg-[#0c0c0c] border-neutral-800' : 'bg-white border-gray-200'
                            )}>
                                <h3 className={cn('text-[13px] font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
                                    Quick Overview
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={cn('text-[12px]', isDark ? 'text-gray-400' : 'text-gray-500')}>Status</span>
                                        <span className={cn(
                                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                                            STATUS_STYLES[selected.status]?.bg,
                                            STATUS_STYLES[selected.status]?.text
                                        )}>
                                            {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={cn('text-[12px]', isDark ? 'text-gray-400' : 'text-gray-500')}>Total Recipients</span>
                                        <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                                            {selected.totalRecipients}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={cn('text-[12px]', isDark ? 'text-gray-400' : 'text-gray-500')}>Created</span>
                                        <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                                            {formatDate(selected.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onViewCampaign(selected.id)}
                                    className={cn(
                                        'w-full mt-5 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-medium transition-colors',
                                        isDark ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    )}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    View Full Campaign Details
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className={cn('text-[13px]', isDark ? 'text-gray-500' : 'text-gray-400')}>
                            Select a campaign to view details
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
