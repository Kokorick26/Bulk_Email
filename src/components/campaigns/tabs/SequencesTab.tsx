import { useState, useEffect, useRef } from 'react';
import {
    Plus, Trash2, Copy, Eye, Clock, Sparkles,
    MoreVertical, ArrowLeft, ArrowRight, MessageSquare,
    Check, X, ChevronDown, ChevronRight, Hash, Send
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

export function SequencesTab({ campaignId, sequence, onSequenceUpdate, leads = [], className }: SequencesTabProps) {
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
        <div className={cn('max-w-7xl mx-auto flex flex-col h-[calc(100vh-220px)] gap-6 animate-in fade-in duration-500', className)}>
            {/* Header Area */}
            <div className="flex items-center justify-between border-b border-dashed pb-6" style={{ borderColor: theme === 'dark' ? '#252a33' : '#e5e7eb' }}>
                <div className="space-y-1">
                    <h2 className={cn(
                        'text-3xl font-[Syne] font-bold tracking-tight',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Workflow <span className="text-[#d97757]">Sequencer</span>
                    </h2>
                    <p className={cn(
                        'text-sm font-light opacity-60',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                        Design your multi-step engagement logic.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                            'h-11 px-8 rounded-xl font-[Syne] font-bold transition-all duration-300 shadow-lg shadow-[#d97757]/10',
                            theme === 'dark'
                                ? 'bg-[#d97757] hover:bg-[#c46144] text-white'
                                : 'bg-blue-600 text-white'
                        )}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Save Sequence
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex gap-8 min-h-0">
                {/* Steps Navigation (Left Sidebar) */}
                <div className="w-80 flex-shrink-0 flex flex-col space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-[Syne] text-sm font-bold uppercase tracking-widest text-[#d97757]">
                            Sequence Flow
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                'text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider',
                                theme === 'dark'
                                    ? 'border-[#3a424f] text-[#a0aab8] bg-[#12151a]'
                                    : 'border-gray-200 text-gray-400 bg-gray-50'
                            )}>
                                {steps.length} Steps
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {steps.map((step, index) => (
                            <div key={step.id} className="relative group perspective-1000">
                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        'absolute left-6 top-16 bottom-0 w-px z-0',
                                        theme === 'dark'
                                            ? 'bg-gradient-to-b from-[#3a424f] to-transparent'
                                            : 'bg-gray-200'
                                    )} style={{ height: 'calc(100% + 12px)' }} />
                                )}

                                <button
                                    onClick={() => setActiveStepId(step.id)}
                                    className={cn(
                                        'relative z-10 w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-300 group-hover:translate-x-1',
                                        activeStepId === step.id
                                            ? theme === 'dark'
                                                ? 'bg-[#1a1e25] border border-[#d97757]/30 shadow-[0_0_20px_rgba(217,119,87,0.1)]'
                                                : 'bg-white border-blue-500 shadow-lg'
                                            : theme === 'dark'
                                                ? 'bg-[#12151a] border border-[#252a33] hover:border-[#d97757]/20'
                                                : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
                                    )}
                                >
                                    <div className={cn(
                                        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-[Syne] font-bold transition-all duration-300',
                                        activeStepId === step.id
                                            ? 'bg-gradient-to-br from-[#d97757] to-[#c46144] text-white shadow-lg'
                                            : theme === 'dark'
                                                ? 'bg-[#1a1e25] text-[#6b7684] border border-[#252a33]'
                                                : 'bg-gray-100 text-gray-400'
                                    )}>
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            'text-sm font-semibold truncate mb-1 transition-colors',
                                            activeStepId === step.id
                                                ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                : theme === 'dark' ? 'text-[#a0aab8]' : 'text-gray-500'
                                        )}>
                                            {step.subject || <span className="italic opacity-50">Untitled Step</span>}
                                        </p>

                                        <div className="flex flex-wrap gap-2 text-[11px] font-medium opacity-80">
                                            {index === 0 ? (
                                                <span className={cn(
                                                    'flex items-center gap-1 px-1.5 py-0.5 rounded',
                                                    theme === 'dark' ? 'bg-[#d97757]/10 text-[#d97757]' : 'bg-blue-50 text-blue-600'
                                                )}>
                                                    <Send className="w-3 h-3" />
                                                    Immediate
                                                </span>
                                            ) : (
                                                <span className={cn(
                                                    'flex items-center gap-1 px-1.5 py-0.5 rounded',
                                                    theme === 'dark' ? 'bg-[#252a33] text-[#a0aab8]' : 'bg-gray-100 text-gray-500'
                                                )}>
                                                    <Clock className="w-3 h-3" />
                                                    {step.delayDays}d delay
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {steps.length > 1 && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteStep(step.id);
                                            }}
                                            className={cn(
                                                'absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer',
                                                theme === 'dark'
                                                    ? 'hover:bg-red-500/20 text-[#6b7684] hover:text-red-400'
                                                    : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                                            )}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        ))}

                        <Button
                            onClick={handleAddStep}
                            variant="outline"
                            className={cn(
                                'w-full py-6 mt-4 border-dashed border-2 flex flex-col items-center gap-2 transition-all duration-300 group',
                                theme === 'dark'
                                    ? 'border-[#252a33] bg-transparent text-[#6b7684] hover:border-[#d97757] hover:bg-[#d97757]/5 hover:text-[#d97757]'
                                    : 'border-gray-200 text-gray-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
                            )}
                        >
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:rotate-90',
                                theme === 'dark' ? 'bg-[#1a1e25]' : 'bg-gray-100'
                            )}>
                                <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider">Add Sequence Step</span>
                        </Button>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className={cn(
                    'flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-all duration-500',
                    theme === 'dark'
                        ? 'bg-[#12151a] border border-[#252a33]'
                        : 'bg-white border border-gray-100 shadow-xl'
                )}>
                    {/* Editor Header / Subject Line */}
                    <div className={cn(
                        'px-8 py-6 border-b flex flex-col gap-4',
                        theme === 'dark' ? 'border-[#1a1e25] bg-gradient-to-r from-[#12151a] to-[#1a1e25]' : 'border-gray-100 bg-white'
                    )}>
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-[Syne] font-bold uppercase tracking-widest text-[#d97757] mb-2 opacity-80">
                                    Email Subject
                                </label>
                                <input
                                    type="text"
                                    value={activeStep.subject}
                                    onChange={(e) => handleUpdateStep(activeStepId, { subject: e.target.value })}
                                    placeholder="Enter a compelling subject line..."
                                    className={cn(
                                        'w-full bg-transparent text-xl md:text-2xl font-[Syne] font-semibold focus:outline-none placeholder:opacity-40 transition-all',
                                        theme === 'dark' ? 'text-white placeholder:text-[#6b7684]' : 'text-gray-900 placeholder:text-gray-300'
                                    )}
                                />
                            </div>

                            {/* Delay Settings for non-first steps */}
                            {activeStep.order > 1 && (
                                <div className={cn(
                                    'flex items-center gap-3 px-4 py-2 rounded-xl border',
                                    theme === 'dark' ? 'bg-[#1a1e25] border-[#252a33]' : 'bg-gray-50 border-gray-200'
                                )}>
                                    <Clock className={cn('w-4 h-4', theme === 'dark' ? 'text-[#a0aab8]' : 'text-gray-500')} />
                                    <div className="flex items-center gap-2">
                                        <span className={cn('text-xs font-medium uppercase', theme === 'dark' ? 'text-[#6b7684]' : 'text-gray-500')}>Wait</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={activeStep.delayDays}
                                            onChange={(e) => handleUpdateStep(activeStepId, { delayDays: parseInt(e.target.value) || 0 })}
                                            className={cn(
                                                'w-10 text-center bg-transparent font-mono text-sm font-bold focus:outline-none border-b',
                                                theme === 'dark' ? 'text-white border-[#3a424f] focus:border-[#d97757]' : 'text-gray-900 border-gray-300'
                                            )}
                                        />
                                        <span className={cn('text-xs', theme === 'dark' ? 'text-[#6b7684]' : 'text-gray-500')}>days</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rich Text Editor Area */}
                    <div className="flex-1 relative group bg-pattern-dots">
                        <textarea
                            ref={bodyRef}
                            value={activeStep.body}
                            onChange={(e) => handleUpdateStep(activeStepId, { body: e.target.value })}
                            placeholder="Hi {{firstName}}, write something amazing..."
                            className={cn(
                                'w-full h-full p-8 bg-transparent border-0 resize-none focus:outline-none text-base leading-relaxed font-sans transition-colors',
                                theme === 'dark' ? 'text-[#f9fafb] placeholder:text-[#3a424f]' : 'text-gray-800 placeholder:text-gray-300'
                            )}
                            style={{ lineHeight: '1.8' }}
                        />

                        {/* Floating Toolbar */}
                        <div className={cn(
                            'absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-2 rounded-2xl border shadow-2xl transition-all duration-300 opacity-90 hover:opacity-100',
                            theme === 'dark'
                                ? 'bg-[#1a1e25]/90 backdrop-blur-md border-[#252a33]'
                                : 'bg-white/90 backdrop-blur-md border-gray-200'
                        )}>
                            <button
                                onClick={() => setShowVariables(!showVariables)}
                                className={cn(
                                    'relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                                    theme === 'dark'
                                        ? 'hover:bg-[#252a33] text-[#a0aab8] hover:text-white'
                                        : 'hover:bg-gray-100 text-gray-600'
                                )}
                            >
                                <Hash className="w-4 h-4" />
                                <span>Variables</span>

                                {showVariables && (
                                    <div className={cn(
                                        'absolute bottom-full left-0 mb-4 w-48 rounded-xl border shadow-xl overflow-hidden py-2 animate-in slide-in-from-bottom-2',
                                        theme === 'dark' ? 'bg-[#1a1e25] border-[#252a33]' : 'bg-white border-gray-100'
                                    )}>
                                        {mergeFields.map(field => (
                                            <div
                                                key={field}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    insertVariable(field);
                                                }}
                                                className={cn(
                                                    'px-4 py-2 text-xs font-mono cursor-pointer transition-colors',
                                                    theme === 'dark' ? 'text-[#a0aab8] hover:bg-[#252a33] hover:text-[#d97757]' : 'text-gray-600 hover:bg-gray-50'
                                                )}
                                            >
                                                {`{{${field}}}`}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </button>

                            <div className={cn('w-px h-6', theme === 'dark' ? 'bg-[#3a424f]' : 'bg-gray-200')} />

                            <button
                                onClick={() => setShowAiModal(!showAiModal)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                                    theme === 'dark'
                                        ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-300 border border-purple-500/20'
                                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                )}
                            >
                                <Sparkles className="w-4 h-4" />
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

