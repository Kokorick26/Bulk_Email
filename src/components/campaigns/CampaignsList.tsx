import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, ChevronDown, MoreHorizontal,
    Play, Pause, Trash2, Copy, BarChart2, Users, Send,
    CheckCircle, XCircle, Clock, TrendingUp, Eye, Mail, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
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

const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-500', textColor: 'text-gray-400' },
    active: { label: 'Active', color: 'bg-emerald-500', textColor: 'text-emerald-400', pulse: true },
    paused: { label: 'Paused', color: 'bg-amber-500', textColor: 'text-amber-400' },
    completed: { label: 'Completed', color: 'bg-blue-500', textColor: 'text-blue-400' },
    failed: { label: 'Failed', color: 'bg-red-500', textColor: 'text-red-400' },
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
    const [filter, setFilter] = useState<CampaignFilter>({
        status: 'all',
        sortBy: 'newest',
        search: ''
    });

    const filteredCampaigns = campaigns
        .filter(c => filter.status === 'all' || c.status === filter.status)
        .filter(c => !filter.search || c.name.toLowerCase().includes(filter.search.toLowerCase()))
        .sort((a, b) => {
            switch (filter.sortBy) {
                case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'name': return a.name.localeCompare(b.name);
                case 'recipients': return b.totalRecipients - a.totalRecipients;
                default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={cn(
                        'text-2xl font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Campaigns
                    </h1>
                    <p className={cn(
                        'text-sm mt-1',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>
                        Manage your email campaigns and track performance
                    </p>
                </div>
                <Button
                    onClick={onCreateNew}
                    className={cn(
                        'gap-2',
                        theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                >
                    <Plus className="w-4 h-4" />
                    Add New
                </Button>
            </div>

            {/* Filters Bar */}
            <div className={cn(
                'flex items-center gap-4 p-4 rounded-xl border',
                theme === 'dark'
                    ? 'bg-[#1a1a1a] border-gray-800'
                    : 'bg-white border-gray-200'
            )}>
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filter.search}
                        onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                        className={cn(
                            'w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2',
                            theme === 'dark'
                                ? 'bg-[#252525] border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500/30'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/30'
                        )}
                    />
                </div>

                {/* Status Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                            theme === 'dark'
                                ? 'bg-[#252525] border-gray-700 text-gray-300 hover:bg-[#303030]'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        )}>
                            <Filter className="w-4 h-4" />
                            {filter.status === 'all' ? 'All statuses' : statusConfig[filter.status].label}
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuItem onClick={() => setFilter(f => ({ ...f, status: 'all' }))}>
                            All statuses
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {Object.entries(statusConfig).map(([key, config]) => (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => setFilter(f => ({ ...f, status: key as Campaign['status'] }))}
                            >
                                <span className={cn('w-2 h-2 rounded-full mr-2', config.color)} />
                                {config.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                            theme === 'dark'
                                ? 'bg-[#252525] border-gray-700 text-gray-300 hover:bg-[#303030]'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        )}>
                            {filter.sortBy === 'newest' && 'Newest first'}
                            {filter.sortBy === 'oldest' && 'Oldest first'}
                            {filter.sortBy === 'name' && 'Name A-Z'}
                            {filter.sortBy === 'recipients' && 'Most recipients'}
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setFilter(f => ({ ...f, sortBy: 'newest' }))}>
                            Newest first
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter(f => ({ ...f, sortBy: 'oldest' }))}>
                            Oldest first
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter(f => ({ ...f, sortBy: 'name' }))}>
                            Name A-Z
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter(f => ({ ...f, sortBy: 'recipients' }))}>
                            Most recipients
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Campaigns Table */}
            <div className={cn(
                'rounded-xl border overflow-hidden',
                theme === 'dark'
                    ? 'bg-[#1a1a1a] border-gray-800'
                    : 'bg-white border-gray-200'
            )}>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className={cn(
                            'w-8 h-8 animate-spin',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )} />
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                        <div className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        )}>
                            <Mail className={cn(
                                'w-8 h-8',
                                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                            )} />
                        </div>
                        <p className={cn(
                            'text-lg font-medium mb-1',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                            No results found with filter
                        </p>
                        <p className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        )}>
                            Try adjusting your search or filter criteria
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className={cn(
                                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                            )}>
                                <TableHead className={cn(
                                    'w-10',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    <input type="checkbox" className="rounded" />
                                </TableHead>
                                <TableHead className={cn(
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>NAME</TableHead>
                                <TableHead className={cn(
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>STATUS</TableHead>
                                <TableHead className={cn(
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>PROGRESS</TableHead>
                                <TableHead className={cn(
                                    'text-center',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>SENT</TableHead>
                                <TableHead className={cn(
                                    'text-center',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>CLICK</TableHead>
                                <TableHead className={cn(
                                    'text-center',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>REPLIED</TableHead>
                                <TableHead className={cn(
                                    'text-center',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>OPPORTUNITIES</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredCampaigns.map((campaign, index) => {
                                    const progress = campaign.totalRecipients > 0
                                        ? (campaign.sentCount / campaign.totalRecipients) * 100
                                        : 0;
                                    const status = statusConfig[campaign.status];

                                    return (
                                        <motion.tr
                                            key={campaign.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ delay: index * 0.02 }}
                                            onClick={() => onViewCampaign(campaign.id)}
                                            className={cn(
                                                'cursor-pointer transition-colors',
                                                theme === 'dark'
                                                    ? 'border-gray-800 hover:bg-gray-800/50'
                                                    : 'border-gray-100 hover:bg-gray-50'
                                            )}
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" className="rounded" />
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className={cn(
                                                        'font-medium',
                                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                    )}>
                                                        {campaign.name}
                                                    </span>
                                                    <p className={cn(
                                                        'text-xs mt-0.5',
                                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                                    )}>
                                                        Created {formatDate(campaign.createdAt)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100',
                                                    status.textColor
                                                )}>
                                                    <span className={cn(
                                                        'w-1.5 h-1.5 rounded-full',
                                                        status.color,
                                                        status.pulse && 'animate-pulse'
                                                    )} />
                                                    {status.label}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3 min-w-[150px]">
                                                    <Progress
                                                        value={progress}
                                                        className="h-1.5 flex-1"
                                                    />
                                                    <span className={cn(
                                                        'text-xs font-medium min-w-[35px]',
                                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                    )}>
                                                        {Math.round(progress)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    'font-medium',
                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                )}>
                                                    {campaign.sentCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    'font-medium',
                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                )}>
                                                    {campaign.clickCount || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    'font-medium',
                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                )}>
                                                    {campaign.replyCount || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    'font-medium text-emerald-400'
                                                )}>
                                                    {(campaign.replyCount || 0) + (campaign.clickCount || 0)}
                                                </span>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className={cn(
                                                            'p-1.5 rounded-lg transition-colors',
                                                            theme === 'dark'
                                                                ? 'hover:bg-gray-700 text-gray-400'
                                                                : 'hover:bg-gray-100 text-gray-500'
                                                        )}>
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onViewCampaign(campaign.id)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {campaign.status === 'active' && onPauseCampaign && (
                                                            <DropdownMenuItem onClick={() => onPauseCampaign(campaign.id)}>
                                                                <Pause className="w-4 h-4 mr-2" />
                                                                Pause Campaign
                                                            </DropdownMenuItem>
                                                        )}
                                                        {campaign.status === 'paused' && onResumeCampaign && (
                                                            <DropdownMenuItem onClick={() => onResumeCampaign(campaign.id)}>
                                                                <Play className="w-4 h-4 mr-2" />
                                                                Resume Campaign
                                                            </DropdownMenuItem>
                                                        )}
                                                        {onDuplicateCampaign && (
                                                            <DropdownMenuItem onClick={() => onDuplicateCampaign(campaign.id)}>
                                                                <Copy className="w-4 h-4 mr-2" />
                                                                Duplicate
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => onDeleteCampaign(campaign.id)}
                                                            className="text-red-500 focus:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
