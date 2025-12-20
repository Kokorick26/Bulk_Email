import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, GripVertical, Trash2, Copy, Eye, ChevronDown, ChevronUp,
    Sparkles, FileText, Code, Link, Image, Type, Bold,
    Italic, List, AlignLeft, Wand2, Bot, Save, Send, X,
    User, Mail, Clock, Loader2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import { ScrollArea } from '../../ui/ScrollArea';
import type { Sequence, SequenceStep, EmailVariant, Lead } from '../types';

interface SequencesTabProps {
    campaignId: string;
    sequence: Sequence | null;
    onSequenceUpdate: (sequence: Sequence) => void;
    leads?: Lead[];
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
    if (!leads || leads.length === 0) {
        return ['firstName', 'lastName', 'email', 'company'];
    }
    const sample = leads[0];
    const fields = ['firstName', 'lastName', 'email', 'company'];
    Object.keys(sample.customFields || {}).forEach(key => {
        if (!fields.includes(key)) fields.push(key);
    });
    return fields;
};

// Personalize content with lead data
const personalizeContent = (content: string, lead: Lead): string => {
    if (!content || !lead) return content;
    let result = content;
    result = result.replace(/\{\{firstName\}\}/gi, lead.firstName || '');
    result = result.replace(/\{\{lastName\}\}/gi, lead.lastName || '');
    result = result.replace(/\{\{email\}\}/gi, lead.email || '');
    result = result.replace(/\{\{company\}\}/gi, lead.company || '');
    Object.entries(lead.customFields || {}).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, value);
    });
    return result;
};

