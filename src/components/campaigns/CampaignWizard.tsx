import { useState, useRef, useCallback, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Check, Loader2, X,
    Sparkles, Users, Mail, Clock, Settings, FileText,
    Upload, Plus, Trash2, Calendar, Globe, Zap,
    ArrowRight, Target, Send, Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import type { Lead, SequenceStep, CampaignSchedule, CampaignOptions } from './types';

interface CampaignWizardProps {
    onBack: () => void;
    onComplete: (campaignId: string) => void;
    className?: string;
}

const STEPS = [
    { id: 1, title: 'Name', icon: FileText },
    { id: 2, title: 'Leads', icon: Users },
    { id: 3, title: 'Strategy', icon: Target },
    { id: 4, title: 'Emails', icon: Mail },
    { id: 5, title: 'Schedule', icon: Calendar },
    { id: 6, title: 'Launch', icon: Send },
];

export function CampaignWizard({ onBack, onComplete, className }: CampaignWizardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [currentStep, setCurrentStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [campaignName, setCampaignName] = useState('');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [sequenceType, setSequenceType] = useState<'same' | 'individual'>('same');
    const [sequences, setSequences] = useState<SequenceStep[]>([
        { id: 'step-1', order: 1, subject: '', body: '', delayDays: 0, delayHours: 0, variants: [] }
    ]);
    const [individualSequences, setIndividualSequences] = useState<Map<string, SequenceStep[]>>(new Map());
    const [schedule, setSchedule] = useState<CampaignSchedule>({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '09:00',
        endTime: '17:00'
    });
    const [options, setOptions] = useState<CampaignOptions>({
        trackOpens: true,
        trackClicks: true,
        stopOnReply: true,
        stopOnClick: false,
        removeUnsubscribed: true,
        dailyLimit: 50,
        timeBetweenEmails: 300
    });

    const canProceed = useCallback(() => {
        switch (currentStep) {
            case 1: return campaignName.trim().length > 0;
            case 2: return leads.length > 0;
            case 3: return true;
            case 4: return sequences.some(s => s.subject && s.body);
            case 5: return schedule.days.length > 0;
            case 6: return true;
            default: return false;
        }
    }, [currentStep, campaignName, leads, sequences, schedule]);

    const handleNext = () => {
        if (currentStep < 6 && canProceed()) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        } else {
            onBack();
        }
    };

    const handleComplete = async () => {
        setIsCreating(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/bulk-email/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: campaignName.trim(),
                    status: 'draft',
                    leads,
                    sequence: { id: `seq-${Date.now()}`, campaignId: '', steps: sequences },
                    schedule,
                    options,
                    sequenceType
                })
            });
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            onComplete(data.id || data.campaignId);
        } catch {
            onComplete('new-campaign-' + Date.now());
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={cn(
            'fixed inset-0 z-50 flex flex-col',
            isDark ? 'bg-[#0a0a0a]' : 'bg-white',
            className
        )}>
            {/* Simple Header */}
            <header className={cn(
                'flex items-center justify-between px-6 py-4 border-b',
                isDark ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'
            )}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className={cn(
                            'flex items-center gap-1.5 text-sm font-medium transition-colors',
                            isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </button>
                    <div className={cn('w-px h-5', isDark ? 'bg-neutral-800' : 'bg-gray-200')} />
                    <h1 className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                        Create Campaign
                    </h1>
                </div>

                {/* Simple Step Indicator */}
                <div className="flex items-center gap-2">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <button
                                onClick={() => idx < currentStep && setCurrentStep(step.id)}
                                disabled={idx >= currentStep}
                                className={cn(
                                    'w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors',
                                    currentStep > step.id
                                        ? 'bg-emerald-500 text-white'
                                        : currentStep === step.id
                                            ? 'bg-orange-500 text-white'
                                            : isDark
                                                ? 'bg-neutral-800 text-neutral-500'
                                                : 'bg-gray-100 text-gray-400',
                                    idx < currentStep && 'cursor-pointer'
                                )}
                            >
                                {currentStep > step.id ? <Check className="w-3.5 h-3.5" /> : step.id}
                            </button>
                            {idx < STEPS.length - 1 && (
                                <div className={cn(
                                    'w-6 h-px mx-1',
                                    currentStep > step.id
                                        ? 'bg-emerald-500'
                                        : isDark ? 'bg-neutral-800' : 'bg-gray-200'
                                )} />
                            )}
                        </div>
                    ))}
                </div>

                <span className={cn('text-sm', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                    Step {currentStep} of 6
                </span>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className={cn(
                    'mx-auto py-8 px-6',
                    currentStep === 4 ? 'max-w-5xl h-full' : 'max-w-2xl'
                )}>
                    {currentStep === 1 && <StepName isDark={isDark} value={campaignName} onChange={setCampaignName} />}
                    {currentStep === 2 && <StepLeads isDark={isDark} leads={leads} onUpdate={setLeads} />}
                    {currentStep === 3 && <StepStrategy isDark={isDark} value={sequenceType} onChange={setSequenceType} />}
                    {currentStep === 4 && <StepEmails isDark={isDark} sequences={sequences} onUpdate={setSequences} sequenceType={sequenceType} leads={leads} individualSequences={individualSequences} onIndividualUpdate={setIndividualSequences} />}
                    {currentStep === 5 && <StepSchedule isDark={isDark} schedule={schedule} onUpdate={setSchedule} />}
                    {currentStep === 6 && <StepLaunch isDark={isDark} options={options} onUpdate={setOptions} campaignName={campaignName} leadsCount={leads.length} />}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className={cn(
                'flex items-center justify-between px-6 py-4 border-t',
                isDark ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'
            )}>
                <span className={cn('text-sm', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                    {STEPS[currentStep - 1].title}
                </span>
                <div className="flex items-center gap-3 mr-20">
                    {currentStep > 1 && currentStep < 6 && (
                        <button
                            onClick={() => setCurrentStep(6)}
                            className={cn(
                                'text-sm font-medium',
                                isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
                            Skip to review
                        </button>
                    )}
                    {currentStep < 6 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={cn(
                                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                canProceed()
                                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                                    : isDark
                                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            )}
                        >
                            Continue
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={isCreating}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Launch Campaign
                                </>
                            )}
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}

// Step 1: Campaign Name
function StepName({ isDark, value, onChange }: { isDark: boolean; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                    Name your campaign
                </h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    Choose a memorable name that helps you identify this campaign later.
                </p>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g., Q1 Product Launch, Series A Outreach..."
                autoFocus
                className={cn(
                    'w-full px-4 py-3 rounded-lg text-sm transition-colors',
                    isDark
                        ? 'bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:border-orange-500'
                        : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500'
                )}
                style={{ outline: 'none' }}
            />
        </div>
    );
}

// Step 2: Add Leads
function StepLeads({ isDark, leads, onUpdate }: { isDark: boolean; leads: Lead[]; onUpdate: (l: Lead[]) => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [manualEmail, setManualEmail] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(Boolean);
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const emailIdx = headers.findIndex(h => h.includes('email'));
            const firstNameIdx = headers.findIndex(h => h.includes('first') || h === 'name');
            const lastNameIdx = headers.findIndex(h => h.includes('last'));
            const companyIdx = headers.findIndex(h => h.includes('company'));

            const newLeads: Lead[] = lines.slice(1).map((line, i) => {
                const values = line.split(',').map(v => v.trim());
                return {
                    id: `lead-${Date.now()}-${i}`,
                    email: values[emailIdx] || '',
                    firstName: firstNameIdx >= 0 ? values[firstNameIdx] : '',
                    lastName: lastNameIdx >= 0 ? values[lastNameIdx] : '',
                    company: companyIdx >= 0 ? values[companyIdx] : '',
                    status: 'pending' as const,
                    customFields: {},
                    addedAt: new Date().toISOString()
                };
            }).filter(l => l.email && l.email.includes('@'));
            onUpdate([...leads, ...newLeads]);
        };
        reader.readAsText(file);
    };

    const addManual = () => {
        if (!manualEmail.includes('@')) return;
        onUpdate([...leads, { id: `lead-${Date.now()}`, email: manualEmail, status: 'pending', customFields: {}, addedAt: new Date().toISOString() }]);
        setManualEmail('');
    };


    return (
        <div className="space-y-6">
            <div>
                <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                    Add your leads
                </h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    Import a CSV or add emails manually.
                </p>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    'border border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                    isDragging
                        ? 'border-orange-500 bg-orange-500/5'
                        : isDark
                            ? 'border-neutral-700 hover:border-neutral-600'
                            : 'border-gray-300 hover:border-gray-400'
                )}
            >
                <Upload className={cn('w-8 h-8 mx-auto mb-3', isDark ? 'text-neutral-500' : 'text-gray-400')} />
                <p className={cn('text-sm font-medium mb-1', isDark ? 'text-white' : 'text-gray-900')}>
                    Drop your CSV here or click to browse
                </p>
                <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                    Supports columns: email, firstName, lastName, company
                </p>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />
            </div>

            {/* Manual Entry */}
            <div className="flex gap-2">
                <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManual()}
                    placeholder="Or type an email address..."
                    className={cn(
                        'flex-1 px-4 py-3 rounded-lg text-sm transition-colors',
                        isDark ? 'bg-neutral-900 border border-neutral-800 text-white focus:border-orange-500' : 'bg-white border border-gray-200 text-gray-900 focus:border-orange-500'
                    )}
                    style={{ outline: 'none' }}
                />
                <button
                    onClick={addManual}
                    disabled={!manualEmail.includes('@')}
                    className={cn(
                        'px-4 rounded-lg transition-colors',
                        manualEmail.includes('@') ? 'bg-orange-500 text-white hover:bg-orange-600' : isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400'
                    )}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Leads Preview */}
            {leads.length > 0 && (
                <div className={cn('rounded-lg overflow-hidden', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                    <div className={cn('px-4 py-3 flex items-center justify-between', isDark ? 'border-b border-neutral-800' : 'border-b border-gray-100')}>
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                                {leads.length} lead{leads.length !== 1 && 's'} ready
                            </span>
                        </div>
                        <button onClick={() => onUpdate([])} className="text-xs text-red-400 hover:text-red-300">Clear all</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                        {leads.slice(0, 8).map(lead => (
                            <div key={lead.id} className={cn('px-4 py-2.5 flex items-center justify-between', isDark ? 'border-b border-neutral-800 last:border-0' : 'border-b border-gray-50 last:border-0')}>
                                <div>
                                    <p className={cn('text-sm', isDark ? 'text-white' : 'text-gray-900')}>{lead.email}</p>
                                    {lead.firstName && <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>{lead.firstName} {lead.lastName} {lead.company && `• ${lead.company}`}</p>}
                                </div>
                                <button onClick={() => onUpdate(leads.filter(l => l.id !== lead.id))} className="text-neutral-400 hover:text-red-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {leads.length > 8 && (
                            <div className={cn('px-4 py-2.5 text-center text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                +{leads.length - 8} more leads
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Step 3: Sequence Strategy
function StepStrategy({ isDark, value, onChange }: { isDark: boolean; value: 'same' | 'individual'; onChange: (v: 'same' | 'individual') => void }) {
    const strategies = [
        { id: 'same' as const, title: 'Same Sequence', desc: 'One email flow for all leads with personalization via merge tags.', recommended: true },
        { id: 'individual' as const, title: 'Individual Emails', desc: 'Write unique emails for each lead. Best for highly personalized outreach.', recommended: false },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                    Choose your strategy
                </h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    How would you like to structure your email sequence?
                </p>
            </div>

            <div className="space-y-3">
                {strategies.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => onChange(s.id)}
                        className={cn(
                            'w-full p-4 rounded-lg text-left transition-colors flex items-start gap-3',
                            value === s.id
                                ? isDark ? 'bg-orange-500/10 border border-orange-500' : 'bg-orange-50 border border-orange-500'
                                : isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-white border border-gray-200 hover:border-gray-300'
                        )}
                    >
                        <div className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                            value === s.id ? 'border-orange-500 bg-orange-500' : isDark ? 'border-neutral-600' : 'border-gray-300'
                        )}>
                            {value === s.id && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>{s.title}</span>
                                {s.recommended && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-500">Recommended</span>
                                )}
                            </div>
                            <p className={cn('text-sm mt-1', isDark ? 'text-neutral-400' : 'text-gray-500')}>{s.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// Step 4: Email Composer
function StepEmails({ isDark, sequences, onUpdate, sequenceType, leads, individualSequences, onIndividualUpdate }: { isDark: boolean; sequences: SequenceStep[]; onUpdate: (s: SequenceStep[]) => void; sequenceType: 'same' | 'individual'; leads: Lead[]; individualSequences: Map<string, SequenceStep[]>; onIndividualUpdate: (m: Map<string, SequenceStep[]>) => void }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedLead, setSelectedLead] = useState(leads[0]?.id || '');
    const [showAI, setShowAI] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const step = sequences[activeIdx];

    const updateStep = (idx: number, updates: Partial<SequenceStep>) => {
        const updated = [...sequences];
        updated[idx] = { ...updated[idx], ...updates };
        onUpdate(updated);
    };

    const addStep = () => {
        onUpdate([...sequences, { id: `step-${Date.now()}`, order: sequences.length + 1, subject: '', body: '', delayDays: 2, delayHours: 0, variants: [] }]);
        setActiveIdx(sequences.length);
    };

    const deleteStep = (idx: number) => {
        if (sequences.length <= 1) return;
        const newSeqs = sequences.filter((_, i) => i !== idx);
        onUpdate(newSeqs);
        if (activeIdx >= newSeqs.length) setActiveIdx(newSeqs.length - 1);
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    context: { mergeFields: ['firstName', 'lastName', 'email', 'company'], currentSubject: step.subject, currentBody: step.body }
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.subject) updateStep(activeIdx, { subject: data.subject });
                if (data.body) updateStep(activeIdx, { body: data.body });
            }
        } catch (error) {
            console.error('AI error:', error);
        } finally {
            setAiLoading(false);
            setAiPrompt('');
            setShowAI(false);
        }
    };

    if (sequenceType === 'individual') {
        return (
            <div className="h-full flex flex-col">
                <div className="mb-4">
                    <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Compose individual emails</h2>
                    <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>Write personalized content for each lead</p>
                </div>
                <div className="flex-1 flex gap-4 min-h-0">
                    <div className={cn('w-52 p-3 rounded-lg overflow-y-auto', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-gray-50 border border-gray-200')}>
                        <p className={cn('text-xs font-medium mb-2', isDark ? 'text-neutral-500' : 'text-gray-400')}>Select Lead</p>
                        <div className="space-y-1">
                            {leads.map(lead => (
                                <button key={lead.id} onClick={() => setSelectedLead(lead.id)}
                                    className={cn('w-full px-2 py-2 rounded text-left text-xs transition-colors truncate',
                                        selectedLead === lead.id ? 'bg-orange-500/20 text-orange-400' : isDark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-700')}>
                                    {lead.email}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 min-h-0">
                        <input type="text" placeholder="Subject line..."
                            value={individualSequences.get(selectedLead)?.[0]?.subject || ''}
                            onChange={(e) => { const m = new Map(individualSequences); const ex = m.get(selectedLead) || [{ ...sequences[0], id: `ind-${selectedLead}` }]; ex[0] = { ...ex[0], subject: e.target.value }; m.set(selectedLead, ex); onIndividualUpdate(m); }}
                            className={cn('w-full px-4 py-3 rounded-lg text-sm font-medium', isDark ? 'bg-neutral-900 border border-neutral-800 text-white focus:border-orange-500' : 'bg-white border border-gray-200 text-gray-900 focus:border-orange-500')}
                            style={{ outline: 'none' }} />
                        <textarea placeholder="Write your message..."
                            value={individualSequences.get(selectedLead)?.[0]?.body || ''}
                            onChange={(e) => { const m = new Map(individualSequences); const ex = m.get(selectedLead) || [{ ...sequences[0], id: `ind-${selectedLead}` }]; ex[0] = { ...ex[0], body: e.target.value }; m.set(selectedLead, ex); onIndividualUpdate(m); }}
                            className={cn('flex-1 w-full px-4 py-3 rounded-lg resize-none text-sm leading-relaxed', isDark ? 'bg-neutral-900 border border-neutral-800 text-white focus:border-orange-500' : 'bg-white border border-gray-200 text-gray-900 focus:border-orange-500')}
                            style={{ outline: 'none', minHeight: '300px' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Craft your sequence</h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>Use {'{{firstName}}'}, {'{{email}}'}, {'{{company}}'} for personalization</p>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Steps sidebar */}
                <div className="w-52 flex flex-col gap-2">
                    <div className="flex-1 space-y-2 overflow-y-auto">
                        {sequences.map((s, idx) => (
                            <button key={s.id} onClick={() => setActiveIdx(idx)}
                                className={cn('w-full p-3 rounded-lg text-left transition-colors group relative',
                                    activeIdx === idx
                                        ? isDark ? 'bg-orange-500/10 border border-orange-500/50' : 'bg-orange-50 border border-orange-400'
                                        : isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-white border border-gray-200 hover:border-gray-300')}>
                                <div className="flex items-center gap-2">
                                    <span className={cn('w-6 h-6 rounded flex items-center justify-center text-xs font-medium flex-shrink-0',
                                        activeIdx === idx ? 'bg-orange-500 text-white' : isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400')}>
                                        {idx + 1}
                                    </span>
                                    <span className={cn('text-sm truncate flex-1', isDark ? 'text-white' : 'text-gray-900')}>
                                        {s.subject || 'Untitled'}
                                    </span>
                                </div>
                                {idx > 0 && (
                                    <span className={cn('text-xs ml-8 block mt-1', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                        {s.delayDays}d delay
                                    </span>
                                )}
                                {sequences.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteStep(idx); }}
                                        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-400 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </button>
                        ))}
                    </div>
                    <button onClick={addStep}
                        className={cn('w-full p-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-xs font-medium transition-colors',
                            isDark ? 'border-neutral-700 text-neutral-500 hover:border-orange-500/50 hover:text-orange-400' : 'border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500')}>
                        <Plus className="w-3.5 h-3.5" /> Add Step
                    </button>
                </div>

                {/* Editor */}
                <div className={cn('flex-1 flex flex-col rounded-lg overflow-hidden', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                    {/* Subject and Delay */}
                    <div className={cn('px-4 py-3 border-b flex items-center gap-4', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                        <input type="text" placeholder="Subject line..." value={step.subject} onChange={(e) => updateStep(activeIdx, { subject: e.target.value })}
                            className={cn('flex-1 bg-transparent text-base font-medium focus:outline-none', isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400')} />
                        {activeIdx > 0 && (
                            <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs', isDark ? 'bg-neutral-800' : 'bg-gray-100')}>
                                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                <span className={cn(isDark ? 'text-neutral-400' : 'text-gray-500')}>Wait</span>
                                <input type="number" min="0" value={step.delayDays} onChange={(e) => updateStep(activeIdx, { delayDays: parseInt(e.target.value) || 0 })}
                                    className={cn('w-10 text-center bg-transparent font-medium focus:outline-none', isDark ? 'text-white' : 'text-gray-900')} />
                                <span className={cn(isDark ? 'text-neutral-400' : 'text-gray-500')}>days</span>
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 relative">
                        <textarea
                            placeholder={`Hi {{firstName}},\n\nWrite your message here...\n\nBest regards`}
                            value={step.body}
                            onChange={(e) => updateStep(activeIdx, { body: e.target.value })}
                            className={cn('w-full h-full p-4 bg-transparent resize-none focus:outline-none text-sm leading-relaxed', isDark ? 'text-white placeholder:text-neutral-600' : 'text-gray-900 placeholder:text-gray-400')}
                        />

                        {/* AI Button */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                            <button
                                onClick={() => setShowAI(!showAI)}
                                className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                                    isDark ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100')}>
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Assist
                            </button>
                        </div>

                        {/* AI Modal */}
                        {showAI && (
                            <div className={cn('absolute bottom-16 right-4 w-80 p-3 rounded-lg border shadow-xl z-50', isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200')}>
                                <p className={cn('text-xs font-medium mb-2', isDark ? 'text-neutral-300' : 'text-gray-600')}>Describe what you want:</p>
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g. 'Make it more professional and concise'"
                                    className={cn('w-full px-3 py-2 rounded-lg text-sm mb-2 focus:outline-none', isDark ? 'bg-neutral-900 border border-neutral-700 text-white' : 'bg-gray-50 border border-gray-200')}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowAI(false)} className={cn('flex-1 px-3 py-2 rounded-lg text-xs font-medium', isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-gray-100 text-gray-600')}>
                                        Cancel
                                    </button>
                                    <button onClick={handleAiGenerate} disabled={aiLoading}
                                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center gap-1">
                                        {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        {aiLoading ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 5: Schedule
function StepSchedule({ isDark, schedule, onUpdate }: { isDark: boolean; schedule: CampaignSchedule; onUpdate: (s: CampaignSchedule) => void }) {
    const DAYS = [{ id: 'monday', label: 'M' }, { id: 'tuesday', label: 'T' }, { id: 'wednesday', label: 'W' }, { id: 'thursday', label: 'T' }, { id: 'friday', label: 'F' }, { id: 'saturday', label: 'S' }, { id: 'sunday', label: 'S' }];

    return (
        <div className="space-y-6">
            <div>
                <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                    Set your schedule
                </h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    Choose when to send emails for optimal engagement.
                </p>
            </div>

            {/* Time */}
            <div className="space-y-4">
                <label className={cn('text-sm font-medium', isDark ? 'text-neutral-300' : 'text-gray-700')}>Sending Window</label>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className={cn('text-xs mb-1 block', isDark ? 'text-neutral-500' : 'text-gray-400')}>Start</label>
                        <input type="time" value={schedule.startTime} onChange={(e) => onUpdate({ ...schedule, startTime: e.target.value })}
                            className={cn('w-full px-3 py-2 rounded-lg text-sm', isDark ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-white border border-gray-200 text-gray-900')}
                            style={{ outline: 'none' }} />
                    </div>
                    <span className={cn('text-sm mt-5', isDark ? 'text-neutral-500' : 'text-gray-400')}>to</span>
                    <div className="flex-1">
                        <label className={cn('text-xs mb-1 block', isDark ? 'text-neutral-500' : 'text-gray-400')}>End</label>
                        <input type="time" value={schedule.endTime} onChange={(e) => onUpdate({ ...schedule, endTime: e.target.value })}
                            className={cn('w-full px-3 py-2 rounded-lg text-sm', isDark ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-white border border-gray-200 text-gray-900')}
                            style={{ outline: 'none' }} />
                    </div>
                </div>
            </div>

            {/* Days */}
            <div className="space-y-3">
                <label className={cn('text-sm font-medium', isDark ? 'text-neutral-300' : 'text-gray-700')}>Active Days</label>
                <div className="flex gap-2">
                    {DAYS.map((d) => (
                        <button key={d.id}
                            onClick={() => onUpdate({ ...schedule, days: schedule.days.includes(d.id) ? schedule.days.filter(x => x !== d.id) : [...schedule.days, d.id] })}
                            className={cn('w-10 h-10 rounded-lg text-xs font-medium transition-colors',
                                schedule.days.includes(d.id) ? 'bg-orange-500 text-white' : isDark ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
                <label className={cn('text-sm font-medium', isDark ? 'text-neutral-300' : 'text-gray-700')}>Timezone</label>
                <select value={schedule.timezone} onChange={(e) => onUpdate({ ...schedule, timezone: e.target.value })}
                    className={cn('w-full px-3 py-2 rounded-lg text-sm cursor-pointer', isDark ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-white border border-gray-200 text-gray-900')}
                    style={{ outline: 'none' }}>
                    {['UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'Europe/London', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'].map(tz => (
                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// Step 6: Review & Launch
function StepLaunch({ isDark, options, onUpdate, campaignName, leadsCount }: { isDark: boolean; options: CampaignOptions; onUpdate: (o: CampaignOptions) => void; campaignName: string; leadsCount: number }) {
    const [emailAccounts, setEmailAccounts] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const EMAILS_PER_ACCOUNT = 15;

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const token = localStorage.getItem('bulkEmailToken');
                const response = await fetch('/api/bulk-email/smtp-accounts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const accounts = await response.json();
                    setEmailAccounts(Array.isArray(accounts) ? accounts.length : 0);
                }
            } catch (e) {
                console.error('Failed to fetch accounts:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const maxDailyEmails = emailAccounts * EMAILS_PER_ACCOUNT;
    const daysToComplete = maxDailyEmails > 0 ? Math.ceil(leadsCount / maxDailyEmails) : 0;

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={cn('w-12 h-6 rounded-full relative transition-colors', checked ? 'bg-orange-500' : isDark ? 'bg-neutral-700' : 'bg-gray-200')}>
            <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm', checked ? 'left-7' : 'left-1')} />
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                    Ready to launch
                </h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    Review your settings and launch "{campaignName}" to {leadsCount} leads
                </p>
            </div>

            {/* Summary Stats */}
            <div className={cn('p-4 rounded-lg', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-gray-50 border border-gray-200')}>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <p className={cn('text-2xl font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{leadsCount}</p>
                        <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>Leads</p>
                    </div>
                    <div>
                        <p className={cn('text-2xl font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                            {loading ? '-' : emailAccounts}
                        </p>
                        <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>Email Accounts</p>
                    </div>
                    <div>
                        <p className={cn('text-2xl font-semibold text-orange-500')}>{loading ? '-' : maxDailyEmails}</p>
                        <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>Max Daily Emails</p>
                    </div>
                    <div>
                        <p className={cn('text-2xl font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                            {loading ? '-' : `~${daysToComplete}`}
                        </p>
                        <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>Days to Complete</p>
                    </div>
                </div>
                <p className={cn('text-xs mt-3 text-center', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                    Each account can send max {EMAILS_PER_ACCOUNT} emails per day
                </p>
            </div>

            {/* Tracking Options */}
            <div className={cn('rounded-lg divide-y', isDark ? 'bg-neutral-900 border border-neutral-800 divide-neutral-800' : 'bg-white border border-gray-200 divide-gray-100')}>
                {[
                    { key: 'trackOpens', label: 'Track Opens', desc: 'Monitor when leads open your emails' },
                    { key: 'trackClicks', label: 'Track Clicks', desc: 'Track link clicks in your emails' },
                    { key: 'stopOnReply', label: 'Stop on Reply', desc: 'Stop sequence when lead replies' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 cursor-pointer" onClick={() => onUpdate({ ...options, [item.key]: !(options as any)[item.key] })}>
                        <div>
                            <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>{item.label}</p>
                            <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>{item.desc}</p>
                        </div>
                        <Toggle checked={(options as any)[item.key]} onChange={() => { }} />
                    </div>
                ))}
            </div>

            {/* Limits */}
            <div className={cn('p-4 rounded-lg space-y-4', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>Time Gap</p>
                        <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>Seconds between sends</p>
                    </div>
                    <input type="number" value={options.timeBetweenEmails} onChange={(e) => onUpdate({ ...options, timeBetweenEmails: parseInt(e.target.value) || 300 })}
                        className={cn('w-20 px-3 py-2 rounded-lg text-right text-sm font-medium', isDark ? 'bg-neutral-800 border border-neutral-700 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900')}
                        style={{ outline: 'none' }} />
                </div>
            </div>

            {/* Warning if no accounts */}
            {!loading && emailAccounts === 0 && (
                <div className={cn('p-4 rounded-lg border', isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')}>
                    <p className="text-sm font-medium">No email accounts configured</p>
                    <p className="text-xs mt-1">Please add at least one email account in Settings before launching the campaign.</p>
                </div>
            )}
        </div>
    );
}
