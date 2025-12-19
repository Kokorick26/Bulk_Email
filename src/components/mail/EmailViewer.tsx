import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Star, Trash2, Archive, MailOpen, MoreVertical,
    Reply, ReplyAll, Forward, Printer, Download, ExternalLink,
    Clock, Paperclip, User
} from 'lucide-react';
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

interface Attachment {
    id: string;
    filename: string;
    contentType: string;
    size: number;
    contentId?: string | null;
}

interface Message {
    id: string;
    uid: number;
    accountId: string;
    folder: string;
    from: string;
    fromName: string;
    fromEmail: string;
    to: string;
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
    onForward?: () => void;
}

export default function EmailViewer({ message, onBack, onDelete, onMarkAsRead, onReply, onForward }: EmailViewerProps) {
    const { theme } = useTheme();
    const [isStarred, setIsStarred] = useState(message.isStarred);
    const [showRawHtml, setShowRawHtml] = useState(false);

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

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Toolbar */}
            <div className={cn(
                'flex items-center gap-2 px-4 py-2 border-b shrink-0',
                theme === 'dark' ? 'border-[#3c4043]' : 'border-[#dadce0]'
            )}>
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className={cn(
                        'rounded-full',
                        theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                    )}
                >
                    <ArrowLeft className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#5f6368]'
                    )} />
                </Button>

                {/* Archive */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'rounded-full',
                        theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                    )}
                    title="Archive"
                >
                    <Archive className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                    )} />
                </Button>

                {/* Delete */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className={cn(
                        'rounded-full',
                        theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                    )}
                    title="Delete"
                >
                    <Trash2 className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                    )} />
                </Button>

                {/* Mark as read/unread */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMarkAsRead}
                    className={cn(
                        'rounded-full',
                        theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                    )}
                    title="Mark as unread"
                >
                    <MailOpen className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                    )} />
                </Button>

                <div className="flex-1" />

                {/* More Options */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'rounded-full',
                                theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                            )}
                        >
                            <MoreVertical className={cn(
                                'w-5 h-5',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className={cn(
                            'w-48',
                            theme === 'dark'
                                ? 'bg-[#303134] border-[#3c4043]'
                                : 'bg-white border-[#dadce0]'
                        )}
                    >
                        <DropdownMenuItem
                            onClick={() => setShowRawHtml(!showRawHtml)}
                            className={cn(
                                theme === 'dark' ? 'text-[#e8eaed] hover:bg-[#3c4043]' : ''
                            )}
                        >
                            {showRawHtml ? 'Show Formatted' : 'Show Original'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className={cn(
                            theme === 'dark' ? 'text-[#e8eaed] hover:bg-[#3c4043]' : ''
                        )}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={cn(
                            theme === 'dark' ? 'bg-[#3c4043]' : ''
                        )} />
                        <DropdownMenuItem className={cn(
                            theme === 'dark' ? 'text-[#e8eaed] hover:bg-[#3c4043]' : ''
                        )}>
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
                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                        )}>
                            {message.subject}
                        </h1>
                        <button
                            onClick={() => setIsStarred(!isStarred)}
                            className={cn(
                                'shrink-0 p-1 rounded-full transition-colors',
                                isStarred
                                    ? 'text-yellow-400'
                                    : theme === 'dark'
                                        ? 'text-[#5f6368] hover:text-[#9aa0a6]'
                                        : 'text-[#9aa0a6] hover:text-[#5f6368]'
                            )}
                        >
                            <Star className={cn('w-6 h-6', isStarred && 'fill-current')} />
                        </button>
                    </div>

                    {/* Sender Info */}
                    <div className={cn(
                        'flex items-start gap-4 pb-6 border-b mb-6',
                        theme === 'dark' ? 'border-[#3c4043]' : 'border-[#dadce0]'
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
                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                )}>
                                    {message.fromName || message.fromEmail}
                                </span>
                                <span className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                )}>
                                    &lt;{message.fromEmail}&gt;
                                </span>
                            </div>
                            <div className={cn(
                                'text-sm mt-0.5',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                to {message.to}
                            </div>
                        </div>

                        {/* Date & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className={cn(
                                'text-sm',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                {formatDate(message.date)}
                            </span>
                        </div>
                    </div>

                    {/* Attachments */}
                    {message.hasAttachments && (
                        <div className={cn(
                            'p-4 rounded-lg mb-6',
                            theme === 'dark' ? 'bg-[#303134]' : 'bg-[#f1f3f4]'
                        )}>
                            <div className="flex items-center gap-2 mb-3">
                                <Paperclip className={cn(
                                    'w-5 h-5',
                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                )} />
                                <span className={cn(
                                    'text-sm font-medium',
                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                )}>
                                    {message.attachmentCount} attachment{message.attachmentCount > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {message.attachments?.map((att) => (
                                    <div
                                        key={att.id}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                                            theme === 'dark'
                                                ? 'bg-[#202124] border-[#3c4043] hover:bg-[#3c4043]'
                                                : 'bg-white border-[#dadce0] hover:bg-[#e8eaed]'
                                        )}
                                        onClick={() => {
                                            // TODO: Implement attachment download
                                            console.log('Download attachment:', att.filename);
                                        }}
                                    >
                                        <Download className={cn(
                                            'w-4 h-4',
                                            theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                        )} />
                                        <span className={cn(
                                            'text-sm',
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>
                                            {att.filename}
                                        </span>
                                        <span className={cn(
                                            'text-xs',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            ({Math.round(att.size / 1024)} KB)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Email Body */}
                    <div className={cn(
                        'email-body prose max-w-none',
                        theme === 'dark' ? 'prose-invert' : ''
                    )}>
                        {showRawHtml ? (
                            <pre className={cn(
                                'p-4 rounded-lg text-xs overflow-auto',
                                theme === 'dark' ? 'bg-[#303134]' : 'bg-[#f1f3f4]'
                            )}>
                                {message.html || message.text}
                            </pre>
                        ) : message.html ? (
                            <div
                                className={cn(
                                    'email-html-content',
                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                )}
                                dangerouslySetInnerHTML={{ __html: message.html }}
                            />
                        ) : (
                            <div className={cn(
                                'whitespace-pre-wrap',
                                theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                            )}>
                                {message.text}
                            </div>
                        )}
                    </div>

                    {/* Reply Actions */}
                    <div className={cn(
                        'flex items-center gap-3 mt-8 pt-6 border-t',
                        theme === 'dark' ? 'border-[#3c4043]' : 'border-[#dadce0]'
                    )}>
                        <Button
                            variant="outline"
                            onClick={onReply}
                            className={cn(
                                'flex items-center gap-2',
                                theme === 'dark'
                                    ? 'border-[#3c4043] text-[#e8eaed] hover:bg-[#3c4043]'
                                    : 'border-[#dadce0]'
                            )}
                        >
                            <Reply className="w-4 h-4" />
                            Reply
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onForward}
                            className={cn(
                                'flex items-center gap-2',
                                theme === 'dark'
                                    ? 'border-[#3c4043] text-[#e8eaed] hover:bg-[#3c4043]'
                                    : 'border-[#dadce0]'
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