export function SequencesTab({ campaignId, sequence, onSequenceUpdate, leads = [], className }: SequencesTabProps) {
    const { theme } = useTheme();
    const [steps, setSteps] = useState<SequenceStep[]>([
        { ...defaultStep, id: 'step-1' }
    ]);
    const [activeStepId, setActiveStepId] = useState('step-1');
    const [showPreview, setShowPreview] = useState(false);
    const [previewLeadIndex, setPreviewLeadIndex] = useState(0);
    const [showVariables, setShowVariables] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (sequence?.steps && sequence.steps.length > 0) {
            setSteps(sequence.steps);
            setActiveStepId(sequence.steps[0].id);
        }
    }, [sequence]);

    const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
    const mergeFields = getAvailableMergeFields(leads);
    const previewLead = leads[previewLeadIndex] || null;

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
            delayDays: 1
        };
        setSteps(prev => [...prev, newStep]);
        setActiveStepId(newStep.id);
    };

    const handleAddVariant = (stepId: string) => {
        setSteps(prev => prev.map(step => {
            if (step.id !== stepId) return step;
            const newVariant: EmailVariant = {
                id: `variant-${Date.now()}`,
                subject: step.subject,
                body: step.body,
                weight: 50
            };
            return { ...step, variants: [...step.variants, newVariant] };
        }));
    };

    const handleDeleteStep = (stepId: string) => {
        if (steps.length <= 1) return;
        const newSteps = steps.filter(s => s.id !== stepId);
        setSteps(newSteps);
        if (activeStepId === stepId) {
            setActiveStepId(newSteps[0].id);
        }
    };

    const handleSave = () => {
        const updatedSequence: Sequence = {
            id: sequence?.id || `sequence-${campaignId}`,
            campaignId,
            steps
        };
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
            // Set cursor position after the inserted variable
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
            }, 0);
        } else {
            handleUpdateStep(activeStepId, { body: activeStep.body + `{{${variable}}}` });
        }
        setShowVariables(false);
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
                if (data.subject) {
                    handleUpdateStep(activeStepId, { subject: data.subject });
                }
                if (data.body) {
                    handleUpdateStep(activeStepId, { body: data.body });
                }
            } else {
                // Fallback: generate a simple template
                const template = generateFallbackTemplate(aiPrompt, mergeFields);
                handleUpdateStep(activeStepId, template);
            }
        } catch (error) {
            console.error('AI generation error:', error);
            // Fallback template
            const template = generateFallbackTemplate(aiPrompt, mergeFields);
            handleUpdateStep(activeStepId, template);
        } finally {
            setAiLoading(false);
            setAiPrompt('');
            setShowAiPanel(false);
        }
    };

    const generateFallbackTemplate = (prompt: string, fields: string[]): Partial<SequenceStep> => {
        const firstName = fields.includes('firstName') ? '{{firstName}}' : 'there';
        const company = fields.includes('company') ? '{{company}}' : 'your company';

        if (prompt.toLowerCase().includes('follow')) {
            return {
                subject: `Following up, ${firstName}`,
                body: `Hi ${firstName},\n\nI wanted to follow up on my previous email. I'd love to learn more about ${company} and see if there's a way we could work together.\n\nWould you have 15 minutes this week for a quick call?\n\nBest regards`
            };
        }

        return {
            subject: `Quick question for ${firstName}`,
            body: `Hi ${firstName},\n\nI noticed ${company}'s work and thought you might be interested in what we're building.\n\nWould you be open to a quick 15-minute chat?\n\nBest regards`
        };
    };

    return (
        <div className={cn('flex gap-6 h-[calc(100vh-280px)]', className)}>
            {/* Left Panel - Steps List */}
            <div className="w-72 flex-shrink-0 flex flex-col">
                <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-2">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    'rounded-xl border p-4 cursor-pointer transition-all relative group',
                                    activeStepId === step.id
                                        ? theme === 'dark'
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-blue-500 bg-blue-50'
                                        : theme === 'dark'
                                            ? 'border-gray-800 bg-[#1a1a1a] hover:border-gray-700'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                )}
                                onClick={() => setActiveStepId(step.id)}
                            >
                                {/* Delete button */}
                                {steps.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteStep(step.id);
                                        }}
                                        className={cn(
                                            'absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                                            theme === 'dark'
                                                ? 'hover:bg-red-500/20 text-red-400'
                                                : 'hover:bg-red-100 text-red-500'
                                        )}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}

                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                                        theme === 'dark'
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-gray-200 text-gray-700'
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={cn(
                                                'font-medium text-sm',
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            )}>
                                                Step {index + 1}
                                            </h4>
                                            {index > 0 && (
                                                <span className={cn(
                                                    'text-xs px-1.5 py-0.5 rounded',
                                                    theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                )}>
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    {step.delayDays}d {step.delayHours}h
                                                </span>
                                            )}
                                        </div>

                                        {/* Email Preview Card */}
                                        <div className={cn(
                                            'mt-3 p-3 rounded-lg',
                                            theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-100'
                                        )}>
                                            <p className={cn(
                                                'text-xs truncate',
                                                step.subject
                                                    ? theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                    : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>
                                                {step.subject || '<Empty subject>'}
                                            </p>
                                        </div>

                                        {/* Add Variant Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddVariant(step.id);
                                            }}
                                            className={cn(
                                                'flex items-center gap-1 mt-3 text-xs font-medium transition-colors',
                                                theme === 'dark'
                                                    ? 'text-gray-400 hover:text-white'
                                                    : 'text-gray-500 hover:text-gray-900'
                                            )}
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add variant
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Add Step Button */}
                <button
                    onClick={handleAddStep}
                    className={cn(
                        'w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors',
                        theme === 'dark'
                            ? 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                            : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                    )}
                >
                    <Plus className="w-4 h-4" />
                    Add step
                </button>
            </div>

            {/* Right Panel - Email Editor */}
            <div className="flex-1 flex flex-col">
                <div className={cn(
                    'flex-1 rounded-xl border overflow-hidden flex flex-col',
                    theme === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-200 bg-white'
                )}>
                    {/* Subject Line */}
                    <div className={cn(
                        'flex items-center gap-4 px-6 py-4 border-b',
                        theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                    )}>
                        <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            Subject
                        </span>
                        <input
                            type="text"
                            value={activeStep.subject}
                            onChange={(e) => handleUpdateStep(activeStepId, { subject: e.target.value })}
                            placeholder="Your subject line"
                            className={cn(
                                'flex-1 bg-transparent border-0 text-base focus:outline-none focus:ring-0 placeholder:text-gray-500',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}
                        />
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                                showPreview
                                    ? theme === 'dark'
                                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                                        : 'border-blue-500 bg-blue-50 text-blue-600'
                                    : theme === 'dark'
                                        ? 'border-gray-700 text-gray-400 hover:bg-gray-800'
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            )}
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                    </div>

                    {/* Body Editor */}
                    <div className="flex-1 p-6 overflow-auto">
                        {showPreview && previewLead ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={cn(
                                        'text-sm font-medium',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        Preview for: <span className="text-blue-500">{previewLead.email}</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPreviewLeadIndex(Math.max(0, previewLeadIndex - 1))}
                                            disabled={previewLeadIndex === 0}
                                            className={cn(
                                                'p-1 rounded disabled:opacity-30',
                                                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                            )}
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <span className={cn(
                                            'text-xs',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>
                                            {previewLeadIndex + 1} / {leads.length}
                                        </span>
                                        <button
                                            onClick={() => setPreviewLeadIndex(Math.min(leads.length - 1, previewLeadIndex + 1))}
                                            disabled={previewLeadIndex >= leads.length - 1}
                                            className={cn(
                                                'p-1 rounded disabled:opacity-30',
                                                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                            )}
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className={cn(
                                    'p-4 rounded-lg border',
                                    theme === 'dark' ? 'bg-[#252525] border-gray-700' : 'bg-gray-50 border-gray-200'
                                )}>
                                    <p className={cn(
                                        'text-sm font-medium mb-2',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        Subject: {personalizeContent(activeStep.subject, previewLead)}
                                    </p>
                                    <div className={cn(
                                        'text-base whitespace-pre-wrap',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {personalizeContent(activeStep.body, previewLead) || '(No content)'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                ref={bodyRef}
                                value={activeStep.body}
                                onChange={(e) => handleUpdateStep(activeStepId, { body: e.target.value })}
                                placeholder="Start typing your email here...

Use merge fields like {{firstName}}, {{lastName}}, {{company}} to personalize your message.

Or click 'AI Tools' below to generate content automatically."
                                className={cn(
                                    'w-full h-full min-h-[300px] bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-base leading-relaxed placeholder:text-gray-500',
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                )}
                            />
                        )}
                    </div>

                    {/* Bottom Toolbar */}
                    <div className={cn(
                        'flex items-center justify-between px-6 py-3 border-t',
                        theme === 'dark' ? 'border-gray-800 bg-[#151515]' : 'border-gray-200 bg-gray-50'
                    )}>
                        <div className="flex items-center gap-2">
                            {/* Save Button */}
                            <Button
                                onClick={handleSave}
                                size="sm"
                                className={cn(
                                    'gap-1',
                                    theme === 'dark'
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                )}
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* AI Tools */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowAiPanel(!showAiPanel)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                                        showAiPanel
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : theme === 'dark'
                                                ? 'text-gray-400 hover:bg-gray-800'
                                                : 'text-gray-500 hover:bg-gray-100'
                                    )}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    AI Tools
                                </button>

                                <AnimatePresence>
                                    {showAiPanel && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className={cn(
                                                'absolute bottom-full right-0 mb-2 w-80 p-4 rounded-xl border shadow-xl z-50',
                                                theme === 'dark'
                                                    ? 'bg-[#1a1a1a] border-gray-700'
                                                    : 'bg-white border-gray-200'
                                            )}
                                        >
                                            <h4 className={cn(
                                                'text-sm font-medium mb-3',
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            )}>
                                                ✨ AI Email Generator
                                            </h4>
                                            <textarea
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                                placeholder="Describe the email you want to create...

Examples:
• Write a friendly follow-up email
• Create a cold outreach email for startups
• Draft an introduction email"
                                                rows={4}
                                                className={cn(
                                                    'w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2',
                                                    theme === 'dark'
                                                        ? 'bg-[#252525] border-gray-700 text-white focus:ring-purple-500/30'
                                                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-purple-500/30'
                                                )}
                                            />
                                            <div className="flex items-center justify-end gap-2 mt-3">
                                                <button
                                                    onClick={() => setShowAiPanel(false)}
                                                    className={cn(
                                                        'px-3 py-1.5 text-sm rounded-lg',
                                                        theme === 'dark'
                                                            ? 'text-gray-400 hover:bg-gray-800'
                                                            : 'text-gray-500 hover:bg-gray-100'
                                                    )}
                                                >
                                                    Cancel
                                                </button>
                                                <Button
                                                    onClick={handleAiGenerate}
                                                    disabled={!aiPrompt.trim() || aiLoading}
                                                    size="sm"
                                                    className="gap-1 bg-purple-600 hover:bg-purple-500"
                                                >
                                                    {aiLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="w-4 h-4" />
                                                    )}
                                                    Generate
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Templates */}
                            <button className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                                theme === 'dark'
                                    ? 'text-gray-400 hover:bg-gray-800'
                                    : 'text-gray-500 hover:bg-gray-100'
                            )}>
                                <FileText className="w-4 h-4" />
                                Templates
                            </button>

                            {/* Variables */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowVariables(!showVariables)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                                        showVariables
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : theme === 'dark'
                                                ? 'text-gray-400 hover:bg-gray-800'
                                                : 'text-gray-500 hover:bg-gray-100'
                                    )}
                                >
                                    <Code className="w-4 h-4" />
                                    Variables
                                </button>

                                <AnimatePresence>
                                    {showVariables && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className={cn(
                                                'absolute bottom-full right-0 mb-2 w-48 p-2 rounded-xl border shadow-xl z-50',
                                                theme === 'dark'
                                                    ? 'bg-[#1a1a1a] border-gray-700'
                                                    : 'bg-white border-gray-200'
                                            )}
                                        >
                                            <p className={cn(
                                                'text-xs px-2 py-1 mb-1',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>
                                                Click to insert
                                            </p>
                                            {mergeFields.map((field) => (
                                                <button
                                                    key={field}
                                                    onClick={() => insertVariable(field)}
                                                    className={cn(
                                                        'w-full text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors',
                                                        theme === 'dark'
                                                            ? 'hover:bg-gray-800 text-blue-400'
                                                            : 'hover:bg-gray-100 text-blue-600'
                                                    )}
                                                >
                                                    {`{{${field}}}`}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className={cn(
                                'w-px h-5 mx-2',
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            )} />

                            {/* Formatting buttons */}
                            {[
                                { icon: Link, label: 'Link' },
                                { icon: Image, label: 'Image' },
                            ].map(({ icon: Icon, label }) => (
                                <button
                                    key={label}
                                    className={cn(
                                        'p-2 rounded-lg transition-colors',
                                        theme === 'dark'
                                            ? 'text-gray-400 hover:bg-gray-800'
                                            : 'text-gray-500 hover:bg-gray-100'
                                    )}
                                    title={label}
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
