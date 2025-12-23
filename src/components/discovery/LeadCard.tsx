import {
    Building2, Globe, MapPin, Users, ExternalLink, Briefcase,
    TrendingUp, Sparkles, Plus, CheckCircle2, Linkedin
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { DiscoveryLead } from './types';
import { useState } from 'react';

interface LeadCardProps {
    lead: DiscoveryLead;
    index: number;
    onClick?: (lead: DiscoveryLead) => void;
    onAddToCampaign?: (lead: DiscoveryLead) => void;
}

export function LeadCard({ lead, index, onClick, onAddToCampaign }: LeadCardProps) {
    const { theme } = useTheme();
    const [isAdded, setIsAdded] = useState(false);

    // Get confidence color based on score
    const getConfidenceColor = (score: number) => {
        if (score >= 85) return { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-500/10' };
        if (score >= 70) return { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/10' };
        if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-500/10' };
        return { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-500/10' };
    };

    const confidenceColors = getConfidenceColor(lead.confidenceScore);

    // Calculate the circular progress
    const circumference = 2 * Math.PI * 18; // radius = 18
    const progress = ((100 - lead.confidenceScore) / 100) * circumference;

    const handleAddToCampaign = () => {
        setIsAdded(true);
        onAddToCampaign?.(lead);
    };

    return (
        <div
            onClick={() => onClick?.(lead)}
            className={cn(
                'group relative rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer',
                'hover:shadow-xl hover:-translate-y-1',
                theme === 'dark'
                    ? 'bg-gradient-to-br from-[#292a2d] to-[#1f2023] border-[#3c4043] hover:border-[#5f6368]'
                    : 'bg-gradient-to-br from-white to-[#f8f9fa] border-[#dadce0] hover:border-[#1a73e8]/30'
            )}
            style={{
                animationDelay: `${index * 100}ms`,
            }}
        >
            {/* Gradient accent bar at top */}
            <div className={cn(
                'absolute top-0 left-0 right-0 h-1',
                'bg-gradient-to-r from-[#1a73e8] via-[#8ab4f8] to-[#1a73e8]',
                'opacity-0 group-hover:opacity-100 transition-opacity'
            )} />

            {/* Main Content */}
            <div className="p-5">
                {/* Header with Company Name and Confidence */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                                'text-lg font-semibold truncate',
                                theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                            )}>
                                {lead.companyName}
                            </h3>
                            {lead.linkedInUrl && (
                                <a
                                    href={lead.linkedInUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        'p-1 rounded-full transition-colors',
                                        theme === 'dark'
                                            ? 'hover:bg-[#0a66c2]/20 text-[#0a66c2]'
                                            : 'hover:bg-[#0a66c2]/10 text-[#0a66c2]'
                                    )}
                                >
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className={cn(
                                'flex items-center gap-1',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                <Building2 className="w-3.5 h-3.5" />
                                {lead.industry}
                            </span>
                            <span className={cn(
                                'flex items-center gap-1',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                <MapPin className="w-3.5 h-3.5" />
                                {lead.country}
                            </span>
                        </div>
                    </div>

                    {/* Confidence Score Circle */}
                    <div className="relative flex-shrink-0">
                        <svg className="w-14 h-14 transform -rotate-90">
                            <circle
                                cx="28"
                                cy="28"
                                r="18"
                                fill="none"
                                stroke={theme === 'dark' ? '#3c4043' : '#e8eaed'}
                                strokeWidth="3"
                            />
                            <circle
                                cx="28"
                                cy="28"
                                r="18"
                                fill="none"
                                className={confidenceColors.text}
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={progress}
                                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={cn(
                                'text-sm font-bold',
                                confidenceColors.text
                            )}>
                                {lead.confidenceScore}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Company Size and Role */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        theme === 'dark'
                            ? 'bg-[#3c4043] text-[#e8eaed]'
                            : 'bg-[#f1f3f4] text-[#202124]'
                    )}>
                        <Users className="w-3 h-3" />
                        {lead.companySize}
                    </span>
                    <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        theme === 'dark'
                            ? 'bg-[#8ab4f8]/15 text-[#8ab4f8]'
                            : 'bg-[#e8f0fe] text-[#1a73e8]'
                    )}>
                        <Briefcase className="w-3 h-3" />
                        Target: {lead.suggestedRole}
                    </span>
                    <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        confidenceColors.light,
                        confidenceColors.text
                    )}>
                        <TrendingUp className="w-3 h-3" />
                        {lead.confidenceScore >= 85 ? 'Excellent Match' :
                            lead.confidenceScore >= 70 ? 'Strong Match' :
                                lead.confidenceScore >= 50 ? 'Good Match' : 'Potential Match'}
                    </span>
                </div>

                {/* AI Reasoning */}
                <div className={cn(
                    'p-3 rounded-xl mb-4',
                    theme === 'dark' ? 'bg-[#1f2023]' : 'bg-[#f8f9fa]'
                )}>
                    <div className="flex items-start gap-2">
                        <Sparkles className={cn(
                            'w-4 h-4 mt-0.5 flex-shrink-0',
                            theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                        )} />
                        <p className={cn(
                            'text-sm leading-relaxed',
                            theme === 'dark' ? 'text-[#bdc1c6]' : 'text-[#5f6368]'
                        )}>
                            {lead.aiReasoning}
                        </p>
                    </div>
                </div>

                {/* Matched Criteria Tags */}
                {lead.matchedCriteria && lead.matchedCriteria.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {lead.matchedCriteria.slice(0, 4).map((criteria, i) => (
                            <span
                                key={i}
                                className={cn(
                                    'px-2 py-0.5 rounded text-xs',
                                    theme === 'dark'
                                        ? 'bg-[#3c4043] text-[#9aa0a6]'
                                        : 'bg-[#e8eaed] text-[#5f6368]'
                                )}
                            >
                                {criteria}
                            </span>
                        ))}
                        {lead.matchedCriteria.length > 4 && (
                            <span className={cn(
                                'px-2 py-0.5 rounded text-xs',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                +{lead.matchedCriteria.length - 4} more
                            </span>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-dashed"
                    style={{ borderColor: theme === 'dark' ? '#3c4043' : '#e8eaed' }}>
                    <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                            theme === 'dark'
                                ? 'bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368]'
                                : 'bg-[#f1f3f4] text-[#202124] hover:bg-[#e8eaed]'
                        )}
                    >
                        <Globe className="w-4 h-4" />
                        Visit Website
                        <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                        onClick={handleAddToCampaign}
                        disabled={isAdded}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                            isAdded
                                ? theme === 'dark'
                                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                    : 'bg-emerald-500/10 text-emerald-600 cursor-default'
                                : theme === 'dark'
                                    ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]'
                                    : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                        )}
                    >
                        {isAdded ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Added
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Add to Campaign
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Found on Platform Badge */}
            <div className={cn(
                'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
                theme === 'dark'
                    ? 'bg-[#3c4043] text-[#9aa0a6]'
                    : 'bg-[#e8eaed] text-[#5f6368]'
            )}>
                via {lead.foundOnPlatform}
            </div>
        </div>
    );
}
