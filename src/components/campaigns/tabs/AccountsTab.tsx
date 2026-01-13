import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, Server, RefreshCw, Check, AlertTriangle, Cloud,
    Mail, Clock, Settings, Activity, ArrowRight, X, Send, Edit3,
    Search, Filter, MoreHorizontal, LayoutGrid, List as ListIcon, Eye
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import type { Lead, SequenceStep } from '../types';

interface SmtpAccount {
    id: string;
    name: string;
    fromEmail: string;
    username?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    status?: 'active' | 'error' | 'disconnected';
}

interface AccountsTabProps {
    campaignId: string;
    leads: Lead[];
    sequence?: { steps: SequenceStep[] } | null;
    onLeadsUpdate?: (leads: Lead[]) => void;
    isLocked?: boolean;
    className?: string;
}

export function AccountsTab({ campaignId, leads, sequence, onLeadsUpdate, isLocked, className }: AccountsTabProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [accounts, setAccounts] = useState<SmtpAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
    const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editSubject, setEditSubject] = useState('');
    const [editBody, setEditBody] = useState('');

    // Fetch SMTP accounts
    const fetchSmtpAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch('/api/bulk-email/smtp-accounts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.map((acc: any) => ({ ...acc, status: 'active' })));
            }
        } catch (err) {
            console.error('Failed to fetch SMTP accounts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSmtpAccounts();
    }, [fetchSmtpAccounts]);

    // Get first step subject/body from sequence
    const getEmailContent = (lead: Lead) => {
        const firstStep = sequence?.steps?.[0];
        if (!firstStep) {
            return { subject: '(No sequence)', body: '(No email content defined)' };
        }

        // Replace merge tags with lead data
        const replaceTags = (text: string) => {
            return text
                .replace(/\{\{firstName\}\}/g, lead.firstName || '')
                .replace(/\{\{lastName\}\}/g, lead.lastName || '')
                .replace(/\{\{email\}\}/g, lead.email || '')
                .replace(/\{\{company\}\}/g, lead.company || '');
        };

        return {
            subject: replaceTags(firstStep.subject || ''),
            body: replaceTags(firstStep.body || '')
        };
    };

    // Combined Queue Data with BATCH-based scheduling
    const queueData = useMemo(() => {
        const pending = leads.filter(l => l.status === 'pending');

        // Map accounts for easy lookup
        const accountMap = accounts.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {} as Record<string, SmtpAccount>);

        // Count unique assigned accounts for batch calculation
        const uniqueAccountIds = new Set(
            pending.map(l => l.sendingAccountId).filter(Boolean)
        );
        const accountCount = Math.max(1, uniqueAccountIds.size || accounts.length);

        // Sort leads by scheduled time or arrival
        const sortedLeads = [...pending].sort((a, b) => {
            const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
            const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
            return timeA - timeB;
        });

        return sortedLeads.map((lead, idx) => {
            // If lead doesn't have an assigned account, use round-robin logic for display
            const assignedId = lead.sendingAccountId || (accounts.length > 0 ? accounts[idx % accounts.length].id : null);
            const emailContent = getEmailContent(lead);

            // Calculate batch number (0-indexed) and estimated time based on batch
            const batchNumber = Math.floor(idx / accountCount);
            const delayMinutes = batchNumber * 10; // 10 min delay between batches (from config)

            return {
                ...lead,
                assignedAccount: assignedId ? accountMap[assignedId] : null,
                previewSubject: emailContent.subject,
                previewBody: emailContent.body,
                batchNumber: batchNumber + 1,
                estimatedTime: batchNumber === 0 ? 'Batch 1 (Now)' : `Batch ${batchNumber + 1} (+${delayMinutes}m)`
            };
        });
    }, [leads, accounts, sequence]);

    const filteredQueue = useMemo(() => {
        return queueData.filter(item => {
            const email = item.email || '';
            const firstName = item.firstName || '';
            const lastName = item.lastName || '';
            const fullName = `${firstName} ${lastName}`.toLowerCase();

            const matchesSearch = email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fullName.includes(searchQuery.toLowerCase());

            const accountId = item.assignedAccount?.id;
            const matchesAccount = selectedAccountId === 'all' || accountId === selectedAccountId;

            return matchesSearch && matchesAccount;
        });
    }, [queueData, searchQuery, selectedAccountId]);

    const handlePreview = (item: any) => {
        setSelectedEmail(item);
        setEditSubject(item.previewSubject);
        setEditBody(item.previewBody);
        setEditMode(false);
    };

    const handleSaveEdit = () => {
        // TODO: Save custom email content for this lead
        // For now just close the modal
        setEditMode(false);
        setSelectedEmail(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4 opacity-50">
                <Activity className="w-8 h-8 animate-pulse text-orange-500" />
                <p className="font-medium text-sm">Loading accounts...</p>
            </div>
        );
    }

    return (
        <div className={cn(
            'flex flex-col h-full overflow-hidden',
            className
        )}>
            {/* Lock Banner */}
            {isLocked && (
                <div className={cn('flex items-center gap-2 px-4 py-2 text-xs font-medium border-b shrink-0',
                    isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                )}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Campaign is running. Pause to make changes.
                </div>
            )}
            {/* Account Tabs */}
            <div className={cn(
                'flex items-center gap-1 px-1 border-b overflow-x-auto shrink-0',
                isDark ? 'border-neutral-800' : 'border-gray-200'
            )}>
                {accounts.map(account => {
                    const accountQueue = queueData.filter(q => q.assignedAccount?.id === account.id).length;
                    return (
                        <button
                            key={account.id}
                            onClick={() => setSelectedAccountId(selectedAccountId === account.id ? 'all' : account.id)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px whitespace-nowrap',
                                selectedAccountId === account.id
                                    ? 'border-orange-500 text-orange-500'
                                    : isDark
                                        ? 'border-transparent text-neutral-500 hover:text-neutral-300'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <div className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                                selectedAccountId === account.id
                                    ? 'bg-orange-500 text-white'
                                    : isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-200 text-gray-600'
                            )}>
                                {account.fromEmail.charAt(0).toUpperCase()}
                            </div>
                            <span className="max-w-[160px] truncate">{account.fromEmail}</span>
                            {accountQueue > 0 && (
                                <span className={cn(
                                    'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                                    selectedAccountId === account.id
                                        ? 'bg-orange-500/20 text-orange-500'
                                        : isDark ? 'bg-neutral-700 text-neutral-400' : 'bg-gray-200 text-gray-500'
                                )}>
                                    {accountQueue}
                                </span>
                            )}
                        </button>
                    );
                })}

                <button
                    onClick={() => window.location.href = '/email-accounts'}
                    className={cn(
                        'flex items-center gap-1.5 px-2 py-2.5 text-xs transition-colors -mb-px',
                        isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-400 hover:text-gray-600'
                    )}
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-1 py-3 shrink-0">
                <div className="relative">
                    <Search className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
                        isDark ? 'text-neutral-500' : 'text-gray-400'
                    )} />
                    <input
                        type="text"
                        placeholder="Search by recipient..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'w-full pl-9 pr-3 py-2 rounded text-xs border focus:outline-none',
                            isDark
                                ? 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-orange-500'
                                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500'
                        )}
                    />
                </div>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-auto">
                {filteredQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-30 space-y-3">
                        <Cloud className="w-10 h-10 stroke-[1px]" />
                        <div className="text-center">
                            <p className="font-semibold text-sm">No emails in queue</p>
                            <p className="text-[10px]">Adjust your filters or add more leads to the campaign.</p>
                        </div>
                    </div>
                ) : (
                    <div className={cn('divide-y', isDark ? 'divide-neutral-800' : 'divide-gray-100')}>
                        {filteredQueue.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handlePreview(item)}
                                className={cn(
                                    'group flex items-center gap-4 px-3 py-2.5 transition-all cursor-pointer',
                                    isDark ? 'hover:bg-neutral-900' : 'hover:bg-gray-50'
                                )}
                            >
                                {/* Lead Info */}
                                <div className="flex items-center gap-2 w-[240px] overflow-hidden">
                                    <div className={cn(
                                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs',
                                        isDark ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-orange-600'
                                    )}>
                                        {(item.email || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                        <p className={cn('text-xs font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                            {item.email}
                                        </p>
                                        <p className="text-[10px] opacity-50 truncate">
                                            {item.firstName} {item.lastName}
                                        </p>
                                    </div>
                                </div>

                                {/* Sender Account */}
                                <div className="flex items-center gap-2 flex-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <div className={cn(
                                        'text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded',
                                        isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'
                                    )}>
                                        Sender
                                    </div>
                                    <p className="text-xs truncate">
                                        {item.assignedAccount?.fromEmail || 'Auto'}
                                    </p>
                                </div>

                                {/* Subject Preview */}
                                <div className={cn('flex-1 truncate text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                    {item.previewSubject || '(No subject)'}
                                </div>

                                {/* Timing + Preview Button */}
                                <div className="flex items-center gap-2 ml-auto shrink-0">
                                    <div className={cn('flex items-center gap-1 text-[10px] font-medium', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                                        <Clock className="w-3 h-3" />
                                        {item.scheduledTime ? new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : item.estimatedTime}
                                    </div>
                                    <button className={cn(
                                        'p-1 rounded transition-colors opacity-0 group-hover:opacity-100',
                                        isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'
                                    )}>
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={cn(
                'shrink-0 px-3 py-2 border-t flex items-center justify-between',
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-100'
            )}>
                <div className="text-[10px] opacity-50">
                    Showing {filteredQueue.length} of {queueData.length} queued emails
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchSmtpAccounts()}
                    className={cn('h-7 px-2 rounded text-[10px] gap-1', isDark ? 'border-neutral-700' : '')}
                >
                    <RefreshCw className="w-3 h-3" />
                    Sync
                </Button>
            </div>

            {/* Email Preview Modal */}
            {selectedEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className={cn(
                        'w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl',
                        isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'
                    )}>
                        {/* Modal Header */}
                        <div className={cn('flex items-center justify-between px-6 py-4 border-b', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                            <div className="flex items-center gap-3">
                                <Mail className={cn('w-5 h-5', isDark ? 'text-orange-500' : 'text-orange-600')} />
                                <div>
                                    <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                                        Email to {selectedEmail.email}
                                    </p>
                                    <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                        From: {selectedEmail.assignedAccount?.fromEmail || 'Auto-assigned'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!editMode && (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                            isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        )}
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className={cn('p-1.5 rounded transition-colors', isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100')}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Subject */}
                            <div>
                                <label className={cn('text-xs font-medium mb-1.5 block', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                    Subject
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={editSubject}
                                        onChange={(e) => setEditSubject(e.target.value)}
                                        className={cn(
                                            'w-full px-3 py-2 rounded-lg text-sm border focus:outline-none',
                                            isDark
                                                ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500'
                                        )}
                                    />
                                ) : (
                                    <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                                        {selectedEmail.previewSubject || '(No subject)'}
                                    </p>
                                )}
                            </div>

                            {/* Body */}
                            <div>
                                <label className={cn('text-xs font-medium mb-1.5 block', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                    Message
                                </label>
                                {editMode ? (
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        rows={12}
                                        className={cn(
                                            'w-full px-3 py-2 rounded-lg text-sm border focus:outline-none resize-none',
                                            isDark
                                                ? 'bg-neutral-800 border-neutral-700 text-white focus:border-orange-500'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500'
                                        )}
                                    />
                                ) : (
                                    <div className={cn(
                                        'p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto',
                                        isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-50 text-gray-700'
                                    )}>
                                        {selectedEmail.previewBody || '(No content)'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                            {editMode ? (
                                <>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className={cn(
                                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                            isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        )}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className={cn(
                                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                        isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    )}
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
