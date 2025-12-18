import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, Send, FileEdit, Archive, Trash2, Star, AlertCircle, Settings,
    Search, RefreshCw, MoreVertical, ChevronDown, Plus, X, Mail,
    Loader2, CheckCircle, XCircle, Clock, CheckCheck, Paperclip
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/ScrollArea';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarFallback } from '../ui/Avatar';
import { Separator } from '../ui/Separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { toast } from 'sonner';

const API_BASE = '/api/bulk-email';

// Types
interface Email {
    id: string;
    from: string;
    fromEmail: string;
    to: string[];
    subject: string;
    preview: string;
    body: string;
    date: string;
    isRead: boolean;
    isStarred: boolean;
    labels: string[];
    folder: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash' | 'spam';
    attachments?: { name: string; size: string }[];
}

interface SmtpAccount {
    id: string;
    name: string;
    fromEmail: string;
    fromName: string;
}

interface Campaign {
    id: string;
    name: string;
    subject: string;
    status: 'draft' | 'sending' | 'completed' | 'failed';
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    createdAt: string;
}

type FolderType = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash' | 'spam';

const folders = [
    { id: 'inbox' as FolderType, label: 'Inbox', icon: Inbox, count: 12 },
    { id: 'sent' as FolderType, label: 'Sent', icon: Send, count: 0 },
    { id: 'drafts' as FolderType, label: 'Drafts', icon: FileEdit, count: 2 },
    { id: 'archive' as FolderType, label: 'Archive', icon: Archive, count: 0 },
    { id: 'spam' as FolderType, label: 'Spam', icon: AlertCircle, count: 3 },
    { id: 'trash' as FolderType, label: 'Trash', icon: Trash2, count: 0 },
];

// Generate mock emails for demonstration
const generateMockEmails = (): Email[] => {
    return [
        {
            id: '1',
            from: 'John Smith',
            fromEmail: 'john@company.com',
            to: ['me@example.com'],
            subject: 'Q4 Marketing Campaign Results',
            preview: 'Hi team, I wanted to share the results from our Q4 campaign. We achieved a 23% open rate...',
            body: `<p>Hi team,</p><p>I wanted to share the results from our Q4 marketing campaign. We achieved a 23% open rate and a 4.5% click-through rate, which exceeds our targets!</p><p>Key highlights:</p><ul><li>Total emails sent: 45,000</li><li>Opens: 10,350</li><li>Clicks: 2,025</li><li>Conversions: 156</li></ul><p>Great work everyone!</p><p>Best,<br/>John</p>`,
            date: '2025-12-16T10:30:00',
            isRead: false,
            isStarred: true,
            labels: ['important', 'work'],
            folder: 'inbox',
        },
        {
            id: '2',
            from: 'Sarah Wilson',
            fromEmail: 'sarah@startup.io',
            to: ['me@example.com'],
            subject: 'Partnership Opportunity',
            preview: 'Hello! I came across your platform and I think there could be some great synergies...',
            body: `<p>Hello!</p><p>I came across your platform and I think there could be some great synergies between our companies.</p><p>Would you be available for a quick call this week to discuss potential collaboration opportunities?</p><p>Looking forward to hearing from you.</p><p>Sarah Wilson<br/>Head of Partnerships<br/>Startup.io</p>`,
            date: '2025-12-16T09:15:00',
            isRead: false,
            isStarred: false,
            labels: [],
            folder: 'inbox',
        },
        {
            id: '3',
            from: 'Newsletter Bot',
            fromEmail: 'news@techweekly.com',
            to: ['me@example.com'],
            subject: 'This Week in Tech: AI Updates',
            preview: 'Your weekly tech digest is here! Top stories include the latest AI developments...',
            body: `<h2>This Week in Tech</h2><p>Your weekly digest of the top tech stories.</p><h3>AI Updates</h3><p>Major developments in the AI space this week...</p>`,
            date: '2025-12-15T18:00:00',
            isRead: true,
            isStarred: false,
            labels: ['newsletter'],
            folder: 'inbox',
        },
        {
            id: '4',
            from: 'Me',
            fromEmail: 'me@example.com',
            to: ['team@company.com'],
            subject: 'Re: Project Update',
            preview: 'Thanks for the update. I have reviewed the documents and everything looks good...',
            body: `<p>Thanks for the update.</p><p>I have reviewed the documents and everything looks good. Let's proceed with the next phase.</p>`,
            date: '2025-12-15T14:30:00',
            isRead: true,
            isStarred: false,
            labels: [],
            folder: 'sent',
        },
    ];
};

