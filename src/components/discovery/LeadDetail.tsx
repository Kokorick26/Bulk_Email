import { useState, useEffect } from 'react';
import {
    X, Building2, Globe, MapPin, Users, ExternalLink, Briefcase,
    Mail, Linkedin, UserCircle, Loader2, RefreshCw, Copy, Check,
    Sparkles, Shield, AlertCircle, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { DiscoveryLead, Employee } from './types';
import { toast } from 'sonner';

interface LeadDetailProps {
    lead: DiscoveryLead;
    isOpen: boolean;
    onClose: () => void;
    onAddToCampaign?: (lead: DiscoveryLead, selectedEmployees: Employee[]) => void;
}

export function LeadDetail({ lead, isOpen, onClose, onAddToCampaign }: LeadDetailProps) {
    const { theme } = useTheme();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<'employees' | 'details' | null>('employees');

    // Fetch employees when modal opens
    useEffect(() => {
        if (isOpen && lead) {
            fetchEmployees();
        }
    }, [isOpen, lead?.id]);

    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/discovery/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    companyName: lead.companyName,
                    website: lead.website,
                    industry: lead.industry,
                    targetRole: lead.suggestedRole,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }

            const data = await response.json();
            setEmployees(data.employees || []);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError('Unable to fetch employee data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        toast.success('Email copied to clipboard!');
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const toggleEmployee = (employeeId: string) => {
        const newSelected = new Set(selectedEmployees);
        if (newSelected.has(employeeId)) {
            newSelected.delete(employeeId);
        } else {
            newSelected.add(employeeId);
        }
        setSelectedEmployees(newSelected);
    };

    const selectAll = () => {
        if (selectedEmployees.size === employees.length) {
            setSelectedEmployees(new Set());
        } else {
            setSelectedEmployees(new Set(employees.map(e => e.id)));
        }
    };

    const handleAddToCampaign = () => {
        const selected = employees.filter(e => selectedEmployees.has(e.id));
        onAddToCampaign?.(lead, selected);
        toast.success(`Added ${selected.length} contacts to campaign!`);
    };

    const getConfidenceBadge = (confidence?: string) => {
        switch (confidence) {
            case 'verified':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                        <Shield className="w-3 h-3" /> Verified
                    </span>
                );
            case 'likely':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                        <Check className="w-3 h-3" /> Likely
                    </span>
                );
            case 'pattern':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
                        <AlertCircle className="w-3 h-3" /> Pattern
                    </span>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={cn(
                'fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[900px] md:max-w-[90vw]',
                'z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden',
                theme === 'dark' ? 'bg-[#202124]' : 'bg-white'
            )}>
                {/* Header */}
                <div className={cn(
                    'flex-shrink-0 px-6 py-4 border-b',
                    theme === 'dark' ? 'border-[#3c4043]' : 'border-[#e8eaed]'
                )}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            {/* Company Logo Placeholder */}
                            <div className={cn(
                                'w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold',
                                'bg-gradient-to-br from-[#1a73e8] to-[#8ab4f8] text-white'
                            )}>
                                {lead.companyName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className={cn(
                                        'text-xl font-semibold',
                                        theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                    )}>
                                        {lead.companyName}
                                    </h2>
                                    <a
                                        href={lead.linkedInUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-full hover:bg-[#0a66c2]/20 text-[#0a66c2]"
                                    >
                                        <Linkedin className="w-4 h-4" />
                                    </a>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm">
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
                                    <span className={cn(
                                        'flex items-center gap-1',
                                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                    )}>
                                        <Users className="w-3.5 h-3.5" />
                                        {lead.companySize}
                                    </span>
                                </div>
                                <a
                                    href={lead.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        'inline-flex items-center gap-1 mt-2 text-sm',
                                        theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                    )}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    {lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                theme === 'dark'
                                    ? 'hover:bg-[#3c4043] text-[#9aa0a6]'
                                    : 'hover:bg-[#f1f3f4] text-[#5f6368]'
                            )}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* AI Insight */}
                    <div className={cn(
                        'mx-6 mt-4 p-4 rounded-xl',
                        theme === 'dark' ? 'bg-[#292a2d]' : 'bg-[#f8f9fa]'
                    )}>
                        <div className="flex items-start gap-2">
                            <Sparkles className={cn(
                                'w-4 h-4 mt-0.5 flex-shrink-0',
                                theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                            )} />
                            <div>
                                <p className={cn(
                                    'text-sm font-medium mb-1',
                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                )}>
                                    Why {lead.companyName} is a good fit:
                                </p>
                                <p className={cn(
                                    'text-sm',
                                    theme === 'dark' ? 'text-[#bdc1c6]' : 'text-[#5f6368]'
                                )}>
                                    {lead.aiReasoning}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Employees Section */}
                    <div className="px-6 py-4">
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'employees' ? null : 'employees')}
                            className={cn(
                                'w-full flex items-center justify-between py-3',
                                theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <UserCircle className="w-5 h-5" />
                                <span className="font-semibold">Key Contacts</span>
                                {employees.length > 0 && (
                                    <span className={cn(
                                        'px-2 py-0.5 rounded-full text-xs',
                                        theme === 'dark' ? 'bg-[#3c4043]' : 'bg-[#e8eaed]'
                                    )}>
                                        {employees.length} found
                                    </span>
                                )}
                            </div>
                            {expandedSection === 'employees' ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </button>

                        {expandedSection === 'employees' && (
                            <div className="mt-2">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <Loader2 className={cn(
                                                'w-8 h-8 animate-spin mx-auto mb-3',
                                                theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                            )} />
                                            <p className={cn(
                                                'text-sm',
                                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                            )}>
                                                Discovering contacts at {lead.companyName}...
                                            </p>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className={cn(
                                            'w-10 h-10 mx-auto mb-3',
                                            theme === 'dark' ? 'text-[#f28b82]' : 'text-red-500'
                                        )} />
                                        <p className={cn(
                                            'text-sm mb-3',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            {error}
                                        </p>
                                        <button
                                            onClick={fetchEmployees}
                                            className={cn(
                                                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                                                theme === 'dark'
                                                    ? 'bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368]'
                                                    : 'bg-[#f1f3f4] text-[#202124] hover:bg-[#e8eaed]'
                                            )}
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Try Again
                                        </button>
                                    </div>
                                ) : employees.length === 0 ? (
                                    <div className="text-center py-8">
                                        <UserCircle className={cn(
                                            'w-10 h-10 mx-auto mb-3',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )} />
                                        <p className={cn(
                                            'text-sm font-medium mb-2',
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>
                                            No public contacts found
                                        </p>
                                        <p className={cn(
                                            'text-xs mb-4',
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>
                                            We couldn't find team information on their website or LinkedIn.
                                            Try visiting their site directly.
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <a
                                                href={`${lead.website}/about`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={cn(
                                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                                                    theme === 'dark'
                                                        ? 'bg-[#3c4043] text-[#8ab4f8] hover:bg-[#5f6368]'
                                                        : 'bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]'
                                                )}
                                            >
                                                <Globe className="w-3 h-3" />
                                                Visit About Page
                                            </a>
                                            <button
                                                onClick={fetchEmployees}
                                                className={cn(
                                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                                                    theme === 'dark'
                                                        ? 'bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368]'
                                                        : 'bg-[#f1f3f4] text-[#202124] hover:bg-[#e8eaed]'
                                                )}
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Select All */}
                                        <div className={cn(
                                            'flex items-center justify-between px-3 py-2 rounded-lg mb-2',
                                            theme === 'dark' ? 'bg-[#292a2d]' : 'bg-[#f1f3f4]'
                                        )}>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmployees.size === employees.length}
                                                    onChange={selectAll}
                                                    className="w-4 h-4 rounded"
                                                />
                                                <span className={cn(
                                                    'text-sm font-medium',
                                                    theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                                )}>
                                                    Select All ({employees.length})
                                                </span>
                                            </label>
                                            {selectedEmployees.size > 0 && (
                                                <span className={cn(
                                                    'text-xs',
                                                    theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                                )}>
                                                    {selectedEmployees.size} selected
                                                </span>
                                            )}
                                        </div>

                                        {/* Employee List */}
                                        <div className="space-y-2">
                                            {employees.map((employee) => (
                                                <div
                                                    key={employee.id}
                                                    className={cn(
                                                        'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                                                        selectedEmployees.has(employee.id)
                                                            ? theme === 'dark'
                                                                ? 'bg-[#8ab4f8]/10 border-[#8ab4f8]/30'
                                                                : 'bg-[#e8f0fe] border-[#1a73e8]/30'
                                                            : theme === 'dark'
                                                                ? 'bg-[#292a2d] border-[#3c4043] hover:border-[#5f6368]'
                                                                : 'bg-white border-[#e8eaed] hover:border-[#dadce0]'
                                                    )}
                                                    onClick={() => toggleEmployee(employee.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployees.has(employee.id)}
                                                        onChange={() => { }}
                                                        className="w-4 h-4 rounded flex-shrink-0"
                                                    />

                                                    {/* Avatar */}
                                                    <div className={cn(
                                                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                                                        theme === 'dark'
                                                            ? 'bg-[#3c4043] text-[#e8eaed]'
                                                            : 'bg-[#e8eaed] text-[#202124]'
                                                    )}>
                                                        {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                'font-medium truncate',
                                                                theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                                            )}>
                                                                {employee.name}
                                                            </span>
                                                            {employee.linkedInUrl && (
                                                                <a
                                                                    href={employee.linkedInUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-[#0a66c2] hover:underline"
                                                                >
                                                                    <Linkedin className="w-3.5 h-3.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className={cn(
                                                            'text-sm truncate',
                                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                                        )}>
                                                            <Briefcase className="w-3 h-3 inline mr-1" />
                                                            {employee.role}
                                                        </div>
                                                    </div>

                                                    {/* Email */}
                                                    {employee.email && (
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {getConfidenceBadge(employee.emailConfidence)}
                                                            <div className={cn(
                                                                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm',
                                                                theme === 'dark'
                                                                    ? 'bg-[#3c4043] text-[#e8eaed]'
                                                                    : 'bg-[#f1f3f4] text-[#202124]'
                                                            )}>
                                                                <Mail className="w-3.5 h-3.5" />
                                                                <span className="max-w-[200px] truncate">
                                                                    {employee.email}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    copyEmail(employee.email!);
                                                                }}
                                                                className={cn(
                                                                    'p-2 rounded-lg transition-colors',
                                                                    copiedEmail === employee.email
                                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                                        : theme === 'dark'
                                                                            ? 'hover:bg-[#3c4043] text-[#9aa0a6]'
                                                                            : 'hover:bg-[#e8eaed] text-[#5f6368]'
                                                                )}
                                                            >
                                                                {copiedEmail === employee.email ? (
                                                                    <Check className="w-4 h-4" />
                                                                ) : (
                                                                    <Copy className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={cn(
                    'flex-shrink-0 px-6 py-4 border-t',
                    theme === 'dark' ? 'border-[#3c4043] bg-[#292a2d]' : 'border-[#e8eaed] bg-[#f8f9fa]'
                )}>
                    <div className="flex items-center justify-between">
                        <div className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            {selectedEmployees.size > 0 ? (
                                <span>{selectedEmployees.size} contact{selectedEmployees.size !== 1 ? 's' : ''} selected</span>
                            ) : (
                                <span>Select contacts to add to campaign</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    theme === 'dark'
                                        ? 'text-[#e8eaed] hover:bg-[#3c4043]'
                                        : 'text-[#202124] hover:bg-[#e8eaed]'
                                )}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleAddToCampaign}
                                disabled={selectedEmployees.size === 0}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                    theme === 'dark'
                                        ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]'
                                        : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                                )}
                            >
                                <Send className="w-4 h-4" />
                                Add to Campaign
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
