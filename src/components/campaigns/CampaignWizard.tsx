import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Check, Loader2, X,
    Sparkles, Users, Mail, Clock, Settings, FileText,
    Upload, Plus, Trash2, Calendar, Globe, Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import type { Lead, SequenceStep, CampaignSchedule, CampaignOptions } from './types';

interface CampaignWizardProps {
    onBack: () => void;
    onComplete: (campaignId: string) => void;
    className?: string;
}

// Step configuration
const STEPS = [
    { id: 1, title: 'Campaign Name', icon: FileText, description: 'Name your campaign' },
    { id: 2, title: 'Add Leads', icon: Users, description: 'Import your audience' },
    { id: 3, title: 'Sequence Type', icon: Sparkles, description: 'Choose sequence strategy' },
    { id: 4, title: 'Email Sequence', icon: Mail, description: 'Craft your messages' },
    { id: 5, title: 'Schedule', icon: Calendar, description: 'Set sending times' },
    { id: 6, title: 'Options', icon: Settings, description: 'Configure settings' },
];

export function CampaignWizard({ onBack, onComplete, className }: CampaignWizardProps) {
    const { theme } = useTheme();
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
            case 3: return sequenceType !== null;
            case 4: return sequences.some(s => s.subject && s.body);
            case 5: return schedule.days.length > 0;
            case 6: return true;
            default: return false;
        }
    }, [currentStep, campaignName, leads, sequenceType, sequences, schedule]);

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

            if (!response.ok) throw new Error('Failed to create campaign');
            const data = await response.json();
            onComplete(data.id || data.campaignId || 'new-campaign');
        } catch (error) {
            console.error('Error creating campaign:', error);
            onComplete('new-campaign-' + Date.now());
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={cn('min-h-[calc(100vh-100px)] flex flex-col', className)}>
            {/* Header with Progress */}
            <div className={cn(
                'sticky top-0 z-20 px-6 py-4 border-b backdrop-blur-xl',
                theme === 'dark' ? 'bg-[#0a0c0f]/90 border-[#252a33]' : 'bg-white/90 border-gray-200'
            )}>
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={handleBack}
                            className={cn(
                                'flex items-center gap-2 text-sm font-medium transition-colors',
                                theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {currentStep === 1 ? 'Cancel' : 'Back'}
                        </button>
                        <h1 className={cn(
                            'text-xl font-[Syne] font-bold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Create <span className="text-[#d97757]">Campaign</span>
                        </h1>
                        <div className="w-20" />
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-between gap-2">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex-1 flex items-center gap-2">
                                <div className={cn(
                                    'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300',
                                    currentStep > step.id
                                        ? 'bg-emerald-500 text-white'
                                        : currentStep === step.id
                                            ? theme === 'dark' ? 'bg-[#d97757] text-white' : 'bg-blue-600 text-white'
                                            : theme === 'dark' ? 'bg-[#1a1e25] text-gray-500' : 'bg-gray-100 text-gray-400'
                                )}>
                                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={cn(
                                        'flex-1 h-0.5 rounded-full transition-all duration-500',
                                        currentStep > step.id
                                            ? 'bg-emerald-500'
                                            : theme === 'dark' ? 'bg-[#252a33]' : 'bg-gray-200'
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto py-12 px-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStep === 1 && (
                                <StepCampaignName
                                    theme={theme}
                                    value={campaignName}
                                    onChange={setCampaignName}
                                />
                            )}
                            {currentStep === 2 && (
                                <StepAddLeads
                                    theme={theme}
                                    leads={leads}
                                    onLeadsUpdate={setLeads}
                                />
                            )}
                            {currentStep === 3 && (
                                <StepSequenceType
                                    theme={theme}
                                    value={sequenceType}
                                    onChange={setSequenceType}
                                />
                            )}
                            {currentStep === 4 && (
                                <StepEmailSequence
                                    theme={theme}
                                    sequenceType={sequenceType}
                                    sequences={sequences}
                                    onSequencesUpdate={setSequences}
                                    leads={leads}
                                    individualSequences={individualSequences}
                                    onIndividualSequencesUpdate={setIndividualSequences}
                                />
                            )}
                            {currentStep === 5 && (
                                <StepSchedule
                                    theme={theme}
                                    schedule={schedule}
                                    onScheduleUpdate={setSchedule}
                                />
                            )}
                            {currentStep === 6 && (
                                <StepOptions
                                    theme={theme}
                                    options={options}
                                    onOptionsUpdate={setOptions}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer Actions */}
            <div className={cn(
                'sticky bottom-0 px-6 py-4 border-t backdrop-blur-xl',
                theme === 'dark' ? 'bg-[#0a0c0f]/90 border-[#252a33]' : 'bg-white/90 border-gray-200'
            )}>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                        Step {currentStep} of 6 — {STEPS[currentStep - 1].description}
                    </p>
                    <div className="flex items-center gap-3">
                        {currentStep < 6 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className={cn(
                                    'gap-2 px-8 h-11 rounded-xl font-[Syne] font-bold',
                                    theme === 'dark'
                                        ? 'bg-[#d97757] hover:bg-[#c46144] text-white disabled:bg-gray-700'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                )}
                            >
                                Continue
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleComplete}
                                disabled={isCreating}
                                className={cn(
                                    'gap-2 px-8 h-11 rounded-xl font-[Syne] font-bold',
                                    theme === 'dark'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                )}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Launch Campaign
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 1: Campaign Name
function StepCampaignName({ theme, value, onChange }: { theme: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <div className={cn(
                    'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
                    theme === 'dark' ? 'bg-[#d97757]/20' : 'bg-blue-100'
                )}>
                    <FileText className={cn('w-8 h-8', theme === 'dark' ? 'text-[#d97757]' : 'text-blue-600')} />
                </div>
                <h2 className={cn(
                    'text-3xl font-[Syne] font-bold mb-3',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                    Let's name your campaign
                </h2>
                <p className={cn(
                    'text-base max-w-md mx-auto',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                    Choose a memorable name that helps you identify this campaign later.
                </p>
            </div>

            <div className="max-w-lg mx-auto">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="e.g., Q1 Outreach, Product Launch..."
                    autoFocus
                    className={cn(
                        'w-full px-6 py-5 text-xl font-medium rounded-2xl border-2 focus:outline-none transition-all text-center',
                        theme === 'dark'
                            ? 'bg-[#12151a] border-[#252a33] text-white placeholder:text-gray-600 focus:border-[#d97757]'
                            : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'
                    )}
                />
            </div>
        </div>
    );
}

// Step 2: Add Leads
function StepAddLeads({ theme, leads, onLeadsUpdate }: { theme: string; leads: Lead[]; onLeadsUpdate: (l: Lead[]) => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [manualEmail, setManualEmail] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

            onLeadsUpdate([...leads, ...newLeads]);
        };
        reader.readAsText(file);
    };

    const addManualLead = () => {
        if (!manualEmail.includes('@')) return;
        onLeadsUpdate([...leads, {
            id: `lead-${Date.now()}`,
            email: manualEmail,
            status: 'pending',
            customFields: {},
            addedAt: new Date().toISOString()
        }]);
        setManualEmail('');
    };

    const removeLead = (id: string) => {
        onLeadsUpdate(leads.filter(l => l.id !== id));
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <div className={cn(
                    'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
                    theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                )}>
                    <Users className={cn('w-8 h-8', theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600')} />
                </div>
                <h2 className={cn(
                    'text-3xl font-[Syne] font-bold mb-3',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                    Add your leads
                </h2>
                <p className={cn(
                    'text-base max-w-md mx-auto',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                    Import a CSV file or add email addresses manually.
                </p>
            </div>

            {/* Upload Area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
                    theme === 'dark'
                        ? 'border-[#252a33] hover:border-[#d97757] bg-[#12151a]/50'
                        : 'border-gray-200 hover:border-blue-400 bg-gray-50'
                )}
            >
                <Upload className={cn('w-10 h-10 mx-auto mb-4', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                <p className={cn('font-medium mb-1', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    Drop your CSV file here or click to browse
                </p>
                <p className={cn('text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                    Supports CSV with email, firstName, lastName, company columns
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>

            {/* Manual Add */}
            <div className="flex gap-3">
                <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManualLead()}
                    placeholder="Enter email address..."
                    className={cn(
                        'flex-1 px-4 py-3 rounded-xl border focus:outline-none transition-all',
                        theme === 'dark'
                            ? 'bg-[#12151a] border-[#252a33] text-white focus:border-[#d97757]'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                    )}
                />
                <Button
                    onClick={addManualLead}
                    disabled={!manualEmail.includes('@')}
                    className={cn(
                        'px-6 rounded-xl',
                        theme === 'dark' ? 'bg-[#d97757] text-white' : 'bg-blue-600 text-white'
                    )}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Leads List */}
            {leads.length > 0 && (
                <div className={cn(
                    'rounded-2xl border overflow-hidden',
                    theme === 'dark' ? 'border-[#252a33]' : 'border-gray-200'
                )}>
                    <div className={cn(
                        'px-4 py-3 flex items-center justify-between',
                        theme === 'dark' ? 'bg-[#1a1e25]' : 'bg-gray-50'
                    )}>
                        <span className={cn('text-sm font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                            {leads.length} lead{leads.length !== 1 && 's'} added
                        </span>
                        <button
                            onClick={() => onLeadsUpdate([])}
                            className="text-xs text-red-400 hover:text-red-300"
                        >
                            Clear all
                        </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {leads.slice(0, 10).map(lead => (
                            <div key={lead.id} className={cn(
                                'px-4 py-2 flex items-center justify-between border-t',
                                theme === 'dark' ? 'border-[#252a33]' : 'border-gray-100'
                            )}>
                                <div>
                                    <p className={cn('text-sm', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                        {lead.email}
                                    </p>
                                    {lead.firstName && (
                                        <p className={cn('text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                            {lead.firstName} {lead.lastName}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => removeLead(lead.id)} className="text-gray-400 hover:text-red-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {leads.length > 10 && (
                            <div className={cn('px-4 py-2 text-center text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                +{leads.length - 10} more leads
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Step 3: Sequence Type
function StepSequenceType({ theme, value, onChange }: { theme: string; value: 'same' | 'individual'; onChange: (v: 'same' | 'individual') => void }) {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <div className={cn(
                    'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
                    theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
                )}>
                    <Sparkles className={cn('w-8 h-8', theme === 'dark' ? 'text-purple-400' : 'text-purple-600')} />
                </div>
                <h2 className={cn(
                    'text-3xl font-[Syne] font-bold mb-3',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                    Email sequence strategy
                </h2>
                <p className={cn(
                    'text-base max-w-md mx-auto',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                    Do you want to use the same email sequence for all leads or personalize per lead?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                    onClick={() => onChange('same')}
                    className={cn(
                        'relative p-6 rounded-2xl border-2 text-left transition-all group',
                        value === 'same'
                            ? theme === 'dark'
                                ? 'border-[#d97757] bg-[#d97757]/10'
                                : 'border-blue-500 bg-blue-50'
                            : theme === 'dark'
                                ? 'border-[#252a33] hover:border-[#3a424f] bg-[#12151a]'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                >
                    <div className={cn(
                        'absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        value === 'same'
                            ? theme === 'dark' ? 'border-[#d97757] bg-[#d97757]' : 'border-blue-500 bg-blue-500'
                            : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                    )}>
                        {value === 'same' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <Mail className={cn('w-8 h-8 mb-4', value === 'same' ? 'text-[#d97757]' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                    <h3 className={cn('text-lg font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        Same for All
                    </h3>
                    <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                        Create one email sequence that will be sent to all leads. Personalization via merge tags.
                    </p>
                </button>

                <button
                    onClick={() => onChange('individual')}
                    className={cn(
                        'relative p-6 rounded-2xl border-2 text-left transition-all group',
                        value === 'individual'
                            ? theme === 'dark'
                                ? 'border-[#d97757] bg-[#d97757]/10'
                                : 'border-blue-500 bg-blue-50'
                            : theme === 'dark'
                                ? 'border-[#252a33] hover:border-[#3a424f] bg-[#12151a]'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                >
                    <div className={cn(
                        'absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        value === 'individual'
                            ? theme === 'dark' ? 'border-[#d97757] bg-[#d97757]' : 'border-blue-500 bg-blue-500'
                            : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                    )}>
                        {value === 'individual' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <Users className={cn('w-8 h-8 mb-4', value === 'individual' ? 'text-[#d97757]' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                    <h3 className={cn('text-lg font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        Individual Emails
                    </h3>
                    <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                        Write unique email content for each lead. Best for highly personalized outreach.
                    </p>
                </button>
            </div>
        </div>
    );
}

// Step 4: Email Sequence
function StepEmailSequence({
    theme, sequenceType, sequences, onSequencesUpdate, leads, individualSequences, onIndividualSequencesUpdate
}: {
    theme: string;
    sequenceType: 'same' | 'individual';
    sequences: SequenceStep[];
    onSequencesUpdate: (s: SequenceStep[]) => void;
    leads: Lead[];
    individualSequences: Map<string, SequenceStep[]>;
    onIndividualSequencesUpdate: (m: Map<string, SequenceStep[]>) => void;
}) {
    const [activeStepIdx, setActiveStepIdx] = useState(0);
    const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');

    const activeStep = sequences[activeStepIdx];

    const updateStep = (idx: number, updates: Partial<SequenceStep>) => {
        const updated = [...sequences];
        updated[idx] = { ...updated[idx], ...updates };
        onSequencesUpdate(updated);
    };

    const addStep = () => {
        onSequencesUpdate([...sequences, {
            id: `step-${Date.now()}`,
            order: sequences.length + 1,
            subject: '',
            body: '',
            delayDays: 2,
            delayHours: 0,
            variants: []
        }]);
        setActiveStepIdx(sequences.length);
    };

    const removeStep = (idx: number) => {
        if (sequences.length <= 1) return;
        const updated = sequences.filter((_, i) => i !== idx);
        onSequencesUpdate(updated);
        if (activeStepIdx >= updated.length) setActiveStepIdx(updated.length - 1);
    };

    if (sequenceType === 'individual') {
        return (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className={cn('text-2xl font-[Syne] font-bold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        Compose emails for each lead
                    </h2>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Lead selector */}
                    <div className={cn('rounded-xl border p-4', theme === 'dark' ? 'border-[#252a33] bg-[#12151a]' : 'border-gray-200')}>
                        <h3 className={cn('text-sm font-bold mb-3', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                            Select Lead
                        </h3>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {leads.map(lead => (
                                <button
                                    key={lead.id}
                                    onClick={() => setSelectedLeadId(lead.id)}
                                    className={cn(
                                        'w-full p-3 rounded-lg text-left text-sm transition-all',
                                        selectedLeadId === lead.id
                                            ? theme === 'dark' ? 'bg-[#d97757]/20 text-[#d97757]' : 'bg-blue-50 text-blue-600'
                                            : theme === 'dark' ? 'hover:bg-[#1a1e25] text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                    )}
                                >
                                    {lead.email}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email Editor */}
                    <div className="col-span-2 space-y-4">
                        <input
                            type="text"
                            placeholder="Email subject..."
                            value={individualSequences.get(selectedLeadId)?.[0]?.subject || ''}
                            onChange={(e) => {
                                const updated = new Map(individualSequences);
                                const existing = updated.get(selectedLeadId) || [{ ...sequences[0], id: `ind-${selectedLeadId}` }];
                                existing[0] = { ...existing[0], subject: e.target.value };
                                updated.set(selectedLeadId, existing);
                                onIndividualSequencesUpdate(updated);
                            }}
                            className={cn(
                                'w-full px-4 py-3 rounded-xl border text-lg font-medium focus:outline-none',
                                theme === 'dark'
                                    ? 'bg-[#12151a] border-[#252a33] text-white focus:border-[#d97757]'
                                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                            )}
                        />
                        <textarea
                            placeholder="Write your personalized email..."
                            value={individualSequences.get(selectedLeadId)?.[0]?.body || ''}
                            onChange={(e) => {
                                const updated = new Map(individualSequences);
                                const existing = updated.get(selectedLeadId) || [{ ...sequences[0], id: `ind-${selectedLeadId}` }];
                                existing[0] = { ...existing[0], body: e.target.value };
                                updated.set(selectedLeadId, existing);
                                onIndividualSequencesUpdate(updated);
                            }}
                            rows={12}
                            className={cn(
                                'w-full px-4 py-3 rounded-xl border resize-none focus:outline-none',
                                theme === 'dark'
                                    ? 'bg-[#12151a] border-[#252a33] text-white focus:border-[#d97757]'
                                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                            )}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className={cn('text-2xl font-[Syne] font-bold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    Create your email sequence
                </h2>
                <p className={cn('text-sm mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                    Use {'{{firstName}}'}, {'{{email}}'}, etc. for personalization
                </p>
            </div>

            <div className="flex gap-6">
                {/* Steps sidebar */}
                <div className="w-48 space-y-2">
                    {sequences.map((step, idx) => (
                        <button
                            key={step.id}
                            onClick={() => setActiveStepIdx(idx)}
                            className={cn(
                                'w-full p-3 rounded-xl text-left text-sm flex items-center gap-3 transition-all group',
                                activeStepIdx === idx
                                    ? theme === 'dark' ? 'bg-[#d97757]/20 text-[#d97757]' : 'bg-blue-50 text-blue-600'
                                    : theme === 'dark' ? 'hover:bg-[#1a1e25] text-gray-400' : 'hover:bg-gray-50 text-gray-600'
                            )}
                        >
                            <span className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                activeStepIdx === idx
                                    ? 'bg-[#d97757] text-white'
                                    : theme === 'dark' ? 'bg-[#252a33]' : 'bg-gray-200'
                            )}>
                                {idx + 1}
                            </span>
                            <span className="truncate flex-1">{step.subject || 'Untitled'}</span>
                            {sequences.length > 1 && (
                                <Trash2
                                    onClick={(e) => { e.stopPropagation(); removeStep(idx); }}
                                    className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-red-400"
                                />
                            )}
                        </button>
                    ))}
                    <button
                        onClick={addStep}
                        className={cn(
                            'w-full p-3 rounded-xl text-sm flex items-center gap-2 border-2 border-dashed',
                            theme === 'dark'
                                ? 'border-[#252a33] text-gray-500 hover:border-[#d97757] hover:text-[#d97757]'
                                : 'border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500'
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        Add Step
                    </button>
                </div>

                {/* Editor */}
                <div className="flex-1 space-y-4">
                    {activeStepIdx > 0 && (
                        <div className="flex items-center gap-3">
                            <Clock className={cn('w-4 h-4', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                            <span className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>Wait</span>
                            <input
                                type="number"
                                min="0"
                                value={activeStep.delayDays}
                                onChange={(e) => updateStep(activeStepIdx, { delayDays: parseInt(e.target.value) || 0 })}
                                className={cn(
                                    'w-16 px-2 py-1 rounded-lg border text-center font-mono text-sm',
                                    theme === 'dark' ? 'bg-[#12151a] border-[#252a33] text-white' : 'bg-white border-gray-200'
                                )}
                            />
                            <span className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>days before sending</span>
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Email subject..."
                        value={activeStep.subject}
                        onChange={(e) => updateStep(activeStepIdx, { subject: e.target.value })}
                        className={cn(
                            'w-full px-4 py-3 rounded-xl border text-lg font-medium focus:outline-none',
                            theme === 'dark'
                                ? 'bg-[#12151a] border-[#252a33] text-white focus:border-[#d97757]'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                        )}
                    />
                    <textarea
                        placeholder="Hi {{firstName}}, write your email content here..."
                        value={activeStep.body}
                        onChange={(e) => updateStep(activeStepIdx, { body: e.target.value })}
                        rows={12}
                        className={cn(
                            'w-full px-4 py-3 rounded-xl border resize-none focus:outline-none leading-relaxed',
                            theme === 'dark'
                                ? 'bg-[#12151a] border-[#252a33] text-white focus:border-[#d97757]'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                        )}
                    />
                </div>
            </div>
        </div>
    );
}

// Step 5: Schedule
function StepSchedule({ theme, schedule, onScheduleUpdate }: { theme: string; schedule: CampaignSchedule; onScheduleUpdate: (s: CampaignSchedule) => void }) {
    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const toggleDay = (day: string) => {
        const newDays = schedule.days.includes(day)
            ? schedule.days.filter(d => d !== day)
            : [...schedule.days, day];
        onScheduleUpdate({ ...schedule, days: newDays });
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <div className={cn(
                    'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
                    theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
                )}>
                    <Calendar className={cn('w-8 h-8', theme === 'dark' ? 'text-amber-400' : 'text-amber-600')} />
                </div>
                <h2 className={cn('text-3xl font-[Syne] font-bold mb-3', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    When should emails be sent?
                </h2>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
                {/* Time Range */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className={cn('block text-xs font-bold uppercase tracking-wider mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                            Start Time
                        </label>
                        <input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => onScheduleUpdate({ ...schedule, startTime: e.target.value })}
                            className={cn(
                                'w-full px-4 py-3 rounded-xl border font-mono focus:outline-none',
                                theme === 'dark' ? 'bg-[#12151a] border-[#252a33] text-white' : 'bg-white border-gray-200'
                            )}
                        />
                    </div>
                    <span className={cn('pt-6', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>to</span>
                    <div className="flex-1">
                        <label className={cn('block text-xs font-bold uppercase tracking-wider mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                            End Time
                        </label>
                        <input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => onScheduleUpdate({ ...schedule, endTime: e.target.value })}
                            className={cn(
                                'w-full px-4 py-3 rounded-xl border font-mono focus:outline-none',
                                theme === 'dark' ? 'bg-[#12151a] border-[#252a33] text-white' : 'bg-white border-gray-200'
                            )}
                        />
                    </div>
                </div>

                {/* Days */}
                <div>
                    <label className={cn('block text-xs font-bold uppercase tracking-wider mb-3', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                        Active Days
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                        {DAYS.map((day, idx) => (
                            <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={cn(
                                    'py-3 rounded-xl font-bold text-sm transition-all',
                                    schedule.days.includes(day)
                                        ? theme === 'dark' ? 'bg-[#d97757] text-white' : 'bg-blue-600 text-white'
                                        : theme === 'dark' ? 'bg-[#1a1e25] text-gray-500 hover:bg-[#252a33]' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                )}
                            >
                                {DAY_LABELS[idx]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Timezone */}
                <div>
                    <label className={cn('block text-xs font-bold uppercase tracking-wider mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                        Timezone
                    </label>
                    <select
                        value={schedule.timezone}
                        onChange={(e) => onScheduleUpdate({ ...schedule, timezone: e.target.value })}
                        className={cn(
                            'w-full px-4 py-3 rounded-xl border focus:outline-none cursor-pointer',
                            theme === 'dark' ? 'bg-[#12151a] border-[#252a33] text-white' : 'bg-white border-gray-200'
                        )}
                    >
                        {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'].map(tz => (
                            <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

// Step 6: Options
function StepOptions({ theme, options, onOptionsUpdate }: { theme: string; options: CampaignOptions; onOptionsUpdate: (o: CampaignOptions) => void }) {
    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={cn(
                'w-12 h-7 rounded-full relative transition-colors',
                checked ? theme === 'dark' ? 'bg-[#d97757]' : 'bg-blue-600' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            )}
        >
            <div className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                checked ? 'left-6' : 'left-1'
            )} />
        </button>
    );

    return (
        <div className="space-y-8">
            <div className="text-center">
                <div className={cn(
                    'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
                    theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-100'
                )}>
                    <Settings className={cn('w-8 h-8', theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600')} />
                </div>
                <h2 className={cn('text-3xl font-[Syne] font-bold mb-3', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    Campaign options
                </h2>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
                {[
                    { key: 'trackOpens', label: 'Track Opens', desc: 'Monitor when recipients open emails', icon: Zap },
                    { key: 'trackClicks', label: 'Track Clicks', desc: 'Track link clicks in emails', icon: Zap },
                    { key: 'stopOnReply', label: 'Stop on Reply', desc: 'Pause sequence when lead replies', icon: Mail },
                ].map(item => (
                    <div
                        key={item.key}
                        onClick={() => onOptionsUpdate({ ...options, [item.key]: !options[item.key as keyof CampaignOptions] })}
                        className={cn(
                            'flex items-center justify-between p-5 rounded-xl border cursor-pointer transition-all',
                            theme === 'dark' ? 'bg-[#12151a] border-[#252a33] hover:border-[#d97757]/50' : 'bg-white border-gray-200 hover:border-blue-300'
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <item.icon className={cn('w-5 h-5', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                            <div>
                                <h4 className={cn('font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>{item.label}</h4>
                                <p className={cn('text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>{item.desc}</p>
                            </div>
                        </div>
                        <Toggle checked={options[item.key as keyof CampaignOptions] as boolean} onChange={() => { }} />
                    </div>
                ))}

                {/* Limits */}
                <div className={cn(
                    'p-5 rounded-xl border space-y-4',
                    theme === 'dark' ? 'bg-[#12151a] border-[#252a33]' : 'bg-white border-gray-200'
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className={cn('font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>Daily Limit</h4>
                            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>Max emails per day</p>
                        </div>
                        <input
                            type="number"
                            value={options.dailyLimit}
                            onChange={(e) => onOptionsUpdate({ ...options, dailyLimit: parseInt(e.target.value) || 50 })}
                            className={cn(
                                'w-20 px-3 py-2 rounded-lg border text-right font-mono',
                                theme === 'dark' ? 'bg-[#0a0c0f] border-[#252a33] text-white' : 'bg-gray-50 border-gray-200'
                            )}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className={cn('font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>Time Gap (seconds)</h4>
                            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>Between each email</p>
                        </div>
                        <input
                            type="number"
                            value={options.timeBetweenEmails}
                            onChange={(e) => onOptionsUpdate({ ...options, timeBetweenEmails: parseInt(e.target.value) || 300 })}
                            className={cn(
                                'w-20 px-3 py-2 rounded-lg border text-right font-mono',
                                theme === 'dark' ? 'bg-[#0a0c0f] border-[#252a33] text-white' : 'bg-gray-50 border-gray-200'
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
