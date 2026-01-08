import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Search, Filter, Eye, X, Clock, CheckCircle,
    AlertCircle, MousePointer, Reply, Loader2, RefreshCw
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import { ScrollArea } from '../../ui/ScrollArea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/Table';

// Email log entry from the backend
interface EmailLog {
    id: string;
    campaignId: string;
    email: string;
    recipientName?: string;
    status: 'sent' | 'failed' | 'opened' | 'clicked' | 'replied';
    sentAt: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    messageId?: string;
    stepIndex?: number;
    error?: string;
}

interface HistoryTabProps {
    campaignId: string;
    className?: string;
}

export function HistoryTab({ campaignId, className }: HistoryTabProps) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'opened' | 'clicked' | 'replied'>('all');
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);

    // Fetch email logs
    const fetchEmailLogs = useCallback(async () => {
        if (!campaignId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmailLogs(data.logs || []);
            }
        } catch (err) {
            console.error('Failed to fetch email logs:', err);
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        fetchEmailLogs();
    }, [fetchEmailLogs]);

    // Filter logs based on search and status
    const filteredLogs = emailLogs
        .filter(log => {
            if (statusFilter !== 'all' && log.status !== statusFilter) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    log.email.toLowerCase().includes(query) ||
                    (log.subject?.toLowerCase().includes(query)) ||
                    (log.recipientName?.toLowerCase().includes(query))
                );
            }
            return true;
        })
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    // Format timestamp
    const formatTime = (sentAt: string): string => {
        const date = new Date(sentAt);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'opened': return <Eye className="w-4 h-4 text-blue-500" />;
            case 'clicked': return <MousePointer className="w-4 h-4 text-purple-500" />;
            case 'replied': return <Reply className="w-4 h-4 text-amber-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    // Stats
    const stats = {
        total: emailLogs.length,
        sent: emailLogs.filter(l => l.status === 'sent').length,
        failed: emailLogs.filter(l => l.status === 'failed').length,
        opened: emailLogs.filter(l => l.status === 'opened').length,
        clicked: emailLogs.filter(l => l.status === 'clicked').length,
        replied: emailLogs.filter(l => l.status === 'replied').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className={cn(
                    'w-8 h-8 animate-spin',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )} />
            </div>
        );
    }

    return (
        <div className={cn('h-full flex flex-col', className)}>
            {/* Compact Toolbar */}
            <div className={cn(
                'flex items-center justify-between px-4 py-3 border-b flex-shrink-0',
                theme === 'dark' ? 'bg-[#0d0d0d] border-neutral-800' : 'bg-white border-gray-200'
            )}>
                {/* Left: Title and Stats */}
                <div className="flex items-center gap-4">
                    <h2 className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Email History
                    </h2>
                    <div className="flex items-center gap-2">
                        {[
                            { label: 'Total', count: stats.total },
                            { label: 'Delivered', count: stats.sent, color: 'text-emerald-500' },
                            { label: 'Failed', count: stats.failed, color: 'text-red-500' },
                        ].filter(s => s.count > 0).map((stat) => (
                            <div key={stat.label} className={cn(
                                'text-xs px-2 py-0.5 rounded flex items-center gap-1',
                                theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                            )}>
                                <span className={stat.color || (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                    {stat.count}
                                </span>
                                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Search and Filters */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                        theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                    )}>
                        <Search className={cn('w-3.5 h-3.5', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'bg-transparent border-0 outline-none text-xs w-32',
                                theme === 'dark'
                                    ? 'text-white placeholder:text-gray-500'
                                    : 'text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className={cn(
                        'flex items-center gap-0.5 p-0.5 rounded-lg',
                        theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                    )}>
                        {(['all', 'sent', 'failed'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={cn(
                                    'px-2 py-1 rounded text-xs font-medium transition-all capitalize',
                                    statusFilter === status
                                        ? theme === 'dark'
                                            ? 'bg-neutral-700 text-white'
                                            : 'bg-white text-gray-900 shadow-sm'
                                        : theme === 'dark'
                                            ? 'text-gray-500 hover:text-gray-300'
                                            : 'text-gray-400 hover:text-gray-600'
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchEmailLogs}
                        className={cn(
                            'h-8 w-8 p-0',
                            theme === 'dark'
                                ? 'text-gray-400 hover:text-white hover:bg-neutral-800'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        )}
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className={cn(
                        'flex flex-col items-center justify-center h-full',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                        <Mail className="w-10 h-10 mb-3 opacity-50" />
                        <p className="text-sm font-medium mb-1">
                            {emailLogs.length === 0 ? 'No emails sent yet' : 'No matching emails'}
                        </p>
                        <p className="text-xs opacity-70">
                            {emailLogs.length === 0
                                ? 'Start the campaign to begin sending'
                                : 'Try adjusting your search'}
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow className={cn(
                                    'border-b',
                                    theme === 'dark' ? 'bg-[#0d0d0d] border-neutral-800' : 'bg-gray-50 border-gray-200'
                                )}>
                                    <TableHead className={cn('w-12', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>#</TableHead>
                                    <TableHead className={cn('min-w-[180px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Recipient</TableHead>
                                    <TableHead className={cn('min-w-[200px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Subject</TableHead>
                                    <TableHead className={cn('min-w-[120px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Sent At</TableHead>
                                    <TableHead className={cn('w-16', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Step</TableHead>
                                    <TableHead className={cn('w-24', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Status</TableHead>
                                    <TableHead className={cn('w-20', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log, index) => (
                                    <TableRow key={log.id} className={cn(
                                        theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                                    )}>
                                        <TableCell className={cn(
                                            'text-xs font-mono',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    'text-sm font-medium',
                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                )}>
                                                    {log.recipientName || log.email.split('@')[0]}
                                                </span>
                                                <span className={cn(
                                                    'text-xs',
                                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                )}>
                                                    {log.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                'text-sm truncate max-w-[200px] block',
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                            )}>
                                                {log.subject || '(No subject)'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    'text-xs font-medium',
                                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                )}>
                                                    {formatTime(log.sentAt)}
                                                </span>
                                                <span className={cn(
                                                    'text-xs',
                                                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                )}>
                                                    {new Date(log.sentAt).toLocaleDateString('en-US', {
                                                        weekday: 'short'
                                                    })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                'px-2 py-0.5 rounded text-xs font-medium',
                                                theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                                            )}>
                                                Step {(log.stepIndex ?? 0) + 1}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(log.status)}
                                                <span className={cn(
                                                    'text-xs font-medium capitalize',
                                                    log.status === 'sent' && 'text-emerald-500',
                                                    log.status === 'failed' && 'text-red-500',
                                                    log.status === 'opened' && 'text-blue-500',
                                                    log.status === 'clicked' && 'text-purple-500',
                                                    log.status === 'replied' && 'text-amber-500'
                                                )}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={() => {
                                                    setSelectedEmailLog(log);
                                                    setShowEmailPreview(true);
                                                }}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                                                    theme === 'dark'
                                                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                )}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                View
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </div>

            {/* Email Preview Modal */}
            <AnimatePresence>
                {showEmailPreview && selectedEmailLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                setShowEmailPreview(false);
                                setSelectedEmailLog(null);
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={cn(
                                'relative w-full max-w-2xl max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col',
                                theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'
                            )}
                        >
                            {/* Modal Header */}
                            <div className={cn(
                                'flex items-center justify-between px-6 py-4 border-b flex-shrink-0',
                                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'p-2 rounded-lg',
                                        theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                                    )}>
                                        <Mail className={cn(
                                            'w-5 h-5',
                                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                        )} />
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            'text-lg font-semibold',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                            Email Preview
                                        </h3>
                                        <p className={cn(
                                            'text-xs',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            Sent to {selectedEmailLog.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEmailPreview(false);
                                        setSelectedEmailLog(null);
                                    }}
                                    className={cn(
                                        'p-2 rounded-lg transition-colors',
                                        theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                    )}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Email Metadata */}
                            <div className={cn(
                                'px-6 py-4 space-y-3 border-b flex-shrink-0',
                                theme === 'dark' ? 'bg-[#151515] border-gray-800' : 'bg-gray-50 border-gray-200'
                            )}>
                                {/* Subject */}
                                <div className="flex items-start gap-3">
                                    <span className={cn(
                                        'text-xs font-medium w-16 pt-0.5 flex-shrink-0',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>Subject:</span>
                                    <span className={cn(
                                        'text-sm font-medium',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {selectedEmailLog.subject || '(No subject)'}
                                    </span>
                                </div>

                                {/* To */}
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        'text-xs font-medium w-16 flex-shrink-0',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>To:</span>
                                    <span className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        {selectedEmailLog.recipientName
                                            ? `${selectedEmailLog.recipientName} <${selectedEmailLog.email}>`
                                            : selectedEmailLog.email}
                                    </span>
                                </div>

                                {/* Sent Time */}
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        'text-xs font-medium w-16 flex-shrink-0',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>Sent:</span>
                                    <span className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        {new Date(selectedEmailLog.sentAt).toLocaleString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        'text-xs font-medium w-16 flex-shrink-0',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>Status:</span>
                                    <span className={cn(
                                        'px-2 py-0.5 rounded-full text-xs font-medium',
                                        selectedEmailLog.status === 'sent' && 'bg-emerald-500/20 text-emerald-400',
                                        selectedEmailLog.status === 'failed' && 'bg-red-500/20 text-red-400',
                                        selectedEmailLog.status === 'opened' && 'bg-blue-500/20 text-blue-400',
                                        selectedEmailLog.status === 'clicked' && 'bg-purple-500/20 text-purple-400',
                                        selectedEmailLog.status === 'replied' && 'bg-amber-500/20 text-amber-400'
                                    )}>
                                        {selectedEmailLog.status.charAt(0).toUpperCase() + selectedEmailLog.status.slice(1)}
                                    </span>
                                    {selectedEmailLog.stepIndex !== undefined && (
                                        <span className={cn(
                                            'text-xs',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            (Step {selectedEmailLog.stepIndex + 1})
                                        </span>
                                    )}
                                </div>

                                {/* Error (if failed) */}
                                {selectedEmailLog.error && (
                                    <div className="flex items-start gap-3">
                                        <span className={cn(
                                            'text-xs font-medium w-16 pt-0.5 flex-shrink-0',
                                            'text-red-400'
                                        )}>Error:</span>
                                        <span className="text-sm text-red-400">
                                            {selectedEmailLog.error}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Email Content */}
                            <div className="flex-1 overflow-y-auto">
                                {selectedEmailLog.htmlContent ? (
                                    <div
                                        className={cn(
                                            'p-6',
                                            theme === 'dark' ? 'bg-[#202020]' : 'bg-white'
                                        )}
                                        dangerouslySetInnerHTML={{ __html: selectedEmailLog.htmlContent }}
                                    />
                                ) : selectedEmailLog.textContent ? (
                                    <pre className={cn(
                                        'p-6 whitespace-pre-wrap font-sans text-sm leading-relaxed',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        {selectedEmailLog.textContent}
                                    </pre>
                                ) : (
                                    <div className={cn(
                                        'flex items-center justify-center py-16',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        <p className="text-sm">No email content available</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className={cn(
                                'flex items-center justify-end px-6 py-4 border-t flex-shrink-0',
                                theme === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
                            )}>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowEmailPreview(false);
                                        setSelectedEmailLog(null);
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
