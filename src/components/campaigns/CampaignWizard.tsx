import { useState, useRef, useCallback, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Check, Loader2, X,
    Sparkles, Users, Mail, Clock, Settings, FileText,
    Upload, Plus, Trash2, Calendar, Globe, Zap,
    ArrowRight, Target, Send, Eye, Info, Code, Type
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { ALL_TIMEZONES, formatTimezone } from '../../lib/timezones';
import type { Lead, SequenceStep, CampaignSchedule, CampaignOptions } from './types';

interface CampaignWizardProps {
    onBack: () => void;
    onComplete: (campaignId: string) => void;
    className?: string;
}

const STEPS = [
    { id: 1, title: 'Name', icon: FileText },
    { id: 2, title: 'Accounts', icon: Mail },
    { id: 3, title: 'Leads', icon: Users },
    { id: 4, title: 'Strategy', icon: Target },
    { id: 5, title: 'Emails', icon: Mail },
    { id: 6, title: 'Preview', icon: Eye },
    { id: 7, title: 'Schedule', icon: Calendar },
    { id: 8, title: 'Review', icon: Send },
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
        dailyLimit: 15,
        timeBetweenEmails: 10,
        selectedAccountIds: []
    });
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

    const canProceed = useCallback(() => {
        switch (currentStep) {
            case 1: return campaignName.trim().length > 0;
            case 2: return selectedAccountIds.length > 0;
            case 3: return leads.length > 0;
            case 4: return true;
            // Step 5: Check for subject AND (body OR htmlBody depending on mode)
            case 5: return sequences.some(s => s.subject && (s.body || (s.isHtml && s.htmlBody)));
            case 6: return true; // Preview step - always can proceed
            case 7: return schedule.days.length > 0;
            case 8: return true;
            default: return false;
        }
    }, [currentStep, campaignName, selectedAccountIds, leads, sequences, schedule]);

    const handleNext = () => {
        if (currentStep < 8 && canProceed()) {
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
            // ✅ ASSIGN ACCOUNTS TO LEADS BEFORE SAVING
            // This ensures each lead knows which SMTP account will send their emails
            const leadsWithAccounts = leads.map((lead, index) => {
                // If lead already has an account assigned (from LeadsTab), keep it
                if (lead.sendingAccountId) {
                    return lead;
                }
                // Otherwise, assign round-robin from selected accounts
                if (selectedAccountIds.length > 0) {
                    return {
                        ...lead,
                        sendingAccountId: selectedAccountIds[index % selectedAccountIds.length]
                    };
                }
                return lead;
            });

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
                    leads: leadsWithAccounts,  // ✅ Use leads with accounts assigned
                    sequence: { id: `seq-${Date.now()}`, campaignId: '', steps: sequences },
                    schedule,
                    options: { ...options, selectedAccountIds },
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
                'flex items-center justify-between px-6 py-4 border-b relative',
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

                {/* Center: Step Indicator */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
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

                {/* Right side: Step Counter + Continue Button */}
                <div className="flex items-center gap-4">
                    <span className={cn('text-sm', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                        Step {currentStep} of 8
                    </span>
                    {currentStep < 8 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={cn(
                                'group relative overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-300 border border-transparent',
                                canProceed()
                                    ? 'bg-orange-500 text-white hover:border-orange-400/50'
                                    : isDark
                                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            )}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Continue
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            {canProceed() && (
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={isCreating}
                            className="group relative overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide bg-emerald-500 text-white hover:border-emerald-400/50 transition-all duration-300 border border-transparent"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Save Campaign
                                    </>
                                )}
                            </span>
                            {!isCreating && (
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                            )}
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className={cn(
                    'mx-auto px-6',
                    currentStep === 5 || currentStep === 6 ? 'max-w-7xl h-full py-4' : 'max-w-2xl py-8'
                )}>
                    {currentStep === 1 && <StepName isDark={isDark} value={campaignName} onChange={setCampaignName} />}
                    {currentStep === 2 && <StepAccounts isDark={isDark} selectedIds={selectedAccountIds} onUpdate={setSelectedAccountIds} />}
                    {currentStep === 3 && <StepLeads isDark={isDark} leads={leads} onUpdate={setLeads} />}
                    {currentStep === 4 && <StepStrategy isDark={isDark} value={sequenceType} onChange={setSequenceType} />}
                    {currentStep === 5 && <StepEmails isDark={isDark} sequences={sequences} onUpdate={setSequences} sequenceType={sequenceType} leads={leads} individualSequences={individualSequences} onIndividualUpdate={setIndividualSequences} selectedAccountIds={selectedAccountIds} />}
                    {currentStep === 6 && <StepPreview isDark={isDark} sequences={sequences} leads={leads} selectedAccountIds={selectedAccountIds} />}
                    {currentStep === 7 && <StepSchedule isDark={isDark} schedule={schedule} onUpdate={setSchedule} />}
                    {currentStep === 8 && <StepLaunch isDark={isDark} options={options} onUpdate={setOptions} campaignName={campaignName} leadsCount={leads.length} selectedAccountIds={selectedAccountIds} />}
                </div>
            </main>


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
    const [manualFirstName, setManualFirstName] = useState('');
    const [manualLastName, setManualLastName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [pendingLeadsCount, setPendingLeadsCount] = useState(0);
    const [pendingListName, setPendingListName] = useState('');
    const [showLeadListsModal, setShowLeadListsModal] = useState(false);
    const [leadLists, setLeadLists] = useState<Array<{ id: string; name: string; leads: Lead[]; createdAt: string }>>([]);
    const [loadingLists, setLoadingLists] = useState(false);

    // Check for pending leads from Lead Lists or Discovery
    useEffect(() => {
        // Check immediately
        const checkPendingLeads = () => {
            const pending = JSON.parse(localStorage.getItem('pendingCampaignLeads') || '[]');
            const listName = localStorage.getItem('pendingCampaignListName') || '';
            setPendingLeadsCount(pending.length);
            setPendingListName(listName);
        };

        checkPendingLeads();

        // Also check when window regains focus (in case user came from another tab)
        window.addEventListener('focus', checkPendingLeads);
        return () => window.removeEventListener('focus', checkPendingLeads);
    }, []);

    const importPendingLeads = () => {
        const pendingLeads = JSON.parse(localStorage.getItem('pendingCampaignLeads') || '[]');
        if (pendingLeads.length > 0) {
            onUpdate([...leads, ...pendingLeads]);
            localStorage.removeItem('pendingCampaignLeads');
            localStorage.removeItem('pendingCampaignListName');
            setPendingLeadsCount(0);
            setPendingListName('');
            toast.success(`Imported ${pendingLeads.length} leads!`);
        }
    };

    const fetchLeadLists = async () => {
        setLoadingLists(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/bulk-email/lead-lists', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLeadLists(data.lists || []);
            }
        } catch (error) {
            toast.error('Failed to load lead lists');
        } finally {
            setLoadingLists(false);
        }
    };

    const importFromLeadList = (list: { name: string; leads: Lead[] }) => {
        onUpdate([...leads, ...list.leads]);
        setShowLeadListsModal(false);
        toast.success(`Imported ${list.leads.length} leads from "${list.name}"`);
    };

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
        onUpdate([...leads, {
            id: `lead-${Date.now()}`,
            email: manualEmail,
            firstName: manualFirstName,
            lastName: manualLastName,
            status: 'pending',
            customFields: {},
            addedAt: new Date().toISOString()
        }]);
        setManualEmail('');
        setManualFirstName('');
        setManualLastName('');
    };


    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                        Add your leads
                    </h2>
                    <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                        Import a CSV or add emails manually.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowLeadListsModal(true);
                        fetchLeadLists();
                    }}
                    className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                        isDark
                            ? 'bg-orange-500/10 border border-orange-500/50 text-orange-400 hover:bg-orange-500/20'
                            : 'bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100'
                    )}
                >
                    <Users className="w-4 h-4" />
                    Add from Leads
                </button>
            </div>

            {/* Import from Lead Lists or Discovery */}
            {pendingLeadsCount > 0 && (
                <div className={cn(
                    'p-4 rounded-lg border flex items-center justify-between',
                    isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            isDark ? 'bg-orange-500/20' : 'bg-orange-100'
                        )}>
                            <Users className={cn('w-5 h-5', isDark ? 'text-orange-400' : 'text-orange-600')} />
                        </div>
                        <div>
                            <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                {pendingLeadsCount} lead{pendingLeadsCount !== 1 ? 's' : ''} ready to import
                                {pendingListName && <span className={cn('ml-2 text-xs font-normal', isDark ? 'text-neutral-400' : 'text-gray-500')}>from "{pendingListName}"</span>}
                            </p>
                            <p className={cn('text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                {pendingListName ? 'From Lead Lists' : 'From Discovery or Lead Lists'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={importPendingLeads}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                            'bg-orange-500 text-white hover:bg-orange-600'
                        )}
                    >
                        <Upload className="w-4 h-4" />
                        Import Leads
                    </button>
                </div>
            )}

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
            <div className="space-y-3">
                <p className={cn('text-sm font-medium', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                    Or add manually
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        value={manualFirstName}
                        onChange={(e) => setManualFirstName(e.target.value)}
                        placeholder="First name (optional)"
                        className={cn(
                            'px-4 py-3 rounded-lg text-sm transition-colors',
                            isDark ? 'bg-neutral-900 border border-neutral-800 text-white focus:border-orange-500' : 'bg-white border border-gray-200 text-gray-900 focus:border-orange-500'
                        )}
                        style={{ outline: 'none' }}
                    />
                    <input
                        type="text"
                        value={manualLastName}
                        onChange={(e) => setManualLastName(e.target.value)}
                        placeholder="Last name (optional)"
                        className={cn(
                            'px-4 py-3 rounded-lg text-sm transition-colors',
                            isDark ? 'bg-neutral-900 border border-neutral-800 text-white focus:border-orange-500' : 'bg-white border border-gray-200 text-gray-900 focus:border-orange-500'
                        )}
                        style={{ outline: 'none' }}
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addManual()}
                        placeholder="Email address *"
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

            {/* Lead Lists Modal */}
            {showLeadListsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowLeadListsModal(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            'w-full max-w-2xl rounded-xl shadow-2xl max-h-[80vh] flex flex-col',
                            isDark ? 'bg-[#0a0a0a] border border-neutral-800' : 'bg-white border border-gray-200'
                        )}
                    >
                        {/* Modal Header */}
                        <div className={cn('px-6 py-4 flex items-center justify-between border-b', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                            <div>
                                <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                    Import from Lead Lists
                                </h3>
                                <p className={cn('text-sm mt-0.5', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                    Select a list to import leads
                                </p>
                            </div>
                            <button
                                onClick={() => setShowLeadListsModal(false)}
                                className={cn(
                                    'p-2 rounded-lg transition-colors',
                                    isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
                                )}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingLists ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className={cn('w-8 h-8 animate-spin', isDark ? 'text-neutral-500' : 'text-gray-400')} />
                                    <p className={cn('text-sm mt-3', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                        Loading lead lists...
                                    </p>
                                </div>
                            ) : leadLists.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Users className={cn('w-12 h-12 mb-3', isDark ? 'text-neutral-700' : 'text-gray-300')} />
                                    <p className={cn('text-sm font-medium', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                        No lead lists found
                                    </p>
                                    <p className={cn('text-xs mt-1', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                        Create a lead list first to import leads
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {leadLists.map((list) => (
                                        <button
                                            key={list.id}
                                            onClick={() => importFromLeadList(list)}
                                            className={cn(
                                                'w-full p-4 rounded-lg border text-left transition-all hover:scale-[1.01]',
                                                isDark
                                                    ? 'bg-neutral-900 border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-800/50'
                                                    : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                                            {list.name}
                                                        </h4>
                                                        <span className={cn(
                                                            'px-2 py-0.5 rounded-full text-xs font-medium',
                                                            isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                                                        )}>
                                                            {list.leads.length} leads
                                                        </span>
                                                    </div>
                                                    <p className={cn('text-xs mt-1', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                                        Created {new Date(list.createdAt).toLocaleDateString()}
                                                    </p>
                                                    {list.leads.length > 0 && (
                                                        <div className={cn('mt-2 text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                                            {list.leads.slice(0, 3).map(lead => lead.email).join(', ')}
                                                            {list.leads.length > 3 && ` +${list.leads.length - 3} more`}
                                                        </div>
                                                    )}
                                                </div>
                                                <ArrowRight className={cn('w-5 h-5 ml-3 flex-shrink-0', isDark ? 'text-neutral-600' : 'text-gray-400')} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className={cn('px-6 py-4 border-t', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                            <button
                                onClick={() => setShowLeadListsModal(false)}
                                className={cn(
                                    'w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isDark
                                        ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                )}
                            >
                                Cancel
                            </button>
                        </div>
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
// Step 4: Email Composer
function StepEmails({ isDark, sequences, onUpdate, sequenceType, leads, individualSequences, onIndividualUpdate, selectedAccountIds }: { isDark: boolean; sequences: SequenceStep[]; onUpdate: (s: SequenceStep[]) => void; sequenceType: 'same' | 'individual'; leads: Lead[]; individualSequences: Map<string, SequenceStep[]>; onIndividualUpdate: (m: Map<string, SequenceStep[]>) => void; selectedAccountIds: string[] }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedLead, setSelectedLead] = useState(leads[0]?.id || '');
    const [showAI, setShowAI] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewLeadIdx, setPreviewLeadIdx] = useState(0);
    const [accounts, setAccounts] = useState<Array<{
        id: string;
        email?: string;
        name?: string;
        fromName?: string;
        fromEmail?: string;
        senderFullName?: string;
        senderCompany?: string;
        senderPosition?: string;
        senderPhone?: string;
        senderWebsite?: string;
        senderLinkedIn?: string
    }>>([]);
    const step = sequences[activeIdx];

    // Fetch accounts for preview
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const token = localStorage.getItem('bulkEmailToken');
                const response = await fetch('/api/bulk-email/smtp-accounts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    // API returns array directly, not { accounts: [...] }
                    setAccounts(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        };
        fetchAccounts();
    }, []);

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

    // Replace variables with actual data
    const replaceVariables = (text: string, lead: Lead, account: typeof accounts[0] | null) => {
        if (!text) return text;

        let result = text;

        // Lead variables
        result = result.replace(/\{\{firstName\}\}/gi, lead.firstName || '');
        result = result.replace(/\{\{lastName\}\}/gi, lead.lastName || '');
        result = result.replace(/\{\{email\}\}/gi, lead.email || '');
        result = result.replace(/\{\{company\}\}/gi, lead.company || '');

        // Account/Sender variables - map to actual database field names
        if (account) {
            // Use senderFullName, fallback to fromName, then name
            const senderName = account.senderFullName || account.fromName || account.name || account.fromEmail?.split('@')[0] || '';
            result = result.replace(/\[Your Name\]/gi, senderName);
            result = result.replace(/\[Your Company\]/gi, account.senderCompany || '');
            result = result.replace(/\[Your Position\]/gi, account.senderPosition || '');
            result = result.replace(/\[Your Phone\]/gi, account.senderPhone || '');
            result = result.replace(/\[Your Website\]/gi, account.senderWebsite || '');
            result = result.replace(/\[LinkedIn\]/gi, account.senderLinkedIn || '');
        }

        return result;
    };

    const getPreviewData = () => {
        const lead = leads[previewLeadIdx] || leads[0];
        const account = accounts.find(a => selectedAccountIds.includes(a.id)) || accounts[0];

        if (!lead) return { subject: step.subject, body: step.body, htmlBody: step.htmlBody, isHtml: step.isHtml };

        return {
            subject: replaceVariables(step.subject, lead, account),
            body: replaceVariables(step.body, lead, account),
            htmlBody: step.htmlBody ? replaceVariables(step.htmlBody, lead, account) : '',
            isHtml: step.isHtml,
            lead,
            account
        };
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

    // Preview Modal Component
    const PreviewModal = () => {
        const preview = getPreviewData();

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        'w-full max-w-2xl rounded-xl shadow-2xl max-h-[85vh] flex flex-col',
                        isDark ? 'bg-[#0a0a0a] border border-neutral-800' : 'bg-white border border-gray-200'
                    )}
                >
                    {/* Modal Header */}
                    <div className={cn('px-6 py-4 flex items-center justify-between border-b', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                        <div>
                            <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                Email Preview
                            </h3>
                            <p className={cn('text-sm mt-0.5', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                                See how your email will look with real data
                            </p>
                        </div>
                        <button
                            onClick={() => setShowPreview(false)}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
                            )}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Lead Selector */}
                    <div className={cn('px-6 py-3 border-b flex items-center gap-4', isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-gray-100 bg-gray-50')}>
                        <span className={cn('text-xs font-medium', isDark ? 'text-neutral-400' : 'text-gray-500')}>Preview for:</span>
                        <select
                            value={previewLeadIdx}
                            onChange={(e) => setPreviewLeadIdx(Number(e.target.value))}
                            className={cn(
                                'flex-1 px-3 py-1.5 rounded-lg text-sm cursor-pointer',
                                isDark ? 'bg-neutral-800 border border-neutral-700 text-white' : 'bg-white border border-gray-200 text-gray-900'
                            )}
                            style={{ outline: 'none' }}
                        >
                            {leads.map((lead, idx) => (
                                <option key={lead.id} value={idx}>
                                    {lead.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : lead.email}
                                    {lead.company ? ` - ${lead.company}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Email Preview */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* From / To */}
                        <div className={cn('mb-4 pb-4 border-b', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={cn('text-xs font-medium w-12', isDark ? 'text-neutral-500' : 'text-gray-400')}>From:</span>
                                <span className={cn('text-sm', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                    {preview.account?.senderFullName || preview.account?.fromName || preview.account?.name || preview.account?.fromEmail || 'Your Email Account'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn('text-xs font-medium w-12', isDark ? 'text-neutral-500' : 'text-gray-400')}>To:</span>
                                <span className={cn('text-sm', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                    {preview.lead?.email || 'recipient@example.com'}
                                </span>
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="mb-4">
                            <p className={cn('text-xs font-medium mb-1', isDark ? 'text-neutral-500' : 'text-gray-400')}>Subject</p>
                            <p className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                {preview.subject || '(No subject)'}
                            </p>
                        </div>

                        {/* Body */}
                        {preview.isHtml && preview.htmlBody ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200">
                                <div className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-2', isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500')}>
                                    <Code className="w-3 h-3" />
                                    HTML Email
                                </div>
                                <div className="bg-white p-0" style={{ minHeight: '300px' }}>
                                    <iframe
                                        srcDoc={preview.htmlBody}
                                        className="w-full border-0"
                                        style={{ height: '300px' }}
                                        title="HTML Email Preview"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className={cn(
                                'p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed',
                                isDark ? 'bg-neutral-900 text-neutral-200' : 'bg-gray-50 text-gray-700'
                            )}>
                                {preview.body || '(No content)'}
                            </div>
                        )}

                        {/* Variable Status */}
                        <div className={cn('mt-4 p-3 rounded-lg text-xs', isDark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-gray-50 border border-gray-200')}>
                            <p className={cn('font-medium mb-2', isDark ? 'text-neutral-400' : 'text-gray-500')}>Variables replaced:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { var: '{{firstName}}', val: preview.lead?.firstName },
                                    { var: '{{lastName}}', val: preview.lead?.lastName },
                                    { var: '{{company}}', val: preview.lead?.company },
                                    { var: '[Your Name]', val: preview.account?.senderFullName || preview.account?.fromName || preview.account?.name },
                                ].map(v => (
                                    <span key={v.var} className={cn(
                                        'px-2 py-1 rounded',
                                        v.val
                                            ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                            : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                                    )}>
                                        {v.var}: {v.val || '(empty)'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className={cn('px-6 py-4 border-t flex justify-end gap-2', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                        <button
                            onClick={() => setShowPreview(false)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                isDark
                                    ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            )}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const VariablesGuide = () => (
        <div className={cn(
            'absolute top-12 right-4 w-80 p-4 rounded-xl border shadow-2xl z-50 max-h-[400px] overflow-y-auto',
            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'
        )}>
            <div className="flex items-center justify-between mb-3">
                <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Personalization Guide</h3>
                <button onClick={() => setShowGuide(false)} className={cn('p-1 rounded hover:bg-black/10', isDark ? 'text-neutral-400' : 'text-gray-400')}>
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <p className={cn('text-xs font-medium uppercase tracking-wider mb-2', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                        Based on Lead Data
                    </p>
                    <div className="space-y-2">
                        {[
                            { code: '{{firstName}}', desc: "Lead's first name" },
                            { code: '{{lastName}}', desc: "Lead's last name" },
                            { code: '{{company}}', desc: "Company name" },
                            { code: '{{email}}', desc: "Lead's email" },
                        ].map(v => (
                            <div key={v.code} className="flex items-center justify-between text-sm">
                                <code className={cn('px-1.5 py-0.5 rounded text-xs', isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600')}>{v.code}</code>
                                <span className={cn('text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>{v.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t pt-3 border-dashed border-gray-700/50">
                    <p className={cn('text-xs font-medium uppercase tracking-wider mb-2', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                        Your Sender Profile
                    </p>
                    <p className={cn('text-xs mb-2 italic', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                        Configure these in "Email Accounts" settings
                    </p>
                    <div className="space-y-2">
                        {[
                            { code: '[Your Name]', desc: "Your full name" },
                            { code: '[Your Company]', desc: "Your company" },
                            { code: '[Your Position]', desc: "Your job title" },
                            { code: '[Your Phone]', desc: "Your phone number" },
                            { code: '[Your Website]', desc: "Company website" },
                            { code: '[LinkedIn]', desc: "Your LinkedIn URL" },
                        ].map(v => (
                            <div key={v.code} className="flex items-center justify-between text-sm">
                                <code className={cn('px-1.5 py-0.5 rounded text-xs', isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')}>{v.code}</code>
                                <span className={cn('text-xs', isDark ? 'text-neutral-400' : 'text-gray-500')}>{v.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

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
            <div className="mb-2 flex items-center justify-between">
                <div>
                    <h2 className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Craft your sequence</h2>
                </div>
                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                        isDark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    )}
                >
                    <Info className="w-3.5 h-3.5" />
                    Variables Guide
                </button>
            </div>

            <div className="flex-1 flex gap-3 min-h-0 relative">
                {showGuide && <VariablesGuide />}

                {/* Steps sidebar */}
                <div className="w-44 flex flex-col gap-2 flex-shrink-0">
                    <div className="flex-1 space-y-1.5 overflow-y-auto">
                        {sequences.map((s, idx) => (
                            <button key={s.id} onClick={() => setActiveIdx(idx)}
                                className={cn('w-full p-2 rounded-lg text-left transition-colors group relative',
                                    activeIdx === idx
                                        ? isDark ? 'bg-orange-500/10 border border-orange-500/50' : 'bg-orange-50 border border-orange-400'
                                        : isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-white border border-gray-200 hover:border-gray-300')}>
                                <div className="flex items-center gap-2">
                                    <span className={cn('w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium flex-shrink-0',
                                        activeIdx === idx ? 'bg-orange-500 text-white' : isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400')}>
                                        {idx + 1}
                                    </span>
                                    <span className={cn('text-xs truncate flex-1', isDark ? 'text-white' : 'text-gray-900')}>
                                        {s.subject || 'Untitled'}
                                    </span>
                                </div>
                                {idx > 0 && (
                                    <span className={cn('text-[10px] ml-7 block', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                        {s.delayDays}d delay
                                    </span>
                                )}
                                {sequences.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteStep(idx); }}
                                        className="absolute top-1.5 right-1.5 p-0.5 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-400 transition-all">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </button>
                        ))}
                    </div>
                    <button onClick={addStep}
                        className={cn('w-full p-2 rounded-lg border border-dashed flex items-center justify-center gap-1.5 text-xs font-medium transition-colors',
                            isDark ? 'border-neutral-700 text-neutral-500 hover:border-orange-500/50 hover:text-orange-400' : 'border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500')}>
                        <Plus className="w-3 h-3" /> Add Step
                    </button>
                </div>

                {/* Editor */}
                <div className={cn('flex-1 flex flex-col rounded-lg overflow-hidden', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                    {/* Subject and Delay - Compact */}
                    <div className={cn('px-3 py-2 border-b flex items-center gap-3', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                        <input type="text" placeholder="Subject line..." value={step.subject} onChange={(e) => updateStep(activeIdx, { subject: e.target.value })}
                            className={cn('flex-1 bg-transparent text-sm font-medium focus:outline-none', isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400')} />
                        {activeIdx > 0 && (
                            <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-xs', isDark ? 'bg-neutral-800' : 'bg-gray-100')}>
                                <Clock className="w-3 h-3 text-neutral-500" />
                                <span className={cn(isDark ? 'text-neutral-400' : 'text-gray-500')}>Wait</span>
                                <input type="number" min="0" value={step.delayDays} onChange={(e) => updateStep(activeIdx, { delayDays: parseInt(e.target.value) || 0 })}
                                    className={cn('w-8 text-center bg-transparent font-medium focus:outline-none', isDark ? 'text-white' : 'text-gray-900')} />
                                <span className={cn(isDark ? 'text-neutral-400' : 'text-gray-500')}>d</span>
                            </div>
                        )}
                        {/* Mode Toggle - Inline */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => updateStep(activeIdx, { isHtml: false })}
                                className={cn(
                                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                                    !step.isHtml
                                        ? 'bg-orange-500 text-white'
                                        : isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                                )}
                            >
                                <Type className="w-3 h-3" />
                                Text
                            </button>
                            <button
                                onClick={() => updateStep(activeIdx, { isHtml: true })}
                                className={cn(
                                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                                    step.isHtml
                                        ? 'bg-orange-500 text-white'
                                        : isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                                )}
                            >
                                <Code className="w-3 h-3" />
                                HTML
                            </button>
                        </div>
                    </div>

                    {/* Body Editor */}
                    <div className="flex-1 flex min-h-0">
                        {/* Code/Text Editor */}
                        <div className={cn('flex-1 relative', step.isHtml && 'border-r', isDark ? 'border-neutral-800' : 'border-gray-200')}>
                            {step.isHtml ? (
                                <>
                                    <div className={cn('px-4 py-2 text-xs font-medium border-b', isDark ? 'text-neutral-400 border-neutral-800 bg-neutral-900' : 'text-gray-500 border-gray-100 bg-gray-50')}>
                                        HTML Code
                                    </div>
                                    <textarea
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
                                        value={step.htmlBody || ''}
                                        onChange={(e) => updateStep(activeIdx, { htmlBody: e.target.value })}
                                        className={cn(
                                            'w-full h-full p-4 bg-transparent resize-none focus:outline-none text-xs font-mono leading-relaxed',
                                            isDark ? 'text-emerald-400 placeholder:text-neutral-600' : 'text-gray-800 placeholder:text-gray-400'
                                        )}
                                        spellCheck={false}
                                    />
                                </>
                            ) : (
                                <textarea
                                    placeholder={`Hi {{firstName}},\n\nWrite your message here...\n\nBest regards,\n[Your Name]`}
                                    value={step.body}
                                    onChange={(e) => updateStep(activeIdx, { body: e.target.value })}
                                    className={cn('w-full h-full p-4 bg-transparent resize-none focus:outline-none text-sm leading-relaxed', isDark ? 'text-white placeholder:text-neutral-600' : 'text-gray-900 placeholder:text-gray-400')}
                                />
                            )}

                            {/* Action Buttons */}
                            <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                {/* AI Button */}
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

                        {/* Live HTML Preview */}
                        {step.isHtml && (
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className={cn('px-4 py-2 text-xs font-medium border-b flex items-center justify-between', isDark ? 'text-neutral-400 border-neutral-800 bg-neutral-900' : 'text-gray-500 border-gray-100 bg-gray-50')}>
                                    <span>Live Preview</span>
                                    <span className={cn('text-xs px-2 py-0.5 rounded', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
                                        {leads.length > 0 ? `Previewing for: ${leads[0]?.firstName || leads[0]?.email}` : 'Add leads to preview'}
                                    </span>
                                </div>
                                <div className={cn('flex-1 overflow-auto p-4', isDark ? 'bg-white' : 'bg-white')}>
                                    <iframe
                                        srcDoc={(() => {
                                            let html = step.htmlBody || '';
                                            // Replace variables with first lead's data for preview
                                            const lead = leads[0];
                                            if (lead) {
                                                html = html.replace(/\{\{firstName\}\}/gi, lead.firstName || '');
                                                html = html.replace(/\{\{lastName\}\}/gi, lead.lastName || '');
                                                html = html.replace(/\{\{email\}\}/gi, lead.email || '');
                                                html = html.replace(/\{\{company\}\}/gi, lead.company || '');
                                            }
                                            // Replace sender variables
                                            const account = accounts.find(a => selectedAccountIds.includes(a.id)) || accounts[0];
                                            if (account) {
                                                const senderName = account.senderFullName || account.fromName || account.name || '';
                                                html = html.replace(/\[Your Name\]/gi, senderName);
                                                html = html.replace(/\[Your Company\]/gi, account.senderCompany || '');
                                                html = html.replace(/\[Your Position\]/gi, account.senderPosition || '');
                                            }
                                            return html;
                                        })()}
                                        className="w-full h-full border-0"
                                        title="Email Preview"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            </div >

            {/* Preview Modal */}
            {showPreview && <PreviewModal />}
        </div >
    );
}

// Step 6: Preview
function StepPreview({ isDark, sequences, leads, selectedAccountIds }: {
    isDark: boolean;
    sequences: SequenceStep[];
    leads: Lead[];
    selectedAccountIds: string[];
}) {
    const [previewLeadIdx, setPreviewLeadIdx] = useState(0);
    const [activeStepIdx, setActiveStepIdx] = useState(0);
    const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
    const [accounts, setAccounts] = useState<Array<{
        id: string;
        email?: string;
        name?: string;
        fromName?: string;
        fromEmail?: string;
        senderFullName?: string;
        senderCompany?: string;
        senderPosition?: string;
        senderPhone?: string;
        senderWebsite?: string;
        senderLinkedIn?: string
    }>>([]);

    // Fetch accounts for preview
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const token = localStorage.getItem('bulkEmailToken');
                const response = await fetch('/api/bulk-email/smtp-accounts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAccounts(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        };
        fetchAccounts();
    }, []);

    const step = sequences[activeStepIdx] || sequences[0];
    const lead = leads[previewLeadIdx] || leads[0];
    const account = accounts.find(a => selectedAccountIds.includes(a.id)) || accounts[0];

    // Replace variables with actual data
    const replaceVariables = (text: string) => {
        if (!text) return text;
        let result = text;

        // Lead variables
        if (lead) {
            result = result.replace(/\{\{firstName\}\}/gi, lead.firstName || '');
            result = result.replace(/\{\{lastName\}\}/gi, lead.lastName || '');
            result = result.replace(/\{\{email\}\}/gi, lead.email || '');
            result = result.replace(/\{\{company\}\}/gi, lead.company || '');
        }

        // Account/Sender variables
        if (account) {
            const senderName = account.senderFullName || account.fromName || account.name || account.fromEmail?.split('@')[0] || '';
            result = result.replace(/\[Your Name\]/gi, senderName);
            result = result.replace(/\[Your Company\]/gi, account.senderCompany || '');
            result = result.replace(/\[Your Position\]/gi, account.senderPosition || '');
            result = result.replace(/\[Your Phone\]/gi, account.senderPhone || '');
            result = result.replace(/\[Your Website\]/gi, account.senderWebsite || '');
            result = result.replace(/\[LinkedIn\]/gi, account.senderLinkedIn || '');
        }

        return result;
    };

    const previewSubject = replaceVariables(step?.subject || '');
    const previewBody = step?.isHtml ? replaceVariables(step?.htmlBody || '') : replaceVariables(step?.body || '');

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                    Preview your emails
                </h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    See exactly how your emails will appear to recipients with personalization applied
                </p>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Sidebar - Controls */}
                <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                    {/* Lead Selector */}
                    <div className={cn('p-4 rounded-lg', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                        <label className={cn('text-xs font-medium uppercase tracking-wider mb-2 block', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                            Preview for Lead
                        </label>
                        <select
                            value={previewLeadIdx}
                            onChange={(e) => setPreviewLeadIdx(Number(e.target.value))}
                            className={cn(
                                'w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer',
                                isDark ? 'bg-neutral-800 border border-neutral-700 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                            )}
                            style={{ outline: 'none' }}
                        >
                            {leads.length === 0 ? (
                                <option>No leads added</option>
                            ) : (
                                leads.map((l, idx) => (
                                    <option key={l.id} value={idx}>
                                        {l.firstName ? `${l.firstName} ${l.lastName || ''}`.trim() : l.email}
                                        {l.company ? ` - ${l.company}` : ''}
                                    </option>
                                ))
                            )}
                        </select>
                        {lead && (
                            <div className={cn('mt-3 pt-3 border-t text-xs space-y-1', isDark ? 'border-neutral-800 text-neutral-400' : 'border-gray-100 text-gray-500')}>
                                <p><span className="font-medium">Email:</span> {lead.email}</p>
                                {lead.company && <p><span className="font-medium">Company:</span> {lead.company}</p>}
                            </div>
                        )}
                    </div>

                    {/* Step Selector */}
                    <div className={cn('p-4 rounded-lg', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                        <label className={cn('text-xs font-medium uppercase tracking-wider mb-2 block', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                            Sequence Step
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {sequences.map((s, idx) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveStepIdx(idx)}
                                    className={cn(
                                        'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                                        activeStepIdx === idx
                                            ? 'bg-orange-500 text-white'
                                            : isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                                    )}
                                >
                                    Step {idx + 1}
                                    {idx > 0 && <span className="ml-1 opacity-60">+{s.delayDays}d</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* View Mode */}
                    <div className={cn('p-4 rounded-lg', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                        <label className={cn('text-xs font-medium uppercase tracking-wider mb-2 block', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                            View Mode
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('preview')}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                                    viewMode === 'preview'
                                        ? 'bg-orange-500 text-white'
                                        : isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                                )}
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Rendered
                            </button>
                            <button
                                onClick={() => setViewMode('source')}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                                    viewMode === 'source'
                                        ? 'bg-orange-500 text-white'
                                        : isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                                )}
                            >
                                <Code className="w-3.5 h-3.5" />
                                Source
                            </button>
                        </div>
                    </div>

                    {/* Variable Status */}
                    <div className={cn('p-4 rounded-lg flex-1 overflow-y-auto', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                        <label className={cn('text-xs font-medium uppercase tracking-wider mb-3 block', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                            Variables Status
                        </label>
                        <div className="space-y-2">
                            {[
                                { var: '{{firstName}}', val: lead?.firstName },
                                { var: '{{lastName}}', val: lead?.lastName },
                                { var: '{{email}}', val: lead?.email },
                                { var: '{{company}}', val: lead?.company },
                                { var: '[Your Name]', val: account?.senderFullName || account?.fromName || account?.name },
                                { var: '[Your Company]', val: account?.senderCompany },
                            ].map(v => (
                                <div key={v.var} className={cn(
                                    'px-2.5 py-2 rounded-lg text-xs flex items-center justify-between',
                                    v.val
                                        ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                        : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                                )}>
                                    <code className="font-mono">{v.var}</code>
                                    <span className="truncate max-w-[100px] ml-2">{v.val || '(empty)'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Preview Area */}
                <div className={cn('flex-1 flex flex-col rounded-xl overflow-hidden', isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200')}>
                    {/* Email Header */}
                    <div className={cn('px-6 py-4 border-b', isDark ? 'border-neutral-800' : 'border-gray-100')}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={cn('text-xs font-medium w-14', isDark ? 'text-neutral-500' : 'text-gray-400')}>From:</span>
                            <span className={cn('text-sm', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                {account?.senderFullName || account?.fromName || account?.name || 'Your Email Account'}
                                {' '}
                                <span className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                    &lt;{account?.fromEmail || 'you@example.com'}&gt;
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={cn('text-xs font-medium w-14', isDark ? 'text-neutral-500' : 'text-gray-400')}>To:</span>
                            <span className={cn('text-sm', isDark ? 'text-neutral-300' : 'text-gray-700')}>
                                {lead?.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : 'Recipient'}
                                {' '}
                                <span className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                    &lt;{lead?.email || 'recipient@example.com'}&gt;
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={cn('text-xs font-medium w-14', isDark ? 'text-neutral-500' : 'text-gray-400')}>Subject:</span>
                            <span className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                                {previewSubject || '(No subject)'}
                            </span>
                        </div>
                    </div>

                    {/* Email Body */}
                    <div className="flex-1 overflow-auto">
                        {viewMode === 'preview' ? (
                            step?.isHtml ? (
                                <div className="h-full bg-white">
                                    <iframe
                                        srcDoc={previewBody}
                                        className="w-full h-full border-0"
                                        title="Email Preview"
                                        sandbox="allow-same-origin"
                                        style={{ minHeight: '400px' }}
                                    />
                                </div>
                            ) : (
                                <div className={cn(
                                    'p-6 whitespace-pre-wrap text-sm leading-relaxed',
                                    isDark ? 'text-neutral-200' : 'text-gray-700'
                                )}>
                                    {previewBody || '(No content)'}
                                </div>
                            )
                        ) : (
                            <div className={cn('p-6 font-mono text-xs leading-relaxed overflow-auto', isDark ? 'bg-neutral-950 text-emerald-400' : 'bg-gray-50 text-gray-800')}>
                                <pre className="whitespace-pre-wrap">{step?.isHtml ? step?.htmlBody : step?.body || '(No content)'}</pre>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={cn('px-6 py-3 border-t flex items-center justify-between', isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-gray-100 bg-gray-50')}>
                        <div className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                            {step?.isHtml ? (
                                <span className="flex items-center gap-1.5">
                                    <Code className="w-3.5 h-3.5" />
                                    HTML Email
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <Type className="w-3.5 h-3.5" />
                                    Plain Text Email
                                </span>
                            )}
                        </div>
                        <div className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                            Previewing Step {activeStepIdx + 1} of {sequences.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 7: Schedule
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
                    {ALL_TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{formatTimezone(tz)}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// Step 2: Select Email Accounts
function StepAccounts({ isDark, selectedIds, onUpdate }: { isDark: boolean; selectedIds: string[]; onUpdate: (ids: string[]) => void }) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const token = localStorage.getItem('bulkEmailToken');
                const res = await fetch('/api/bulk-email/smtp-accounts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAccounts(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error('Failed to fetch accounts:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const toggleAccount = (id: string) => {
        if (selectedIds.includes(id)) {
            onUpdate(selectedIds.filter(i => i !== id));
        } else {
            onUpdate([...selectedIds, id]);
        }
    };

    const selectAll = () => {
        if (selectedIds.length === accounts.length) {
            onUpdate([]);
        } else {
            onUpdate(accounts.map(a => a.id));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                    Select Email Accounts
                </h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    Choose which email accounts to use for this campaign. Each account can send max 15 emails per day.
                </p>
            </div>

            {accounts.length === 0 ? (
                <div className={cn('p-8 rounded-lg text-center border', isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-200')}>
                    <Mail className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-neutral-600' : 'text-gray-400')} />
                    <p className={cn('text-sm font-medium mb-1', isDark ? 'text-neutral-400' : 'text-gray-600')}>No email accounts found</p>
                    <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-500')}>Add email accounts in Settings first.</p>
                </div>
            ) : (
                <>
                    {/* Select All */}
                    <button
                        onClick={selectAll}
                        className={cn(
                            'w-full flex items-center justify-between p-4 rounded-lg border transition-colors',
                            selectedIds.length === accounts.length
                                ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                                : isDark
                                    ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-orange-500/50'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center',
                                selectedIds.length === accounts.length
                                    ? 'bg-orange-500 border-orange-500'
                                    : isDark ? 'border-neutral-600' : 'border-gray-300'
                            )}>
                                {selectedIds.length === accounts.length && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-medium">Select All ({accounts.length} accounts)</span>
                        </div>
                        <span className="text-sm">{accounts.length * 15} emails/day max</span>
                    </button>

                    {/* Individual Accounts */}
                    <div className="space-y-2">
                        {accounts.map(acc => {
                            const isSelected = selectedIds.includes(acc.id);
                            return (
                                <button
                                    key={acc.id}
                                    onClick={() => toggleAccount(acc.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-4 rounded-lg border transition-colors text-left',
                                        isSelected
                                            ? 'bg-orange-500/10 border-orange-500'
                                            : isDark
                                                ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    <div className={cn(
                                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                                        isSelected
                                            ? 'bg-orange-500 border-orange-500'
                                            : isDark ? 'border-neutral-600' : 'border-gray-300'
                                    )}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                            {acc.fromEmail}
                                        </p>
                                        <p className={cn('text-xs truncate', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                                            {acc.name || acc.fromName}
                                        </p>
                                    </div>
                                    <span className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>
                                        15/day
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className={cn(
                        'px-4 py-3 rounded-lg text-sm flex items-center justify-between',
                        selectedIds.length > 0
                            ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                            : isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-500'
                    )}>
                        <span>{selectedIds.length} account{selectedIds.length !== 1 ? 's' : ''} selected</span>
                        <span className="font-medium">{selectedIds.length * 15} emails/day max</span>
                    </div>
                </>
            )}
        </div>
    );
}

// Step 8: Review & Launch
function StepLaunch({ isDark, options, onUpdate, campaignName, leadsCount, selectedAccountIds }: { isDark: boolean; options: CampaignOptions; onUpdate: (o: CampaignOptions) => void; campaignName: string; leadsCount: number; selectedAccountIds: string[] }) {
    const EMAILS_PER_ACCOUNT = 15;

    const activeAccountsCount = selectedAccountIds.length;
    const maxDailyEmails = activeAccountsCount * EMAILS_PER_ACCOUNT;
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
                    Ready to save
                </h2>
                <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                    Review your settings and save "{campaignName}" for {leadsCount} leads
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
                            {activeAccountsCount}
                        </p>
                        <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>Sending Accounts</p>
                    </div>
                    <div>
                        <p className={cn('text-2xl font-semibold text-orange-500')}>{maxDailyEmails}</p>
                        <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>Max Daily Emails</p>
                    </div>
                    <div>
                        <p className={cn('text-2xl font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                            ~{daysToComplete}
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
                        <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-gray-400')}>Minutes between sends</p>
                    </div>
                    <input
                        type="number"
                        min="1"
                        value={options.timeBetweenEmails || 10}
                        onChange={(e) => {
                            const minutes = parseInt(e.target.value) || 10;
                            onUpdate({ ...options, timeBetweenEmails: minutes });
                        }}
                        className={cn('w-20 px-3 py-2 rounded-lg text-right text-sm font-medium', isDark ? 'bg-neutral-800 border border-neutral-700 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900')}
                        style={{ outline: 'none' }}
                    />
                </div>
            </div>

            {/* Warning if no accounts */}
            {activeAccountsCount === 0 && (
                <div className={cn('p-4 rounded-lg border', isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')}>
                    <p className="text-sm font-medium">No email accounts selected</p>
                    <p className="text-xs mt-1">Go back to Step 2 and select at least one email account.</p>
                </div>
            )}
        </div>
    );
}

