import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Mail, RefreshCw, Trash2, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Progress } from '../ui/Progress';
import { StatusBadge } from '../dashboard/StatusBadge';
import { EmptyState } from '../dashboard/EmptyState';

interface Campaign {
    id: string;
    name: string;
    subject: string;
    status: 'draft' | 'sending' | 'completed' | 'failed';
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    createdAt: string;
    completedAt?: string;
}

interface CampaignHistoryProps {
    campaigns: Campaign[];
    loading?: boolean;
    onRefresh?: () => void;
    onDelete?: (id: string) => void;
    onView?: (id: string) => void;
    className?: string;
}

export function CampaignHistory({
    campaigns,
    loading,
    onRefresh,
    onDelete,
    onView,
    className,
}: CampaignHistoryProps) {
    const getStatusType = (status: Campaign['status']) => {
        switch (status) {
            case 'completed': return 'success';
            case 'failed': return 'error';
            case 'sending': return 'pending';
            default: return 'info';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <div className={cn('space-y-6', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Campaign History</h2>
                    <p className="text-white/40 mt-1">Track all your email campaigns</p>
                </div>
                <Button variant="outline" onClick={onRefresh} disabled={loading}>
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            <Card className="overflow-hidden">
                {campaigns.length === 0 ? (
                    <EmptyState
                        icon={<Mail className="w-8 h-8" />}
                        title="No campaigns yet"
                        description="Start by composing your first email campaign"
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign, index) => {
                                const progress = campaign.totalRecipients > 0
                                    ? (campaign.sentCount / campaign.totalRecipients) * 100
                                    : 0;

                                return (
                                    <motion.tr
                                        key={campaign.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-white">{campaign.name}</div>
                                                <div className="text-sm text-white/40 line-clamp-1">
                                                    {campaign.subject}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={getStatusType(campaign.status)}
                                                label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                                pulse={campaign.status === 'sending'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4 min-w-[200px]">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-white font-medium">{campaign.sentCount}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <XCircle className="w-4 h-4 text-red-400" />
                                                    <span className="text-white font-medium">{campaign.failedCount}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <Progress value={progress} className="h-1.5" />
                                                </div>
                                                <span className="text-xs text-white/40 min-w-[40px]">
                                                    {Math.round(progress)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-white/50 text-sm">
                                                {formatDate(campaign.createdAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                {onView && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onView(campaign.id)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {onDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDelete(campaign.id)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
