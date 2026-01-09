import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Star, Trash2, Archive, MailOpen, MoreVertical,
    Reply, ReplyAll, Forward, Printer, Download, ExternalLink,
    Clock, Paperclip, User, Loader2, FolderInput, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { useTheme } from '../../lib/ThemeContext';

const API_BASE = '/api/inbox';

interface Attachment {
    id: string;
    filename: string;
    contentType: string;
    size: number;
    contentId?: string | null;
}

export interface Message {
    id: string;
    uid: number;
    accountId: string;
    folder: string;
    from: string;
    fromName: string;
    fromEmail: string;
    to: string;
    cc?: string;
    subject: string;
    date: string;
    text: string;
    html: string;
    isRead: boolean;
    isStarred: boolean;
    hasAttachments: boolean;
    attachmentCount: number;
    attachments?: Attachment[];
    snippet: string;
    messageId: string;
    inReplyTo?: string;
    references?: string[];
}

interface EmailViewerProps {
    message: Message;
    onBack: () => void;
    onDelete: () => void;
    onMarkAsRead: () => void;
    onReply?: () => void;
    onReplyAll?: () => void;
    onForward?: () => void;
    onStarToggle?: (starred: boolean) => void;
    onArchive?: () => void;
    onMessageUpdate?: (message: Message) => void;
}

