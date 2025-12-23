import { useState, useRef, useEffect } from 'react';
import {
    Search, Sparkles, Target, RotateCcw, Download, ChevronRight,
    Lightbulb, TrendingUp, Zap, ArrowRight, Filter, X, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { ScrollArea } from '../ui/ScrollArea';
import { DiscoveryFilters } from './DiscoveryFilters';
import { LeadCard } from './LeadCard';
import { LeadDetail } from './LeadDetail';
import { DiscoveryProgress } from './DiscoveryProgress';
import {
    DiscoveryFilters as FiltersType,
    DiscoveryLead,
    Employee,
    DEFAULT_FILTERS,
} from './types';

const API_BASE = '/api/discovery';

// Example prompts to inspire users
const EXAMPLE_PROMPTS = [
    "I want to sell AI automation services to mid-size e-commerce companies in the UK and Europe.",
    "Looking for SaaS startups in the US that need marketing automation solutions.",
    "Find healthcare tech companies in Germany that might benefit from our data analytics platform.",
    "Target fintech companies in London with 50-200 employees for our compliance software.",
];

export function LeadDiscovery() {
    const { theme } = useTheme();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // State
    const [prompt, setPrompt] = useState('');
    const [filters, setFilters] = useState<FiltersType>(DEFAULT_FILTERS);
    const [isSearching, setIsSearching] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [leads, setLeads] = useState<DiscoveryLead[]>([]);
    const [searchSummary, setSearchSummary] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [processingTime, setProcessingTime] = useState(0);
    const [totalEvaluated, setTotalEvaluated] = useState(0);
    const [selectedLead, setSelectedLead] = useState<DiscoveryLead | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [prompt]);

    // Simulate step progression during search
    useEffect(() => {
        if (!isSearching) return;

        const stepDurations = [2000, 3000, 2500, 1500]; // ms per step
        let currentStepIndex = 0;

        const progressSteps = () => {
            if (currentStepIndex < 4) {
                setCurrentStep(currentStepIndex + 1);
                currentStepIndex++;
                if (currentStepIndex < 4) {
                    setTimeout(progressSteps, stepDurations[currentStepIndex]);
                }
            }
        };

        setTimeout(progressSteps, stepDurations[0]);
    }, [isSearching]);

    const handleSearch = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter a search prompt to find leads');
            return;
        }

        setIsSearching(true);
        setCurrentStep(1);
        setLeads([]);
        setHasSearched(true);

        const startTime = Date.now();

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    prompt,
                    filters,
                }),
            });

            if (!response.ok) {
                throw new Error('Discovery search failed');
            }

            const data = await response.json();

            // Small delay to let the animation complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            setLeads(data.leads || []);
            setSearchSummary(data.searchSummary || '');
            setProcessingTime(data.processingTime || Math.round((Date.now() - startTime) / 1000));
            setTotalEvaluated(data.totalCandidatesEvaluated || 0);

            if (data.leads?.length > 0) {
                toast.success(`Found ${data.leads.length} high-quality leads!`);
            } else {
                toast.info('No matching leads found. Try adjusting your criteria.');
            }
        } catch (error) {
            console.error('Discovery error:', error);
            toast.error('Failed to search for leads. Please try again.');
        } finally {
            setIsSearching(false);
            setCurrentStep(0);
        }
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        toast.success('Filters cleared');
    };

    const handleReset = () => {
        setPrompt('');
        setFilters(DEFAULT_FILTERS);
        setLeads([]);
        setHasSearched(false);
        setSearchSummary('');
    };

    const handleExportLeads = () => {
        if (leads.length === 0) return;

        const csvContent = [
            ['Company Name', 'Website', 'Industry', 'Country', 'Size', 'Target Role', 'Confidence Score', 'AI Reasoning'].join(','),
            ...leads.map(lead => [
                `"${lead.companyName}"`,
                lead.website,
                lead.industry,
                lead.country,
                lead.companySize,
                lead.suggestedRole,
                lead.confidenceScore,
                `"${lead.aiReasoning.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `discovery-leads-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('Leads exported successfully!');
    };

    const handleAddToCampaign = (lead: DiscoveryLead) => {
        // TODO: Implement campaign integration
        toast.success(`${lead.companyName} added to campaign!`);
    };

    const useExamplePrompt = (examplePrompt: string) => {
        setPrompt(examplePrompt);
        textareaRef.current?.focus();
    };

    const activeFilterCount =
        filters.industry.length +
        filters.region.length +
        filters.companySize.length +
        filters.targetRole.length +
        (filters.techMaturity ? 1 : 0) +
        (filters.platforms.length !== 3 ? 1 : 0);

    return (
        <>
            <div className="flex h-full">
                {/* Left Panel - Filters (Collapsible) */}
                {showFilters && (
                    <div className={cn(
                        'w-80 flex-shrink-0 border-r overflow-hidden',
                        theme === 'dark' ? 'border-[#3c4043]' : 'border-[#e8eaed]'
                    )}>
                        <ScrollArea className="h-full">
                            <div className="p-4">
                                <DiscoveryFilters
                                    filters={filters}
                                    onChange={setFilters}
                                    onClear={handleClearFilters}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className={cn(
                        'flex-shrink-0 px-6 py-5 border-b',
                        theme === 'dark' ? 'border-[#3c4043]' : 'border-[#e8eaed]'
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center',
                                    'bg-gradient-to-br from-[#1a73e8] to-[#8ab4f8]'
                                )}>
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className={cn(
                                        'text-xl font-semibold',
                                        theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                    )}>
                                        AI Sales Discovery
                                    </h1>
                                    <p className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                    )}>
                                        Find your ideal clients with AI-powered research
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Toggle Filters */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        showFilters
                                            ? theme === 'dark'
                                                ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]'
                                                : 'bg-[#e8f0fe] text-[#1a73e8]'
                                            : theme === 'dark'
                                                ? 'text-[#9aa0a6] hover:bg-[#3c4043]'
                                                : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                                    )}
                                >
                                    <Filter className="w-4 h-4" />
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <span className={cn(
                                            'px-1.5 py-0.5 rounded-full text-xs',
                                            theme === 'dark'
                                                ? 'bg-[#8ab4f8] text-[#202124]'
                                                : 'bg-[#1a73e8] text-white'
                                        )}>
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                {hasSearched && leads.length > 0 && (
                                    <>
                                        <button
                                            onClick={handleExportLeads}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                                theme === 'dark'
                                                    ? 'text-[#9aa0a6] hover:bg-[#3c4043]'
                                                    : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                                            )}
                                        >
                                            <Download className="w-4 h-4" />
                                            Export
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                                theme === 'dark'
                                                    ? 'text-[#9aa0a6] hover:bg-[#3c4043]'
                                                    : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                                            )}
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            New Search
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className={cn(
                            'relative rounded-2xl border-2 transition-all overflow-hidden',
                            theme === 'dark'
                                ? 'bg-[#292a2d] border-[#3c4043] focus-within:border-[#8ab4f8]'
                                : 'bg-white border-[#dadce0] focus-within:border-[#1a73e8] focus-within:shadow-lg'
                        )}>
                            <div className="flex items-start gap-3 p-4">
                                <Sparkles className={cn(
                                    'w-5 h-5 mt-1 flex-shrink-0',
                                    theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                )} />
                                <textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe your ideal customers... e.g., 'I want to sell AI automation services to mid-size e-commerce companies in the UK and Europe'"
                                    className={cn(
                                        'flex-1 resize-none border-0 bg-transparent outline-none text-sm leading-relaxed min-h-[24px]',
                                        theme === 'dark'
                                            ? 'text-[#e8eaed] placeholder:text-[#9aa0a6]'
                                            : 'text-[#202124] placeholder:text-[#5f6368]'
                                    )}
                                    rows={1}
                                    disabled={isSearching}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSearch();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching || !prompt.trim()}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                        theme === 'dark'
                                            ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]'
                                            : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                                    )}
                                >
                                    {isSearching ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            Discover Leads
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Example prompts */}
                            {!hasSearched && !isSearching && (
                                <div className={cn(
                                    'px-4 pb-4 pt-2 border-t',
                                    theme === 'dark' ? 'border-[#3c4043]' : 'border-[#f1f3f4]'
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb className={cn(
                                            'w-3.5 h-3.5',
                                            theme === 'dark' ? 'text-[#f9ab00]' : 'text-[#ea8600]'
                                        )} />
                                        <span className={cn(
                                            'text-xs font-medium',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            Try these examples:
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {EXAMPLE_PROMPTS.map((example, i) => (
                                            <button
                                                key={i}
                                                onClick={() => useExamplePrompt(example)}
                                                className={cn(
                                                    'text-xs px-3 py-1.5 rounded-full transition-colors truncate max-w-[300px]',
                                                    theme === 'dark'
                                                        ? 'bg-[#3c4043] text-[#bdc1c6] hover:bg-[#5f6368]'
                                                        : 'bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]'
                                                )}
                                            >
                                                {example.slice(0, 50)}...
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Area */}
                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {/* Processing State - centered card */}
                            {isSearching && (
                                <div className="flex justify-center">
                                    <div className="w-full max-w-xl">
                                        <DiscoveryProgress
                                            isActive={isSearching}
                                            currentStep={currentStep}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Results */}
                            {!isSearching && hasSearched && (
                                <>
                                    {/* Search Summary */}
                                    {searchSummary && (
                                        <div className={cn(
                                            'mb-6 p-4 rounded-xl border',
                                            theme === 'dark'
                                                ? 'bg-[#292a2d] border-[#3c4043]'
                                                : 'bg-[#f8f9fa] border-[#e8eaed]'
                                        )}>
                                            <div className="flex items-start gap-3">
                                                <Sparkles className={cn(
                                                    'w-5 h-5 mt-0.5',
                                                    theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                                )} />
                                                <div>
                                                    <p className={cn(
                                                        'text-sm',
                                                        theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                                    )}>
                                                        {searchSummary}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className={cn(
                                                            'text-xs',
                                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                                        )}>
                                                            <TrendingUp className="w-3 h-3 inline mr-1" />
                                                            {totalEvaluated} companies evaluated
                                                        </span>
                                                        <span className={cn(
                                                            'text-xs',
                                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                                        )}>
                                                            <Zap className="w-3 h-3 inline mr-1" />
                                                            {processingTime}s processing time
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lead Cards */}
                                    {leads.length > 0 ? (
                                        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                                            {leads.map((lead, index) => (
                                                <LeadCard
                                                    key={lead.id}
                                                    lead={lead}
                                                    index={index}
                                                    onClick={setSelectedLead}
                                                    onAddToCampaign={handleAddToCampaign}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <div className={cn(
                                                'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
                                                theme === 'dark' ? 'bg-[#3c4043]' : 'bg-[#f1f3f4]'
                                            )}>
                                                <Search className={cn(
                                                    'w-8 h-8',
                                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                                )} />
                                            </div>
                                            <h3 className={cn(
                                                'text-lg font-medium mb-2',
                                                theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                            )}>
                                                No matching leads found
                                            </h3>
                                            <p className={cn(
                                                'text-sm',
                                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                            )}>
                                                Try adjusting your search criteria or broadening your filters to find more potential matches.
                                            </p>
                                            <button
                                                onClick={handleReset}
                                                className={cn(
                                                    'mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                                    theme === 'dark'
                                                        ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]'
                                                        : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                                                )}
                                            >
                                                Start New Search
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Empty State - First Visit */}
                            {!isSearching && !hasSearched && (
                                <div className="w-full text-center py-12">
                                    <div className={cn(
                                        'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center',
                                        'bg-gradient-to-br from-[#1a73e8] to-[#8ab4f8]'
                                    )}>
                                        <Target className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className={cn(
                                        'text-2xl font-semibold mb-3',
                                        theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                    )}>
                                        Discover Your Ideal Clients
                                    </h2>
                                    <p className={cn(
                                        'text-sm mb-8 max-w-md mx-auto',
                                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                    )}>
                                        Describe your ideal customer in natural language, and our AI will find the top 5
                                        best-matching companies with detailed explanations of why they're a great fit.
                                    </p>

                                    {/* Feature highlights */}
                                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                                        {[
                                            {
                                                icon: Sparkles,
                                                title: 'AI-Powered Research',
                                                desc: 'Natural language understanding'
                                            },
                                            {
                                                icon: TrendingUp,
                                                title: 'Smart Scoring',
                                                desc: 'Confidence-based ranking'
                                            },
                                            {
                                                icon: Zap,
                                                title: 'Explainable Results',
                                                desc: 'Know why each lead fits'
                                            }
                                        ].map((feature, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    'p-4 rounded-xl border',
                                                    theme === 'dark'
                                                        ? 'bg-[#292a2d] border-[#3c4043]'
                                                        : 'bg-white border-[#e8eaed]'
                                                )}
                                            >
                                                <feature.icon className={cn(
                                                    'w-6 h-6 mx-auto mb-2',
                                                    theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                                )} />
                                                <h4 className={cn(
                                                    'text-sm font-medium mb-1',
                                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                                )}>
                                                    {feature.title}
                                                </h4>
                                                <p className={cn(
                                                    'text-xs',
                                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                                )}>
                                                    {feature.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                        <ArrowRight className={cn(
                                            'w-4 h-4',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )} />
                                        <span className={cn(
                                            'text-sm',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            Enter a prompt above to get started
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <LeadDetail
                    lead={selectedLead}
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onAddToCampaign={(lead, employees) => {
                        toast.success(`Added ${employees.length} contacts from ${lead.companyName} to campaign!`);
                        setSelectedLead(null);
                    }}
                />
            )}
        </>
    );
}
