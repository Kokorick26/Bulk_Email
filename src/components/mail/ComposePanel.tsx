import { useState, useRef } from 'react';
import {
    Send, Loader2, Clock, Paperclip, Image, Link2,
    Smile, MoreHorizontal, Trash2, Minimize2, Maximize2,
    Bold, Italic, Underline, List, AlignLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useTheme } from '../../lib/ThemeContext';

const API_BASE = '/api/bulk-email';

interface SmtpAccount {
    id: string;
    name: string;
    fromEmail: string;
    fromName: string;
    isDefault?: boolean;
}

interface ComposePanelProps {
    smtpAccounts: SmtpAccount[];
    onSuccess?: () => void;
    className?: string;
}

export function ComposePanel({ smtpAccounts, onSuccess, className }: ComposePanelProps) {
    const { theme } = useTheme();
    const [selectedSmtpId, setSelectedSmtpId] = useState<string>('system-default');
    const [recipients, setRecipients] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sendOneByOne, setSendOneByOne] = useState(false);
    const [sending, setSending] = useState(false);
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const validEmailCount = recipients
        .split(/[,;\n]/)
        .filter(e => e.trim() && e.includes('@')).length;

    const handleSend = async () => {
        if (!recipients || !subject || !body) {
            toast.error('Please fill all required fields');
            return;
        }

        if (validEmailCount === 0) {
            toast.error('No valid email addresses found');
            return;
        }

        if (!confirm(`Send to ${validEmailCount} recipient${validEmailCount > 1 ? 's' : ''}?`)) return;

        const htmlContent = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#202124">${body.replace(/\n/g, '<br>')}</div>`;

        setSending(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`${API_BASE}/quick-send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    smtpAccountId: selectedSmtpId === 'system-default' ? null : selectedSmtpId,
                    recipients: recipients,
                    subject: subject,
                    htmlContent: htmlContent,
                    textContent: body,
                    sendOneByOne,
                }),
            });

            if (!res.ok) throw new Error((await res.json()).error);

            toast.success(`Sending to ${validEmailCount} recipients`);
            setRecipients('');
            setSubject('');
            setBody('');
            setCc('');
            setBcc('');
            onSuccess?.();
        } catch (err: any) {
            toast.error(err.message || 'Failed to send emails');
        } finally {
            setSending(false);
        }
    };

    const handleDiscard = () => {
        if (recipients || subject || body) {
            if (!confirm('Discard this draft?')) return;
        }
        setRecipients('');
        setSubject('');
        setBody('');
        setCc('');
        setBcc('');
    };

    const ToolbarButton = ({ icon: Icon, label, onClick, active }: { icon: any; label: string; onClick?: () => void; active?: boolean }) => (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className={cn(
                'p-2 rounded hover:bg-[#f1f3f4] transition-colors',
                active ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#5f6368]'
            )}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className={cn('max-w-3xl mx-auto', className)}>
            {/* Gmail-style Compose Card */}
            <div className="gmail-card overflow-hidden shadow-lg">
                {/* Header */}
                <div className={cn(
                    'flex items-center justify-between px-4 py-2.5 text-white',
                    theme === 'dark' ? 'bg-[#303134]' : 'bg-[#404040]'
                )}>
                    <h2 className="text-sm font-medium">New Message</h2>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
                            <Minimize2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Email Form */}
                <div className={cn(
                    'divide-y',
                    theme === 'dark' ? 'divide-[#3c4043]' : 'divide-[#f1f3f4]'
                )}>
                    {/* From Field */}
                    <div className="flex items-center px-4 py-2 gap-2">
                        <span className={cn('text-sm w-12', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>From</span>
                        <Select value={selectedSmtpId} onValueChange={setSelectedSmtpId}>
                            <SelectTrigger className={cn(
                                'flex-1 border-0 bg-transparent h-auto py-0 px-0 focus:ring-0 hover:bg-transparent shadow-none',
                                theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                            )}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme === 'dark' ? 'bg-[#303134] border-[#3c4043]' : 'bg-white border-[#dadce0]'}>
                                <SelectItem value="system-default">System Default</SelectItem>
                                {smtpAccounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.fromName} &lt;{acc.fromEmail}&gt;
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* To Field */}
                    <div className="flex items-center px-4 py-2 gap-2">
                        <span className={cn('text-sm w-12', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>To</span>
                        <input
                            type="text"
                            value={recipients}
                            onChange={(e) => setRecipients(e.target.value)}
                            placeholder="Recipients"
                            className={cn(
                                'flex-1 bg-transparent border-0 outline-none placeholder:text-[#9aa0a6] text-sm',
                                theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                            )}
                        />
                        <div className="flex gap-2 text-sm">
                            {!showCc && (
                                <button
                                    onClick={() => setShowCc(true)}
                                    className={cn(
                                        'transition-colors',
                                        theme === 'dark' ? 'text-[#9aa0a6] hover:text-[#e8eaed]' : 'text-[#5f6368] hover:text-[#202124]'
                                    )}
                                >
                                    Cc
                                </button>
                            )}
                            {!showBcc && (
                                <button
                                    onClick={() => setShowBcc(true)}
                                    className="text-[#5f6368] hover:text-[#202124] transition-colors"
                                >
                                    Bcc
                                </button>
                            )}
                        </div>
                        {validEmailCount > 0 && (
                            <span className="text-xs text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-full">
                                {validEmailCount}
                            </span>
                        )}
                    </div>

                    {/* Cc Field */}
                    {showCc && (
                        <div className="flex items-center px-4 py-2 gap-2">
                            <span className="text-sm text-[#5f6368] w-12">Cc</span>
                            <input
                                type="text"
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                                placeholder="Carbon copy"
                                className="flex-1 bg-transparent border-0 outline-none text-[#202124] placeholder:text-[#9aa0a6] text-sm"
                            />
                        </div>
                    )}

                    {/* Bcc Field */}
                    {showBcc && (
                        <div className="flex items-center px-4 py-2 gap-2">
                            <span className="text-sm text-[#5f6368] w-12">Bcc</span>
                            <input
                                type="text"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                                placeholder="Blind carbon copy"
                                className="flex-1 bg-transparent border-0 outline-none text-[#202124] placeholder:text-[#9aa0a6] text-sm"
                            />
                        </div>
                    )}

                    {/* Subject Field */}
                    <div className="flex items-center px-4 py-2 gap-2">
                        <span className="text-sm text-[#5f6368] w-12">Subject</span>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Subject"
                            className="flex-1 bg-transparent border-0 outline-none text-[#202124] placeholder:text-[#9aa0a6] text-sm"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="px-4 py-4">
                    <textarea
                        ref={textareaRef}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your message here..."
                        className="w-full min-h-[300px] bg-transparent border-0 outline-none resize-none text-[#202124] placeholder:text-[#9aa0a6] text-sm leading-relaxed"
                    />
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#f1f3f4]">
                    <div className="flex items-center gap-1">
                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={sending || !recipients || !subject || !body}
                            className={cn(
                                'flex items-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm transition-all',
                                sending || !recipients || !subject || !body
                                    ? 'bg-[#f1f3f4] text-[#9aa0a6] cursor-not-allowed'
                                    : 'bg-[#0b57d0] text-white hover:bg-[#0842a0] hover:shadow-md'
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
                        <div className="h-6 w-px bg-[#dadce0] mx-2" />

                        <div className="hidden sm:flex items-center">
                            <ToolbarButton icon={Bold} label="Bold" />
                            <ToolbarButton icon={Italic} label="Italic" />
                            <ToolbarButton icon={Underline} label="Underline" />
                        </div>

                        <div className="h-6 w-px bg-[#dadce0] mx-1 hidden sm:block" />

                        <ToolbarButton icon={Paperclip} label="Attach files" />
                        <ToolbarButton icon={Link2} label="Insert link" />
                        <ToolbarButton icon={Image} label="Insert image" />
                        <ToolbarButton icon={Smile} label="Insert emoji" />

                        <div className="h-6 w-px bg-[#dadce0] mx-1" />

                        <ToolbarButton
                            icon={Clock}
                            label={sendOneByOne ? 'One-by-one: ON' : 'One-by-one: OFF'}
                            onClick={() => setSendOneByOne(!sendOneByOne)}
                            active={sendOneByOne}
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <ToolbarButton icon={MoreHorizontal} label="More options" />
                        <button
                            onClick={handleDiscard}
                            className="p-2 rounded hover:bg-[#fce8e6] text-[#5f6368] hover:text-[#d93025] transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="mt-4 text-center">
                <p className="text-xs text-[#5f6368]">
                    Separate multiple recipients with commas or semicolons
                    {sendOneByOne && (
                        <span className="text-[#1a73e8] ml-2">• One-by-one mode active</span>
                    )}
                </p>
            </div>
        </div>
    );
}
