import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Trash2, Loader2, RefreshCw, Clock, Search,
    ChevronLeft, Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/ScrollArea';
import { useTheme } from '../../lib/ThemeContext';
import ComposeEmailModal, { OriginalMessage } from './ComposeEmailModal';

const API_BASE = '/api/inbox';

interface Draft {
    id: string;
    accountId: string;
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    createdAt: string;
    updatedAt: string;
    inReplyTo?: string;
}

interface DraftsViewProps {
    smtpAccounts: Array<{
        id: string;
        name: string;
        fromEmail: string;
    }>;
    onBack?: () => void;
}

export default function DraftsView({ smtpAccounts, onBack }: DraftsViewProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/drafts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDrafts(data);
            }
        } catch (err) {
            console.error('Failed to fetch drafts:', err);
            toast.error('Failed to load drafts');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDraft = async (draft: Draft, e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!confirm('Delete this draft?')) return;

        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`${API_BASE}/drafts/${draft.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setDrafts(prev => prev.filter(d => d.id !== draft.id));
            toast.success('Draft deleted');
        } catch (err) {
            toast.error('Failed to delete draft');
        }
    };

    const handleOpenDraft = (draft: Draft) => {
        setSelectedDraft(draft);
        setShowComposeModal(true);
    };

    const handleComposeSuccess = () => {
        setShowComposeModal(false);
        setSelectedDraft(null);
        fetchDrafts();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getAccountEmail = (accountId: string) => {
        const account = smtpAccounts.find(a => a.id === accountId);
        return account?.fromEmail || 'Unknown';
    };

    const filteredDrafts = drafts.filter(d => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            d.subject.toLowerCase().includes(query) ||
            d.to.toLowerCase().includes(query) ||
            d.textContent.toLowerCase().includes(query)
        );
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Header */}
            <div className={cn(
                'flex items-center gap-3 px-4 py-3 border-b flex-shrink-0',
                isDark ? 'border-neutral-800' : 'border-gray-200'
            )}>
                {onBack && (
                    <button
                        onClick={onBack}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
                        )}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="flex-1">
                    <h1 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                        Drafts
                    </h1>
                    <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                        {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={fetchDrafts}
                    disabled={loading}
                    className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                        isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
                    )}
                >
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Search */}
            <div className={cn('px-4 py-3 border-b flex-shrink-0', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                <div className={cn(
                    'flex items-center gap-2 h-9 px-3 rounded-lg',
                    isDark ? 'bg-neutral-900' : 'bg-gray-100'
                )}>
                    <Search className={cn('w-4 h-4', isDark ? 'text-neutral-500' : 'text-gray-400')} />
                    <input
                        type="text"
                        placeholder="Search drafts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'flex-1 bg-transparent border-0 outline-none text-sm',
                            isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                        )}
                    />
                </div>
            </div>

            {/* Drafts List */}
            <ScrollArea className="flex-1">
                {loading && drafts.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className={cn('w-6 h-6 animate-spin', isDark ? 'text-orange-500' : 'text-blue-500')} />
                    </div>
                ) : filteredDrafts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className={cn(
                            'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                            isDark ? 'bg-neutral-800' : 'bg-gray-100'
                        )}>
                            <FileText className={cn('w-7 h-7', isDark ? 'text-neutral-600' : 'text-gray-400')} />
                        </div>
                        <p className={cn('text-sm', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                            {searchQuery ? 'No matching drafts' : 'No drafts saved'}
                        </p>
                    </div>
                ) : (
                    <div>
                        <AnimatePresence>
                            {filteredDrafts.map((draft, index) => (
                                <motion.div
                                    key={draft.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    onClick={() => handleOpenDraft(draft)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-colors group',
                                        isDark
                                            ? 'border-neutral-800 hover:bg-neutral-800/50'
                                            : 'border-gray-100 hover:bg-gray-50'
                                    )}
                                >
                                    <div className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                        isDark ? 'bg-neutral-800' : 'bg-gray-100'
                                    )}>
                                        <FileText className={cn('w-5 h-5', isDark ? 'text-orange-500' : 'text-orange-600')} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-sm font-medium truncate',
                                                isDark ? 'text-white' : 'text-gray-900'
                                            )}>
                                                {draft.subject || '(No subject)'}
                                            </span>
                                            <span className={cn(
                                                'text-xs',
                                                isDark ? 'text-red-400' : 'text-red-600'
                                            )}>
                                                Draft
                                            </span>
                                        </div>
                                        <div className={cn('text-xs truncate mt-0.5', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                            To: {draft.to || '(no recipients)'}
                                        </div>
                                        <div className={cn('text-xs truncate mt-0.5', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                            {draft.textContent?.slice(0, 80) || '(Empty)'}...
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                            {formatDate(draft.updatedAt)}
                                        </span>
                                        <button
                                            onClick={(e) => handleDeleteDraft(draft, e)}
                                            className={cn(
                                                'p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                                                isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                                            )}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>

            {/* Compose Modal for editing draft */}
            <ComposeEmailModal
                isOpen={showComposeModal}
                onClose={() => {
                    setShowComposeModal(false);
                    setSelectedDraft(null);
                    fetchDrafts();
                }}
                smtpAccounts={smtpAccounts.map(a => ({
                    id: a.id,
                    name: a.name,
                    fromEmail: a.fromEmail,
                    fromName: a.name,
                }))}
                mode="compose"
                originalMessage={null}
                onSuccess={handleComposeSuccess}
                defaultAccountId={selectedDraft?.accountId}
                draftId={selectedDraft?.id}
            />
        </div>
    );
}
