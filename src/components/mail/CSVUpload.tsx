import { useState, useCallback } from 'react';
import {
    Upload, FileSpreadsheet, X, Check, AlertCircle,
    Users, Loader2, Trash2, Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { useTheme } from '../../lib/ThemeContext';

interface Recipient {
    email: string;
    name: string;
    [key: string]: string;
}

interface CSVUploadProps {
    onRecipientsLoaded: (recipients: Recipient[], headers: string[]) => void;
    recipients: Recipient[];
    className?: string;
}

export function CSVUpload({ onRecipientsLoaded, recipients, className }: CSVUploadProps) {
    const { theme } = useTheme();
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    const parseCSV = (text: string): { headers: string[]; data: Recipient[] } => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) throw new Error('Empty CSV file');

        const headerLine = lines[0];
        const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

        const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail' || h === 'email address');
        const nameIndex = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'fullname');

        if (emailIndex === -1) {
            throw new Error('CSV must have an "email" column');
        }

        const data: Recipient[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const recipient: Recipient = {
                email: values[emailIndex]?.trim() || '',
                name: nameIndex !== -1 ? values[nameIndex]?.trim() || '' : '',
            };

            headers.forEach((header, idx) => {
                if (header !== 'email' && header !== 'name') {
                    recipient[header] = values[idx]?.trim() || '';
                }
            });

            if (recipient.email && recipient.email.includes('@')) {
                data.push(recipient);
            }
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

    const handleFile = async (file: File) => {
        setLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const { headers, data } = parseCSV(text);
            setHeaders(headers);
            onRecipientsLoaded(data, headers);
            setShowPreview(data.length > 0);
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

    const clearRecipients = () => {
        onRecipientsLoaded([], []);
        setHeaders([]);
        setShowPreview(false);
    };

    return (
        <div className={cn('space-y-4', className)}>
            {recipients.length === 0 ? (
                // Upload Zone - Gmail Style
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        'relative border-2 border-dashed rounded-lg p-10 transition-all text-center',
                        isDragging
                            ? theme === 'dark'
                                ? 'border-[#8ab4f8] bg-[#394457]'
                                : 'border-[#1a73e8] bg-[#e8f0fe]'
                            : theme === 'dark'
                                ? 'border-[#3c4043] hover:border-[#8ab4f8] hover:bg-[#303134]'
                                : 'border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f8f9fa]',
                        loading && 'opacity-50 pointer-events-none'
                    )}
                >
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className={cn('w-10 h-10 animate-spin', theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]')} />
                            <p className={theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'}>Processing CSV...</p>
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileInput}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className={cn(
                                    'w-14 h-14 rounded-full flex items-center justify-center',
                                    theme === 'dark' ? 'bg-[#394457]' : 'bg-[#e8f0fe]'
                                )}>
                                    <Upload className={cn('w-7 h-7', theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]')} />
                                </div>
                                <div>
                                    <p className={cn('font-medium', theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]')}>
                                        Drop your CSV file here
                                    </p>
                                    <p className={cn('text-sm mt-1', theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')}>
                                        or click to browse
                                    </p>
                                </div>
                                <p className={cn(
                                    'text-xs mt-2 px-3 py-1.5 rounded-full',
                                    theme === 'dark' ? 'bg-[#3c4043] text-[#9aa0a6]' : 'bg-[#f1f3f4] text-[#5f6368]'
                                )}>
                                    Required: email column • Optional: name, custom fields
                                </p>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                // Recipients Summary - Gmail Style
                <div className="gmail-card overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-[#dadce0]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e6f4ea] flex items-center justify-center">
                                <Check className="w-5 h-5 text-[#1e8e3e]" />
                            </div>
                            <div>
                                <h3 className="font-medium text-[#202124]">
                                    {recipients.length} Recipients Loaded
                                </h3>
                                <p className="text-sm text-[#5f6368]">
                                    Fields: {headers.join(', ')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#dadce0] text-sm text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                {showPreview ? 'Hide' : 'Preview'}
                            </button>
                            <button
                                onClick={clearRecipients}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#fce8e6] text-sm text-[#d93025] hover:bg-[#fce8e6] transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear
                            </button>
                        </div>
                    </div>

                    {showPreview && (
                        <div className="p-4">
                            <ScrollArea className="h-[200px] border border-[#dadce0] rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-[#f8f9fa]">
                                            <TableHead className="w-[50px] text-[#5f6368]">#</TableHead>
                                            {headers.map((h) => (
                                                <TableHead key={h} className="capitalize text-[#5f6368]">{h}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recipients.slice(0, 50).map((r, idx) => (
                                            <TableRow key={idx} className="hover:bg-[#f8f9fa]">
                                                <TableCell className="text-[#5f6368]">{idx + 1}</TableCell>
                                                {headers.map((h) => (
                                                    <TableCell key={h} className="text-[#202124]">{r[h] || '-'}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {recipients.length > 50 && (
                                    <p className="text-center text-sm text-[#5f6368] py-2 bg-[#f8f9fa]">
                                        Showing first 50 of {recipients.length} recipients
                                    </p>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-[#d93025] bg-[#fce8e6] px-4 py-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto hover:bg-[#f8d7da] p-1 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