export default function MailDashboard() {
    const [currentFolder, setCurrentFolder] = useState<FolderType>('inbox');
    const [emails, setEmails] = useState<Email[]>(generateMockEmails());
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCompose, setShowCompose] = useState(false);
    const [loading, setLoading] = useState(false);
    const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    // Compose state
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        body: '',
        smtpId: '',
    });
    const [sending, setSending] = useState(false);

    // Filter emails by folder and search
    const filteredEmails = emails.filter(email => {
        const matchesFolder = email.folder === currentFolder;
        const matchesSearch = searchQuery === '' ||
            email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.preview.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder && matchesSearch;
    });

    const unreadCount = emails.filter(e => !e.isRead && e.folder === 'inbox').length;

    // Toggle email selection
    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Toggle star
    const toggleStar = (id: string) => {
        setEmails(prev => prev.map(e =>
            e.id === id ? { ...e, isStarred: !e.isStarred } : e
        ));
    };

    // Mark as read
    const markAsRead = (id: string) => {
        setEmails(prev => prev.map(e =>
            e.id === id ? { ...e, isRead: true } : e
        ));
    };

    // Delete emails
    const deleteEmails = (ids: string[]) => {
        setEmails(prev => prev.map(e =>
            ids.includes(e.id) ? { ...e, folder: 'trash' as FolderType } : e
        ));
        setSelectedIds([]);
        toast.success(`${ids.length} email(s) moved to trash`);
    };

    // Archive emails
    const archiveEmails = (ids: string[]) => {
        setEmails(prev => prev.map(e =>
            ids.includes(e.id) ? { ...e, folder: 'archive' as FolderType } : e
        ));
        setSelectedIds([]);
        toast.success(`${ids.length} email(s) archived`);
    };

    // Handle compose send
    const handleSend = async () => {
        if (!composeData.to || !composeData.subject || !composeData.body) {
            toast.error('Please fill all fields');
            return;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/quick-send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    recipients: composeData.to,
                    subject: composeData.subject,
                    htmlContent: composeData.body.replace(/\n/g, '<br>'),
                    textContent: composeData.body,
                    smtpAccountId: composeData.smtpId || null,
                }),
            });

            if (!res.ok) throw new Error('Failed to send');

            toast.success('Email sent successfully!');
            setShowCompose(false);
            setComposeData({ to: '', subject: '', body: '', smtpId: '' });

            // Add to sent folder
            const newEmail: Email = {
                id: Date.now().toString(),
                from: 'Me',
                fromEmail: 'me@example.com',
                to: composeData.to.split(',').map(e => e.trim()),
                subject: composeData.subject,
                preview: composeData.body.substring(0, 100),
                body: composeData.body,
                date: new Date().toISOString(),
                isRead: true,
                isStarred: false,
                labels: [],
                folder: 'sent',
            };
            setEmails(prev => [newEmail, ...prev]);
        } catch (err) {
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    // Refresh data
    const handleRefresh = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const [smtpRes, campaignsRes] = await Promise.all([
                fetch(`${API_BASE}/smtp-accounts`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (smtpRes.ok) setSmtpAccounts(await smtpRes.json());
            if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-[calc(100vh-64px)] flex bg-black text-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 flex flex-col">
                {/* Compose Button */}
                <div className="p-4">
                    <Button
                        onClick={() => setShowCompose(true)}
                        className="w-full rounded-2xl shadow-lg shadow-white/10"
                        size="lg"
                    >
                        <Plus className="w-5 h-5" />
                        Compose
                    </Button>
                </div>

                {/* Folders */}
                <ScrollArea className="flex-1">
                    <div className="px-2 space-y-1">
                        {folders.map((folder) => {
                            const count = folder.id === 'inbox' ? unreadCount :
                                emails.filter(e => e.folder === folder.id).length;
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => {
                                        setCurrentFolder(folder.id);
                                        setSelectedEmail(null);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                                        currentFolder === folder.id
                                            ? "bg-white/10 text-white"
                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <folder.icon className="w-5 h-5" />
                                    <span className="flex-1 text-left">{folder.label}</span>
                                    {count > 0 && (
                                        <span className={cn(
                                            "text-xs font-semibold",
                                            currentFolder === folder.id ? "text-white" : "text-white/40"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <Separator className="my-4" />

                    {/* Labels */}
                    <div className="px-4 mb-2">
                        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Labels</span>
                    </div>
                    <div className="px-2 space-y-1">
                        {['Important', 'Work', 'Personal', 'Newsletter'].map((label) => (
                            <button
                                key={label}
                                className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all"
                            >
                                <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    label === 'Important' && "bg-red-500",
                                    label === 'Work' && "bg-blue-500",
                                    label === 'Personal' && "bg-green-500",
                                    label === 'Newsletter' && "bg-purple-500"
                                )} />
                                {label}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="h-14 border-b border-white/10 px-4 flex items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search emails..."
                            className="pl-10 rounded-full bg-white/5 border-white/10 focus:bg-white/10"
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-400">Empty trash</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Email List + Reading Pane */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Email List */}
                    <div className={cn(
                        "border-r border-white/10 flex flex-col transition-all",
                        selectedEmail ? "w-[400px]" : "flex-1"
                    )}>
                        {/* List Actions */}
                        {selectedIds.length > 0 && (
                            <div className="h-12 px-4 flex items-center gap-2 border-b border-white/10 bg-white/5">
                                <span className="text-sm text-white/60">{selectedIds.length} selected</span>
                                <Button variant="ghost" size="sm" onClick={() => archiveEmails(selectedIds)}>
                                    <Archive className="w-4 h-4 mr-1" /> Archive
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteEmails(selectedIds)}>
                                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        <ScrollArea className="flex-1">
                            {filteredEmails.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-white/40">
                                    <Mail className="w-12 h-12 mb-4 opacity-50" />
                                    <p>No emails in {currentFolder}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {filteredEmails.map((email) => (
                                        <div
                                            key={email.id}
                                            onClick={() => {
                                                setSelectedEmail(email);
                                                markAsRead(email.id);
                                            }}
                                            className={cn(
                                                "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group",
                                                selectedEmail?.id === email.id
                                                    ? "bg-white/10"
                                                    : "hover:bg-white/5",
                                                !email.isRead && "bg-white/[0.02]"
                                            )}
                                        >
                                            {/* Checkbox */}
                                            <div
                                                onClick={(e) => { e.stopPropagation(); toggleSelect(email.id); }}
                                                className={cn(
                                                    "w-5 h-5 rounded border border-white/20 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors",
                                                    selectedIds.includes(email.id) ? "bg-white border-white" : "hover:border-white/40"
                                                )}
                                            >
                                                {selectedIds.includes(email.id) && (
                                                    <CheckCheck className="w-3 h-3 text-black" />
                                                )}
                                            </div>

                                            {/* Star */}
                                            <button

                                                onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                                                className="shrink-0 mt-0.5"
                                            >
                                                <Star className={cn(
                                                    "w-4 h-4 transition-colors",
                                                    email.isStarred ? "fill-yellow-500 text-yellow-500" : "text-white/20 hover:text-yellow-500"
                                                )} />
                                            </button>

                                            {/* Avatar */}
                                            <Avatar className="w-8 h-8 shrink-0">
                                                <AvatarFallback className="bg-white/10 text-xs">
                                                    {email.from.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "font-medium truncate",
                                                        !email.isRead ? "text-white" : "text-white/70"
                                                    )}>
                                                        {email.from}
                                                    </span>
                                                    {email.labels.includes('important') && (
                                                        <Badge variant="destructive" className="text-[10px] px-1.5">!</Badge>
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    !email.isRead ? "text-white/80" : "text-white/50"
                                                )}>
                                                    {email.subject}
                                                </p>
                                                <p className="text-xs text-white/40 truncate">
                                                    {email.preview}
                                                </p>
                                            </div>

                                            {/* Date */}
                                            <div className="text-xs text-white/40 shrink-0">
                                                {formatDate(email.date)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Reading Pane */}
                    <AnimatePresence>
                        {selectedEmail && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                {/* Email Header */}
                                <div className="p-6 border-b border-white/10">
                                    <div className="flex items-start justify-between mb-4">
                                        <h1 className="text-xl font-semibold">{selectedEmail.subject}</h1>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon">
                                                <Archive className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteEmails([selectedEmail.id])}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-10 h-10">
                                            <AvatarFallback className="bg-white/10">
                                                {selectedEmail.from.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{selectedEmail.from}</span>
                                                <span className="text-sm text-white/40">&lt;{selectedEmail.fromEmail}&gt;</span>
                                            </div>
                                            <div className="text-sm text-white/50">
                                                to {selectedEmail.to.join(', ')}
                                            </div>
                                        </div>
                                        <div className="text-sm text-white/40">
                                            {new Date(selectedEmail.date).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Email Body */}
                                <ScrollArea className="flex-1 p-6">
                                    <div
                                        className="prose prose-invert max-w-none text-white/80"
                                        dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                                    />
                                </ScrollArea>

                                {/* Reply Bar */}
                                <div className="p-4 border-t border-white/10">
                                    <div className="flex gap-2">
                                        <Input placeholder="Reply to this email..." className="flex-1" />
                                        <Button>Send</Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {showCompose && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center"
                        onClick={() => setShowCompose(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                        >
                            {/* Compose Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                                <h3 className="font-medium">New Message</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowCompose(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Compose Form */}
                            <div className="p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-white/40 w-12">To</span>
                                    <Input
                                        value={composeData.to}
                                        onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                                        placeholder="recipient@example.com"
                                        className="border-0 bg-transparent focus-visible:ring-0 px-0"
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-white/40 w-12">Subject</span>
                                    <Input
                                        value={composeData.subject}
                                        onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                                        placeholder="Email subject"
                                        className="border-0 bg-transparent focus-visible:ring-0 px-0"
                                    />
                                </div>
                                <Separator />
                                <Textarea
                                    value={composeData.body}
                                    onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                                    placeholder="Write your message..."
                                    className="min-h-[200px] border-0 bg-transparent focus-visible:ring-0 resize-none"
                                />
                            </div>

                            {/* Compose Footer */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon">
                                        <Paperclip className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" onClick={() => setShowCompose(false)}>
                                        Discard
                                    </Button>
                                    <Button onClick={handleSend} disabled={sending}>
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
