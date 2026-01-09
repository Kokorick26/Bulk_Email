import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, Loader2, Paperclip, Image, Link2, Smile, Trash2,
    Minimize2, Maximize2, Bold, Italic, Underline, List, AlignLeft,
    ChevronDown, Reply, Forward, MoreHorizontal, Clock, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useTheme } from '../../lib/ThemeContext';

const API_BASE = '/api/inbox';

export interface SmtpAccount {
    id: string;
    name: string;
    fromEmail: string;
    fromName: string;
    isDefault?: boolean;
    signature?: string;
}

export interface ComposeMessage {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    html: string;
    text: string;
    attachments?: File[];
}

export interface OriginalMessage {
    id: string;
    uid: number;
    accountId: string;
    from: string;
    fromEmail: string;
    fromName: string;
    to: string;
    cc?: string;
    subject: string;
    date: string;
    text: string;
    html: string;
    messageId: string;
    references?: string[];
}

interface ComposeEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    smtpAccounts: SmtpAccount[];
    mode: 'compose' | 'reply' | 'replyAll' | 'forward';
    originalMessage?: OriginalMessage | null;
    onSuccess?: () => void;
    defaultAccountId?: string;
    draftId?: string;
}

export function ComposeEmailModal({
    isOpen,
    onClose,
    smtpAccounts,
    mode,
    originalMessage,
    onSuccess,
    defaultAccountId,
    draftId
}: ComposeEmailModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isMinimized, setIsMinimized] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [sending, setSending] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);

    // Form state
    const [selectedAccountId, setSelectedAccountId] = useState<string>(
        defaultAccountId || smtpAccounts.find(a => a.isDefault)?.id || smtpAccounts[0]?.id || ''
    );
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [to, setTo] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize based on mode and original message
    useEffect(() => {
        if (!isOpen) return;

        if (originalMessage && mode !== 'compose') {
            const account = smtpAccounts.find(a => a.id === originalMessage.accountId);
            if (account) setSelectedAccountId(account.id);

            if (mode === 'reply') {
                setTo(originalMessage.fromEmail);
                setSubject(originalMessage.subject.startsWith('Re:') ? originalMessage.subject : `Re: ${originalMessage.subject}`);
                setBodyHtml(buildQuotedReply(originalMessage, account?.signature));
            } else if (mode === 'replyAll') {
                setTo(originalMessage.fromEmail);
                // Parse original To and CC, exclude self
                const selfEmail = account?.fromEmail || '';
                const allRecipients = [
                    ...(originalMessage.to?.split(',').map(e => e.trim()) || []),
                    ...(originalMessage.cc?.split(',').map(e => e.trim()) || [])
                ].filter(e => e && !e.includes(selfEmail));
                setCc(allRecipients.join(', '));
                setShowCc(allRecipients.length > 0);
                setSubject(originalMessage.subject.startsWith('Re:') ? originalMessage.subject : `Re: ${originalMessage.subject}`);
                setBodyHtml(buildQuotedReply(originalMessage, account?.signature));
            } else if (mode === 'forward') {
                setSubject(originalMessage.subject.startsWith('Fwd:') ? originalMessage.subject : `Fwd: ${originalMessage.subject}`);
                setBodyHtml(buildForwardedContent(originalMessage, account?.signature));
            }
        } else {
            // New compose - add signature if available
            const account = smtpAccounts.find(a => a.id === selectedAccountId);
            if (account?.signature) {
                setBodyHtml(`<br><br>${account.signature}`);
            }
        }
    }, [isOpen, mode, originalMessage, smtpAccounts]);

    // Auto-save draft
    const saveDraft = useCallback(async () => {
        if (!selectedAccountId || (!to && !subject && !bodyHtml)) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/drafts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: currentDraftId,
                    accountId: selectedAccountId,
                    to,
                    cc,
                    bcc,
                    subject,
                    htmlContent: bodyHtml,
                    textContent: contentEditableRef.current?.innerText || '',
                    inReplyTo: originalMessage?.messageId || null,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (!currentDraftId) {
                    setCurrentDraftId(data.draft.id);
                }
            }
        } catch (err) {
            console.error('Failed to save draft:', err);
        } finally {
            setSaving(false);
        }
    }, [selectedAccountId, to, cc, bcc, subject, bodyHtml, currentDraftId, originalMessage]);

    // Auto-save after 3 seconds of inactivity
    useEffect(() => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        if (to || subject || bodyHtml) {
            autoSaveTimeoutRef.current = setTimeout(() => {
                saveDraft();
            }, 3000);
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [to, cc, bcc, subject, bodyHtml, saveDraft]);

    // Sync bodyHtml to contentEditable
    useEffect(() => {
        if (contentEditableRef.current && contentEditableRef.current.innerHTML !== bodyHtml) {
            contentEditableRef.current.innerHTML = bodyHtml;
        }
    }, [bodyHtml]);

    const buildQuotedReply = (msg: OriginalMessage, signature?: string) => {
        const sigBlock = signature ? `<br><br>${signature}` : '';
        return `
            <br><br>${sigBlock}
            <div style="border-left: 2px solid #ccc; padding-left: 12px; margin-left: 0; color: #666; font-size: 13px;">
                <p style="margin: 0 0 8px 0; font-size: 12px;">On ${new Date(msg.date).toLocaleString()}, <b>${msg.from}</b> wrote:</p>
                ${msg.html || `<p>${msg.text?.replace(/\n/g, '<br>')}</p>`}
            </div>
        `;
    };

    const buildForwardedContent = (msg: OriginalMessage, signature?: string) => {
        const sigBlock = signature ? `<br><br>${signature}` : '';
        return `
            <br><br>${sigBlock}
            <div style="border-top: 1px solid #ccc; padding-top: 12px; margin-top: 12px;">
                <p style="margin: 0; font-size: 12px; color: #666;"><b>---------- Forwarded message ---------</b></p>
                <p style="margin: 4px 0; font-size: 12px; color: #666;"><b>From:</b> ${msg.from}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #666;"><b>Date:</b> ${new Date(msg.date).toLocaleString()}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #666;"><b>Subject:</b> ${msg.subject}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #666;"><b>To:</b> ${msg.to}</p>
                <br>
                ${msg.html || `<p>${msg.text?.replace(/\n/g, '<br>')}</p>`}
            </div>
        `;
    };

    const handleSend = async () => {
        if (!to.trim()) {
            toast.error('Please enter a recipient');
            return;
        }
        if (!subject.trim()) {
            toast.error('Please enter a subject');
            return;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const endpoint = mode === 'compose' ? '/send' :
                mode === 'forward' ? '/forward' : '/reply';

            const payload: any = {
                accountId: selectedAccountId,
                to: to.split(',').map(e => e.trim()).filter(Boolean),
                subject,
                htmlContent: bodyHtml || contentEditableRef.current?.innerHTML || '',
                textContent: contentEditableRef.current?.innerText || '',
            };

            if (cc) payload.cc = cc.split(',').map(e => e.trim()).filter(Boolean);
            if (bcc) payload.bcc = bcc.split(',').map(e => e.trim()).filter(Boolean);

            if (mode === 'reply' || mode === 'replyAll') {
                payload.originalMessage = originalMessage;
                payload.replyContent = contentEditableRef.current?.innerText || '';
                payload.replyAll = mode === 'replyAll';
            } else if (mode === 'forward') {
                payload.originalMessage = originalMessage;
                payload.additionalContent = contentEditableRef.current?.innerText || '';
            }

            // Handle attachments
            if (attachments.length > 0) {
                const attachmentData = await Promise.all(
                    attachments.map(async file => ({
                        filename: file.name,
                        contentType: file.type,
                        content: await fileToBase64(file),
                    }))
                );
                payload.attachments = attachmentData;
            }

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send email');
            }

            toast.success(mode === 'forward' ? 'Email forwarded!' : mode.includes('reply') ? 'Reply sent!' : 'Email sent!');

            // Delete draft if exists
            if (currentDraftId) {
                try {
                    await fetch(`${API_BASE}/drafts/${currentDraftId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (e) {
                    console.error('Failed to delete draft:', e);
                }
            }

            onSuccess?.();
            handleClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleClose = () => {
        // Reset state
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBodyHtml('');
        setAttachments([]);
        setShowCc(false);
        setShowBcc(false);
        setCurrentDraftId(null);
        setIsMinimized(false);
        setIsFullScreen(false);
        onClose();
    };

    const handleDiscard = async () => {
        if (to || subject || bodyHtml) {
            if (!confirm('Discard this draft?')) return;
        }

        // Delete draft if exists
        if (currentDraftId) {
            try {
                const token = localStorage.getItem('bulkEmailToken');
                await fetch(`${API_BASE}/drafts/${currentDraftId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Failed to delete draft:', e);
            }
        }

        handleClose();
    };

    const handleAttachmentAdd = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments(prev => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        contentEditableRef.current?.focus();
    };

    const handleContentChange = () => {
        if (contentEditableRef.current) {
            setBodyHtml(contentEditableRef.current.innerHTML);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'reply': return 'Reply';
            case 'replyAll': return 'Reply All';
            case 'forward': return 'Forward';
            default: return 'New Message';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!isOpen && !isMinimized) return null;

    return (
        <AnimatePresence>
            {(isOpen || isMinimized) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        height: isMinimized ? 48 : isFullScreen ? '100vh' : 'auto',
                        width: isMinimized ? 320 : isFullScreen ? '100vw' : 640,
                    }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        'fixed z-50 overflow-hidden shadow-2xl rounded-t-lg',
                        isFullScreen ? 'inset-0 rounded-none' : 'bottom-0 right-6',
                        isDark ? 'bg-[#202124] border border-neutral-700' : 'bg-white border border-gray-200'
                    )}
                    style={{
                        maxHeight: isFullScreen ? '100vh' : '80vh',
                        maxWidth: isFullScreen ? '100vw' : '640px',
                    }}
                >
                    {/* Header */}
                    <div
                        className={cn(
                            'flex items-center justify-between px-4 py-2.5 cursor-pointer select-none',
                            isDark ? 'bg-[#303134]' : 'bg-[#404040]'
                        )}
                        onClick={() => isMinimized && setIsMinimized(false)}
                    >
                        <div className="flex items-center gap-2 text-white">
                            {mode !== 'compose' && (
                                mode === 'forward' ? <Forward className="w-4 h-4" /> : <Reply className="w-4 h-4" />
                            )}
                            <h2 className="text-sm font-medium">{getTitle()}</h2>
                            {saving && <span className="text-xs text-gray-400">Saving...</span>}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                                className="p-1.5 rounded hover:bg-white/10 transition-colors text-white"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsFullScreen(!isFullScreen); }}
                                className="p-1.5 rounded hover:bg-white/10 transition-colors text-white"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                                className="p-1.5 rounded hover:bg-white/10 transition-colors text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <div className="flex flex-col h-full max-h-[calc(80vh-48px)]">
                            {/* Form Fields */}
                            <div className={cn(
                                'divide-y flex-shrink-0 border-b',
                                isDark ? 'divide-neutral-700 border-neutral-700' : 'divide-gray-100 border-gray-100'
                            )}>
                                {/* From */}
                                <div className="flex items-center px-4 py-2 gap-2">
                                    <span className={cn('text-sm w-12', isDark ? 'text-neutral-400' : 'text-gray-500')}>From</span>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className={cn(
                                            'flex-1 bg-transparent border-0 outline-none text-sm cursor-pointer',
                                            isDark ? 'text-white' : 'text-gray-900'
                                        )}
                                    >
                                        {smtpAccounts.map(account => (
                                            <option
                                                key={account.id}
                                                value={account.id}
                                                className={isDark ? 'bg-[#202124] text-white' : 'bg-white text-gray-900'}
                                            >
                                                {account.fromName} &lt;{account.fromEmail}&gt;
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* To */}
                                <div className="flex items-center px-4 py-2 gap-2">
                                    <span className={cn('text-sm w-12', isDark ? 'text-neutral-400' : 'text-gray-500')}>To</span>
                                    <input
                                        type="text"
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        placeholder="Recipients"
                                        dir="ltr"
                                        className={cn(
                                            'flex-1 bg-transparent border-0 outline-none text-sm text-left',
                                            isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                                        )}
                                    />
                                    <div className="flex gap-2 text-sm">
                                        {!showCc && (
                                            <button
                                                onClick={() => setShowCc(true)}
                                                className={cn('hover:underline', isDark ? 'text-neutral-400' : 'text-gray-500')}
                                            >
                                                Cc
                                            </button>
                                        )}
                                        {!showBcc && (
                                            <button
                                                onClick={() => setShowBcc(true)}
                                                className={cn('hover:underline', isDark ? 'text-neutral-400' : 'text-gray-500')}
                                            >
                                                Bcc
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Cc */}
                                {showCc && (
                                    <div className="flex items-center px-4 py-2 gap-2">
                                        <span className={cn('text-sm w-12', isDark ? 'text-neutral-400' : 'text-gray-500')}>Cc</span>
                                        <input
                                            type="text"
                                            value={cc}
                                            onChange={(e) => setCc(e.target.value)}
                                            placeholder="Carbon copy"
                                            dir="ltr"
                                            className={cn(
                                                'flex-1 bg-transparent border-0 outline-none text-sm text-left',
                                                isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Bcc */}
                                {showBcc && (
                                    <div className="flex items-center px-4 py-2 gap-2">
                                        <span className={cn('text-sm w-12', isDark ? 'text-neutral-400' : 'text-gray-500')}>Bcc</span>
                                        <input
                                            type="text"
                                            value={bcc}
                                            onChange={(e) => setBcc(e.target.value)}
                                            placeholder="Blind carbon copy"
                                            dir="ltr"
                                            className={cn(
                                                'flex-1 bg-transparent border-0 outline-none text-sm text-left',
                                                isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Subject */}
                                <div className="flex items-center px-4 py-2 gap-2">
                                    <span className={cn('text-sm w-12', isDark ? 'text-neutral-400' : 'text-gray-500')}>Subject</span>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder=""
                                        dir="ltr"
                                        className={cn(
                                            'flex-1 bg-transparent border-0 outline-none text-sm text-left',
                                            isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Body - Rich Text Editor */}
                            <div className="flex-1 overflow-auto px-4 py-4 min-h-[200px]">
                                <div
                                    ref={contentEditableRef}
                                    contentEditable
                                    onInput={handleContentChange}
                                    dir="ltr"
                                    className={cn(
                                        'min-h-[180px] outline-none text-sm leading-relaxed text-left',
                                        isDark ? 'text-white' : 'text-gray-900'
                                    )}
                                    style={{
                                        wordBreak: 'break-word',
                                        textAlign: 'left',
                                        direction: 'ltr',
                                        unicodeBidi: 'plaintext'
                                    }}
                                />
                            </div>

                            {/* Attachments */}
                            {attachments.length > 0 && (
                                <div className={cn(
                                    'px-4 py-2 border-t flex flex-wrap gap-2',
                                    isDark ? 'border-neutral-700' : 'border-gray-100'
                                )}>
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                'flex items-center gap-2 px-2 py-1 rounded text-xs',
                                                isDark ? 'bg-neutral-700 text-white' : 'bg-gray-100 text-gray-700'
                                            )}
                                        >
                                            <FileText className="w-3 h-3" />
                                            <span className="max-w-[150px] truncate">{file.name}</span>
                                            <span className="text-gray-400">({formatFileSize(file.size)})</span>
                                            <button
                                                onClick={() => removeAttachment(index)}
                                                className="hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Toolbar */}
                            <div className={cn(
                                'flex items-center justify-between px-3 py-2 border-t flex-shrink-0',
                                isDark ? 'border-neutral-700' : 'border-gray-100'
                            )}>
                                <div className="flex items-center gap-1">
                                    {/* Send Button */}
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || !to || !subject}
                                        className={cn(
                                            'flex items-center gap-2 px-5 py-2 rounded-md font-medium text-sm transition-all',
                                            sending || !to || !subject
                                                ? isDark ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                                        )}
                                    >
                                        {sending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        {sending ? 'Sending...' : 'Send'}
                                    </button>

                                    {/* Formatting Tools */}
                                    <div className={cn('h-6 w-px mx-2', isDark ? 'bg-neutral-700' : 'bg-gray-200')} />

                                    <div className="hidden sm:flex items-center">
                                        <button
                                            onClick={() => execCommand('bold')}
                                            className={cn('p-2 rounded hover:bg-opacity-10', isDark ? 'text-neutral-400 hover:bg-white' : 'text-gray-500 hover:bg-gray-100')}
                                            title="Bold"
                                        >
                                            <Bold className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => execCommand('italic')}
                                            className={cn('p-2 rounded hover:bg-opacity-10', isDark ? 'text-neutral-400 hover:bg-white' : 'text-gray-500 hover:bg-gray-100')}
                                            title="Italic"
                                        >
                                            <Italic className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => execCommand('underline')}
                                            className={cn('p-2 rounded hover:bg-opacity-10', isDark ? 'text-neutral-400 hover:bg-white' : 'text-gray-500 hover:bg-gray-100')}
                                            title="Underline"
                                        >
                                            <Underline className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => execCommand('insertUnorderedList')}
                                            className={cn('p-2 rounded hover:bg-opacity-10', isDark ? 'text-neutral-400 hover:bg-white' : 'text-gray-500 hover:bg-gray-100')}
                                            title="Bullet List"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className={cn('h-6 w-px mx-1', isDark ? 'bg-neutral-700' : 'bg-gray-200')} />

                                    <button
                                        onClick={handleAttachmentAdd}
                                        className={cn('p-2 rounded hover:bg-opacity-10', isDark ? 'text-neutral-400 hover:bg-white' : 'text-gray-500 hover:bg-gray-100')}
                                        title="Attach files"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>
                                    <button
                                        className={cn('p-2 rounded hover:bg-opacity-10', isDark ? 'text-neutral-400 hover:bg-white' : 'text-gray-500 hover:bg-gray-100')}
                                        title="Insert link"
                                    >
                                        <Link2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        className={cn('p-2 rounded hover:bg-opacity-10', isDark ? 'text-neutral-400 hover:bg-white' : 'text-gray-500 hover:bg-gray-100')}
                                        title="Insert emoji"
                                    >
                                        <Smile className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        className={cn('p-2 rounded hover:bg-opacity-10', isDark ? 'text-neutral-400 hover:bg-white' : 'text-gray-500 hover:bg-gray-100')}
                                        title="More options"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleDiscard}
                                        className={cn(
                                            'p-2 rounded transition-colors',
                                            isDark ? 'text-neutral-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                        )}
                                        title="Discard"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ComposeEmailModal;
