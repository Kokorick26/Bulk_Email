import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileSpreadsheet, X, Check, AlertCircle,
    Users, Loader2, Trash2, Eye, ChevronDown, Ban,
    Mail, User, Building, Hash, Clock, Plus, Edit3, FolderOpen, ExternalLink, ArrowLeft
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import { ScrollArea } from '../../ui/ScrollArea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/Table';
import { LeadBuilder } from '../LeadBuilder';
import type { Lead, ColumnMapping } from '../types';

// Email log entry from the backend
interface EmailLog {
    id: string;
    campaignId: string;
    email: string;
    recipientName?: string;
    status: 'sent' | 'failed' | 'opened' | 'clicked' | 'replied';
    sentAt: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    messageId?: string;
    stepIndex?: number;
    error?: string;
}

interface LeadsTabProps {
    campaignId: string;
    leads: Lead[];
    onLeadsUpdate: (leads: Lead[]) => void;
    className?: string;
}

// Field type options for column mapping
const fieldTypes = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'firstName', label: 'First Name', icon: User },
    { id: 'lastName', label: 'Last Name', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'timezone', label: 'Timezone', icon: Building },           // e.g., "America/New_York"
    { id: 'country', label: 'Country', icon: Building },             // For timezone inference
    { id: 'workingHoursStart', label: 'Working Hours Start', icon: Hash }, // e.g., "09:00"
    { id: 'workingHoursEnd', label: 'Working Hours End', icon: Hash },     // e.g., "18:00"
    { id: 'custom', label: 'Custom Field', icon: Hash },
    { id: 'ignore', label: 'Do not import', icon: Ban },
];

// Helper function to convert 12-hour time format to 24-hour format
const convertTo24Hour = (time: string): string | null => {
    if (!time) return null;

    // Already in 24h format (e.g., "09:00", "14:30")
    if (/^\d{1,2}:\d{2}$/.test(time)) {
        const [h, m] = time.split(':');
        return `${h.padStart(2, '0')}:${m}`;
    }

    // 12h format with AM/PM (e.g., "9:00 AM", "2:30 PM")
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return null;
};

