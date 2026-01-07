import { useState, useRef, useEffect } from 'react';
import {
    Network as ChartNetworkIcon,
    Image as ImageIcon,
    Map as MapIcon,
    PenTool as PenToolIcon,
    Sparkles as SparklesIcon,
    Send,
    Loader2,
    Command,
    MoreHorizontal,
    Paperclip,
    Mic,
    X,
    Minimize2,
    StopCircle,
    Bot,
    User,
    Check,
    Copy,
    ShieldCheck,
    Lightbulb,
    Smile,
    Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/ScrollArea';
import { useTheme } from '../../lib/ThemeContext';
import { Badge } from "../ui/Badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/Select";
import { Textarea } from "../ui/Textarea";

const API_BASE = '/api/ai';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIContext {
    recipientCount?: number;
    headers?: string[];
    recipients?: Array<{ email: string; name: string;[key: string]: string }>;
    currentSubject?: string;
    currentBody?: string;
}

interface PersonalizedEmail {
    email: string;
    name: string;
    subject: string;
    body: string;
}

interface PendingMessage {
    message: string;
    selectedText?: string;
    recipientEmail?: string;
}

interface AISidebarProps {
    isOpen: boolean;
    onClose: () => void;
    context?: AIContext;
    onInsertSubject?: (subject: string) => void;
    onInsertBody?: (body: string) => void;
    onFileUpload?: (file: File) => void;
    onPersonalizedEmails?: (emails: PersonalizedEmail[]) => void;
    pendingMessage?: PendingMessage | null;
    onPendingMessageHandled?: () => void;
    className?: string;
}

export function AISidebar({
    isOpen,
    onClose,
    context,
    onInsertSubject,
    onInsertBody,
    onFileUpload,
    onPersonalizedEmails,
    pendingMessage,
    onPendingMessageHandled,
    className
}: AISidebarProps) {
    const { theme } = useTheme();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [pendingPreview, setPendingPreview] = useState<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (onFileUpload) {
                onFileUpload(file);
                toast.success(`Uploaded ${file.name}`);
                // Add system message
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `I've received **${file.name}**. You can now ask me to process this file.`,
                    timestamp: new Date()
                }]);
            } else {
                toast.error("File upload not supported here.");
            }
        }
        // Reset
        if (e.target) e.target.value = '';
    };

    // Handle pending message from text selection - set input and user can send
    useEffect(() => {
        if (pendingMessage && !isLoading) {
            const { message, selectedText, recipientEmail } = pendingMessage;

            // Build context-aware message
            let fullMessage = message;
            if (recipientEmail) {
                fullMessage = `For ${recipientEmail}: ${message}`;
            }

            // Set input so user can review and send
            setInput(fullMessage);
            onPendingMessageHandled?.();
        }
    }, [pendingMessage, isLoading, onPendingMessageHandled]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    context: context,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();

            // Handle tool results - check for preview action
            if (data.toolResults && data.toolResults.length > 0) {
                data.toolResults.forEach((result: any) => {
                    if (result.result.action === 'show_preview') {
                        // Store preview data for confirm button
                        setPendingPreview({
                            previewType: result.result.previewType,
                            recipient: result.result.recipient,
                            email: result.result.email,
                            template: result.result.template,
                            totalRecipients: result.result.totalRecipients,
                            samples: result.result.samples,
                            recipients: context?.recipients
                        });

                        // AUTOMATICALLY UPDATE EDITOR
                        if (result.result.template) {
                            console.log('[AI] Preview template:', result.result.template);
                            if (result.result.template.subject && onInsertSubject) {
                                console.log('[AI] Inserting subject from preview:', result.result.template.subject);
                                onInsertSubject(result.result.template.subject);
                            }
                            if (result.result.template.body && onInsertBody) {
                                console.log('[AI] Inserting body from preview, length:', result.result.template.body.length);
                                onInsertBody(result.result.template.body);
                            }
                        }
                    } else if (result.result.action === 'show_personalized_preview') {
                        // Handle personalized emails preview
                        setPendingPreview({
                            previewType: 'personalized',
                            totalRecipients: result.result.totalRecipients,
                            personalizedEmails: result.result.personalizedEmails,
                            samples: result.result.samples,
                            template: result.result.template,
                            recipients: context?.recipients
                        });

                        // Update editor with template (individual emails stored separately)
                        if (result.result.template) {
                            if (result.result.template.subject && onInsertSubject) {
                                onInsertSubject(result.result.template.subject);
                            }
                            if (result.result.template.body && onInsertBody) {
                                onInsertBody(result.result.template.body);
                            }
                        }

                        // Pass personalized emails to parent for preview cycling
                        if (result.result.personalizedEmails && onPersonalizedEmails) {
                            onPersonalizedEmails(result.result.personalizedEmails);
                        }

                        toast.success(`Generated ${result.result.totalRecipients} unique personalized emails!`);
                    } else if (result.result.success) {
                        toast.success(result.result.message);
                    }
                });
            }

            // Handle insert content action
            if (data.insertContent) {
                console.log('[AI] Inserting content:', data.insertContent);
                if (data.insertContent.subject && onInsertSubject) {
                    console.log('[AI] Inserting subject:', data.insertContent.subject);
                    onInsertSubject(data.insertContent.subject);
                } else {
                    console.warn('[AI] No subject to insert or no onInsertSubject callback');
                }
                if (data.insertContent.body && onInsertBody) {
                    console.log('[AI] Inserting body, length:', data.insertContent.body.length);
                    onInsertBody(data.insertContent.body);
                } else {
                    console.warn('[AI] No body to insert or no onInsertBody callback');
                }
                toast.success('Content inserted into compose form!');
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
            }]);
        } catch (error) {
            console.error('AI error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I apologize, but I encountered an error. Please try again.",
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSend = async () => {
        if (!pendingPreview) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');

            // Handle personalized emails differently
            const sendType = pendingPreview.previewType === 'personalized' ? 'personalized' : pendingPreview.previewType;

            const response = await fetch(`${API_BASE}/confirm-send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    sendType: sendType,
                    recipient: pendingPreview.recipient,
                    recipients: pendingPreview.recipients,
                    template: pendingPreview.template,
                    email: pendingPreview.email,
                    personalizedEmails: pendingPreview.personalizedEmails // Pass unique emails per recipient
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `✅ ${data.message}`,
                    timestamp: new Date(),
                }]);
            } else {
                toast.error(data.error || 'Failed to send');
            }

            setPendingPreview(null);
        } catch (error) {
            console.error('Send error:', error);
            toast.error('Failed to send emails');
        } finally {
            setIsLoading(false);
        }
    };

    const generateEmail = async (type: string) => {
        const prompt = `Generate a ${type} email.`;
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: prompt,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/generate-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type,
                    context,
                    tone: 'professional',
                    length: 'medium',
                }),
            });

            if (!response.ok) throw new Error('Failed to generate email');
            const data = await response.json();

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Here's a ${type.replace('-', ' ')} email:\n\n**Subject:** ${data.subject}\n\n---\n\n${data.body}\n\n---\n\nWould you like me to insert this into your email editor?`,
                timestamp: new Date(),
            }]);

            if (data.subject && onInsertSubject) {
                toast.success('Email generated! Click to use the subject line', {
                    action: {
                        label: 'Use Subject',
                        onClick: () => onInsertSubject(data.subject),
                    },
                });
            }
        } catch (e) {
            toast.error("Failed to generate email");
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Failed to generate email content. Please try again.",
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            toast.success('Copied to clipboard');
        } catch {
            toast.error('Failed to copy');
        }
    };

    if (!isOpen) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/50 font-bold rounded-full shadow-lg h-12 px-6 uppercase tracking-wide transition-all duration-300 border border-transparent hover:border-orange-400/50 flex items-center gap-2"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" />
                        Iris AI
                    </span>
                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                        <div className="relative h-full w-8 bg-white/20" />
                    </div>
                </button>
            </div>
        );
    }

    return (
        <Card className={cn("flex h-full w-[450px] shrink-0 flex-col shadow-none border-l rounded-none bg-background", className)}>
            <div className="flex flex-row items-center justify-end p-2 border-b">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setIsMinimized(true)}>
                    <Minimize2 className="size-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
                    <X className="size-4 text-muted-foreground" />
                </Button>
            </div>

            <CardContent className="flex flex-1 flex-col p-0 overflow-hidden relative">

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-6 mt-8">
                        <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5 shadow-inner ring-1 ring-inset ring-white/10">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>

                        <div className="flex flex-col items-center text-center max-w-[80%]">
                            <h2 className="text-xl font-medium tracking-tight text-foreground mb-1">
                                Hi there,
                            </h2>
                            <h3 className="text-lg font-medium text-muted-foreground">
                                I'm Iris AI. How can I help?
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                I'm here to help you optimize your campaigns. Choose a starter below or ask me anything!
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 px-4">
                            <Badge
                                variant="secondary"
                                className="h-7 cursor-pointer gap-1.5 px-3 py-1.5 text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                onClick={() => {
                                    const recipientCount = context?.recipients?.length || 0;
                                    if (recipientCount > 0) {
                                        setInput(`Write unique personalized cold emails for all ${recipientCount} recipients. Make each email different and high-converting for B2B leads.`);
                                    } else {
                                        setInput("Draft a high-converting cold email for B2B leads");
                                    }
                                }}
                            >
                                <Mail className="w-3.5 h-3.5 text-blue-500" />
                                Draft Cold Email
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="h-7 cursor-pointer gap-1.5 px-3 py-1.5 text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                onClick={() => {
                                    const hasContent = context?.currentSubject || context?.currentBody;
                                    if (hasContent) {
                                        setInput(`Review my current email for deliverability issues and suggest improvements:\n\nSubject: ${context?.currentSubject || '(none)'}\n\nBody: ${context?.currentBody || '(none)'}`);
                                    } else {
                                        setInput("How can I improve my email deliverability?");
                                    }
                                }}
                            >
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                Improve Deliverability
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="h-7 cursor-pointer gap-1.5 px-3 py-1.5 text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                onClick={() => {
                                    const recipientCount = context?.recipients?.length || 0;
                                    if (recipientCount > 0) {
                                        setInput(`Give me creative campaign ideas for my ${recipientCount} recipients. Consider their data fields: ${context?.headers?.join(', ') || 'name, email'}`);
                                    } else {
                                        setInput("Give me creative ideas for my next campaign");
                                    }
                                }}
                            >
                                <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                                Campaign Ideas
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="h-7 cursor-pointer gap-1.5 px-3 py-1.5 text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                onClick={() => {
                                    const recipientCount = context?.recipients?.length || 0;
                                    if (recipientCount > 0) {
                                        setInput(`Generate 5 high-converting subject line variations for my campaign to ${recipientCount} recipients. Use personalization with {{name}} where appropriate.`);
                                    } else {
                                        generateEmail('cold-outreach');
                                    }
                                }}
                            >
                                <PenToolIcon className="w-3.5 h-3.5 text-purple-500" />
                                Subject Lines
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="h-7 cursor-pointer gap-1.5 px-3 py-1.5 text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                onClick={() => {
                                    const hasContent = context?.currentSubject || context?.currentBody;
                                    if (hasContent) {
                                        setInput(`Analyze the sentiment and tone of my email draft and suggest improvements:\n\nSubject: ${context?.currentSubject || '(none)'}\n\nBody: ${context?.currentBody || '(none)'}`);
                                    } else {
                                        setInput("Analyze the sentiment of my email draft");
                                    }
                                }}
                            >
                                <Smile className="w-3.5 h-3.5 text-orange-500" />
                                Sentiment
                            </Badge>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 w-full">
                        <div className="p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className="group">
                                    <div className={cn(
                                        'flex gap-3',
                                        msg.role === 'user' && 'flex-row-reverse'
                                    )}>
                                        <div className={cn(
                                            'w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs border',
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-muted text-muted-foreground border-border'
                                        )}>
                                            {msg.role === 'user' ? (
                                                <User className="w-4 h-4" />
                                            ) : (
                                                <Bot className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className={cn(
                                            'max-w-[85%] relative group',
                                            msg.role === 'user' && 'text-right'
                                        )}>
                                            <div className={cn(
                                                'px-4 py-2.5 rounded-2xl text-sm leading-relaxed inline-block text-left shadow-sm',
                                                msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : 'bg-muted text-foreground rounded-tl-sm border border-border'
                                            )}>
                                                {/* Markdown Parsing Logic using ReactMarkdown */}
                                                <div className="text-sm prose dark:prose-invert max-w-none break-words leading-normal">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm, remarkBreaks]}
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-7 text-sm text-foreground/90" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2 text-foreground/90" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-foreground/90" {...props} />,
                                                            li: ({ node, ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
                                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-4 mt-6 first:mt-0 text-foreground" {...props} />,
                                                            h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mb-3 mt-5 first:mt-0 text-foreground" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="text-base font-semibold mb-2 mt-4 text-foreground" {...props} />,
                                                            a: ({ node, ...props }) => <a className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors" {...props} />,
                                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-4 bg-muted/20 italic text-muted-foreground rounded-r-md" {...props} />,
                                                            code: ({ node, ...props }) => <code className="font-mono text-[13px] bg-muted/50 px-1.5 py-0.5 rounded-md border border-border text-foreground" {...props} />,
                                                            pre: ({ node, ...props }) => <pre className="bg-[#1e1e1e] dark:bg-[#1e1e1e] p-4 rounded-lg mb-4 overflow-x-auto border border-border/50 text-white" {...props} />,
                                                            hr: ({ node, ...props }) => <hr className="my-6 border-border" {...props} />,
                                                            table: ({ node, ...props }) => <table className="w-full my-4 border-collapse text-sm" {...props} />,
                                                            th: ({ node, ...props }) => <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold" {...props} />,
                                                            td: ({ node, ...props }) => <td className="border border-border px-3 py-2" {...props} />,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>

                                            </div>
                                            {msg.role === 'assistant' && (
                                                <button
                                                    onClick={() => copyToClipboard(msg.content, msg.id)}
                                                    className="absolute -bottom-5 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                                                >
                                                    {copiedId === msg.id ? (
                                                        <><Check className="w-3 h-3" /> Copied</>
                                                    ) : (
                                                        <><Copy className="w-3 h-3" /> Copy</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    </div>
                                    <div className="bg-muted text-foreground px-4 py-2.5 rounded-2xl rounded-tl-sm border border-border">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview Card with Confirm Button */}
                            {pendingPreview && (
                                <div className="mx-2 my-3 p-4 rounded-xl border bg-muted/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Mail className="w-5 h-5 text-primary" />
                                        <span className="font-medium text-foreground">
                                            {pendingPreview.previewType === 'single'
                                                ? `Ready to send to ${pendingPreview.recipient?.name}`
                                                : pendingPreview.previewType === 'personalized'
                                                    ? `${pendingPreview.totalRecipients} unique personalized emails ready`
                                                    : `Ready to send to ${pendingPreview.totalRecipients} recipients`
                                            }
                                        </span>
                                    </div>

                                    {/* Preview content */}
                                    <div className="mb-3 p-3 rounded-lg bg-background border">
                                        {pendingPreview.previewType === 'single' ? (
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">To: {pendingPreview.recipient?.email}</div>
                                                <div className="font-medium text-sm text-foreground">{pendingPreview.email?.subject}</div>
                                                <div className="text-sm text-muted-foreground mt-2 line-clamp-3">{pendingPreview.email?.body}</div>
                                            </div>
                                        ) : pendingPreview.previewType === 'personalized' ? (
                                            <div>
                                                <div className="text-sm text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                                                    <SparklesIcon className="w-4 h-4" />
                                                    Each email is uniquely crafted:
                                                </div>
                                                {pendingPreview.samples?.slice(0, 3).map((sample: any, i: number) => (
                                                    <div key={i} className="mb-2 p-2 bg-muted rounded border-l-2 border-primary">
                                                        <div className="text-xs text-muted-foreground">{sample.name} ({sample.email})</div>
                                                        <div className="text-sm font-medium text-foreground">{sample.subject}</div>
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{sample.bodyPreview}</div>
                                                    </div>
                                                ))}
                                                {pendingPreview.totalRecipients > 3 && (
                                                    <div className="text-xs text-muted-foreground text-center mt-2">
                                                        + {pendingPreview.totalRecipients - 3} more unique emails
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-2">Sample previews:</div>
                                                {pendingPreview.samples?.slice(0, 2).map((sample: any, i: number) => (
                                                    <div key={i} className="mb-2 p-2 bg-muted rounded">
                                                        <div className="text-xs text-muted-foreground">{sample.email}</div>
                                                        <div className="text-sm font-medium text-foreground">{sample.subject}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleConfirmSend}
                                            disabled={isLoading}
                                            className="flex-1"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            {isLoading ? 'Sending...' : 'Confirm & Send'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setPendingPreview(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>
                    </ScrollArea>
                )}

                <div className="relative mt-auto flex-col p-4 pt-1">
                    <div className="relative rounded-md ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
                        <Textarea
                            placeholder="Ask me anything..."
                            className="peer bg-transparent min-h-[100px] resize-none border-none py-3 ps-9 pe-9 shadow-none focus-visible:ring-0"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />

                        <div className="pointer-events-none absolute start-0 top-[14px] flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <SparklesIcon className="size-4" />
                        </div>

                        <button
                            className="absolute end-0 bottom-7 flex h-9 w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-colors outline-none hover:text-foreground focus:z-10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={input ? "Send message" : "Record audio"}
                            type="button"
                            onClick={input ? sendMessage : undefined}
                        >
                            {input ? (
                                <Send className="size-4 text-primary" />
                            ) : (
                                <Mic className="size-4" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between rounded-b-md border-t bg-muted/50 px-3 py-2 dark:bg-muted mt-2">
                        <Select defaultValue="mistral-large-latest">
                            <SelectTrigger className="h-7 w-auto min-w-[130px] border-none shadow-none gap-2 px-2 focus:ring-0 text-foreground bg-transparent">
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-3 h-3 text-primary" />
                                    <SelectValue placeholder="Select a model" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem className="text-xs" value="mistral-large-latest">Mistral Large 3</SelectItem>
                                <SelectItem className="text-xs" value="mistral-medium-latest">Mistral Medium 3.1</SelectItem>
                                <SelectItem className="text-xs" value="mistral-small-latest">Mistral Small 3.2</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv,.txt" // basic defaults, can be expanded
                                onChange={handleFileChange}
                            />
                            <Button
                                className="h-7 px-2 gap-2 text-xs hover:bg-muted-foreground/10"
                                variant="ghost"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Paperclip className="size-3.5 text-muted-foreground" />
                                Attach
                            </Button>
                            <Button className="h-7 w-7 p-0" variant="ghost" title="Shortcuts">
                                <Command className="size-3.5 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}