export default function EmailViewer({
    message,
    onBack,
    onDelete,
    onMarkAsRead,
    onReply,
    onReplyAll,
    onForward,
    onStarToggle,
    onArchive,
    onMessageUpdate
}: EmailViewerProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isStarred, setIsStarred] = useState(message.isStarred);
    const [showRawHtml, setShowRawHtml] = useState(false);
    const [starring, setStarring] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (email: string) => {
        const colors = [
            'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
            'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
            'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
            'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
        ];
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = email.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const handleStarToggle = async () => {
        if (starring) return;

        setStarring(true);
        const newStarred = !isStarred;

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/message/${message.accountId}/${message.uid}/star`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ starred: newStarred }),
            });

            if (response.ok) {
                setIsStarred(newStarred);
                onStarToggle?.(newStarred);
                onMessageUpdate?.({ ...message, isStarred: newStarred });
                toast.success(newStarred ? 'Message starred' : 'Star removed');
            } else {
                throw new Error('Failed to toggle star');
            }
        } catch (err) {
            toast.error('Failed to update star');
        } finally {
            setStarring(false);
        }
    };

    const handleArchive = async () => {
        if (archiving) return;

        setArchiving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/message/${message.accountId}/${message.uid}/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromFolder: message.folder,
                    toFolder: 'Archive'
                }),
            });

            if (response.ok) {
                toast.success('Message archived');
                onArchive?.();
                onBack(); // Go back to inbox
            } else {
                throw new Error('Failed to archive');
            }
        } catch (err) {
            toast.error('Failed to archive message');
        } finally {
            setArchiving(false);
        }
    };

    const handleDownloadAttachment = async (attachment: Attachment, index: number) => {
        if (downloadingAttachment) return;

        setDownloadingAttachment(attachment.id);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(
                `${API_BASE}/attachment/${message.accountId}/${message.uid}/${index}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Failed to download');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Attachment downloaded');
        } catch (err) {
            toast.error('Failed to download attachment');
        } finally {
            setDownloadingAttachment(null);
        }
    };

    const handleMoveToFolder = async (folder: string) => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/message/${message.accountId}/${message.uid}/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromFolder: message.folder,
                    toFolder: folder
                }),
            });

            if (response.ok) {
                toast.success(`Moved to ${folder}`);
                onBack();
            } else {
                throw new Error('Failed to move');
            }
        } catch (err) {
            toast.error('Failed to move message');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Toolbar */}
            <div className={cn(
                'flex items-center gap-1 px-4 py-2 border-b shrink-0',
                isDark ? 'border-neutral-800' : 'border-gray-200'
            )}>
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className={cn(
                        'rounded-full',
                        isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                    )}
                >
                    <ArrowLeft className={cn(
                        'w-5 h-5',
                        isDark ? 'text-white' : 'text-gray-600'
                    )} />
                </Button>

                {/* Archive */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleArchive}
                    disabled={archiving}
                    className={cn(
                        'rounded-full',
                        isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                    )}
                    title="Archive"
                >
                    {archiving ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                        <Archive className={cn(
                            'w-5 h-5',
                            isDark ? 'text-neutral-400' : 'text-gray-500'
                        )} />
                    )}
                </Button>

                {/* Delete */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className={cn(
                        'rounded-full',
                        isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                    )}
                    title="Delete"
                >
                    <Trash2 className={cn(
                        'w-5 h-5',
                        isDark ? 'text-neutral-400' : 'text-gray-500'
                    )} />
                </Button>

                {/* Mark as read/unread */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMarkAsRead}
                    className={cn(
                        'rounded-full',
                        isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                    )}
                    title="Mark as unread"
                >
                    <MailOpen className={cn(
                        'w-5 h-5',
                        isDark ? 'text-neutral-400' : 'text-gray-500'
                    )} />
                </Button>

                {/* Move to folder dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'rounded-full',
                                isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                            )}
                            title="Move to folder"
                        >
                            <FolderInput className={cn(
                                'w-5 h-5',
                                isDark ? 'text-neutral-400' : 'text-gray-500'
                            )} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className={cn(
                            'w-40',
                            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                        )}
                    >
                        <DropdownMenuItem
                            onClick={() => handleMoveToFolder('Archive')}
                            className={cn(isDark ? 'text-white hover:bg-neutral-800' : '')}
                        >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleMoveToFolder('Spam')}
                            className={cn(isDark ? 'text-white hover:bg-neutral-800' : '')}
                        >
                            <Tag className="w-4 h-4 mr-2" />
                            Spam
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleMoveToFolder('Trash')}
                            className={cn(isDark ? 'text-white hover:bg-neutral-800' : '')}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Trash
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1" />

                {/* More Options */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'rounded-full',
                                isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                            )}
                        >
                            <MoreVertical className={cn(
                                'w-5 h-5',
                                isDark ? 'text-neutral-400' : 'text-gray-500'
                            )} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className={cn(
                            'w-48',
                            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                        )}
                    >
                        <DropdownMenuItem
                            onClick={() => setShowRawHtml(!showRawHtml)}
                            className={cn(isDark ? 'text-white hover:bg-neutral-800' : '')}
                        >
                            {showRawHtml ? 'Show Formatted' : 'Show Original'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className={cn(isDark ? 'text-white hover:bg-neutral-800' : '')}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={isDark ? 'bg-neutral-800' : ''} />
                        <DropdownMenuItem className={cn(isDark ? 'text-white hover:bg-neutral-800' : '')}>
                            <Download className="w-4 h-4 mr-2" />
                            Download message
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Email Content */}
            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    {/* Subject */}
                    <div className="flex items-start gap-4 mb-6">
                        <h1 className={cn(
                            'text-2xl font-normal flex-1',
                            isDark ? 'text-white' : 'text-gray-900'
                        )}>
                            {message.subject}
                        </h1>
                        <button
                            onClick={handleStarToggle}
                            disabled={starring}
                            className={cn(
                                'shrink-0 p-1 rounded-full transition-all',
                                isStarred
                                    ? 'text-yellow-400'
                                    : isDark
                                        ? 'text-neutral-500 hover:text-neutral-300'
                                        : 'text-gray-400 hover:text-gray-600',
                                starring && 'opacity-50'
                            )}
                        >
                            {starring ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Star className={cn('w-6 h-6', isStarred && 'fill-current')} />
                            )}
                        </button>
                    </div>

                    {/* Sender Info */}
                    <div className={cn(
                        'flex items-start gap-4 pb-6 border-b mb-6',
                        isDark ? 'border-neutral-800' : 'border-gray-200'
                    )}>
                        {/* Avatar */}
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0',
                            getAvatarColor(message.fromEmail)
                        )}>
                            {getInitials(message.fromName || message.fromEmail)}
                        </div>

                        {/* Sender Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                    'font-medium',
                                    isDark ? 'text-white' : 'text-gray-900'
                                )}>
                                    {message.fromName || message.fromEmail}
                                </span>
                                <span className={cn(
                                    'text-sm',
                                    isDark ? 'text-neutral-400' : 'text-gray-500'
                                )}>
                                    &lt;{message.fromEmail}&gt;
                                </span>
                            </div>
                            <div className={cn(
                                'text-sm mt-0.5',
                                isDark ? 'text-neutral-400' : 'text-gray-500'
                            )}>
                                to {message.to}
                                {message.cc && <span className="ml-2">cc: {message.cc}</span>}
                            </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className={cn(
                                'text-sm',
                                isDark ? 'text-neutral-400' : 'text-gray-500'
                            )}>
                                {formatDate(message.date)}
                            </span>
                        </div>
                    </div>

                    {/* Attachments */}
                    {message.hasAttachments && message.attachments && message.attachments.length > 0 && (
                        <div className={cn(
                            'p-4 rounded-lg mb-6',
                            isDark ? 'bg-neutral-900' : 'bg-gray-50'
                        )}>
                            <div className="flex items-center gap-2 mb-3">
                                <Paperclip className={cn(
                                    'w-5 h-5',
                                    isDark ? 'text-neutral-400' : 'text-gray-500'
                                )} />
                                <span className={cn(
                                    'text-sm font-medium',
                                    isDark ? 'text-white' : 'text-gray-900'
                                )}>
                                    {message.attachmentCount} attachment{message.attachmentCount > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {message.attachments.map((att, index) => (
                                    <button
                                        key={att.id}
                                        onClick={() => handleDownloadAttachment(att, index)}
                                        disabled={downloadingAttachment === att.id}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                                            isDark
                                                ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                                                : 'bg-white border-gray-200 hover:bg-gray-100',
                                            downloadingAttachment === att.id && 'opacity-50'
                                        )}
                                    >
                                        {downloadingAttachment === att.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        ) : (
                                            <Download className={cn(
                                                'w-4 h-4',
                                                isDark ? 'text-blue-400' : 'text-blue-600'
                                            )} />
                                        )}
                                        <span className={cn(
                                            'text-sm',
                                            isDark ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {att.filename}
                                        </span>
                                        <span className={cn(
                                            'text-xs',
                                            isDark ? 'text-neutral-400' : 'text-gray-500'
                                        )}>
                                            ({formatFileSize(att.size)})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Email Body */}
                    <div className={cn(
                        'email-body prose max-w-none',
                        isDark ? 'prose-invert' : ''
                    )}>
                        {showRawHtml ? (
                            <pre className={cn(
                                'p-4 rounded-lg text-xs overflow-auto',
                                isDark ? 'bg-neutral-900' : 'bg-gray-50'
                            )}>
                                {message.html || message.text}
                            </pre>
                        ) : message.html ? (
                            <div
                                className={cn(
                                    'email-html-content',
                                    isDark ? 'text-white' : 'text-gray-900'
                                )}
                                dangerouslySetInnerHTML={{ __html: message.html }}
                            />
                        ) : (
                            <div className={cn(
                                'whitespace-pre-wrap',
                                isDark ? 'text-white' : 'text-gray-900'
                            )}>
                                {message.text}
                            </div>
                        )}
                    </div>

                    {/* Reply Actions */}
                    <div className={cn(
                        'flex items-center gap-3 mt-8 pt-6 border-t',
                        isDark ? 'border-neutral-800' : 'border-gray-200'
                    )}>
                        <Button
                            variant="outline"
                            onClick={onReply}
                            className={cn(
                                'flex items-center gap-2',
                                isDark
                                    ? 'border-neutral-700 text-white hover:bg-neutral-800'
                                    : 'border-gray-200'
                            )}
                        >
                            <Reply className="w-4 h-4" />
                            Reply
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onReplyAll}
                            className={cn(
                                'flex items-center gap-2',
                                isDark
                                    ? 'border-neutral-700 text-white hover:bg-neutral-800'
                                    : 'border-gray-200'
                            )}
                        >
                            <ReplyAll className="w-4 h-4" />
                            Reply All
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onForward}
                            className={cn(
                                'flex items-center gap-2',
                                isDark
                                    ? 'border-neutral-700 text-white hover:bg-neutral-800'
                                    : 'border-gray-200'
                            )}
                        >
                            <Forward className="w-4 h-4" />
                            Forward
                        </Button>
                    </div>
                </div>
            </ScrollArea>
        </motion.div>
    );
}
