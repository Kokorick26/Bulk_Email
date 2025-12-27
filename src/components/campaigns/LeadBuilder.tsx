import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Check, X, GripVertical, Copy,
    ChevronDown, MoreHorizontal, Mail, User, Building,
    Globe, Clock, Download, Upload
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';
import type { Lead } from './types';

interface LeadBuilderProps {
    leads: Lead[];
    onLeadsUpdate: (leads: Lead[]) => void;
    onClose: () => void;
    className?: string;
}

interface EditableCell {
    rowId: string;
    field: string;
}

// Column definitions
const columns = [
    { id: 'email', label: 'Email', icon: Mail, width: 'w-64', required: true },
    { id: 'firstName', label: 'First Name', icon: User, width: 'w-32' },
    { id: 'lastName', label: 'Last Name', icon: User, width: 'w-32' },
    { id: 'company', label: 'Company', icon: Building, width: 'w-40' },
    { id: 'country', label: 'Country', icon: Globe, width: 'w-32' },
    { id: 'timezone', label: 'Timezone', icon: Clock, width: 'w-40' },
];

// Country options for dropdown
const countryOptions = [
    { value: '', label: 'Select...' },
    { value: 'USA', label: '🇺🇸 United States' },
    { value: 'UK', label: '🇬🇧 United Kingdom' },
    { value: 'India', label: '🇮🇳 India' },
    { value: 'Germany', label: '🇩🇪 Germany' },
    { value: 'France', label: '🇫🇷 France' },
    { value: 'Canada', label: '🇨🇦 Canada' },
    { value: 'Australia', label: '🇦🇺 Australia' },
    { value: 'Japan', label: '🇯🇵 Japan' },
    { value: 'Singapore', label: '🇸🇬 Singapore' },
    { value: 'UAE', label: '🇦🇪 UAE' },
    { value: 'Netherlands', label: '🇳🇱 Netherlands' },
    { value: 'Spain', label: '🇪🇸 Spain' },
    { value: 'Italy', label: '🇮🇹 Italy' },
    { value: 'Brazil', label: '🇧🇷 Brazil' },
    { value: 'Mexico', label: '🇲🇽 Mexico' },
];

