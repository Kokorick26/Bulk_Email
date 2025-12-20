import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileSpreadsheet, X, Check, AlertCircle,
    Users, Loader2, Trash2, Eye, ChevronDown, Ban,
    Mail, User, Building, Hash
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import { ScrollArea } from '../../ui/ScrollArea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/Table';
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
    { id: 'custom', label: 'Custom Field', icon: Hash },
    { id: 'ignore', label: 'Do not import', icon: Ban },
];

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

        // Check if samples look like emails
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (samples.some(s => emailPattern.test(s))) return 'email';

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

    const handleImportLeads = () => {
        // Convert parsed data to leads based on column mappings
        const newLeads: Lead[] = parsedData.map((row, index) => {
            const lead: Lead = {
                id: `lead-${Date.now()}-${index}`,
                email: '',
                status: 'pending',
                customFields: {},
                addedAt: new Date().toISOString()
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
                    case 'custom':
                        lead.customFields[mapping.customFieldName || mapping.columnName] = value;
                        break;
                }
            });

            return lead;
        }).filter(lead => lead.email && lead.email.includes('@'));

        onLeadsUpdate([...leads, ...newLeads]);
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

    // If no leads, show empty state with upload
    if (leads.length === 0) {
        return (
            <div className={cn('space-y-6', className)}>
                {/* Add Leads Button */}
                <div className="flex justify-end">
                    <Button
                        className={cn(
                            'gap-2',
                            theme === 'dark'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        )}
                        onClick={() => document.getElementById('csv-upload')?.click()}
                    >
                        Add Leads
                    </Button>
                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileInput}
                        className="hidden"
                    />
                </div>

                {/* Empty State */}
                <div className={cn(
                    'flex flex-col items-center justify-center py-20 px-4 rounded-xl border',
                    theme === 'dark'
                        ? 'bg-[#1a1a1a] border-gray-800'
                        : 'bg-white border-gray-200'
                )}>
                    {/* Illustration placeholder */}
                    <div className={cn(
                        'w-64 h-48 mb-6 flex items-center justify-center',
                        theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                    )}>
                        <svg viewBox="0 0 200 150" className="w-full h-full">
                            {/* Simple illustration of person with board */}
                            <rect x="40" y="20" width="80" height="60" rx="4" fill="currentColor" opacity="0.3" />
                            <rect x="50" y="30" width="30" height="5" rx="2" fill="currentColor" opacity="0.5" />
                            <rect x="50" y="40" width="50" height="5" rx="2" fill="currentColor" opacity="0.5" />
                            <rect x="50" y="50" width="40" height="5" rx="2" fill="currentColor" opacity="0.5" />
                            <rect x="50" y="60" width="55" height="5" rx="2" fill="currentColor" opacity="0.5" />
                            <circle cx="140" cy="45" r="15" fill="currentColor" opacity="0.4" />
                            <rect x="125" y="65" width="30" height="40" rx="3" fill="currentColor" opacity="0.3" />
                            <path d="M 60 120 L 80 100 L 100 110 L 120 95" stroke="currentColor" fill="none" strokeWidth="2" opacity="0.5" />
                        </svg>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">👋</span>
                        <p className={cn(
                            'text-lg font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Add some leads to get started
                        </p>
                    </div>

                    <Button
                        className={cn(
                            'gap-2',
                            theme === 'dark'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        )}
                        onClick={() => document.getElementById('csv-upload-2')?.click()}
                    >
                        Add Leads
                    </Button>
                    <input
                        id="csv-upload-2"
                        type="file"
                        accept=".csv"
                        onChange={handleFileInput}
                        className="hidden"
                    />
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
            </div>
        );
    }

    // Show leads list
    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex items-center justify-between">
                <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                    {leads.length} leads in this campaign
                </p>
                <Button
                    className={cn(
                        'gap-2',
                        theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                    onClick={() => document.getElementById('csv-upload-3')?.click()}
                >
                    Add More Leads
                </Button>
                <input
                    id="csv-upload-3"
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                />
            </div>

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
                                <TableHead>Email</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.map((lead) => (
                                <TableRow key={lead.id} className={cn(
                                    theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                                )}>
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
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
}
