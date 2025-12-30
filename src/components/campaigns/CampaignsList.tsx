import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, ChevronDown, MoreHorizontal,
    Play, Pause, Trash2, Copy, BarChart2, Users, Send,
    CheckCircle, XCircle, Clock, TrendingUp, Eye, Mail, Loader2,
    ChevronRight, Megaphone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { ScrollArea } from '../ui/ScrollArea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '../ui/DropdownMenu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
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

const statusConfig: Record<string, { label: string; color: string; textColor: string; pulse?: boolean }> = {
    draft: { label: 'Draft', color: 'bg-gray-500', textColor: 'text-gray-400' },
    active: { label: 'Active', color: 'bg-emerald-500', textColor: 'text-emerald-400', pulse: true },
    paused: { label: 'Paused', color: 'bg-amber-500', textColor: 'text-amber-400' },
    completed: { label: 'Completed', color: 'bg-blue-500', textColor: 'text-blue-400' },
    failed: { label: 'Failed', color: 'bg-red-500', textColor: 'text-red-400' },
    scheduled: { label: 'Scheduled', color: 'bg-purple-500', textColor: 'text-purple-400' },
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
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<CampaignFilter>({
        status: 'all',
        sortBy: 'newest',
        search: ''
    });

    const filteredCampaigns = campaigns
        .filter(c => filter.status === 'all' || c.status === filter.status)
        .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            switch (filter.sortBy) {
                case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'name': return a.name.localeCompare(b.name);
                case 'recipients': return b.totalRecipients - a.totalRecipients;
                default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

    useEffect(() => {
        if (!selectedCampaign && filteredCampaigns.length > 0) {
            setSelectedCampaign(filteredCampaigns[0]);
        }
    }, [filteredCampaigns, selectedCampaign]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Handle campaign selection
    const handleSelectCampaign = (campaign: Campaign) => {
        setSelectedCampaign(campaign);
    };

    // Handle view campaign details
    const handleViewDetails = (campaign: Campaign) => {
        onViewCampaign(campaign.id);
    };

    return (
        <div className={cn('flex flex-1 min-h-0', className)}>
            {/* Sidebar - List of Campaigns */}
            <div className={cn(
                'w-72 flex-shrink-0 flex flex-col border-r',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-gray-50 border-gray-200'
            )}>
                {/* Sidebar Header */}
                <div className={cn(
                    'p-4 border-b',
                    theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={cn(
                            'text-lg font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Campaigns
                        </h2>
                        <button
                            onClick={onCreateNew}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                theme === 'dark'
                                    ? 'bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta-dark)]'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            )}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className={cn(
                            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )} />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'w-full pl-10 pr-4 py-2 rounded-lg border text-sm',
                                theme === 'dark'
                                    ? 'bg-[#252525] border-gray-700 text-white placeholder:text-gray-500'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                    </div>
                </div>

                {/* Campaigns List */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className={cn(
                                    'w-6 h-6 animate-spin',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )} />
                            </div>
                        ) : filteredCampaigns.length === 0 ? (
                            <div className={cn(
                                'text-center py-8',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )}>
                                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No campaigns yet</p>
                                <button
                                    onClick={onCreateNew}
                                    className="text-blue-500 text-sm mt-2 hover:underline"
                                >
                                    Create your first campaign
                                </button>
                            </div>
                        ) : (
                            filteredCampaigns.map(campaign => {
                                const status = statusConfig[campaign.status];
                                const progress = campaign.totalRecipients > 0
                                    ? (campaign.sentCount / campaign.totalRecipients) * 100
                                    : 0;

                                return (
                                    <button
                                        key={campaign.id}
                                        onClick={() => handleSelectCampaign(campaign)}
                                        className={cn(
                                            'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors group',
                                            selectedCampaign?.id === campaign.id
                                                ? theme === 'dark'
                                                    ? 'bg-[var(--terracotta)]/10 text-[var(--terracotta)]'
                                                    : 'bg-blue-50 text-blue-600'
                                                : theme === 'dark'
                                                    ? 'hover:bg-white/5 text-[var(--text-secondary)]'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                        )}
                                    >
                                        <Megaphone className="w-4 h-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate">{campaign.name}</p>
                                                <span className={cn(
                                                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                                    status.color,
                                                    status.pulse && 'animate-pulse'
                                                )} />
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className={cn(
                                                    'text-xs',
                                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                )}>
                                                    {campaign.totalRecipients} leads
                                                </p>
                                                {progress > 0 && (
                                                    <span className={cn(
                                                        'text-xs',
                                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    )}>
                                                        • {Math.round(progress)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className={cn(
                                            'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedCampaign ? (
                    <>
                        {/* Campaign Header */}
                        <div className={cn(
                            'flex items-center justify-between px-6 py-4 border-b',
                            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                        )}>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className={cn(
                                        'text-xl font-semibold',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {selectedCampaign.name}
                                    </h1>
                                    <span className={cn(
                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100',
                                        statusConfig[selectedCampaign.status].textColor
                                    )}>
                                        <span className={cn(
                                            'w-1.5 h-1.5 rounded-full',
                                            statusConfig[selectedCampaign.status].color,
                                            statusConfig[selectedCampaign.status].pulse && 'animate-pulse'
                                        )} />
                                        {statusConfig[selectedCampaign.status].label}
                                    </span>
                                </div>
                                <p className={cn(
                                    'text-sm mt-1',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Created {formatDate(selectedCampaign.createdAt)} • {selectedCampaign.totalRecipients} recipients
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedCampaign.status === 'active' && onPauseCampaign && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPauseCampaign(selectedCampaign.id)}
                                        className={cn(
                                            'gap-2',
                                            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                                        )}
                                    >
                                        <Pause className="w-4 h-4" />
                                        Pause
                                    </Button>
                                )}
                                {selectedCampaign.status === 'paused' && onResumeCampaign && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onResumeCampaign(selectedCampaign.id)}
                                        className={cn(
                                            'gap-2',
                                            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                                        )}
                                    >
                                        <Play className="w-4 h-4" />
                                        Resume
                                    </Button>
                                )}
                                {onDuplicateCampaign && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDuplicateCampaign(selectedCampaign.id)}
                                        className={cn(
                                            'gap-2',
                                            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                                        )}
                                    >
                                        <Copy className="w-4 h-4" />
                                        Duplicate
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={() => handleViewDetails(selectedCampaign)}
                                    className={cn(
                                        'gap-2',
                                        theme === 'dark'
                                            ? 'bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)] text-white'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                                    )}
                                >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                </Button>
                                <button
                                    onClick={() => onDeleteCampaign(selectedCampaign.id)}
                                    className={cn(
                                        'p-2 rounded-lg transition-colors',
                                        theme === 'dark'
                                            ? 'text-red-400 hover:bg-red-500/20'
                                            : 'text-red-500 hover:bg-red-50'
                                    )}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Campaign Stats */}
                        <div className={cn(
                            'px-6 py-6 border-b',
                            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                        )}>
                            <div className="grid grid-cols-4 gap-6">
                                {/* Progress */}
                                <div className={cn(
                                    'p-4 rounded-xl border',
                                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                                )}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn(
                                            'p-2 rounded-lg',
                                            theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50'
                                        )}>
                                            <TrendingUp className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>Progress</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className={cn(
                                            'text-2xl font-bold',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {selectedCampaign.totalRecipients > 0
                                                ? Math.round((selectedCampaign.sentCount / selectedCampaign.totalRecipients) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={selectedCampaign.totalRecipients > 0
                                            ? (selectedCampaign.sentCount / selectedCampaign.totalRecipients) * 100
                                            : 0}
                                        className="h-1.5 mt-3"
                                    />
                                </div>

                                {/* Sent */}
                                <div className={cn(
                                    'p-4 rounded-xl border',
                                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                                )}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn(
                                            'p-2 rounded-lg',
                                            theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-50'
                                        )}>
                                            <Send className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>Sent</span>
                                    </div>
                                    <span className={cn(
                                        'text-2xl font-bold',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {selectedCampaign.sentCount}
                                    </span>
                                    <p className={cn(
                                        'text-xs mt-1',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        of {selectedCampaign.totalRecipients} total
                                    </p>
                                </div>

                                {/* Replied */}
                                <div className={cn(
                                    'p-4 rounded-xl border',
                                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                                )}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn(
                                            'p-2 rounded-lg',
                                            theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-50'
                                        )}>
                                            <Mail className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>Replied</span>
                                    </div>
                                    <span className={cn(
                                        'text-2xl font-bold',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {selectedCampaign.replyCount || 0}
                                    </span>
                                    <p className={cn(
                                        'text-xs mt-1',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        {selectedCampaign.sentCount > 0
                                            ? `${Math.round(((selectedCampaign.replyCount || 0) / selectedCampaign.sentCount) * 100)}% reply rate`
                                            : '0% reply rate'}
                                    </p>
                                </div>

                                {/* Clicked */}
                                <div className={cn(
                                    'p-4 rounded-xl border',
                                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                                )}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn(
                                            'p-2 rounded-lg',
                                            theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-50'
                                        )}>
                                            <BarChart2 className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>Clicked</span>
                                    </div>
                                    <span className={cn(
                                        'text-2xl font-bold',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {selectedCampaign.clickCount || 0}
                                    </span>
                                    <p className={cn(
                                        'text-xs mt-1',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        {selectedCampaign.sentCount > 0
                                            ? `${Math.round(((selectedCampaign.clickCount || 0) / selectedCampaign.sentCount) * 100)}% click rate`
                                            : '0% click rate'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Campaign Details Preview */}
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <div className={cn(
                                'p-6 rounded-xl border',
                                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                            )}>
                                <h3 className={cn(
                                    'text-lg font-medium mb-4',
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    Quick Overview
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            'text-sm',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>Status</span>
                                        <span className={cn(
                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100',
                                            statusConfig[selectedCampaign.status].textColor
                                        )}>
                                            <span className={cn(
                                                'w-1.5 h-1.5 rounded-full',
                                                statusConfig[selectedCampaign.status].color
                                            )} />
                                            {statusConfig[selectedCampaign.status].label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            'text-sm',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>Total Recipients</span>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>{selectedCampaign.totalRecipients}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            'text-sm',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>Created</span>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>{formatDate(selectedCampaign.createdAt)}</span>
                                    </div>
                                    {selectedCampaign.updatedAt && (
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                'text-sm',
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            )}>Last Updated</span>
                                            <span className={cn(
                                                'text-sm font-medium',
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            )}>{formatDate(selectedCampaign.updatedAt)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-800">
                                    <Button
                                        onClick={() => handleViewDetails(selectedCampaign)}
                                        className={cn(
                                            'w-full gap-2',
                                            theme === 'dark'
                                                ? 'bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)] text-white'
                                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                                        )}
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Full Campaign Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Empty State - No campaign selected */
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className={cn(
                            'w-20 h-20 rounded-full flex items-center justify-center mb-6',
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        )}>
                            <Megaphone className={cn(
                                'w-10 h-10',
                                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                            )} />
                        </div>
                        <h2 className={cn(
                            'text-xl font-semibold mb-2',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Select a campaign
                        </h2>
                        <p className={cn(
                            'text-sm text-center max-w-sm mb-6',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            Choose a campaign from the sidebar or create a new one
                        </p>
                        <Button
                            onClick={onCreateNew}
                            className={cn(
                                'gap-2',
                                theme === 'dark'
                                    ? 'bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)] text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            Create New Campaign
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
