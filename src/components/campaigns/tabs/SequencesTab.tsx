import { useState, useEffect, useRef } from 'react';
import {
    Plus, Trash2, Copy, Eye, Clock, Sparkles,
    MoreVertical, ArrowLeft, ArrowRight, MessageSquare,
    Check, X, ChevronDown, ChevronRight, Hash, Send, Code, Type, AlertCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import type { Sequence, SequenceStep, EmailVariant, Lead } from '../types';

interface SequencesTabProps {
    campaignId: string;
    sequence: Sequence | null;
    onSequenceUpdate: (sequence: Sequence) => void;
    leads?: Lead[];
    isLocked?: boolean;
    className?: string;
}

const defaultStep: SequenceStep = {
    id: '',
    order: 1,
    subject: '',
    body: '',
    delayDays: 0,
    delayHours: 0,
    variants: []
};

// Merge fields helper
const getAvailableMergeFields = (leads: Lead[]) => {
    // All variables supported by the backend
    const allFields = new Set([
        // Lead fields
        'firstName', 'lastName', 'name', 'email', 'company', 'jobTitle',
        'phone', 'website', 'address', 'city', 'country', 'notes',
        // Sender fields (from SMTP account profile)
        'senderName', 'senderCompany', 'senderPosition', 'senderPhone',
        'senderWebsite', 'senderLinkedIn', 'senderAddress', 'senderSignature'
    ]);

    if (leads && leads.length > 0) {
        // Scan up to 50 leads to find all unique custom fields
        const sampleSize = Math.min(leads.length, 50);
        for (let i = 0; i < sampleSize; i++) {
            const lead = leads[i];
            if (lead.customFields) {
                Object.keys(lead.customFields).forEach(key => {
                    // key is a string
                    allFields.add(key);
                });
            }
        }
    }

    return Array.from(allFields);
};

export function SequencesTab({ campaignId, sequence, onSequenceUpdate, leads = [], isLocked, className }: SequencesTabProps) {
    const { theme } = useTheme();
    const [steps, setSteps] = useState<SequenceStep[]>([
        { ...defaultStep, id: 'step-1' }
    ]);
    const [activeStepId, setActiveStepId] = useState('step-1');
    const [showVariables, setShowVariables] = useState(false);

    // AI State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Saving State
    const [isSaving, setIsSaving] = useState(false);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    // Threading State - follow-up emails appear in same thread
    const [threadSequence, setThreadSequence] = useState(true);

    // Load threading preference from campaign options
    useEffect(() => {
        const loadThreadingPreference = async () => {
            try {
                const token = localStorage.getItem('bulkEmailToken');
                const response = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.options?.threadSequence !== undefined) {
                        setThreadSequence(data.options.threadSequence);
                    }
                }
            } catch (err) {
                console.error('Error loading threading preference:', err);
            }
        };
        loadThreadingPreference();
    }, [campaignId]);

    const handleThreadingToggle = async () => {
        const newValue = !threadSequence;
        setThreadSequence(newValue);

        // Save to campaign options
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/options`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    options: { threadSequence: newValue }
                })
            });
        } catch (err) {
            console.error('Error saving threading preference:', err);
        }
    };

    useEffect(() => {
        if (sequence?.steps && sequence.steps.length > 0) {
            setSteps(sequence.steps);
            setActiveStepId(sequence.steps[0].id);
        }
    }, [sequence]);

    const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
    const mergeFields = getAvailableMergeFields(leads);

    const handleUpdateStep = (stepId: string, updates: Partial<SequenceStep>) => {
        setSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, ...updates } : step
        ));
    };

    const handleAddStep = () => {
        const newStep: SequenceStep = {
            ...defaultStep,
            id: `step-${Date.now()}`,
            order: steps.length + 1,
            delayDays: 2
        };
        setSteps(prev => [...prev, newStep]);
        setActiveStepId(newStep.id);
    };

    const handleDeleteStep = (stepId: string) => {
        if (steps.length <= 1) return;
        const newSteps = steps.filter(s => s.id !== stepId);
        setSteps(newSteps);
        if (activeStepId === stepId) {
            setActiveStepId(newSteps[0].id);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const updatedSequence: Sequence = {
            id: sequence?.id || `sequence-${campaignId}`,
            campaignId,
            steps
        };

        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/sequence`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sequence: updatedSequence })
            });
        } catch (err) {
            console.error('Error saving sequence:', err);
        } finally {
            setIsSaving(false);
        }

        onSequenceUpdate(updatedSequence);
    };

    const insertVariable = (variable: string) => {
        const textarea = bodyRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = activeStep.body;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newText = before + `{{${variable}}}` + after;
            handleUpdateStep(activeStepId, { body: newText });
            setShowVariables(false);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
            }, 0);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    context: {
                        mergeFields,
                        leadCount: leads.length,
                        currentSubject: activeStep.subject,
                        currentBody: activeStep.body
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[AI Generate] Response:', data);

                if (data.subject) {
                    console.log('[AI Generate] Updating subject:', data.subject);
                    handleUpdateStep(activeStepId, { subject: data.subject });
                } else {
                    console.warn('[AI Generate] No subject in response');
                }

                if (data.body) {
                    console.log('[AI Generate] Updating body, length:', data.body.length);
                    handleUpdateStep(activeStepId, { body: data.body });
                } else {
                    console.warn('[AI Generate] No body in response');
                }
            } else {
                console.error('[AI Generate] Response not OK:', response.status);
            }
        } catch (error) {
            console.error('AI error:', error);
        } finally {
            setAiLoading(false);
            setAiPrompt('');
            setShowAiModal(false);
        }
    };

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Lock Banner */}
            {isLocked && (
                <div className={cn('flex items-center gap-2 px-4 py-2 text-xs font-medium border-b',
                    theme === 'dark' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                )}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Campaign is running. Pause to make changes.
                </div>
            )}
            {/* Compact Toolbar */}
            <div className={cn(
                'flex items-center justify-between px-4 py-3 border-b flex-shrink-0',
                theme === 'dark' ? 'bg-[#0d0d0d] border-neutral-800' : 'bg-white border-gray-200'
            )}>
                <div className="flex items-center gap-3">
                    <h2 className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Sequences
                    </h2>
                    <div className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        theme === 'dark' ? 'bg-neutral-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                    )}>
                        {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    className={cn(
                        'h-8 text-xs gap-1.5',
                        theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                >
                    {isSaving ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            Save
                        </>
                    )}
                </Button>
            </div>

            <div className="flex-1 flex gap-6 min-h-0 p-4 overflow-hidden">
                {/* Steps Navigation (Left Sidebar) */}
                <div className="w-72 flex-shrink-0 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className={cn(
                            'text-xs font-semibold uppercase tracking-wider',
                            theme === 'dark' ? 'text-orange-500' : 'text-blue-600'
                        )}>
                            Sequence Flow
                        </h3>
                        <span className={cn(
                            'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                            theme === 'dark'
                                ? 'border-neutral-700 text-gray-400 bg-neutral-800'
                                : 'border-gray-200 text-gray-400 bg-gray-50'
                        )}>
                            {steps.length} Steps
                        </span>
                    </div>

                    {/* Threading Option */}
                    {steps.length > 1 && (
                        <div
                            onClick={() => handleThreadingToggle()}
                            className={cn(
                                'flex items-center justify-between p-2.5 rounded border cursor-pointer transition-all',
                                threadSequence
                                    ? theme === 'dark'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                                        : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                    : theme === 'dark'
                                        ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare className={cn(
                                    'w-3.5 h-3.5',
                                    threadSequence
                                        ? 'text-emerald-500'
                                        : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )} />
                                <div>
                                    <p className={cn(
                                        'text-[10px] font-semibold',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        Thread Follow-ups
                                    </p>
                                    <p className={cn(
                                        'text-[9px]',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        {threadSequence ? 'Emails appear as replies' : 'Separate new emails'}
                                    </p>
                                </div>
                            </div>
                            <div className={cn(
                                'w-8 h-4.5 rounded-full p-0.5 transition-colors',
                                threadSequence
                                    ? 'bg-emerald-500'
                                    : theme === 'dark' ? 'bg-neutral-600' : 'bg-gray-300'
                            )}>
                                <div className={cn(
                                    'w-3.5 h-3.5 rounded-full bg-white shadow transition-transform',
                                    threadSequence ? 'translate-x-3.5' : 'translate-x-0'
                                )} />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                        {steps.map((step, index) => (
                            <button
                                key={step.id}
                                onClick={() => setActiveStepId(step.id)}
                                className={cn(
                                    'relative w-full flex items-center gap-3 p-3 rounded text-left transition-all',
                                    activeStepId === step.id
                                        ? theme === 'dark'
                                            ? 'bg-neutral-800 border border-neutral-700'
                                            : 'bg-gray-100 border border-gray-200'
                                        : theme === 'dark'
                                            ? 'bg-neutral-900 border border-neutral-800 hover:bg-neutral-800'
                                            : 'bg-white border border-gray-100 hover:bg-gray-50'
                                )}
                            >
                                <div className={cn(
                                    'flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs font-bold',
                                    activeStepId === step.id
                                        ? 'bg-orange-500 text-white'
                                        : theme === 'dark'
                                            ? 'bg-neutral-800 text-gray-400 border border-neutral-700'
                                            : 'bg-gray-100 text-gray-400'
                                )}>
                                    {index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        'text-xs font-medium truncate',
                                        activeStepId === step.id
                                            ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    )}>
                                        {step.subject || <span className="italic opacity-50">Untitled</span>}
                                    </p>
                                    <span className={cn(
                                        'text-[10px]',
                                        index === 0
                                            ? 'text-orange-500'
                                            : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        {index === 0 ? '✓ Immediate' : (() => {
                                            const parts = [];
                                            if (step.delayDays) parts.push(`${step.delayDays}d`);
                                            if (step.delayHours) parts.push(`${step.delayHours}h`);
                                            if (step.delayMinutes) parts.push(`${step.delayMinutes}m`);
                                            return parts.length > 0 ? parts.join(' ') + ' delay' : 'No delay';
                                        })()}
                                    </span>
                                </div>

                                {steps.length > 1 && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteStep(step.id);
                                        }}
                                        className={cn(
                                            'p-1 rounded opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity cursor-pointer',
                                            theme === 'dark'
                                                ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                                                : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                                        )}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                        ))}

                        <button
                            onClick={handleAddStep}
                            className={cn(
                                'w-full flex items-center justify-center gap-2 py-3 border border-dashed rounded text-xs font-medium transition-all',
                                theme === 'dark'
                                    ? 'border-neutral-700 text-gray-500 hover:border-orange-500 hover:text-orange-500'
                                    : 'border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                            )}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Sequence Step
                        </button>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className={cn(
                    'flex-1 flex flex-col rounded overflow-hidden',
                    theme === 'dark'
                        ? 'bg-neutral-900 border border-neutral-800'
                        : 'bg-white border border-gray-200'
                )}>
                    {/* Editor Header / Subject Line */}
                    <div className={cn(
                        'px-4 py-3 border-b',
                        theme === 'dark' ? 'border-neutral-800 bg-neutral-900' : 'border-gray-100 bg-white'
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className={cn(
                                    'block text-[10px] font-semibold uppercase tracking-wider mb-1',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )}>
                                    Email Subject
                                </label>
                                <input
                                    type="text"
                                    value={activeStep.subject}
                                    onChange={(e) => handleUpdateStep(activeStepId, { subject: e.target.value })}
                                    placeholder="Enter a compelling subject line..."
                                    className={cn(
                                        'w-full bg-transparent text-lg font-semibold focus:outline-none placeholder:opacity-40 transition-all',
                                        theme === 'dark' ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-300'
                                    )}
                                />
                            </div>

                            {/* Delay Settings for non-first steps */}
                            {activeStep.order > 1 && (
                                <div className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded border',
                                    theme === 'dark' ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                )}>
                                    <Clock className={cn('w-3.5 h-3.5', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')} />
                                    <span className={cn('text-[10px] font-medium uppercase', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>Wait</span>

                                    {/* Days */}
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            value={activeStep.delayDays}
                                            onChange={(e) => handleUpdateStep(activeStepId, { delayDays: parseInt(e.target.value) || 0 })}
                                            className={cn(
                                                'w-8 text-center bg-transparent font-mono text-xs font-bold focus:outline-none border-b',
                                                theme === 'dark' ? 'text-white border-neutral-600 focus:border-orange-500' : 'text-gray-900 border-gray-300'
                                            )}
                                        />
                                        <span className={cn('text-[10px]', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>d</span>
                                    </div>

                                    {/* Hours */}
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="23"
                                            value={activeStep.delayHours || 0}
                                            onChange={(e) => handleUpdateStep(activeStepId, { delayHours: parseInt(e.target.value) || 0 })}
                                            className={cn(
                                                'w-8 text-center bg-transparent font-mono text-xs font-bold focus:outline-none border-b',
                                                theme === 'dark' ? 'text-white border-neutral-600 focus:border-orange-500' : 'text-gray-900 border-gray-300'
                                            )}
                                        />
                                        <span className={cn('text-[10px]', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>h</span>
                                    </div>

                                    {/* Minutes */}
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={activeStep.delayMinutes || 0}
                                            onChange={(e) => handleUpdateStep(activeStepId, { delayMinutes: parseInt(e.target.value) || 0 })}
                                            className={cn(
                                                'w-8 text-center bg-transparent font-mono text-xs font-bold focus:outline-none border-b',
                                                theme === 'dark' ? 'text-white border-neutral-600 focus:border-orange-500' : 'text-gray-900 border-gray-300'
                                            )}
                                        />
                                        <span className={cn('text-[10px]', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>m</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor Mode Toggle */}
                    <div className={cn(
                        'px-4 py-2 border-b flex items-center justify-between',
                        theme === 'dark' ? 'border-neutral-800 bg-neutral-900/50' : 'border-gray-100 bg-gray-50'
                    )}>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleUpdateStep(activeStepId, { isHtml: false })}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                    !activeStep.isHtml
                                        ? 'bg-orange-500 text-white'
                                        : theme === 'dark' ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                                )}
                            >
                                <Type className="w-3.5 h-3.5" />
                                Plain Text
                            </button>
                            <button
                                onClick={() => handleUpdateStep(activeStepId, { isHtml: true })}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                    activeStep.isHtml
                                        ? 'bg-orange-500 text-white'
                                        : theme === 'dark' ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                                )}
                            >
                                <Code className="w-3.5 h-3.5" />
                                HTML
                            </button>
                        </div>
                        <span className={cn('text-xs', theme === 'dark' ? 'text-neutral-500' : 'text-gray-400')}>
                            {activeStep.isHtml ? 'Write HTML code for rich formatting' : 'Simple text email'}
                        </span>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 flex min-h-0">
                        {/* Code/Text Editor */}
                        <div className={cn('flex-1 relative flex flex-col', activeStep.isHtml && 'border-r', theme === 'dark' ? 'border-neutral-800' : 'border-gray-200')}>
                            {activeStep.isHtml ? (
                                <>
                                    <div className={cn('px-4 py-2 text-xs font-medium border-b flex-shrink-0', theme === 'dark' ? 'text-neutral-400 border-neutral-800 bg-neutral-900' : 'text-gray-500 border-gray-100 bg-gray-50')}>
                                        HTML Code
                                    </div>
                                    <textarea
                                        ref={bodyRef}
                                        placeholder={`<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hello {{firstName}}!</h1>
        </div>
        <div class="content">
            <p>Write your HTML email content here...</p>
            <a href="#" class="button">Call to Action</a>
        </div>
        <p>Best regards,<br>[Your Name]</p>
    </div>
</body>
</html>`}
                                        value={activeStep.htmlBody || ''}
                                        onChange={(e) => handleUpdateStep(activeStepId, { htmlBody: e.target.value })}
                                        className={cn(
                                            'flex-1 w-full p-4 bg-transparent resize-none focus:outline-none text-xs font-mono leading-relaxed',
                                            theme === 'dark' ? 'text-emerald-400 placeholder:text-neutral-600' : 'text-gray-800 placeholder:text-gray-400'
                                        )}
                                        spellCheck={false}
                                    />
                                </>
                            ) : (
                                <textarea
                                    ref={bodyRef}
                                    value={activeStep.body}
                                    onChange={(e) => handleUpdateStep(activeStepId, { body: e.target.value })}
                                    placeholder="Hi {{firstName}}, write something amazing..."
                                    className={cn(
                                        'flex-1 w-full p-4 bg-transparent border-0 resize-none focus:outline-none text-sm leading-relaxed',
                                        theme === 'dark' ? 'text-gray-200 placeholder:text-gray-600' : 'text-gray-800 placeholder:text-gray-300'
                                    )}
                                />
                            )}

                            {/* Floating Toolbar */}
                            <div className={cn(
                                'absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-1.5 rounded border shadow-lg',
                                theme === 'dark'
                                    ? 'bg-neutral-900/95 backdrop-blur-sm border-neutral-700'
                                    : 'bg-white/95 backdrop-blur-sm border-gray-200'
                            )}>
                                <button
                                    onClick={() => setShowVariables(!showVariables)}
                                    className={cn(
                                        'relative flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wide transition-all',
                                        theme === 'dark'
                                            ? 'hover:bg-neutral-800 text-gray-400 hover:text-white'
                                            : 'hover:bg-gray-100 text-gray-500'
                                    )}
                                >
                                    <Hash className="w-3.5 h-3.5" />
                                    <span>Variables</span>

                                    {showVariables && (
                                        <div className={cn(
                                            'absolute bottom-full left-0 mb-2 w-40 rounded border shadow-xl overflow-hidden py-1',
                                            theme === 'dark' ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-100'
                                        )}>
                                            {mergeFields.map(field => (
                                                <div
                                                    key={field}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        insertVariable(field);
                                                    }}
                                                    className={cn(
                                                        'px-3 py-1.5 text-[10px] font-mono cursor-pointer transition-colors normal-case',
                                                        theme === 'dark' ? 'text-gray-400 hover:bg-neutral-800 hover:text-orange-500' : 'text-gray-600 hover:bg-gray-50'
                                                    )}
                                                >
                                                    {`{{${field}}}`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </button>

                                <div className={cn('w-px h-5', theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-200')} />

                                <button
                                    onClick={() => setShowAiModal(!showAiModal)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wide transition-all',
                                        theme === 'dark'
                                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                    )}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>AI Assist</span>
                                </button>
                            </div>

                            {/* AI Modal Popover */}
                            {showAiModal && (
                                <div className={cn(
                                    'absolute bottom-24 left-1/2 -translate-x-1/2 w-[500px] p-1 rounded-2xl border shadow-2xl z-50 animate-in zoom-in-95',
                                    theme === 'dark' ? 'bg-[#1a1e25] border-[#3a424f]' : 'bg-white border-gray-200'
                                )}>
                                    <div className="flex gap-2 p-2">
                                        <input
                                            type="text"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="e.g. 'Make this email sound more professional and concise'..."
                                            className={cn(
                                                'flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition-all',
                                                theme === 'dark'
                                                    ? 'bg-[#12151a] text-white placeholder:text-[#3a424f]'
                                                    : 'bg-gray-50 text-gray-900 border border-transparent focus:border-purple-200'
                                            )}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleAiGenerate}
                                            disabled={aiLoading}
                                            className={cn(
                                                'px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2',
                                                theme === 'dark'
                                                    ? 'bg-[#d97757] text-white hover:bg-[#c46144]'
                                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                            )}
                                        >
                                            {aiLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {aiLoading ? 'Thinking' : 'Generate'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Live HTML Preview */}
                        {activeStep.isHtml && (
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className={cn('px-4 py-2 text-xs font-medium border-b flex items-center justify-between flex-shrink-0', theme === 'dark' ? 'text-neutral-400 border-neutral-800 bg-neutral-900' : 'text-gray-500 border-gray-100 bg-gray-50')}>
                                    <span>Live Preview</span>
                                    <span className={cn('text-xs px-2 py-0.5 rounded', theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
                                        {leads && leads.length > 0 ? `Previewing for: ${leads[0]?.firstName || leads[0]?.email}` : 'Add leads to preview'}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-auto p-4 bg-white">
                                    <iframe
                                        srcDoc={(() => {
                                            let html = activeStep.htmlBody || '';
                                            // Replace variables with first lead's data for preview
                                            const lead = leads && leads[0];
                                            if (lead) {
                                                html = html.replace(/\{\{firstName\}\}/gi, lead.firstName || '');
                                                html = html.replace(/\{\{lastName\}\}/gi, lead.lastName || '');
                                                html = html.replace(/\{\{email\}\}/gi, lead.email || '');
                                                html = html.replace(/\{\{company\}\}/gi, lead.company || '');
                                            }
                                            return html;
                                        })()}
                                        className="w-full h-full border-0"
                                        title="Email Preview"
                                        sandbox="allow-same-origin"
                                        style={{ minHeight: '300px' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Removed Absolute Save Button */}

                <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${theme === 'dark' ? '#252a33' : '#e5e7eb'};
                    border-radius: 10px;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
                .bg-pattern-dots {
                    background-image: radial-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px);
                    background-size: 24px 24px;
                }
            `}</style>
            </div>
        </div>
    );
}

