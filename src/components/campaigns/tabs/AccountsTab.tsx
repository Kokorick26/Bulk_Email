import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, Server, RefreshCw, Check, AlertTriangle, Cloud,
    Mail, Clock, Settings, Activity, ArrowRight,
    Search, Filter, MoreHorizontal, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import type { Lead } from '../types';

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
    sequence?: any;
    onLeadsUpdate?: (leads: Lead[]) => void;
    className?: string;
}

export function AccountsTab({ campaignId, leads, sequence, onLeadsUpdate, className }: AccountsTabProps) {
    const { theme } = useTheme();
    const [accounts, setAccounts] = useState<SmtpAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

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

    // Combined Queue Data
    const queueData = useMemo(() => {
        const pending = leads.filter(l => l.status === 'pending');

        // Map accounts for easy lookup
        const accountMap = accounts.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {} as Record<string, SmtpAccount>);

        // Sort leads by scheduled time or arrival
        const sortedLeads = [...pending].sort((a, b) => {
            const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
            const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
            return timeA - timeB;
        });

        return sortedLeads.map((lead, idx) => {
            // If lead doesn't have an assigned account, use round-robin logic for display
            const assignedId = lead.sendingAccountId || (accounts.length > 0 ? accounts[idx % accounts.length].id : null);
            return {
                ...lead,
                assignedAccount: assignedId ? accountMap[assignedId] : null
            };
        });
    }, [leads, accounts]);

    const filteredQueue = useMemo(() => {
        return queueData.filter(item => {
            const email = item.email || '';
            const firstName = item.firstName || '';
            const lastName = item.lastName || '';
            const fullName = `${firstName} ${lastName}`.toLowerCase();

            const matchesSearch = email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fullName.includes(searchQuery.toLowerCase());

            // Use the calculated assignedAccount from queueData instead of sendingAccountId which might be null
            const accountId = item.assignedAccount?.id;
            const matchesAccount = selectedAccountId === 'all' || accountId === selectedAccountId;

            return matchesSearch && matchesAccount;
        });
    }, [queueData, searchQuery, selectedAccountId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4 opacity-50">
                <Activity className="w-8 h-8 animate-pulse text-[#d97757]" />
                <p className="font-[Syne] font-bold tracking-widest text-xs uppercase italic">Synchronizing Fleet...</p>
            </div>
        );
    }

    return (
        <div className={cn(
            'max-w-6xl mx-auto flex flex-col animate-in fade-in duration-500 h-[calc(100vh-200px)] overflow-hidden',
            className
        )}
        >
            {/* Account Tabs (Inbox-style horizontal bar at top) */}
            <div className={cn(
                'flex items-center gap-2 px-1 border-b overflow-x-auto shrink-0',
                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            )}>
                {accounts.map(account => {
                    const accountQueue = queueData.filter(q => q.assignedAccount?.id === account.id).length;
                    return (
                        <button
                            key={account.id}
                            onClick={() => setSelectedAccountId(selectedAccountId === account.id ? 'all' : account.id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap',
                                selectedAccountId === account.id
                                    ? theme === 'dark' ? 'border-[#d97757] text-[#d97757]' : 'border-blue-500 text-blue-500'
                                    : theme === 'dark'
                                        ? 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            <div className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                selectedAccountId === account.id
                                    ? theme === 'dark' ? 'bg-[#d97757] text-white' : 'bg-blue-500 text-white'
                                    : theme === 'dark' ? 'bg-[#252a33] text-gray-400' : 'bg-gray-200 text-gray-600'
                            )}>
                                {account.fromEmail.charAt(0).toUpperCase()}
                            </div>
                            <span className="max-w-[180px] truncate">{account.fromEmail}</span>
                            {accountQueue > 0 && (
                                <span className={cn(
                                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                                    selectedAccountId === account.id
                                        ? 'bg-[#d97757]/20 text-[#d97757]'
                                        : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                                )}>
                                    {accountQueue}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Add Account Button */}
                <button
                    onClick={() => window.location.href = '/email-accounts'}
                    className={cn(
                        'flex items-center gap-2 px-3 py-3 text-sm transition-colors -mb-px',
                        theme === 'dark'
                            ? 'text-gray-500 hover:text-gray-300'
                            : 'text-gray-400 hover:text-gray-600'
                    )}
                >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-1 py-4 shrink-0">
                <div className="relative">
                    <Search className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )} />
                    <input
                        type="text"
                        placeholder="Search by recipient..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border',
                            theme === 'dark'
                                ? 'bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#d97757]'
                                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'
                        )}
                    />
                </div>
            </div>


            {/* Queue List - Scrollable */}
            <div className="flex-1 overflow-auto">
                {filteredQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-30 space-y-4">
                        <Cloud className="w-12 h-12 stroke-[1px]" />
                        <div className="text-center">
                            <p className="font-[Syne] font-bold text-lg">No emails in queue</p>
                            <p className="text-xs">Adjust your filters or add more leads to the campaign.</p>
                        </div>
                    </div>
                ) : (
                    <div className={cn(
                        'divide-y',
                        theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'
                    )}>
                        {filteredQueue.map((item, idx) => (
                            <div
                                key={item.id}
                                className={cn(
                                    'group flex items-center gap-4 px-4 py-3 transition-all',
                                    theme === 'dark' ? 'hover:bg-[#1a1e25]' : 'hover:bg-blue-50/50'
                                )}
                            >
                                {/* Checkbox placeholder */}
                                <div className={cn(
                                    'w-5 h-5 rounded border flex items-center justify-center cursor-pointer',
                                    theme === 'dark' ? 'border-gray-700 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                                )}>
                                </div>

                                {/* Lead Info */}
                                <div className="flex items-center gap-3 w-[280px] overflow-hidden">
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
                                        theme === 'dark'
                                            ? 'bg-[#d97757]/10 text-[#d97757]'
                                            : 'bg-blue-50 text-blue-600'
                                    )}>
                                        {(item.email || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                        <p className={cn(
                                            'text-sm font-medium truncate',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {item.email}
                                        </p>
                                        <p className="text-[11px] opacity-50 truncate uppercase tracking-tight">
                                            {item.firstName} {item.lastName}
                                        </p>
                                    </div>
                                </div>

                                {/* Sending Account */}
                                <div className="flex items-center gap-2 flex-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <div className={cn(
                                        'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded',
                                        theme === 'dark' ? 'bg-[#252a33] text-gray-400' : 'bg-gray-100 text-gray-500'
                                    )}>
                                        Sender Node
                                    </div>
                                    <p className="text-sm truncate">
                                        {item.assignedAccount?.name || item.assignedAccount?.fromEmail || 'Auto-Selecting'}
                                    </p>
                                </div>

                                {/* Status & Timing */}
                                <div className="flex items-center gap-3 ml-auto shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-emerald-500" />
                                        <span className="text-xs font-mono font-bold text-emerald-500">
                                            {item.scheduledTime ? new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T+${idx * 15}m`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer - Fixed at bottom */}
            <div className={cn(
                'shrink-0 px-4 py-3 border-t flex items-center justify-between',
                theme === 'dark' ? 'bg-[#0a0c0f] border-gray-800' : 'bg-gray-50 border-gray-100'
            )}>
                <div className="text-[11px] font-medium opacity-50">
                    Showing {filteredQueue.length} of {queueData.length} queued emails
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchSmtpAccounts()}
                        className={cn(
                            'h-8 px-3 rounded-lg text-xs',
                            theme === 'dark' ? 'border-gray-700' : ''
                        )}
                    >
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Sync
                    </Button>
                </div>
            </div>
        </div>
    );
}