// Timezone options
const timezoneOptions = [
    { value: '', label: 'Auto (from country)' },
    { value: 'America/New_York', label: 'Eastern (US)' },
    { value: 'America/Chicago', label: 'Central (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific (US)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Asia/Kolkata', label: 'India' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Australia/Sydney', label: 'Sydney' },
];

export function LeadBuilder({ leads, onLeadsUpdate, onClose, className }: LeadBuilderProps) {
    const { theme } = useTheme();
    const [localLeads, setLocalLeads] = useState<Lead[]>(leads);
    const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            // Only call select() if it's an input element (not a select)
            if (typeof inputRef.current.select === 'function') {
                inputRef.current.select();
            }
        }
    }, [editingCell]);

    // Create a new empty lead
    const createEmptyLead = useCallback((): Lead => ({
        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        country: '',
        timezone: '',
        status: 'pending',
        customFields: {},
        addedAt: new Date().toISOString(),
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }), []);

    // Add new row
    const addRow = useCallback(() => {
        const newLead = createEmptyLead();
        setLocalLeads(prev => [...prev, newLead]);
        // Immediately start editing the email cell
        setTimeout(() => {
            setEditingCell({ rowId: newLead.id, field: 'email' });
            setEditValue('');
        }, 50);
    }, [createEmptyLead]);

    // Delete selected rows
    const deleteSelectedRows = useCallback(() => {
        setLocalLeads(prev => prev.filter(lead => !selectedRows.has(lead.id)));
        setSelectedRows(new Set());
    }, [selectedRows]);

    // Delete single row
    const deleteRow = useCallback((id: string) => {
        setLocalLeads(prev => prev.filter(lead => lead.id !== id));
        selectedRows.delete(id);
        setSelectedRows(new Set(selectedRows));
    }, [selectedRows]);

    // Start editing a cell
    const startEditing = useCallback((rowId: string, field: string, currentValue: string) => {
        setEditingCell({ rowId, field });
        setEditValue(currentValue || '');
    }, []);

    // Save cell edit
    const saveEdit = useCallback(() => {
        if (!editingCell) return;

        setLocalLeads(prev => prev.map(lead => {
            if (lead.id === editingCell.rowId) {
                return { ...lead, [editingCell.field]: editValue };
            }
            return lead;
        }));
        setEditingCell(null);
        setEditValue('');
    }, [editingCell, editValue]);

    // Cancel edit
    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        setEditValue('');
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
        if (e.key === 'Enter') {
            saveEdit();
            // Move to next row
            if (rowIndex < localLeads.length - 1) {
                const nextLead = localLeads[rowIndex + 1];
                startEditing(nextLead.id, columns[colIndex].id, (nextLead as any)[columns[colIndex].id] || '');
            }
        } else if (e.key === 'Escape') {
            cancelEdit();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            saveEdit();
            // Move to next column or next row
            if (colIndex < columns.length - 1) {
                const currentLead = localLeads[rowIndex];
                startEditing(currentLead.id, columns[colIndex + 1].id, (currentLead as any)[columns[colIndex + 1].id] || '');
            } else if (rowIndex < localLeads.length - 1) {
                const nextLead = localLeads[rowIndex + 1];
                startEditing(nextLead.id, columns[0].id, (nextLead as any)[columns[0].id] || '');
            }
        }
    }, [saveEdit, cancelEdit, startEditing, localLeads]);

    // Toggle row selection
    const toggleRowSelection = useCallback((id: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    }, [selectedRows]);

    // Toggle all selection
    const toggleAllSelection = useCallback(() => {
        if (selectedRows.size === localLeads.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(localLeads.map(l => l.id)));
        }
    }, [selectedRows, localLeads]);

    // Duplicate selected rows
    const duplicateSelectedRows = useCallback(() => {
        const newLeads = localLeads.filter(l => selectedRows.has(l.id)).map(lead => ({
            ...lead,
            id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            addedAt: new Date().toISOString()
        }));
        setLocalLeads(prev => [...prev, ...newLeads]);
        setSelectedRows(new Set());
    }, [localLeads, selectedRows]);

    // Save all and close
    const handleSave = useCallback(() => {
        // Filter out leads without email
        const validLeads = localLeads.filter(lead => lead.email && lead.email.includes('@'));
        onLeadsUpdate(validLeads);
        onClose();
    }, [localLeads, onLeadsUpdate, onClose]);

    // Export as CSV
    const exportCSV = useCallback(() => {
        const headers = columns.map(c => c.id).join(',');
        const rows = localLeads.map(lead =>
            columns.map(c => `"${((lead as any)[c.id] || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads.csv';
        a.click();
        URL.revokeObjectURL(url);
    }, [localLeads]);

    // Render editable cell
    const renderCell = (lead: Lead, field: string, rowIndex: number, colIndex: number) => {
        const isEditing = editingCell?.rowId === lead.id && editingCell?.field === field;
        const value = (lead as any)[field] || '';

        // Special rendering for dropdowns
        if (field === 'country' && isEditing) {
            return (
                <select
                    ref={inputRef as any}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    className={cn(
                        'w-full h-full px-2 py-1 text-sm border-2 rounded outline-none',
                        theme === 'dark'
                            ? 'bg-[#252525] border-blue-500 text-white'
                            : 'bg-white border-blue-500 text-gray-900'
                    )}
                >
                    {countryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        if (field === 'timezone' && isEditing) {
            return (
                <select
                    ref={inputRef as any}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    className={cn(
                        'w-full h-full px-2 py-1 text-sm border-2 rounded outline-none',
                        theme === 'dark'
                            ? 'bg-[#252525] border-blue-500 text-white'
                            : 'bg-white border-blue-500 text-gray-900'
                    )}
                >
                    {timezoneOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        if (isEditing) {
            return (
                <input
                    ref={inputRef}
                    type={field === 'email' ? 'email' : 'text'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    className={cn(
                        'w-full h-full px-2 py-1 text-sm border-2 rounded outline-none',
                        theme === 'dark'
                            ? 'bg-[#252525] border-blue-500 text-white'
                            : 'bg-white border-blue-500 text-gray-900'
                    )}
                    placeholder={`Enter ${field}...`}
                />
            );
        }

        return (
            <div
                onClick={() => startEditing(lead.id, field, value)}
                className={cn(
                    'w-full h-full px-2 py-1.5 cursor-text text-sm truncate',
                    'hover:bg-blue-500/10 rounded transition-colors',
                    value ? '' : 'text-gray-400 italic'
                )}
            >
                {value || `Add ${field}...`}
            </div>
        );
    };

    return (
        <div className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4',
            className
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                    'relative w-full max-w-6xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden',
                    theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'
                )}
            >
                {/* Header */}
                <div className={cn(
                    'flex items-center justify-between px-6 py-4 border-b',
                    theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                )}>
                    <div>
                        <h2 className={cn(
                            'text-lg font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Lead Builder
                        </h2>
                        <p className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            Create and edit leads directly • {localLeads.length} leads
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={exportCSV}
                            className={cn(
                                'gap-2',
                                theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </Button>
                        <button
                            onClick={onClose}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            )}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    theme === 'dark' ? 'border-gray-800 bg-[#252525]' : 'border-gray-100 bg-gray-50'
                )}>
                    <div className="flex items-center gap-2">
                        {selectedRows.size > 0 ? (
                            <>
                                <span className={cn(
                                    'text-sm font-medium',
                                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                )}>
                                    {selectedRows.size} selected
                                </span>
                                <button
                                    onClick={duplicateSelectedRows}
                                    className={cn(
                                        'flex items-center gap-1 px-2 py-1 text-xs rounded',
                                        theme === 'dark'
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    )}
                                >
                                    <Copy className="w-3 h-3" />
                                    Duplicate
                                </button>
                                <button
                                    onClick={deleteSelectedRows}
                                    className={cn(
                                        'flex items-center gap-1 px-2 py-1 text-xs rounded',
                                        'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    )}
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            </>
                        ) : (
                            <span className={cn(
                                'text-sm',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )}>
                                Click any cell to edit • Tab to move between cells • Enter to save
                            </span>
                        )}
                    </div>
                    <button
                        onClick={addRow}
                        className={cn(
                            'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                            theme === 'dark'
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        Add Lead
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className={cn(
                            'sticky top-0 z-10',
                            theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'
                        )}>
                            <tr className={cn(
                                'border-b',
                                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                            )}>
                                {/* Checkbox */}
                                <th className="w-10 px-2 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.size === localLeads.length && localLeads.length > 0}
                                        onChange={toggleAllSelection}
                                        className="w-4 h-4 rounded"
                                    />
                                </th>
                                {/* Row number */}
                                <th className={cn(
                                    'w-12 px-2 py-3 text-left text-xs font-medium uppercase tracking-wider',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )}>
                                    #
                                </th>
                                {/* Data columns */}
                                {columns.map(col => (
                                    <th
                                        key={col.id}
                                        className={cn(
                                            'px-2 py-3 text-left text-xs font-medium uppercase tracking-wider',
                                            col.width,
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <col.icon className="w-3.5 h-3.5" />
                                            {col.label}
                                            {col.required && <span className="text-red-400">*</span>}
                                        </div>
                                    </th>
                                ))}
                                {/* Actions */}
                                <th className="w-16 px-2 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {localLeads.map((lead, rowIndex) => (
                                <tr
                                    key={lead.id}
                                    className={cn(
                                        'group border-b transition-colors',
                                        theme === 'dark'
                                            ? 'border-gray-800 hover:bg-[#252525]'
                                            : 'border-gray-100 hover:bg-gray-50',
                                        selectedRows.has(lead.id) && (theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50')
                                    )}
                                >
                                    {/* Checkbox */}
                                    <td className="px-2 py-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(lead.id)}
                                            onChange={() => toggleRowSelection(lead.id)}
                                            className="w-4 h-4 rounded"
                                        />
                                    </td>
                                    {/* Row number */}
                                    <td className={cn(
                                        'px-2 py-1 text-xs font-mono',
                                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                    )}>
                                        {rowIndex + 1}
                                    </td>
                                    {/* Data cells */}
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={col.id}
                                            className={cn(
                                                'px-1 py-0.5',
                                                col.width
                                            )}
                                        >
                                            {renderCell(lead, col.id, rowIndex, colIndex)}
                                        </td>
                                    ))}
                                    {/* Actions */}
                                    <td className="px-2 py-1">
                                        <button
                                            onClick={() => deleteRow(lead.id)}
                                            className={cn(
                                                'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                                                theme === 'dark'
                                                    ? 'hover:bg-red-500/20 text-red-400'
                                                    : 'hover:bg-red-50 text-red-500'
                                            )}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* Add row button at bottom */}
                            <tr>
                                <td colSpan={columns.length + 3} className="px-2 py-2">
                                    <button
                                        onClick={addRow}
                                        className={cn(
                                            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                                            theme === 'dark'
                                                ? 'text-gray-500 hover:bg-[#252525] hover:text-gray-300'
                                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                        )}
                                    >
                                        <Plus className="w-4 h-4" />
                                        New lead
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className={cn(
                    'flex items-center justify-between px-6 py-4 border-t',
                    theme === 'dark' ? 'border-gray-800 bg-[#252525]' : 'border-gray-200 bg-gray-50'
                )}>
                    <div className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>
                        {localLeads.filter(l => l.email && l.email.includes('@')).length} valid leads
                        {localLeads.filter(l => !l.email || !l.email.includes('@')).length > 0 && (
                            <span className="text-amber-500 ml-2">
                                ({localLeads.filter(l => !l.email || !l.email.includes('@')).length} missing email)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Save {localLeads.filter(l => l.email && l.email.includes('@')).length} Leads
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
