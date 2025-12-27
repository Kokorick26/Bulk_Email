import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileSpreadsheet, X, Check, AlertCircle,
    Users, Loader2, Trash2, Eye, ChevronDown, Ban,
    Mail, User, Building, Hash, Clock, Plus, Edit3, FolderOpen
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import { ScrollArea } from '../../ui/ScrollArea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/Table';
import { LeadBuilder } from '../LeadBuilder';
import type { Lead, ColumnMapping } from '../types';

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
            <div className={cn('space-y-6', className)}>
                {/* Back Link */}
                <button
                    onClick={() => {
                        setShowMapping(false);
                        setUploadedFile(null);
                        setColumnMappings([]);
                    }}
                    className={cn(
                        'flex items-center gap-1 text-sm font-medium transition-colors',
                        theme === 'dark'
                            ? 'text-blue-400 hover:text-blue-300'
                            : 'text-blue-600 hover:text-blue-700'
                    )}
                >
                    ← Choose another method
                </button>

                {/* Title */}
                <h2 className={cn(
                    'text-xl font-semibold',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                    Upload CSV File
                </h2>

                {/* Uploaded File Card */}
                {uploadedFile && (
                    <div className={cn(
                        'relative p-8 rounded-xl border-2 border-dashed text-center',
                        theme === 'dark'
                            ? 'border-gray-700 bg-[#1a1a1a]'
                            : 'border-gray-200 bg-gray-50'
                    )}>
                        <button
                            onClick={() => {
                                setUploadedFile(null);
                                setShowMapping(false);
                            }}
                            className={cn(
                                'absolute top-3 right-3 p-1 rounded-full',
                                theme === 'dark'
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-red-100 text-red-500 hover:bg-red-200'
                            )}
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <p className={cn(
                            'text-xs mb-1',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                            {formatFileSize(uploadedFile.size)}
                        </p>
                        <p className={cn(
                            'text-lg font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            {uploadedFile.name}
                        </p>

                        <div className="flex items-center justify-center gap-2 mt-4">
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-500 text-sm font-medium">File processed</span>
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
            <div className={cn('space-y-4', className)}>
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

                <div className="flex items-center justify-between">
                    <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                        {leads.length} leads in this campaign
                    </p>
                    <div className="flex items-center gap-2">
                        {/* Edit Leads Button */}
                        <Button
                            variant="outline"
                            onClick={() => setShowLeadBuilder(true)}
                            className={cn(
                                'gap-2',
                                theme === 'dark'
                                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            )}
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Leads
                        </Button>

                        {/* Add Leads Dropdown */}
                        <div className="relative group">
                            <Button
                                className={cn(
                                    'gap-2',
                                    theme === 'dark'
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                )}
                            >
                                <Plus className="w-4 h-4" />
                                Add Leads
                                <ChevronDown className="w-3 h-3" />
                            </Button>
                            <div className={cn(
                                'absolute right-0 top-full mt-1 py-1 w-48 rounded-lg shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20',
                                theme === 'dark'
                                    ? 'bg-[#1a1a1a] border-gray-800'
                                    : 'bg-white border-gray-200'
                            )}>
                                <button
                                    onClick={() => setShowLeadBuilder(true)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                                        theme === 'dark'
                                            ? 'hover:bg-gray-800 text-gray-300'
                                            : 'hover:bg-gray-100 text-gray-700'
                                    )}
                                >
                                    <Plus className="w-4 h-4" />
                                    Create leads
                                </button>
                                <button
                                    onClick={() => document.getElementById('csv-upload-3')?.click()}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                                        theme === 'dark'
                                            ? 'hover:bg-gray-800 text-gray-300'
                                            : 'hover:bg-gray-100 text-gray-700'
                                    )}
                                >
                                    <Upload className="w-4 h-4" />
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

                {/* Schedule Preview Card */}
                {leads.filter(l => l.status === 'pending').length > 0 && (
                    <div className={cn(
                        'p-4 rounded-xl border',
                        theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                    )}>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className={cn(
                                'w-4 h-4',
                                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            )} />
                            <h4 className={cn(
                                'text-sm font-medium',
                                theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                            )}>
                                Email Schedule Preview
                            </h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {leads.filter(l => l.status === 'pending').slice(0, 6).map((lead, index) => {
                                const sendTime = new Date(Date.now() + (index * 10 * 60 * 1000)); // 10 min intervals
                                return (
                                    <div
                                        key={lead.id}
                                        className={cn(
                                            'p-2 rounded-lg text-center',
                                            theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'
                                        )}
                                    >
                                        <p className={cn(
                                            'text-xs font-medium truncate',
                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        )}>
                                            {lead.firstName || lead.email.split('@')[0]}
                                        </p>
                                        <p className={cn(
                                            'text-xs',
                                            index === 0
                                                ? 'text-emerald-500 font-medium'
                                                : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )}>
                                            {index === 0 ? 'Now' : `+${index * 10}min`}
                                        </p>
                                    </div>
                                );
                            })}
                            {leads.filter(l => l.status === 'pending').length > 6 && (
                                <div className={cn(
                                    'p-2 rounded-lg text-center flex items-center justify-center',
                                    theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'
                                )}>
                                    <p className={cn(
                                        'text-xs',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        +{leads.filter(l => l.status === 'pending').length - 6} more
                                    </p>
                                </div>
                            )}
                        </div>
                        <p className={cn(
                            'text-xs mt-3',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                            First email sends instantly, then every 10 minutes. Leads outside their working hours will be scheduled for later.
                        </p>
                    </div>
                )}

                <div className={cn(
                    'rounded-xl border overflow-hidden',
                    theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                )}>
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow className={cn(
                                    theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'
                                )}>
                                    <TableHead>#</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Scheduled</TableHead>
                                    <TableHead>Timezone</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead, index) => {
                                    // Calculate scheduled time based on pending position
                                    const pendingLeads = leads.filter(l => l.status === 'pending');
                                    const pendingIndex = pendingLeads.findIndex(l => l.id === lead.id);
                                    const isPending = lead.status === 'pending';

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
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            )}>
                                                {lead.email}
                                            </TableCell>
                                            <TableCell className={cn(
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                            )}>
                                                {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '-'}
                                            </TableCell>
                                            <TableCell className={cn(
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            )}>
                                                {lead.company || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {isPending ? (
                                                    <span className={cn(
                                                        'text-xs font-medium',
                                                        pendingIndex === 0
                                                            ? 'text-emerald-500'
                                                            : theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                                    )}>
                                                        {pendingIndex === 0 ? '🚀 Now' : `⏱ +${pendingIndex * 10}min`}
                                                    </span>
                                                ) : (
                                                    <span className={cn(
                                                        'text-xs',
                                                        lead.status === 'sent' ? 'text-gray-400' : 'text-gray-500'
                                                    )}>
                                                        {lead.status === 'sent' ? '✓ Sent' : '-'}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {lead.timezone ? (
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            'text-xs font-medium',
                                                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                                        )}>
                                                            {lead.timezone.split('/').pop()?.replace('_', ' ') || lead.timezone}
                                                        </span>
                                                        {lead.workingHoursStart && lead.workingHoursEnd && (
                                                            <span className={cn(
                                                                'text-xs',
                                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                            )}>
                                                                {lead.workingHoursStart} - {lead.workingHoursEnd}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : lead.country ? (
                                                    <span className={cn(
                                                        'text-xs',
                                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    )}>
                                                        {lead.country}
                                                    </span>
                                                ) : (
                                                    <span className={cn(
                                                        'text-xs',
                                                        theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                                                    )}>
                                                        Default
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    'px-2 py-1 rounded-full text-xs font-medium',
                                                    lead.status === 'sent' && 'bg-blue-500/20 text-blue-400',
                                                    lead.status === 'opened' && 'bg-emerald-500/20 text-emerald-400',
                                                    lead.status === 'clicked' && 'bg-purple-500/20 text-purple-400',
                                                    lead.status === 'replied' && 'bg-amber-500/20 text-amber-400',
                                                    lead.status === 'bounced' && 'bg-red-500/20 text-red-400',
                                                    lead.status === 'pending' && (theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                                                )}>
                                                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                                </span>
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
        </>
    );
}
