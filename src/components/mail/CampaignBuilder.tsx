import { useState, useRef, useEffect } from 'react';
import {
    Send, Loader2, Clock, Sparkles, FileSpreadsheet,
    FileText, Play, Pause, CheckCircle, XCircle, Users,
    Zap, Timer, Mail, ChevronRight, Bot, User, Upload,
    Eye, RefreshCw, StopCircle, Settings, Wand2, Copy,
    ChevronDown, ChevronUp, AlertCircle, Check, ArrowRight,
    Rocket, Target, MessageSquare, BarChart3, Shield, X,
    Pencil, ChevronLeft, CheckCircle2, CircleDotDashed, CircleX, Circle, CircleAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Progress } from '../ui/Progress';
import { CSVUpload } from './CSVUpload';
import { useTheme } from '../../lib/ThemeContext';

const API_BASE = '/api/bulk-email';

interface SmtpAccount {
    id: string;
    name: string;
    fromEmail: string;
    fromName: string;
    isDefault?: boolean;
}

interface Recipient {
    email: string;
    name: string;
    [key: string]: string;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: { label: string; action: () => void }[];
}

interface SendingLog {
    email: string;
    name: string;
    status: 'pending' | 'sending' | 'success' | 'failed';
    timestamp?: Date;
    error?: string;
    personalizedSubject?: string;
    personalizedBody?: string;
}

interface PersonalizedEmail {
    email: string;
    name: string;
    subject: string;
    body: string;
}

interface CampaignBuilderProps {
    smtpAccounts: SmtpAccount[];
    onSuccess?: () => void;
    onContextChange?: (context: {
        recipientCount: number;
        headers: string[];
        recipients: Recipient[];
        currentSubject: string;
        currentBody: string;
    }) => void;
    aiSubject?: string;
    aiBody?: string;
    aiPersonalizedEmails?: PersonalizedEmail[];
    onSendToAI?: (message: string, selectedText?: string, recipientEmail?: string) => void;
    className?: string;
}

const personalizeContent = (template: string, recipient: Recipient): string => {
    let result = template;

    // Spintax support: {Hi|Hello|Hey}
    // Matches {content} where content contains |
    // use deterministic selection based on email to prevent UI flickering
    const seed = recipient.email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    result = result.replace(/{([^{}]+)}/g, (match, content, offset) => {
        if (content.includes('|')) {
            const choices = content.split('|');
            // Use seed + offset to pick a consistent option for this specific tag placement
            const index = (seed + offset) % choices.length;
            return choices[index];
        }
        return match;
    });

    Object.entries(recipient).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, value || '');
    });
    
    // Remove em dashes and en dashes - replace with regular hyphens
    return result
        .replace(/—/g, '-')  // em dash
        .replace(/–/g, '-')  // en dash
        .replace(/"/g, '"')  // smart quotes
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'");
};

// Basic Markdown parser for emails - optimized for tight spacing
const parseMarkdown = (text: string): string => {
    if (!text) return '';

    // Step 1: Basic formatting - remove em/en dashes first
    let html = text
        .replace(/—/g, '-')                                                                      // Em dashes
        .replace(/–/g, '-')                                                                      // En dashes
        .replace(/"/g, '"')                                                                      // Smart quotes
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'")
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')                                         // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')                                                     // Italic
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#1a73e8;">$1</a>');      // Links

    // Step 2: Process lists - find consecutive lines starting with "- " or "• "
    // Replace each list block with a clean <ul>
    html = html.replace(/((?:^[-•] .+$\n?)+)/gm, (match) => {
        const items = match.trim().split('\n')
            .map(line => line.replace(/^[-•] /, ''))
            .map(item => `<li style="margin:0;padding:0;">${item}</li>`)
            .join('');  // NO newlines between li elements
        return `<ul style="margin:4px 0;padding-left:20px;">${items}</ul>`;
    });

    // Step 3: Handle paragraphs - split by double newlines
    const blocks = html.split(/\n\n+/);

    html = blocks.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<ul') || trimmed.startsWith('<div')) return trimmed;
        // Convert single newlines to <br> for non-list content
        return `<div style="margin:0 0 4px 0;">${trimmed.replace(/\n/g, '<br>')}</div>`;
    }).join('');

    return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#202124;line-height:1.4;">${html}</div>`;
};