export function LeadsTab({ campaignId, leads, onLeadsUpdate, className }: LeadsTabProps) {
    const { theme } = useTheme();
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMapping, setShowMapping] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
    const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);

    // Duplicate checking options
    const [checkDuplicates, setCheckDuplicates] = useState({
        campaigns: true,
        lists: true,
        workspace: true
    });
    const [verifyLeads, setVerifyLeads] = useState(false);
    const [showLeadBuilder, setShowLeadBuilder] = useState(false);

    // Lead Lists import state
    const [showLeadListsModal, setShowLeadListsModal] = useState(false);
    const [leadLists, setLeadLists] = useState<Array<{ id: string; name: string; leads: Lead[]; description?: string }>>([]);
    const [loadingLeadLists, setLoadingLeadLists] = useState(false);

    // SMTP Accounts for sending account selection
    interface SmtpAccount {
        id: string;
        name: string;
        fromEmail: string;
    }
    const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);

    // Email logs state for viewing sent emails
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Scheduled email preview/edit state
    const [showScheduledPreview, setShowScheduledPreview] = useState(false);
    const [selectedScheduledLead, setSelectedScheduledLead] = useState<Lead | null>(null);
    const [editableSubject, setEditableSubject] = useState('');
    const [editableBody, setEditableBody] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [savingCustomEmail, setSavingCustomEmail] = useState(false);
    const [campaignSequence, setCampaignSequence] = useState<{ steps?: Array<{ subject?: string; body?: string; variants?: Array<{ subject?: string; body?: string }> }> } | null>(null);

    // Fetch SMTP accounts on mount
    const fetchSmtpAccounts = useCallback(async () => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch('/api/bulk-email/smtp-accounts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSmtpAccounts(data);
            }
        } catch (err) {
            console.error('Failed to fetch SMTP accounts:', err);
        }
    }, []);

    // Fetch email logs for this campaign
    const fetchEmailLogs = useCallback(async () => {
        if (!campaignId) return;
        setLoadingLogs(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmailLogs(data.logs || []);
            }
        } catch (err) {
            console.error('Failed to fetch email logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    }, [campaignId]);

    // Fetch campaign sequence for email preview
    const fetchCampaignSequence = useCallback(async () => {
        if (!campaignId) return;
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCampaignSequence(data.sequence || null);
            }
        } catch (err) {
            console.error('Failed to fetch campaign sequence:', err);
        }
    }, [campaignId]);

    useEffect(() => {
        fetchSmtpAccounts();
        fetchEmailLogs();
        fetchCampaignSequence();
    }, [fetchSmtpAccounts, fetchEmailLogs, fetchCampaignSequence]);

    // Auto-refresh campaign data every 10 seconds to update lead statuses
    useEffect(() => {
        if (!campaignId) return;

        const refreshCampaignData = async () => {
            try {
                const token = localStorage.getItem('bulkEmailToken');
                const response = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.leads && Array.isArray(data.leads)) {
                        // Update leads with latest status from backend
                        onLeadsUpdate(data.leads);
                    }
                }
            } catch (error) {
                // Silently fail - don't spam console
            }
        };

        // Refresh every 10 seconds
        const interval = setInterval(refreshCampaignData, 10000);

        return () => clearInterval(interval);
    }, [campaignId, onLeadsUpdate]);

    // Personalize email content with lead data
    const personalizeContent = (content: string, lead: Lead): string => {
        if (!content) return '';
        let personalized = content;

        // Replace common variables
        personalized = personalized.replace(/\{\{firstName\}\}/gi, lead.firstName || '');
        personalized = personalized.replace(/\{\{lastName\}\}/gi, lead.lastName || '');
        personalized = personalized.replace(/\{\{email\}\}/gi, lead.email || '');
        personalized = personalized.replace(/\{\{company\}\}/gi, lead.company || '');
        personalized = personalized.replace(/\{\{name\}\}/gi,
            lead.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : lead.email.split('@')[0]
        );

        // Replace any other {{variable}} patterns with lead data
        const variablePattern = /\{\{(\w+)\}\}/g;
        personalized = personalized.replace(variablePattern, (match, key) => {
            return (lead as any)[key] || match;
        });

        return personalized;
    };

    // Open scheduled email preview
    const openScheduledEmailPreview = (lead: Lead) => {
        setSelectedScheduledLead(lead);

        // Get the first step of the sequence (for pending leads, they're at step 0)
        const step = campaignSequence?.steps?.[0];
        if (step) {
            // Use the first variant or the main step content
            const variant = step.variants?.[0] || step;
            const subject = personalizeContent(variant.subject || step.subject || '', lead);
            const body = personalizeContent(variant.body || step.body || '', lead);
            setEditableSubject(subject);
            setEditableBody(body);
        } else {
            setEditableSubject('');
            setEditableBody('');
        }

        setIsEditMode(false);
        setShowScheduledPreview(true);
    };

    // Save custom email for a lead
    const saveCustomEmail = async () => {
        if (!selectedScheduledLead) return;
        setSavingCustomEmail(true);

        try {
            // Update the lead with custom email content
            const updatedLeads = leads.map(l => {
                if (l.id === selectedScheduledLead.id) {
                    return {
                        ...l,
                        customSubject: editableSubject,
                        customBody: editableBody
                    };
                }
                return l;
            });

            // Save to backend
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/leads`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ leads: updatedLeads })
            });

            onLeadsUpdate(updatedLeads);
            setIsEditMode(false);
            setShowScheduledPreview(false);
            setSelectedScheduledLead(null);
        } catch (err) {
            console.error('Failed to save custom email:', err);
        } finally {
            setSavingCustomEmail(false);
        }
    };

    // Get email logs for a specific lead
    const getLogsForLead = (leadEmail: string) => {
        return emailLogs.filter(log => log.email.toLowerCase() === leadEmail.toLowerCase())
            .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    };

    // Format sent timestamp
    const formatSentTime = (sentAt: string): string => {
        const date = new Date(sentAt);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const diffMins = Math.floor(diff / (1000 * 60));
        const diffHours = Math.floor(diff / (1000 * 60 * 60));
        const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Fetch lead lists
    const fetchLeadLists = async () => {
        setLoadingLeadLists(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/bulk-email/lead-lists', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLeadLists(data.lists || []);
            }
        } catch (err) {
            console.error('Error fetching lead lists:', err);
        } finally {
            setLoadingLeadLists(false);
        }
    };

    // Import leads from a lead list
    const importFromLeadList = (list: { id: string; name: string; leads: Lead[] }) => {
        if (list.leads.length === 0) {
            alert('This list has no leads to import.');
            return;
        }

        // Merge leads (avoid duplicates by email)
        const existingEmails = new Set(leads.map(l => l.email.toLowerCase()));
        const newLeads = list.leads.filter(l => l.email && !existingEmails.has(l.email.toLowerCase()));
        const mergedLeads = [...leads, ...newLeads];

        onLeadsUpdate(mergedLeads);
        saveCampaignLeads(mergedLeads);
        setShowLeadListsModal(false);

        alert(`Imported ${newLeads.length} leads from "${list.name}"!`);
    };

    // Save leads to campaign
    const saveCampaignLeads = async (leadsToSave: Lead[]) => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/leads`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ leads: leadsToSave })
            });
        } catch (err) {
            console.error('Error saving leads:', err);
        }
    };

    const parseCSV = (text: string): { headers: string[]; data: Record<string, string>[] } => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) throw new Error('Empty CSV file');

        const headerLine = lines[0];
        const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

        const data: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const row: Record<string, string> = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx]?.trim() || '';
            });
            data.push(row);
        }

        return { headers, data };
    };

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^["']|["']$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        return result;
    };

    const guessFieldType = (columnName: string, samples: string[]): ColumnMapping['fieldType'] => {
        const lowerName = columnName.toLowerCase();

        if (lowerName.includes('email') || lowerName === 'e-mail') return 'email';
        if (lowerName.includes('first') || lowerName === 'fname') return 'firstName';
        if (lowerName.includes('last') || lowerName === 'lname' || lowerName === 'surname') return 'lastName';
        if (lowerName.includes('company') || lowerName.includes('organization') || lowerName === 'org') return 'company';
        if (lowerName === 'name' || lowerName === 'full name' || lowerName === 'fullname') return 'firstName';

        // Timezone detection
        if (lowerName.includes('timezone') || lowerName === 'tz' || lowerName === 'time zone' || lowerName === 'time_zone') return 'timezone';

        // Country detection (for timezone inference)
        if (lowerName === 'country' || lowerName.includes('country') || lowerName === 'location' || lowerName === 'region') return 'country';

        // Working hours detection
        if (lowerName.includes('working') && lowerName.includes('start') || lowerName === 'start_time' || lowerName === 'work_start') return 'workingHoursStart';
        if (lowerName.includes('working') && lowerName.includes('end') || lowerName === 'end_time' || lowerName === 'work_end') return 'workingHoursEnd';

        // Check if samples look like emails
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (samples.some(s => emailPattern.test(s))) return 'email';

        // Check if samples look like timezones (e.g., "America/New_York", "UTC", "EST")
        const timezonePattern = /^[A-Z][a-z]+\/[A-Z][a-z_]+$|^UTC$|^[A-Z]{2,4}$/;
        if (samples.some(s => timezonePattern.test(s))) return 'timezone';

        // Check if samples look like time (e.g., "09:00", "9:00 AM")
        const timePattern = /^\d{1,2}:\d{2}(\s?(AM|PM))?$/i;
        if (samples.some(s => timePattern.test(s))) {
            if (lowerName.includes('start') || lowerName.includes('from')) return 'workingHoursStart';
            if (lowerName.includes('end') || lowerName.includes('to')) return 'workingHoursEnd';
        }

        return 'ignore';
    };

    const handleFile = async (file: File) => {
        setLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const { headers, data } = parseCSV(text);

            // Create initial column mappings with auto-detection
            const mappings: ColumnMapping[] = headers.map(header => {
                const samples = data.slice(0, 4).map(row => row[header] || '');
                return {
                    columnName: header,
                    fieldType: guessFieldType(header, samples),
                    samples
                };
            });

            setUploadedFile({ name: file.name, size: file.size });
            setColumnMappings(mappings);
            setParsedData(data);
            setShowMapping(true);
        } catch (err: any) {
            setError(err.message || 'Failed to parse CSV');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            handleFile(file);
        } else {
            setError('Please upload a CSV file');
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const updateColumnMapping = (index: number, fieldType: ColumnMapping['fieldType']) => {
        setColumnMappings(prev => prev.map((mapping, i) =>
            i === index ? { ...mapping, fieldType } : mapping
        ));
    };

    const handleImportLeads = async () => {
        // Country to timezone mapping for inference when timezone is not provided
        const countryToTimezone: Record<string, string> = {
            'usa': 'America/New_York',
            'us': 'America/New_York',
            'united states': 'America/New_York',
            'uk': 'Europe/London',
            'united kingdom': 'Europe/London',
            'england': 'Europe/London',
            'india': 'Asia/Kolkata',
            'germany': 'Europe/Berlin',
            'france': 'Europe/Paris',
            'australia': 'Australia/Sydney',
            'canada': 'America/Toronto',
            'japan': 'Asia/Tokyo',
            'china': 'Asia/Shanghai',
            'singapore': 'Asia/Singapore',
            'uae': 'Asia/Dubai',
            'dubai': 'Asia/Dubai',
            'brazil': 'America/Sao_Paulo',
            'mexico': 'America/Mexico_City',
            'spain': 'Europe/Madrid',
            'italy': 'Europe/Rome',
            'netherlands': 'Europe/Amsterdam',
            'sweden': 'Europe/Stockholm',
            'norway': 'Europe/Oslo',
            'denmark': 'Europe/Copenhagen',
            'switzerland': 'Europe/Zurich',
            'south korea': 'Asia/Seoul',
            'korea': 'Asia/Seoul',
            'new zealand': 'Pacific/Auckland',
            'israel': 'Asia/Jerusalem',
            'russia': 'Europe/Moscow',
            'poland': 'Europe/Warsaw',
        };

        // Convert parsed data to leads based on column mappings
        const newLeads: Lead[] = parsedData.map((row, index) => {
            const lead: Lead = {
                id: `lead-${Date.now()}-${index}`,
                email: '',
                status: 'pending',
                customFields: {},
                addedAt: new Date().toISOString(),
                // Default working hours (9 AM - 6 PM, weekdays)
                workingHoursStart: '09:00',
                workingHoursEnd: '18:00',
                workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            };

            columnMappings.forEach(mapping => {
                const value = row[mapping.columnName] || '';
                switch (mapping.fieldType) {
                    case 'email':
                        lead.email = value;
                        break;
                    case 'firstName':
                        lead.firstName = value;
                        break;
                    case 'lastName':
                        lead.lastName = value;
                        break;
                    case 'company':
                        lead.company = value;
                        break;
                    case 'timezone':
                        lead.timezone = value;
                        break;
                    case 'country':
                        lead.country = value;
                        // Infer timezone from country if timezone not already set
                        if (!lead.timezone && value) {
                            const tz = countryToTimezone[value.toLowerCase()];
                            if (tz) lead.timezone = tz;
                        }
                        break;
                    case 'workingHoursStart':
                        // Convert 12h format to 24h if needed
                        lead.workingHoursStart = convertTo24Hour(value) || '09:00';
                        break;
                    case 'workingHoursEnd':
                        lead.workingHoursEnd = convertTo24Hour(value) || '18:00';
                        break;
                    case 'custom':
                        lead.customFields[mapping.customFieldName || mapping.columnName] = value;
                        break;
                }
            });

            return lead;
        }).filter(lead => lead.email && lead.email.includes('@'));

        const allLeads = [...leads, ...newLeads];

        // Save to backend
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/leads`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ leads: allLeads })
            });
        } catch (err) {
            console.error('Error saving leads:', err);
        }

        onLeadsUpdate(allLeads);
        setShowMapping(false);
        setUploadedFile(null);
        setColumnMappings([]);
        setParsedData([]);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    };

    // If showing column mapping view
    if (showMapping) {
        return (
            <div className={cn('max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500', className)}>
                {/* Back Link */}
                <button
                    onClick={() => {
                        setShowMapping(false);
                        setUploadedFile(null);
                        setColumnMappings([]);
                    }}
                    className={cn(
                        'flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors group',
                        theme === 'dark'
                            ? 'text-gray-500 hover:text-[#d97757]'
                            : 'text-gray-400 hover:text-blue-600'
                    )}
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Database
                </button>

                {/* Title */}
                <div className="space-y-2">
                    <h2 className={cn(
                        'text-4xl font-[Syne] font-bold tracking-tight',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Data <span className="text-[#d97757]">Import</span>
                    </h2>
                    <p className={cn(
                        'text-sm font-light leading-relaxed max-w-lg',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                        Map your CSV columns to the system fields. We'll intelligentally detect types for you.
                    </p>
                </div>

                {/* Uploaded File Card */}
                {uploadedFile && (
                    <div className={cn(
                        'relative p-6 rounded-2xl border transition-all duration-300',
                        theme === 'dark'
                            ? 'bg-[#12151a] border-[#252a33] shadow-lg'
                            : 'bg-white border-blue-100 shadow-xl'
                    )}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    'p-3 rounded-xl',
                                    theme === 'dark' ? 'bg-[#1a1e25] text-[#d97757]' : 'bg-blue-50 text-blue-600'
                                )}>
                                    <FileSpreadsheet className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className={cn(
                                        'text-xs font-mono mb-1 opacity-60',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    )}>
                                        SOURCE FILE ({formatFileSize(uploadedFile.size)})
                                    </p>
                                    <p className={cn(
                                        'text-lg font-[Syne] font-bold',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {uploadedFile.name}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setUploadedFile(null);
                                    setShowMapping(false);
                                }}
                                className={cn(
                                    'p-2 rounded-full transition-colors',
                                    theme === 'dark'
                                        ? 'hover:bg-[#252a33] text-gray-500 hover:text-white'
                                        : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                                )}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className={cn(
                            'mt-6 py-2 px-4 rounded-lg flex items-center gap-3 text-xs font-medium border',
                            theme === 'dark'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        )}>
                            <Check className="w-3 h-3" />
                            File successfully parsed and ready for mapping
                        </div>
                    </div>
                )}

                {/* Column Mapping Table */}
                <div className={cn(
                    'rounded-xl border overflow-hidden',
                    theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                )}>
                    <Table>
                        <TableHeader>
                            <TableRow className={cn(
                                theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'
                            )}>
                                <TableHead className={cn(
                                    'w-1/4',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>Column Name</TableHead>
                                <TableHead className={cn(
                                    'w-1/4',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>Select Type</TableHead>
                                <TableHead className={cn(
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>Samples</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {columnMappings.map((mapping, index) => (
                                <TableRow key={mapping.columnName} className={cn(
                                    theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                                )}>
                                    <TableCell className={cn(
                                        'font-medium',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {mapping.columnName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="relative">
                                            <select
                                                value={mapping.fieldType}
                                                onChange={(e) => updateColumnMapping(index, e.target.value as ColumnMapping['fieldType'])}
                                                className={cn(
                                                    'w-full px-3 py-2 pr-8 rounded-lg border appearance-none cursor-pointer text-sm',
                                                    theme === 'dark'
                                                        ? 'bg-[#252525] border-gray-700 text-white'
                                                        : 'bg-white border-gray-200 text-gray-900',
                                                    mapping.fieldType === 'ignore' && 'text-red-400'
                                                )}
                                            >
                                                {fieldTypes.map(type => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className={cn(
                                                'absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            {mapping.samples.map((sample, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        'text-sm truncate max-w-[250px]',
                                                        i === 2
                                                            ? theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'
                                                            : theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                                    )}
                                                >
                                                    {sample || '-'}
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Duplicate Check Options */}
                <div className={cn(
                    'flex items-center justify-center gap-6 py-4',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                    <span className="text-sm">Check for duplicates across all</span>
                    {['Campaigns', 'Lists', 'The Workspace'].map((option, index) => (
                        <label key={option} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={[checkDuplicates.campaigns, checkDuplicates.lists, checkDuplicates.workspace][index]}
                                onChange={(e) => {
                                    const key = ['campaigns', 'lists', 'workspace'][index] as keyof typeof checkDuplicates;
                                    setCheckDuplicates(prev => ({ ...prev, [key]: e.target.checked }));
                                }}
                                className="rounded border-gray-600"
                            />
                            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{option}</span>
                        </label>
                    ))}
                </div>

                {/* Verify Leads & Import */}
                <div className="flex items-center justify-center gap-4 py-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={verifyLeads}
                            onChange={(e) => setVerifyLeads(e.target.checked)}
                            className="rounded border-gray-600"
                        />
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Verify leads</span>
                    </label>
                    <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                        theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                    )}>
                        ⚡ 0.25 / Row
                    </span>
                </div>

                {/* Import Button */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleImportLeads}
                        className={cn(
                            'px-8',
                            theme === 'dark'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        )}
                    >
                        Import {parsedData.length} Leads
                    </Button>
                </div>
            </div>
        );
    }

    // Handler for saving leads from LeadBuilder
    const handleLeadBuilderSave = async (newLeads: Lead[]) => {
        // Use the newLeads directly (this includes all edits, additions, and deletions)
        const updatedLeads = newLeads;

        // Save to backend
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/leads`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ leads: updatedLeads })
            });
        } catch (err) {
            console.error('Error saving leads:', err);
        }

        onLeadsUpdate(updatedLeads);
    };

    // Handler for changing a lead's sending account
    const handleLeadAccountChange = async (leadId: string, accountId: string) => {
        const updatedLeads = leads.map(lead =>
            lead.id === leadId ? { ...lead, sendingAccountId: accountId } : lead
        );

        // Save to backend
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/leads`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ leads: updatedLeads })
            });
        } catch (err) {
            console.error('Error updating lead account:', err);
        }

        onLeadsUpdate(updatedLeads);
    };

    // Helper to get scheduled time for a lead based on its position
    const getScheduledTime = (pendingIndex: number, delayMinutes: number = 10): Date => {
        return new Date(Date.now() + (pendingIndex * delayMinutes * 60 * 1000));
    };

    // Helper to format time in user's locale
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Country to timezone mapping for display
    const countryToTimezone: Record<string, string> = {
        'india': 'Asia/Kolkata',
        'usa': 'America/New_York',
        'uk': 'Europe/London',
        'united kingdom': 'Europe/London',
        'germany': 'Europe/Berlin',
        'france': 'Europe/Paris',
        'australia': 'Australia/Sydney',
        'japan': 'Asia/Tokyo',
        'china': 'Asia/Shanghai',
        'singapore': 'Asia/Singapore',
        'uae': 'Asia/Dubai',
        'canada': 'America/Toronto',
    };

    // Helper to get lead's timezone
    const getLeadTimezone = (lead: Lead): string => {
        if (lead.timezone) return lead.timezone;
        if (lead.country) {
            const tz = countryToTimezone[lead.country.toLowerCase()];
            if (tz) return tz;
        }
        return Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to local
    };

    // Helper to get lead's current local time
    const getLeadLocalTime = (lead: Lead): string => {
        try {
            const tz = getLeadTimezone(lead);
            return new Date().toLocaleTimeString('en-US', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    };

    // Helper to check if lead is within working hours (default 9:00-20:00)
    const isWithinWorkingHours = (lead: Lead, workStart: string = '09:00', workEnd: string = '20:00'): boolean => {
        try {
            const tz = getLeadTimezone(lead);
            const now = new Date();
            const localTime = now.toLocaleTimeString('en-US', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const [hours, minutes] = localTime.split(':').map(Number);
            const currentMinutes = hours * 60 + minutes;

            const [startH, startM] = workStart.split(':').map(Number);
            const [endH, endM] = workEnd.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        } catch {
            return true; // Assume within hours if can't determine
        }
    };

    // If no leads, show empty state with upload
    if (leads.length === 0) {
        return (
            <div className={cn('space-y-6', className)}>
                {/* Lead Builder Modal */}
                <AnimatePresence>
                    {showLeadBuilder && (
                        <LeadBuilder
                            leads={[]}
                            onLeadsUpdate={handleLeadBuilderSave}
                            onClose={() => setShowLeadBuilder(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Empty State */}
                <div className={cn(
                    'flex flex-col items-center justify-center py-16 px-4 rounded-xl border',
                    theme === 'dark'
                        ? 'bg-[#1a1a1a] border-gray-800'
                        : 'bg-white border-gray-200'
                )}>
                    {/* Illustration */}
                    <div className={cn(
                        'w-48 h-36 mb-6 flex items-center justify-center',
                        theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                    )}>
                        <svg viewBox="0 0 200 150" className="w-full h-full">
                            <rect x="40" y="20" width="80" height="60" rx="4" fill="currentColor" opacity="0.3" />
                            <rect x="50" y="30" width="30" height="5" rx="2" fill="currentColor" opacity="0.5" />
                            <rect x="50" y="40" width="50" height="5" rx="2" fill="currentColor" opacity="0.5" />
                            <rect x="50" y="50" width="40" height="5" rx="2" fill="currentColor" opacity="0.5" />
                            <rect x="50" y="60" width="55" height="5" rx="2" fill="currentColor" opacity="0.5" />
                            <circle cx="140" cy="45" r="15" fill="currentColor" opacity="0.4" />
                            <rect x="125" y="65" width="30" height="40" rx="3" fill="currentColor" opacity="0.3" />
                        </svg>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">👋</span>
                        <p className={cn(
                            'text-lg font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Add some leads to get started
                        </p>
                    </div>

                    <p className={cn(
                        'text-sm mb-8 text-center max-w-md',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>
                        Create leads directly in the app or upload a CSV file with your contacts
                    </p>

                    {/* Two options: Create or Upload */}
                    <div className="flex items-center gap-4">
                        {/* Import from Lead Lists - Primary */}
                        <Button
                            onClick={() => {
                                fetchLeadLists();
                                setShowLeadListsModal(true);
                            }}
                            className={cn(
                                'gap-2 px-6 py-3',
                                theme === 'dark'
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            )}
                        >
                            <FolderOpen className="w-4 h-4" />
                            Import from Lead Lists
                        </Button>

                        {/* Divider */}
                        <span className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        )}>
                            or
                        </span>

                        {/* Upload CSV Button - Secondary */}
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('csv-upload')?.click()}
                            className={cn(
                                'gap-2 px-6 py-3',
                                theme === 'dark'
                                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            )}
                        >
                            <Upload className="w-4 h-4" />
                            Upload CSV
                        </Button>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Lead Lists Import Modal */}
                <AnimatePresence>
                    {showLeadListsModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setShowLeadListsModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    'relative w-full max-w-md rounded-xl shadow-xl p-6',
                                    theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'
                                )}
                            >
                                <h3 className={cn(
                                    'text-lg font-semibold mb-2',
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    Import from Lead Lists
                                </h3>
                                <p className={cn(
                                    'text-sm mb-4',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Select a lead list to import leads into this campaign
                                </p>

                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {loadingLeadLists ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className={cn(
                                                'w-6 h-6 animate-spin',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )} />
                                        </div>
                                    ) : leadLists.length === 0 ? (
                                        <div className={cn(
                                            'text-center py-8',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No lead lists found</p>
                                            <p className="text-xs mt-1">Create a lead list first in the Lead Lists section</p>
                                        </div>
                                    ) : (
                                        leadLists.map(list => (
                                            <button
                                                key={list.id}
                                                onClick={() => importFromLeadList(list)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                                                    theme === 'dark'
                                                        ? 'hover:bg-gray-800 border border-gray-800'
                                                        : 'hover:bg-gray-50 border border-gray-200'
                                                )}
                                            >
                                                <Users className={cn(
                                                    'w-5 h-5',
                                                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                                )} />
                                                <div className="flex-1">
                                                    <p className={cn(
                                                        'text-sm font-medium',
                                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                    )}>
                                                        {list.name}
                                                    </p>
                                                    <p className={cn(
                                                        'text-xs',
                                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    )}>
                                                        {list.leads?.length || 0} leads
                                                    </p>
                                                </div>
                                                <ChevronDown className={cn(
                                                    'w-4 h-4 -rotate-90',
                                                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                )} />
                                            </button>
                                        ))
                                    )}
                                </div>

                                <div className="flex justify-end mt-6">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowLeadListsModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }


    // Show leads list
    return (
        <>
            <div className={cn('h-full flex flex-col', className)}>
                {/* Lead Builder Modal */}
                <AnimatePresence>
                    {showLeadBuilder && (
                        <LeadBuilder
                            leads={leads}
                            onLeadsUpdate={handleLeadBuilderSave}
                            onClose={() => setShowLeadBuilder(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Toolbar - Revnix Style */}
                <div className={cn(
                    'flex items-center justify-between px-4 py-3 border-b',
                    theme === 'dark' ? 'bg-[#0d0d0d] border-neutral-800' : 'bg-white border-gray-200'
                )}>
                    {/* Left: Title and Stats */}
                    <div className="flex items-center gap-4">
                        <h2 className={cn(
                            'text-sm font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Leads
                        </h2>
                        <div className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            theme === 'dark' ? 'bg-neutral-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                        )}>
                            {leads.length} Results
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLeadBuilder(true)}
                            className="h-8 text-xs gap-1.5 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit Leads
                        </Button>

                        <div className="relative group">
                            <Button
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Leads
                                <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                            <div className={cn(
                                'absolute right-0 top-full mt-1 py-1 w-44 rounded-lg shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20',
                                theme === 'dark'
                                    ? 'bg-neutral-900 border-neutral-800'
                                    : 'bg-white border-gray-200'
                            )}>
                                <button
                                    onClick={() => setShowLeadBuilder(true)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                                        theme === 'dark'
                                            ? 'hover:bg-neutral-800 text-gray-300'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    )}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Create leads
                                </button>
                                <button
                                    onClick={() => document.getElementById('csv-upload-3')?.click()}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                                        theme === 'dark'
                                            ? 'hover:bg-neutral-800 text-gray-300'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    )}
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload CSV
                                </button>
                            </div>
                        </div>
                        <input
                            id="csv-upload-3"
                            type="file"
                            accept=".csv"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        {/* FIX: Added table-fixed to prevent layout shift when content loads */}
                        <Table className="table-fixed w-full">
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow className={cn(
                                    'border-b',
                                    theme === 'dark' ? 'bg-[#0d0d0d] border-neutral-800' : 'bg-gray-50 border-gray-200'
                                )}>
                                    <TableHead className={cn('w-[50px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>#</TableHead>
                                    <TableHead className={cn('w-[200px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Email</TableHead>
                                    <TableHead className={cn('w-[120px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Name</TableHead>
                                    <TableHead className={cn('w-[100px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Company</TableHead>
                                    <TableHead className={cn('w-[110px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Sent / Scheduled</TableHead>
                                    <TableHead className={cn('w-[180px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Sending Account</TableHead>
                                    <TableHead className={cn('w-[100px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Timezone</TableHead>
                                    <TableHead className={cn('w-[80px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Status</TableHead>
                                    <TableHead className={cn('w-[60px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Reply</TableHead>
                                    <TableHead className={cn('w-[80px]', theme === 'dark' ? 'text-gray-500 bg-[#0d0d0d]' : 'text-gray-500 bg-gray-50')}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead, index) => {
                                    // Calculate scheduled time based on pending position
                                    const pendingLeads = leads.filter(l => l.status === 'pending');
                                    const pendingIndex = pendingLeads.findIndex(l => l.id === lead.id);
                                    const isPending = lead.status === 'pending';
                                    const leadLogs = getLogsForLead(lead.email);
                                    const latestLog = leadLogs[0]; // Most recent email sent

                                    return (
                                        <TableRow key={lead.id} className={cn(
                                            theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                                        )}>
                                            <TableCell className={cn(
                                                'text-xs font-mono',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className={cn(
                                                'truncate',
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            )}>
                                                {lead.email}
                                            </TableCell>
                                            <TableCell className={cn(
                                                'truncate',
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                            )}>
                                                {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '-'}
                                            </TableCell>
                                            <TableCell className={cn(
                                                'truncate',
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            )}>
                                                {lead.company || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {isPending ? (
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            'text-xs font-medium',
                                                            pendingIndex === 0
                                                                ? 'text-emerald-500'
                                                                : theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                                        )}>
                                                            {pendingIndex === 0 ? '🚀 Now' : formatTime(getScheduledTime(pendingIndex))}
                                                        </span>
                                                        {pendingIndex > 0 && (
                                                            <span className={cn(
                                                                'text-xs',
                                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                            )}>
                                                                +{pendingIndex * 10}min
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : latestLog ? (
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            'text-xs font-medium',
                                                            latestLog.status === 'sent' ? 'text-emerald-500' :
                                                                latestLog.status === 'failed' ? 'text-red-400' :
                                                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        )}>
                                                            ✓ {formatSentTime(latestLog.sentAt)}
                                                        </span>
                                                        {leadLogs.length > 1 && (
                                                            <span className={cn(
                                                                'text-xs',
                                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                            )}>
                                                                {leadLogs.length} emails sent
                                                            </span>
                                                        )}
                                                        <span className={cn(
                                                            'text-xs',
                                                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                        )}>
                                                            {new Date(latestLog.sentAt).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={cn(
                                                        'text-xs',
                                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    )}>
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="overflow-hidden">
                                                {isPending && smtpAccounts.length > 0 ? (
                                                    <select
                                                        value={lead.sendingAccountId || smtpAccounts[pendingIndex % smtpAccounts.length]?.id || ''}
                                                        onChange={(e) => handleLeadAccountChange(lead.id, e.target.value)}
                                                        className={cn(
                                                            'w-full max-w-[160px] px-2 py-1 rounded text-xs border appearance-none cursor-pointer truncate',
                                                            theme === 'dark'
                                                                ? 'bg-[#252525] border-gray-700 text-white'
                                                                : 'bg-white border-gray-200 text-gray-900'
                                                        )}
                                                    >
                                                        {smtpAccounts.map(account => (
                                                            <option key={account.id} value={account.id}>
                                                                {account.fromEmail}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : lead.sendingAccountId ? (
                                                    // ✅ Show assigned account with icon
                                                    <div className="flex items-center gap-2 max-w-[160px]">
                                                        <Mail className={cn(
                                                            'w-3 h-3 flex-shrink-0',
                                                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                                        )} />
                                                        <span className={cn(
                                                            'text-xs font-medium truncate',
                                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                        )}>
                                                            {smtpAccounts.find(a => a.id === lead.sendingAccountId)?.fromEmail || 'Unknown'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    // ✅ Not assigned indicator
                                                    <span className={cn(
                                                        'text-xs italic',
                                                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                    )}>
                                                        Not assigned
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const tz = getLeadTimezone(lead);
                                                    const localTime = getLeadLocalTime(lead);
                                                    const tzName = tz.split('/').pop()?.replace('_', ' ') || tz;
                                                    const withinHours = isWithinWorkingHours(lead);

                                                    return (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn(
                                                                    'text-xs font-medium',
                                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                                )}>
                                                                    {localTime}
                                                                </span>
                                                                <span className={cn(
                                                                    'w-1.5 h-1.5 rounded-full',
                                                                    withinHours ? 'bg-emerald-500' : 'bg-amber-500'
                                                                )} title={withinHours ? 'Within working hours' : 'Outside working hours'} />
                                                            </div>
                                                            <span className={cn(
                                                                'text-[10px]',
                                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                            )}>
                                                                {tzName}
                                                            </span>
                                                            {(lead.workingHoursStart && lead.workingHoursEnd) && (
                                                                <span className={cn(
                                                                    'text-[10px]',
                                                                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                                )}>
                                                                    Hours: {lead.workingHoursStart}-{lead.workingHoursEnd}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const withinHours = isWithinWorkingHours(lead);
                                                    const isWaiting = lead.status === 'pending' && !withinHours;

                                                    return (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={cn(
                                                                'px-1.5 py-0.5 rounded text-[10px] font-semibold inline-block w-fit uppercase tracking-wide',
                                                                lead.status === 'sent' && 'bg-orange-500 text-white',
                                                                lead.status === 'opened' && 'bg-emerald-500/20 text-emerald-400',
                                                                lead.status === 'clicked' && 'bg-purple-500/20 text-purple-400',
                                                                lead.status === 'replied' && 'bg-amber-500/20 text-amber-400',
                                                                lead.status === 'bounced' && 'bg-red-500/20 text-red-400',
                                                                lead.status === 'pending' && !isWaiting && (theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'),
                                                                isWaiting && 'bg-amber-500/20 text-amber-400'
                                                            )}>
                                                                {isWaiting ? 'Waiting' : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                                            </span>
                                                            {isWaiting && (
                                                                <span className={cn(
                                                                    'text-[10px]',
                                                                    theme === 'dark' ? 'text-amber-500/70' : 'text-amber-600'
                                                                )}>
                                                                    Outside hours
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {(lead as any).hasReplied ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Check className={cn(
                                                            'w-3.5 h-3.5',
                                                            theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                                        )} />
                                                        <span className={cn(
                                                            'text-xs font-medium',
                                                            theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                                        )}>
                                                            Replied
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={cn(
                                                        'text-xs',
                                                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                    )}>
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {leadLogs.length > 0 ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedEmailLog(latestLog);
                                                            setShowEmailPreview(true);
                                                        }}
                                                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        Preview
                                                    </button>
                                                ) : (
                                                    <span className={cn(
                                                        'text-xs',
                                                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                    )}>
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                    );
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </div>

            {/* Lead Lists Import Modal */}
            <AnimatePresence>
                {showLeadListsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowLeadListsModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                'relative w-full max-w-md rounded-xl shadow-xl p-6',
                                theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'
                            )}
                        >
                            <h3 className={cn(
                                'text-lg font-semibold mb-2',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                Import from Lead Lists
                            </h3>
                            <p className={cn(
                                'text-sm mb-4',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            )}>
                                Select a lead list to import leads into this campaign
                            </p>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {loadingLeadLists ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className={cn(
                                            'w-6 h-6 animate-spin',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )} />
                                    </div>
                                ) : leadLists.length === 0 ? (
                                    <div className={cn(
                                        'text-center py-8',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No lead lists found</p>
                                        <p className="text-xs mt-1">Create a lead list first in the Lead Lists section</p>
                                    </div>
                                ) : (
                                    leadLists.map(list => (
                                        <button
                                            key={list.id}
                                            onClick={() => importFromLeadList(list)}
                                            className={cn(
                                                'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                                                theme === 'dark'
                                                    ? 'hover:bg-gray-800 border border-gray-800'
                                                    : 'hover:bg-gray-50 border border-gray-200'
                                            )}
                                        >
                                            <Users className={cn(
                                                'w-5 h-5',
                                                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                            )} />
                                            <div className="flex-1">
                                                <p className={cn(
                                                    'text-sm font-medium',
                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                )}>
                                                    {list.name}
                                                </p>
                                                <p className={cn(
                                                    'text-xs',
                                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                )}>
                                                    {list.leads?.length || 0} leads
                                                </p>
                                            </div>
                                            <ChevronDown className={cn(
                                                'w-4 h-4 -rotate-90',
                                                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                            )} />
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowLeadListsModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Email Preview Modal */}
            <AnimatePresence>
                {showEmailPreview && selectedEmailLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                setShowEmailPreview(false);
                                setSelectedEmailLog(null);
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={cn(
                                'relative w-full max-w-2xl max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col',
                                theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'
                            )}
                        >
                            {/* Modal Header - Orange themed */}
                            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/20">
                                        <Mail className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Email Preview
                                        </h3>
                                        <p className="text-xs text-white/70">
                                            Sent to {selectedEmailLog.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEmailPreview(false);
                                        setSelectedEmailLog(null);
                                    }}
                                    className="p-2 rounded-lg transition-colors hover:bg-white/20 text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Email Metadata */}
                            <div className={cn(
                                'px-6 py-4 space-y-3 border-b flex-shrink-0',
                                theme === 'dark' ? 'bg-[#151515] border-gray-800' : 'bg-gray-50 border-gray-200'
                            )}>
                                {/* Subject */}
                                <div className="flex items-start gap-3">
                                    <span className={cn(
                                        'text-xs font-medium w-16 pt-0.5 flex-shrink-0',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>Subject:</span>
                                    <span className={cn(
                                        'text-sm font-medium',
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {selectedEmailLog.subject || '(No subject)'}
                                    </span>
                                </div>

                                {/* To */}
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        'text-xs font-medium w-16 flex-shrink-0',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>To:</span>
                                    <span className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        {selectedEmailLog.recipientName
                                            ? `${selectedEmailLog.recipientName} <${selectedEmailLog.email}>`
                                            : selectedEmailLog.email}
                                    </span>
                                </div>

                                {/* Sent Time */}
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        'text-xs font-medium w-16 flex-shrink-0',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>Sent:</span>
                                    <span className={cn(
                                        'text-sm',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        {new Date(selectedEmailLog.sentAt).toLocaleString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        'text-xs font-medium w-16 flex-shrink-0',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>Status:</span>
                                    <span className={cn(
                                        'px-2 py-0.5 rounded text-xs font-medium',
                                        selectedEmailLog.status === 'sent' && 'bg-orange-500 text-white',
                                        selectedEmailLog.status === 'failed' && 'bg-red-500/20 text-red-400',
                                        selectedEmailLog.status === 'opened' && 'bg-emerald-500/20 text-emerald-400',
                                        selectedEmailLog.status === 'clicked' && 'bg-purple-500/20 text-purple-400',
                                        selectedEmailLog.status === 'replied' && 'bg-amber-500/20 text-amber-400'
                                    )}>
                                        {selectedEmailLog.status.charAt(0).toUpperCase() + selectedEmailLog.status.slice(1)}
                                    </span>
                                    {selectedEmailLog.stepIndex !== undefined && (
                                        <span className={cn(
                                            'text-xs',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            (Step {selectedEmailLog.stepIndex + 1})
                                        </span>
                                    )}
                                </div>

                                {/* Error (if failed) */}
                                {selectedEmailLog.error && (
                                    <div className="flex items-start gap-3">
                                        <span className={cn(
                                            'text-xs font-medium w-16 pt-0.5 flex-shrink-0',
                                            'text-red-400'
                                        )}>Error:</span>
                                        <span className="text-sm text-red-400">
                                            {selectedEmailLog.error}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Email Content */}
                            <div className="flex-1 overflow-y-auto">
                                {selectedEmailLog.htmlContent ? (
                                    <div
                                        className={cn(
                                            'p-6',
                                            theme === 'dark' ? 'bg-[#202020]' : 'bg-white'
                                        )}
                                        dangerouslySetInnerHTML={{ __html: selectedEmailLog.htmlContent }}
                                    />
                                ) : selectedEmailLog.textContent ? (
                                    <pre className={cn(
                                        'p-6 whitespace-pre-wrap font-sans text-sm leading-relaxed',
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    )}>
                                        {selectedEmailLog.textContent}
                                    </pre>
                                ) : campaignSequence?.steps && selectedEmailLog.stepIndex !== undefined ? (
                                    // Fallback: Show sequence step template
                                    <div
                                        className={cn(
                                            'p-6',
                                            theme === 'dark' ? 'bg-[#202020]' : 'bg-white'
                                        )}
                                    >
                                        <div className={cn(
                                            'text-xs mb-4 px-3 py-2 rounded',
                                            theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                                        )}>
                                            Showing template from Step {selectedEmailLog.stepIndex + 1}. Actual sent email may have personalized variables.
                                        </div>
                                        <div dangerouslySetInnerHTML={{
                                            __html: campaignSequence.steps[selectedEmailLog.stepIndex]?.body || 'No content available'
                                        }} />
                                    </div>
                                ) : (
                                    <div className={cn(
                                        'flex flex-col items-center justify-center py-16 text-center',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        <Mail className="w-10 h-10 mb-3 opacity-50" />
                                        <p className="text-sm font-medium mb-1">Email content not stored</p>
                                        <p className="text-xs max-w-sm">
                                            This email was sent before content logging was enabled.
                                            New emails will show their full content here.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className={cn(
                                'flex items-center justify-between px-6 py-4 border-t flex-shrink-0',
                                theme === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
                            )}>
                                <div className="flex items-center gap-2">
                                    {/* Show all emails for this lead */}
                                    {getLogsForLead(selectedEmailLog.email).length > 1 && (
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-xs',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>
                                                {getLogsForLead(selectedEmailLog.email).length} emails sent to this lead
                                            </span>
                                            <div className="flex gap-1">
                                                {getLogsForLead(selectedEmailLog.email).slice(0, 5).map((log, idx) => (
                                                    <button
                                                        key={log.id}
                                                        onClick={() => setSelectedEmailLog(log)}
                                                        className={cn(
                                                            'w-6 h-6 rounded text-xs font-medium transition-all',
                                                            log.id === selectedEmailLog.id
                                                                ? theme === 'dark'
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-blue-600 text-white'
                                                                : theme === 'dark'
                                                                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                        )}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowEmailPreview(false);
                                        setSelectedEmailLog(null);
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Scheduled Email Preview/Edit Modal */}
            <AnimatePresence>
                {showScheduledPreview && selectedScheduledLead && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                if (!isEditMode) {
                                    setShowScheduledPreview(false);
                                    setSelectedScheduledLead(null);
                                }
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={cn(
                                'relative w-full max-w-3xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col',
                                theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'
                            )}
                        >
                            {/* Modal Header */}
                            <div className={cn(
                                'flex items-center justify-between px-6 py-4 border-b flex-shrink-0',
                                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'p-2 rounded-lg',
                                        isEditMode
                                            ? theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
                                            : theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                                    )}>
                                        {isEditMode ? (
                                            <Edit3 className={cn(
                                                'w-5 h-5',
                                                theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                                            )} />
                                        ) : (
                                            <Eye className={cn(
                                                'w-5 h-5',
                                                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                            )} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            'text-lg font-semibold',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {isEditMode ? 'Edit Email' : 'Email Preview'}
                                        </h3>
                                        <p className={cn(
                                            'text-xs',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            Scheduled for {selectedScheduledLead.firstName || selectedScheduledLead.email.split('@')[0]}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isEditMode && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditMode(true)}
                                            className={cn(
                                                'gap-2',
                                                theme === 'dark'
                                                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            )}
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit
                                        </Button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowScheduledPreview(false);
                                            setSelectedScheduledLead(null);
                                            setIsEditMode(false);
                                        }}
                                        className={cn(
                                            'p-2 rounded-lg transition-colors',
                                            theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                        )}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Recipient Info */}
                            <div className={cn(
                                'px-6 py-3 border-b flex-shrink-0',
                                theme === 'dark' ? 'bg-[#151515] border-gray-800' : 'bg-gray-50 border-gray-200'
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            'text-xs font-medium',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>To:</span>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {selectedScheduledLead.firstName
                                                ? `${selectedScheduledLead.firstName} ${selectedScheduledLead.lastName || ''} <${selectedScheduledLead.email}>`
                                                : selectedScheduledLead.email}
                                        </span>
                                    </div>
                                    {selectedScheduledLead.company && (
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-xs font-medium',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>Company:</span>
                                            <span className={cn(
                                                'text-sm',
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                            )}>
                                                {selectedScheduledLead.company}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Email Content */}
                            <div className="flex-1 overflow-y-auto">
                                {isEditMode ? (
                                    <div className="p-6 space-y-4">
                                        {/* Subject Input */}
                                        <div>
                                            <label className={cn(
                                                'block text-sm font-medium mb-2',
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                            )}>
                                                Subject
                                            </label>
                                            <input
                                                type="text"
                                                value={editableSubject}
                                                onChange={(e) => setEditableSubject(e.target.value)}
                                                className={cn(
                                                    'w-full px-4 py-3 rounded-lg border text-sm',
                                                    theme === 'dark'
                                                        ? 'bg-[#252525] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500'
                                                        : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'
                                                )}
                                                placeholder="Email subject..."
                                            />
                                        </div>

                                        {/* Body Input */}
                                        <div>
                                            <label className={cn(
                                                'block text-sm font-medium mb-2',
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                            )}>
                                                Body
                                            </label>
                                            <textarea
                                                value={editableBody}
                                                onChange={(e) => setEditableBody(e.target.value)}
                                                rows={12}
                                                className={cn(
                                                    'w-full px-4 py-3 rounded-lg border text-sm resize-none',
                                                    theme === 'dark'
                                                        ? 'bg-[#252525] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500'
                                                        : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'
                                                )}
                                                placeholder="Email body..."
                                            />
                                        </div>

                                        <p className={cn(
                                            'text-xs',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            💡 This custom content will be saved for this lead only. Variables like {'{{firstName}}'} have already been replaced.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-6">
                                        {/* Subject Preview */}
                                        <div className={cn(
                                            'mb-4 p-4 rounded-lg border',
                                            theme === 'dark' ? 'bg-[#252525] border-gray-700' : 'bg-gray-50 border-gray-200'
                                        )}>
                                            <p className={cn(
                                                'text-xs font-medium mb-1',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>Subject</p>
                                            <p className={cn(
                                                'text-base font-medium',
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            )}>
                                                {editableSubject || '(No subject)'}
                                            </p>
                                        </div>

                                        {/* Body Preview */}
                                        <div className={cn(
                                            'rounded-lg border p-4',
                                            theme === 'dark' ? 'bg-[#252525] border-gray-700' : 'bg-white border-gray-200'
                                        )}>
                                            <p className={cn(
                                                'text-xs font-medium mb-3',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>Body</p>
                                            {editableBody ? (
                                                <div
                                                    className={cn(
                                                        'prose prose-sm max-w-none',
                                                        theme === 'dark' ? 'prose-invert' : ''
                                                    )}
                                                    dangerouslySetInnerHTML={{
                                                        __html: editableBody
                                                            .replace(/\n\n/g, '</p><p>')
                                                            .replace(/\n/g, '<br>')
                                                    }}
                                                />
                                            ) : (
                                                <p className={cn(
                                                    'text-sm italic',
                                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                )}>
                                                    No email body configured. Please add content in the Sequences tab.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className={cn(
                                'flex items-center justify-between px-6 py-4 border-t flex-shrink-0',
                                theme === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
                            )}>
                                <div className="flex items-center gap-2">
                                    {(selectedScheduledLead as any).customSubject && !isEditMode && (
                                        <span className={cn(
                                            'px-2 py-1 rounded text-xs font-medium',
                                            theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                                        )}>
                                            Custom email saved
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {isEditMode && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsEditMode(false);
                                                    // Reset to original content
                                                    const step = campaignSequence?.steps?.[0];
                                                    if (step) {
                                                        const variant = step.variants?.[0] || step;
                                                        setEditableSubject(personalizeContent(variant.subject || step.subject || '', selectedScheduledLead));
                                                        setEditableBody(personalizeContent(variant.body || step.body || '', selectedScheduledLead));
                                                    }
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={saveCustomEmail}
                                                disabled={savingCustomEmail}
                                                className={cn(
                                                    'gap-2',
                                                    theme === 'dark'
                                                        ? 'bg-blue-600 hover:bg-blue-700'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                )}
                                            >
                                                {savingCustomEmail ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                    {!isEditMode && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setShowScheduledPreview(false);
                                                setSelectedScheduledLead(null);
                                            }}
                                        >
                                            Close
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