const loadTemplates = (): EmailTemplate[] => {
    try {
        const data = localStorage.getItem('email-templates');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

// Enhanced AI that can craft personalized emails for each recipient
const getAIResponse = async (
    message: string,
    context: {
        recipients: Recipient[];
        template: string;
        body: string;
        headers: string[];
    }
): Promise<{ content: string; action?: 'craft_emails' | 'send_emails' | 'optimize_subject' | 'generate_template' }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const lowerMessage = message.toLowerCase();

    // Check if user wants to send emails
    if (lowerMessage.includes('send') && (lowerMessage.includes('email') || lowerMessage.includes('campaign'))) {
        return {
            content: `I'm ready to send personalized emails to ${context.recipients.length} recipients.\n\nEach email will be uniquely crafted using the merge fields: ${context.headers.map(h => `{{${h}}}`).join(', ')}\n\nClick "Launch Campaign" below to start sending, or ask me to preview specific emails first.`,
            action: 'send_emails'
        };
    }

    // Craft individual emails
    if (lowerMessage.includes('craft') || lowerMessage.includes('personalize') || lowerMessage.includes('each')) {
        const sampleEmails = context.recipients.slice(0, 3).map(r => ({
            to: r.email,
            subject: personalizeContent(context.template || 'Hello {{name}}', r),
            preview: personalizeContent(context.body || 'Hi {{name}}, ...', r).substring(0, 100)
        }));

        return {
            content: `I've analyzed your ${context.recipients.length} recipients. Here's how each email will be personalized:\n\n${sampleEmails.map((e, i) => `**${i + 1}. ${e.to}**\nSubject: "${e.subject}"\nPreview: "${e.preview}..."`).join('\n\n')}\n\n${context.recipients.length > 3 ? `...and ${context.recipients.length - 3} more personalized emails.` : ''}\n\nReady to send these personalized emails?`,
            action: 'craft_emails'
        };
    }

    // Generate template
    if (lowerMessage.includes('write') || lowerMessage.includes('create') || lowerMessage.includes('generate') || lowerMessage.includes('draft')) {
        const fields = context.headers.length > 0 ? context.headers : ['name', 'email', 'company'];
        return {
            content: `Here's a high-converting email template:\n\n**Subject:** Quick question for you, {{${fields[0]}}}\n\n---\n\nHi {{${fields[0]}}},\n\nI noticed ${fields.includes('company') ? "{{company}}'s" : 'your'} recent work and thought you might be interested in what we're building.\n\nWould you be open to a quick 15-minute chat this week?\n\nBest regards,\n[Your Name]\n\n---\n\n*This template uses personalization tokens that will be replaced with each recipient's data.*`,
            action: 'generate_template'
        };
    }

    // Subject line optimization
    if (lowerMessage.includes('subject') || lowerMessage.includes('optimize')) {
        return {
            content: `Here are optimized subject lines with high open rates:\n\n• "Quick question, {{name}}"\n• "{{name}}, saw your recent work"\n• "Thought of you, {{name}}"\n• "15 mins this week?"\n• "Following up, {{name}}"\n\nPersonalized subjects with the recipient's name typically see 26% higher open rates.`,
            action: 'optimize_subject'
        };
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
        return {
            content: `I'm your AI email assistant. I can help you:\n\n• **Write emails** - "Write a follow-up email"\n• **Craft personalized emails** - "Craft emails for each recipient"\n• **Optimize subjects** - "Suggest better subject lines"\n• **Send campaigns** - "Send emails to all recipients"\n\nCurrently working with ${context.recipients.length} recipients${context.headers.length > 0 ? ` and fields: ${context.headers.join(', ')}` : ''}.`,
        };
    }

    return {
        content: `I can help you with:\n\n• Writing email content\n• Personalizing for each recipient\n• Optimizing subject lines\n• Sending your campaign\n\nWhat would you like to do?`,
    };
};

export function CampaignBuilder({ smtpAccounts, onSuccess, onContextChange, aiSubject, aiBody, aiPersonalizedEmails, onSendToAI, className }: CampaignBuilderProps) {
    const { theme } = useTheme();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedSmtpId, setSelectedSmtpId] = useState<string>('system-default');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [customSubject, setCustomSubject] = useState('');
    const [customBody, setCustomBody] = useState('');
    const [intervalMinutes, setIntervalMinutes] = useState(4);

    const [recipientOverrides, setRecipientOverrides] = useState<Record<string, { subject?: string, body?: string }>>({});
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isPreviewMode, setIsPreviewMode] = useState(true);
    
    // Text selection state for AI editing
    const [selectedText, setSelectedText] = useState('');
    const [selectionMenuPos, setSelectionMenuPos] = useState<{ x: number; y: number } | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Welcome to Campaign Builder! Upload your recipient list to get started. I'll help you craft personalized emails for each contact.",
            timestamp: new Date(),
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isAIThinking, setIsAIThinking] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [isSending, setIsSending] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [sendingLogs, setSendingLogs] = useState<SendingLog[]>([]);
    const pauseRef = useRef(false);
    const stopRef = useRef(false);
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

    // Poll for campaign status
    useEffect(() => {
        let interval: any;
        if (activeCampaignId && isSending) {
            interval = setInterval(async () => {
                try {
                    const token = localStorage.getItem('bulkEmailToken');
                    const res = await fetch(`${API_BASE}/campaigns/${activeCampaignId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();

                        // If done
                        if (data.status === 'completed' || data.status === 'failed') {
                            setIsSending(false);
                            setActiveCampaignId(null);
                            toast.success(`Campaign finished: ${data.sentCount} sent, ${data.failedCount} failed`);
                            if (data.status === 'completed') onSuccess?.();
                        }

                        // Update local logs to reflect progress (simplified visualization)
                        setSendingLogs(prev => {
                            const newLogs = [...prev];
                            let s = data.sentCount || 0;
                            let f = data.failedCount || 0;
                            for (let i = 0; i < newLogs.length; i++) {
                                if (s > 0) { newLogs[i].status = 'success'; s--; }
                                else if (f > 0) { newLogs[i].status = 'failed'; f--; }
                                else { newLogs[i].status = 'pending'; }
                            }
                            return newLogs;
                        });
                    }
                } catch (e) { console.error("Polling error", e); }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [activeCampaignId, isSending]);

    const [previewRecipient, setPreviewRecipient] = useState<Recipient | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isSendingSingle, setIsSendingSingle] = useState(false);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Update AI context whenever relevant state changes
    useEffect(() => {
        onContextChange?.({
            recipientCount: recipients.length,
            headers: headers,
            recipients: recipients,
            currentSubject: customSubject,
            currentBody: customBody,
        });
    }, [recipients, headers, customSubject, customBody, onContextChange]);

    // Apply AI-inserted content - use refs to prevent flicker
    const prevAiSubjectRef = useRef<string | undefined>(undefined);
    const prevAiBodyRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        // Only update if aiSubject changed from previous value (not just different from current state)
        if (aiSubject && aiSubject !== prevAiSubjectRef.current) {
            prevAiSubjectRef.current = aiSubject;
            setCustomSubject(aiSubject);
        }
    }, [aiSubject]);

    useEffect(() => {
        // Only update if aiBody changed from previous value
        if (aiBody && aiBody !== prevAiBodyRef.current) {
            prevAiBodyRef.current = aiBody;
            setCustomBody(aiBody);
        }
    }, [aiBody]);

    const handleRecipientsLoaded = (data: Recipient[], csvHeaders: string[]) => {
        setRecipients(data);
        setHeaders(csvHeaders);
        if (data.length > 0) {
            setPreviewRecipient(data[0]);
            setPreviewIndex(0);
            setStep(2);
            setChatMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Loaded **${data.length} recipients** with fields: ${csvHeaders.map(h => `\`{{${h}}}\``).join(', ')}\n\nNow write your email using these merge fields, or ask me to generate a template for you.`,
                timestamp: new Date(),
            }]);
        }
    };

    const handleAiFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            // Simple CSV parser
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) return;
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const data: Recipient[] = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const recipient: Recipient = { email: values[0] || '', name: '' };
                headers.forEach((h, i) => {
                    recipient[h] = values[i] || '';
                    if (h.toLowerCase().includes('email')) recipient.email = values[i];
                });
                return recipient;
            }).filter(r => r.email && r.email.includes('@'));

            handleRecipientsLoaded(data, headers);
        };
        reader.readAsText(file);
    };

    const handleSendChat = async () => {
        if (!chatInput.trim() || isAIThinking) return;
        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date() };
        setChatMessages(prev => [...prev, userMessage]);
        const inputText = chatInput;
        setChatInput('');
        setIsAIThinking(true);
        try {
            const response = await getAIResponse(inputText, {
                recipients,
                template: customSubject,
                body: customBody,
                headers
            });
            setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                timestamp: new Date()
            }]);
        } catch {
            toast.error('AI error');
        }
        finally { setIsAIThinking(false); }
    };

    const getPreviewContent = (recipient: Recipient) => {
        const override = recipientOverrides[recipient.email];
        
        // Check if we have AI-personalized content for this recipient
        const aiPersonalized = aiPersonalizedEmails?.find(e => e.email === recipient.email);
        
        if (override) {
            return {
                subject: override.subject ?? personalizeContent(customSubject, recipient),
                body: override.body ?? personalizeContent(customBody, recipient),
                isModified: true,
                isAiPersonalized: false
            };
        }
        
        if (aiPersonalized) {
            return {
                subject: aiPersonalized.subject,
                body: aiPersonalized.body,
                isModified: false,
                isAiPersonalized: true
            };
        }
        
        return {
            subject: personalizeContent(customSubject, recipient),
            body: personalizeContent(customBody, recipient),
            isModified: false,
            isAiPersonalized: false
        };
    };


    // Handle text selection in preview
    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        
        if (text && text.length > 0 && previewRef.current) {
            setSelectedText(text);
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();
            if (rect) {
                setSelectionMenuPos({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                });
            }
        } else {
            setSelectedText('');
            setSelectionMenuPos(null);
        }
    };

    // Send selected text to AI for editing
    const handleSendSelectionToAI = (action: string) => {
        if (!selectedText || !onSendToAI) return;
        
        const recipientEmail = previewRecipient?.email;
        const message = `${action}: "${selectedText}"`;
        
        onSendToAI(message, selectedText, recipientEmail);
        setSelectedText('');
        setSelectionMenuPos(null);
        window.getSelection()?.removeAllRanges();
        toast.success('Sent to AI for editing');
    };

    const startCampaign = async () => {
        if (!recipients.length) return;
        setStep(3);
        setIsSending(true);
        setSendingLogs(recipients.map(r => ({ email: r.email, name: r.name || '', status: 'pending' })));

        const token = localStorage.getItem('bulkEmailToken');

        try {
            // Check if we have AI-personalized emails
            const hasAiPersonalized = aiPersonalizedEmails && aiPersonalizedEmails.length > 0;
            
            if (hasAiPersonalized) {
                // Send AI-personalized emails (each recipient has unique content)
                const res = await fetch('/api/ai/confirm-send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        sendType: 'personalized',
                        personalizedEmails: aiPersonalizedEmails.map(e => ({
                            ...e,
                            body: parseMarkdown(e.body) // Convert to HTML
                        }))
                    }),
                });

                if (!res.ok) throw new Error('Failed to start personalized campaign');

                const data = await res.json();
                toast.success(data.message || 'Personalized campaign started');
                
            } else {
                // Standard template-based campaign
                const htmlContent = parseMarkdown(customBody);

                const res = await fetch(`${API_BASE}/quick-send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        smtpAccountId: selectedSmtpId === 'system-default' ? null : selectedSmtpId,
                        recipients: recipients,
                        subject: customSubject,
                        htmlContent,
                        textContent: customBody,
                        delaySeconds: intervalMinutes * 60,
                        sendOneByOne: true
                    }),
                });

                if (!res.ok) throw new Error('Failed to start campaign');

                const data = await res.json();
                setActiveCampaignId(data.campaignId);
                toast.success('Campaign started in background');
            }

        } catch (error) {
            console.error(error);
            toast.error('Failed to start campaign');
            setIsSending(false);
            setStep(2);
        }
    };



    const handleSingleSend = async () => {
        if (!previewRecipient || !customSubject || !customBody) return;

        setIsSendingSingle(true);
        const token = localStorage.getItem('bulkEmailToken');

        try {
            const personalized = getPreviewContent(previewRecipient);
            const htmlContent = parseMarkdown(personalized.body);

            const res = await fetch(`${API_BASE}/quick-send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    smtpAccountId: selectedSmtpId === 'system-default' ? null : selectedSmtpId,
                    recipients: previewRecipient.email,
                    subject: personalized.subject,
                    htmlContent,
                    textContent: personalized.body,
                    sendOneByOne: false,
                }),
            });

            if (!res.ok) throw new Error('Failed');
            toast.success(`Email sent to ${previewRecipient.email}`);
        } catch (error) {
            toast.error('Failed to send email');
        } finally {
            setIsSendingSingle(false);
        }
    };

    const togglePause = () => {
        pauseRef.current = !pauseRef.current;
        setIsPaused(!isPaused);
    };

    const stopCampaign = () => {
        if (confirm('Stop the campaign?')) {
            stopRef.current = true;
            pauseRef.current = false;
            setIsPaused(false);
            setIsSending(false);
        }
    };

    const successCount = sendingLogs.filter(l => l.status === 'success').length;
    const failedCount = sendingLogs.filter(l => l.status === 'failed').length;
    const progressPercent = sendingLogs.length > 0 ? ((successCount + failedCount) / sendingLogs.length) * 100 : 0;

    return (
        <div className={cn('min-h-[calc(100vh-100px)]', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        theme === 'dark' ? 'bg-[#394457]' : 'bg-[#c2e7ff]'
                    )}>
                        <Zap className={cn('w-5 h-5', theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#001d35]')} />
                    </div>
                    <div>
                        <h1 className={cn('text-xl font-medium', theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]')}>Campaign Builder</h1>
                        <p className={cn('text-sm', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>AI-powered personalized emails</p>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className={cn(
                    'flex items-center gap-2 rounded-full p-1',
                    theme === 'dark' ? 'bg-[#303134]' : 'bg-[#f1f3f4]'
                )}>
                    {[
                        { num: 1, label: 'Upload', completed: recipients.length > 0 },
                        { num: 2, label: 'Compose', completed: customSubject && customBody },
                        { num: 3, label: 'Send', completed: false },
                    ].map((s, idx) => (
                        <button
                            key={s.num}
                            onClick={() => setStep(s.num as 1 | 2 | 3)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                                step === s.num
                                    ? theme === 'dark'
                                        ? 'bg-[#3c4043] text-[#e8eaed] shadow-sm'
                                        : 'bg-white text-[#202124] shadow-sm'
                                    : s.completed
                                        ? theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                        : theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}
                        >
                            {s.completed && step !== s.num ? (
                                <Check className="w-4 h-4 text-[#1e8e3e]" />
                            ) : (
                                <span className={cn(
                                    'w-5 h-5 rounded-full text-xs flex items-center justify-center',
                                    step === s.num
                                        ? theme === 'dark' ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#1a73e8] text-white'
                                        : theme === 'dark' ? 'bg-[#3c4043] text-[#9aa0a6]' : 'bg-[#e8eaed] text-[#5f6368]'
                                )}>
                                    {s.num}
                                </span>
                            )}
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {/* Main Content - Full width now that AI sidebar is global */}
                <div className="space-y-4">
                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div className="gmail-card p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <FileSpreadsheet className={cn('w-5 h-5', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                                <h2 className={cn('text-base font-medium', theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]')}>Import Recipients</h2>
                            </div>
                            <CSVUpload recipients={recipients} onRecipientsLoaded={handleRecipientsLoaded} />

                            {recipients.length > 0 && (
                                <div className={cn(
                                    'mt-4 p-4 rounded-lg flex items-center gap-3',
                                    theme === 'dark' ? 'bg-[#1e3a29]' : 'bg-[#e6f4ea]'
                                )}>
                                    <CheckCircle className="w-5 h-5 text-[#1e8e3e]" />
                                    <span className="text-[#1e8e3e] font-medium">
                                        {recipients.length} recipients loaded
                                    </span>
                                    <button
                                        onClick={() => setStep(2)}
                                        className={cn(
                                            'ml-auto font-medium hover:underline flex items-center gap-1',
                                            theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                        )}
                                    >
                                        Continue <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Compose Email */}
                    {step === 2 && (
                        <>
                            {/* Email Editor Card */}
                            <div className="gmail-card overflow-hidden">
                                {/* Toolbar */}
                                <div className={cn(
                                    'flex items-center justify-between px-6 py-3 border-b',
                                    theme === 'dark'
                                        ? 'border-[#3c4043] bg-[#303134]'
                                        : 'border-[#dadce0] bg-[#f8f9fa]'
                                )}>
                                    <div className="flex items-center gap-2">
                                        <Mail className={cn('w-5 h-5', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                                        <span className={cn('font-medium', theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]')}>Compose Email</span>
                                        <span className={cn('text-sm', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>• {recipients.length} recipients</span>
                                    </div>
                                    {headers.length > 0 && (
                                        <div className="flex gap-2">
                                            {headers.slice(0, 4).map(h => (
                                                <button
                                                    key={h}
                                                    onClick={() => setCustomBody(prev => prev + `{{${h}}}`)}
                                                    className={cn(
                                                        'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                                                        theme === 'dark'
                                                            ? 'bg-[#394457] text-[#8ab4f8] hover:bg-[#4a5568]'
                                                            : 'bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]'
                                                    )}
                                                >
                                                    + {h}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Subject */}
                                    <div>
                                        <label className={cn('text-sm mb-2 block', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>Subject</label>
                                        <input
                                            value={customSubject}
                                            onChange={(e) => setCustomSubject(e.target.value)}
                                            placeholder="Use {{name}} for personalization..."
                                            className={cn(
                                                'w-full px-4 py-3 border rounded-lg placeholder:text-[#9aa0a6] focus:outline-none focus:ring-1 transition-all',
                                                theme === 'dark'
                                                    ? 'bg-[#3c4043] border-[#3c4043] text-[#e8eaed] focus:border-[#8ab4f8] focus:ring-[#8ab4f8]'
                                                    : 'bg-white border-[#dadce0] text-[#202124] focus:border-[#1a73e8] focus:ring-[#1a73e8]'
                                            )}
                                        />
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <label className={cn('text-sm mb-2 block', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>Message</label>
                                        <textarea
                                            value={customBody}
                                            onChange={(e) => setCustomBody(e.target.value)}
                                            placeholder="Write your message here. Use merge fields like {{name}}, {{company}} etc."
                                            rows={12}
                                            className={cn(
                                                'w-full px-4 py-3 border rounded-lg placeholder:text-[#9aa0a6] focus:outline-none focus:ring-1 transition-all resize-none leading-relaxed',
                                                theme === 'dark'
                                                    ? 'bg-[#3c4043] border-[#3c4043] text-[#e8eaed] focus:border-[#8ab4f8] focus:ring-[#8ab4f8]'
                                                    : 'bg-white border-[#dadce0] text-[#202124] focus:border-[#1a73e8] focus:ring-[#1a73e8]'
                                            )}
                                        />
                                    </div>
                                    
                                    {/* Craft for all recipients button - shows when user has typed content */}
                                    {(customSubject || customBody) && recipients.length > 0 && onSendToAI && (
                                        <div className={cn(
                                            'mx-6 mb-6 p-4 rounded-xl border-2 border-dashed flex items-center justify-between',
                                            theme === 'dark'
                                                ? 'border-[#8ab4f8]/30 bg-[#8ab4f8]/5'
                                                : 'border-[#1a73e8]/30 bg-[#1a73e8]/5'
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-10 h-10 rounded-full flex items-center justify-center',
                                                    theme === 'dark' ? 'bg-[#8ab4f8]/20' : 'bg-[#1a73e8]/10'
                                                )}>
                                                    <Sparkles className={cn('w-5 h-5', theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]')} />
                                                </div>
                                                <div>
                                                    <p className={cn('font-medium text-sm', theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]')}>
                                                        Ready to personalize?
                                                    </p>
                                                    <p className={cn('text-xs', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>
                                                        AI will craft {recipients.length} unique emails based on your content
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    const message = `Write unique personalized emails for all ${recipients.length} recipients based on this:\n\nSubject: ${customSubject}\n\nBody: ${customBody}`;
                                                    onSendToAI(message);
                                                }}
                                                className={cn(
                                                    'gap-2',
                                                    theme === 'dark'
                                                        ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]'
                                                        : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                                                )}
                                            >
                                                <Wand2 className="w-4 h-4" />
                                                Craft for All Recipients
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preview Card */}
                            {/* Preview Card */}
                            {previewRecipient && customSubject && (
                                <div className={cn(
                                    'rounded-2xl overflow-hidden border',
                                    theme === 'dark'
                                        ? 'bg-[#303134] border-[#3c4043]'
                                        : 'bg-white border-[#dadce0]'
                                )}>
                                    <div className={cn(
                                        'flex items-center justify-between px-6 py-3 border-b',
                                        theme === 'dark'
                                            ? 'border-[#3c4043] bg-[#3c4043]'
                                            : 'border-[#dadce0] bg-[#f8f9fa]'
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Eye className={cn('w-5 h-5', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                                                <span className={cn('font-medium', theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]')}>Preview</span>
                                            </div>

                                            {/* Edit/View Toggle */}
                                            <div className={cn(
                                                "flex items-center p-1 rounded-lg border",
                                                theme === 'dark' ? "bg-[#303134] border-[#5f6368]" : "bg-white border-[#dadce0]"
                                            )}>
                                                <button
                                                    onClick={() => setIsPreviewMode(false)}
                                                    className={cn(
                                                        "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                                        !isPreviewMode
                                                            ? (theme === 'dark' ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#1a73e8] text-white")
                                                            : (theme === 'dark' ? "text-[#9aa0a6] hover:text-[#e8eaed]" : "text-[#5f6368] hover:text-[#202124]")
                                                    )}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setIsPreviewMode(true)}
                                                    className={cn(
                                                        "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                                        isPreviewMode
                                                            ? (theme === 'dark' ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#1a73e8] text-white")
                                                            : (theme === 'dark' ? "text-[#9aa0a6] hover:text-[#e8eaed]" : "text-[#5f6368] hover:text-[#202124]")
                                                    )}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-2 mr-1 border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium"
                                                onClick={handleSingleSend}
                                                disabled={isSendingSingle}
                                                title="Send this email now"
                                            >
                                                {isSendingSingle ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Send className="w-3.5 h-3.5" />
                                                )}
                                                Send This
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const newIndex = Math.max(0, previewIndex - 1);
                                                    setPreviewIndex(newIndex);
                                                    setPreviewRecipient(recipients[newIndex]);
                                                }}
                                                disabled={previewIndex === 0}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className={cn('text-sm min-w-[3rem] text-center', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>
                                                {previewIndex + 1} / {recipients.length}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const newIndex = Math.min(recipients.length - 1, previewIndex + 1);
                                                    setPreviewIndex(newIndex);
                                                    setPreviewRecipient(recipients[newIndex]);
                                                }}
                                                disabled={previewIndex === recipients.length - 1}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <span className={cn('text-xs', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>To:</span>
                                                <span className={cn('ml-2 text-sm', theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]')}>{previewRecipient.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getPreviewContent(previewRecipient).isAiPersonalized && (
                                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        AI Personalized
                                                    </Badge>
                                                )}
                                                {getPreviewContent(previewRecipient).isModified && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Customized
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn('mb-4 pb-4 border-b space-y-2', theme === 'dark' ? 'border-[#3c4043]' : 'border-[#f1f3f4]')}>
                                            <div className="flex items-center justify-between">
                                                <span className={cn('text-xs', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>Subject:</span>
                                                {getPreviewContent(previewRecipient).isModified && (
                                                    <button
                                                        onClick={() => {
                                                            const newOverrides = { ...recipientOverrides };
                                                            delete newOverrides[previewRecipient.email];
                                                            setRecipientOverrides(newOverrides);
                                                        }}
                                                        className="text-xs text-red-500 hover:underline"
                                                    >
                                                        Reset to default
                                                    </button>
                                                )}
                                            </div>
                                            <Input
                                                value={getPreviewContent(previewRecipient).subject}
                                                onChange={(e) => {
                                                    if (!previewRecipient) return;
                                                    setRecipientOverrides(prev => ({
                                                        ...prev,
                                                        [previewRecipient.email]: {
                                                            ...prev[previewRecipient.email],
                                                            subject: e.target.value,
                                                            body: prev[previewRecipient.email]?.body ?? personalizeContent(customBody, previewRecipient)
                                                        }
                                                    }));
                                                }}
                                                className={cn('h-9 font-medium', theme === 'dark' ? 'bg-[#3c4043] border-[#3c4043]' : 'border-[#dadce0]')}
                                            />
                                        </div>

                                        {isPreviewMode ? (
                                            <div className="relative">
                                                <div
                                                    ref={previewRef}
                                                    className="w-full p-6 rounded-md border text-sm leading-relaxed overflow-y-auto min-h-[300px] bg-white text-[#202124] border-gray-200 shadow-sm select-text cursor-text"
                                                    dangerouslySetInnerHTML={{ __html: parseMarkdown(getPreviewContent(previewRecipient).body) }}
                                                    onMouseUp={handleTextSelection}
                                                />
                                                
                                                {/* Floating selection menu */}
                                                {selectionMenuPos && selectedText && onSendToAI && (
                                                    <div 
                                                        className="fixed z-50 bg-[#202124] text-white rounded-lg shadow-xl py-1 px-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150"
                                                        style={{ 
                                                            left: selectionMenuPos.x, 
                                                            top: selectionMenuPos.y,
                                                            transform: 'translate(-50%, -100%)'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() => handleSendSelectionToAI('Rewrite this')}
                                                            className="px-3 py-1.5 text-xs font-medium hover:bg-white/10 rounded flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <Wand2 className="w-3 h-3" />
                                                            Rewrite
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendSelectionToAI('Make this shorter')}
                                                            className="px-3 py-1.5 text-xs font-medium hover:bg-white/10 rounded transition-colors"
                                                        >
                                                            Shorter
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendSelectionToAI('Make this more compelling')}
                                                            className="px-3 py-1.5 text-xs font-medium hover:bg-white/10 rounded transition-colors"
                                                        >
                                                            Improve
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendSelectionToAI('Change the tone of this')}
                                                            className="px-3 py-1.5 text-xs font-medium hover:bg-white/10 rounded transition-colors"
                                                        >
                                                            Tone
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedText('');
                                                                setSelectionMenuPos(null);
                                                                window.getSelection()?.removeAllRanges();
                                                            }}
                                                            className="px-2 py-1.5 text-xs hover:bg-white/10 rounded transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <textarea
                                                value={getPreviewContent(previewRecipient).body}
                                                onChange={(e) => {
                                                    if (!previewRecipient) return;
                                                    setRecipientOverrides(prev => ({
                                                        ...prev,
                                                        [previewRecipient.email]: {
                                                            ...prev[previewRecipient.email],
                                                            body: e.target.value,
                                                            subject: prev[previewRecipient.email]?.subject ?? personalizeContent(customSubject, previewRecipient)
                                                        }
                                                    }));
                                                }}
                                                rows={15}
                                                className={cn(
                                                    'w-full p-4 rounded-md border text-sm leading-relaxed whitespace-pre-wrap resize-none focus:outline-none focus:ring-1',
                                                    theme === 'dark'
                                                        ? 'bg-[#3c4043] border-[#3c4043] text-[#e8eaed] focus:ring-[#8ab4f8]'
                                                        : 'bg-white border-[#dadce0] text-[#202124] focus:border-[#1a73e8] focus:ring-[#1a73e8]'
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Send Settings */}
                            <div className="gmail-card p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <Settings className={cn('w-5 h-5', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                                    <h3 className={cn('font-medium', theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]')}>Send Settings</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={cn('text-sm mb-2 block', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>Sender Account</label>
                                        <Select value={selectedSmtpId} onValueChange={setSelectedSmtpId}>
                                            <SelectTrigger className={cn(
                                                'h-12 rounded-lg',
                                                theme === 'dark'
                                                    ? 'border-[#3c4043] bg-[#3c4043] text-[#e8eaed]'
                                                    : 'border-[#dadce0] bg-white text-[#202124]'
                                            )}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className={theme === 'dark' ? 'bg-[#303134] border-[#3c4043]' : 'bg-white border-[#dadce0]'}>
                                                <SelectItem value="system-default">Bhawesh Bhaskar (System Default)</SelectItem>
                                                {smtpAccounts.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id}>
                                                        {acc.fromName} &lt;{acc.fromEmail}&gt;
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className={cn('text-sm mb-2 block', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>
                                            Delay between emails (minutes)
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={intervalMinutes}
                                            onChange={(e) => setIntervalMinutes(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                                            className={cn(
                                                'h-12 rounded-lg',
                                                theme === 'dark'
                                                    ? 'border-[#3c4043] bg-[#3c4043] text-[#e8eaed]'
                                                    : 'border-[#dadce0] bg-white text-[#202124]'
                                            )}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={startCampaign}
                                    disabled={!customSubject || !customBody || recipients.length === 0}
                                    className={cn(
                                        'w-full py-4 rounded-lg font-medium text-base flex items-center justify-center gap-2 transition-all',
                                        customSubject && customBody && recipients.length > 0
                                            ? theme === 'dark'
                                                ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] hover:shadow-md'
                                                : 'bg-[#1a73e8] text-white hover:bg-[#1557b0] hover:shadow-md'
                                            : theme === 'dark'
                                                ? 'bg-[#3c4043] text-[#5f6368] cursor-not-allowed'
                                                : 'bg-[#f1f3f4] text-[#9aa0a6] cursor-not-allowed'
                                    )}
                                >
                                    <Send className="w-5 h-5" />
                                    Send to {recipients.length} Recipients
                                </button>
                                <p className={cn('text-center text-sm mt-3', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>
                                    Estimated time: ~{Math.round((recipients.length * intervalMinutes) / 60) || 1} hour(s)
                                </p>
                                <p className={cn('text-center text-xs mt-2 flex items-center justify-center gap-1', theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]')}>
                                    <Sparkles className="w-3 h-3" />
                                    AI will automatically rewrite each email uniquely to bypass spam filters
                                </p>
                            </div>
                        </>
                    )}

                    {/* Step 3: Sending Progress */}
                    {step === 3 && (
                        <>
                            {/* Progress Card */}
                            <div className="gmail-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        {isSending ? (
                                            isPaused ? (
                                                <div className="w-12 h-12 rounded-full bg-[#fef7e0] flex items-center justify-center">
                                                    <Pause className="w-6 h-6 text-[#f9ab00]" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-[#1a73e8] animate-spin" />
                                                </div>
                                            )
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[#e6f4ea] flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-[#1e8e3e]" />
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-xl font-medium text-[#202124]">
                                                {isSending ? (isPaused ? 'Paused' : 'Sending...') : 'Complete'}
                                            </h2>
                                            <p className="text-[#5f6368]">
                                                {successCount + failedCount} of {sendingLogs.length} sent
                                            </p>
                                        </div>
                                    </div>
                                    {isSending && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={togglePause}
                                                className={cn(
                                                    'px-4 py-2 rounded-lg font-medium transition-all',
                                                    isPaused
                                                        ? 'bg-[#1a73e8] text-white'
                                                        : 'bg-[#f1f3f4] text-[#202124] hover:bg-[#e8eaed]'
                                                )}
                                            >
                                                {isPaused ? 'Resume' : 'Pause'}
                                            </button>
                                            <button
                                                onClick={stopCampaign}
                                                className="px-4 py-2 rounded-lg font-medium bg-[#fce8e6] text-[#d93025] hover:bg-[#f8d7da] transition-all"
                                            >
                                                Stop
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-[#5f6368]">Progress</span>
                                        <span className="text-[#1a73e8] font-medium">{Math.round(progressPercent)}%</span>
                                    </div>
                                    <div className="gmail-progress">
                                        <div
                                            className="gmail-progress-bar"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-[#e6f4ea] rounded-lg text-center">
                                        <div className="text-2xl font-medium text-[#1e8e3e]">{successCount}</div>
                                        <div className="text-sm text-[#1e8e3e]">Sent</div>
                                    </div>
                                    <div className="p-4 bg-[#fce8e6] rounded-lg text-center">
                                        <div className="text-2xl font-medium text-[#d93025]">{failedCount}</div>
                                        <div className="text-sm text-[#d93025]">Failed</div>
                                    </div>
                                    <div className="p-4 bg-[#f1f3f4] rounded-lg text-center">
                                        <div className="text-2xl font-medium text-[#5f6368]">
                                            {sendingLogs.length - successCount - failedCount}
                                        </div>
                                        <div className="text-sm text-[#5f6368]">Pending</div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Progress List */}
                            <div className="space-y-2 mt-6 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {sendingLogs.slice().reverse().map((log, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "group flex items-center px-4 py-2.5 rounded-lg border transition-all",
                                            theme === 'dark'
                                                ? "bg-[#303134] border-[#3c4043]"
                                                : "bg-white border-[#dadce0] hover:shadow-sm"
                                        )}
                                    >
                                        {/* Status Icon */}
                                        <div className="mr-3 flex-shrink-0">
                                            {log.status === 'success' ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : log.status === 'sending' ? (
                                                <CircleDotDashed className="h-5 w-5 text-blue-500 animate-spin" />
                                            ) : log.status === 'failed' ? (
                                                <CircleX className="h-5 w-5 text-red-500" />
                                            ) : (
                                                <Circle className={cn("h-5 w-5", theme === 'dark' ? "text-[#5f6368]" : "text-[#dadce0]")} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={cn(
                                                    "font-medium text-sm truncate",
                                                    log.status === 'success' && "line-through opacity-70",
                                                    theme === 'dark' ? "text-[#e8eaed]" : "text-[#202124]"
                                                )}>
                                                    {log.email}
                                                </span>
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                                    log.status === 'success'
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : log.status === 'sending'
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                            : log.status === 'failed'
                                                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                : "bg-gray-100 text-gray-600 dark:bg-[#3c4043] dark:text-[#9aa0a6]"
                                                )}>
                                                    {log.status === 'success' ? 'Completed' : log.status === 'sending' ? 'In Progress' : log.status === 'failed' ? 'Failed' : 'Pending'}
                                                </span>
                                            </div>
                                            <div className={cn("text-xs truncate", theme === 'dark' ? "text-[#9aa0a6]" : "text-[#5f6368]")}>
                                                {log.status === 'success' ? `Sent at ${new Date().toLocaleTimeString()}` : log.status === 'failed' ? 'Failed to send' : log.personalizedSubject || 'Preparing...'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
