import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Users, Search, Trash2, Edit3, Download, Upload,
    MoreHorizontal, FolderPlus, ChevronRight, CheckCircle2,
    X, Clock, Globe, Loader2, Mail, Send, Megaphone,
    ShieldCheck, AlertTriangle, XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../lib/ThemeContext';
import { Button } from '../components/ui/Button';
import { ScrollArea } from '../components/ui/ScrollArea';
import type { Lead } from '../components/campaigns/types';

// Lead List interface
interface LeadList {
    id: string;
    name: string;
    description?: string;
    leads: Lead[];
    createdAt: string;
    updatedAt: string;
    tags?: string[];
}

// Campaign interface for export
interface Campaign {
    id: string;
    name: string;
    status: string;
}

// Column definitions for the inline editor
const columns = [
    { id: 'email', label: 'Email', width: 'w-64', required: true },
    { id: 'firstName', label: 'First Name', width: 'w-32' },
    { id: 'lastName', label: 'Last Name', width: 'w-32' },
    { id: 'company', label: 'Company', width: 'w-40' },
    { id: 'country', label: 'Country', width: 'w-32' },
    { id: 'timezone', label: 'Timezone', width: 'w-40' },
    { id: 'bounceStatus', label: 'Status', width: 'w-24' },
];

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
];

const timezoneOptions = [
    { value: '', label: 'Auto (from country)' },
    { value: 'America/New_York', label: 'Eastern (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific (US)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Asia/Kolkata', label: 'India' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' },
];

interface LeadListsPageProps {
    onNavigateToCampaign?: (campaignId: string) => void;
}

export function LeadListsPage({ onNavigateToCampaign }: LeadListsPageProps) {
    const { theme } = useTheme();
    const [leadLists, setLeadLists] = useState<LeadList[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedList, setSelectedList] = useState<LeadList | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');

    // Inline editing state
    const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // Export to campaign state
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Bounce checking state
    const [checkingBounces, setCheckingBounces] = useState(false);
    const [bounceResults, setBounceResults] = useState<Record<string, { status: string; reason: string }>>({});

    // Check email bounces
    const checkEmailBounces = useCallback(async () => {
        if (!selectedList || selectedList.leads.length === 0) return;

        setCheckingBounces(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const emails = selectedList.leads.map(l => l.email).filter(Boolean);

            const response = await fetch('/api/bulk-email/validate-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ emails })
            });

            if (response.ok) {
                const data = await response.json();
                const resultsMap: Record<string, { status: string; reason: string }> = {};
                for (const result of data.results || []) {
                    resultsMap[result.email] = { status: result.status, reason: result.reason };
                }
                setBounceResults(resultsMap);

                // Update leads with bounce status
                const updatedLeads = selectedList.leads.map(lead => ({
                    ...lead,
                    bounceStatus: resultsMap[lead.email]?.status || 'unknown'
                }));
                const updatedList = { ...selectedList, leads: updatedLeads };
                setSelectedList(updatedList);
                saveList(updatedList);
            }
        } catch (err) {
            console.error('Error checking bounces:', err);
        } finally {
            setCheckingBounces(false);
        }
    }, [selectedList]);

    // Fetch lead lists
    const fetchLeadLists = useCallback(async () => {
        try {
            setLoading(true);
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
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeadLists();
    }, [fetchLeadLists]);

    // Fetch campaigns for export
    const fetchCampaigns = useCallback(async () => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/bulk-email/campaigns', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data || []);
            }
        } catch (err) {
            console.error('Error fetching campaigns:', err);
        }
    }, []);

    // Export leads to campaign
    const exportToCampaign = async (campaignId: string) => {
        if (!selectedList || selectedList.leads.length === 0) return;

        setExporting(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');

            // Get existing campaign
            const campaignRes = await fetch(`/api/bulk-email/campaigns/${campaignId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!campaignRes.ok) {
                alert('Failed to fetch campaign');
                setExporting(false);
                return;
            }

            const campaign = await campaignRes.json();
            const existingLeads = campaign.leads || [];

            // Merge leads (avoid duplicates by email)
            const existingEmails = new Set(existingLeads.map((l: Lead) => l.email.toLowerCase()));
            const newLeads = selectedList.leads.filter(l => l.email && !existingEmails.has(l.email.toLowerCase()));
            const mergedLeads = [...existingLeads, ...newLeads];

            // Update campaign with merged leads
            const updateRes = await fetch(`/api/bulk-email/campaigns/${campaignId}/leads`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ leads: mergedLeads })
            });

            if (updateRes.ok) {
                const resultData = await updateRes.json();
                alert(`Successfully exported ${newLeads.length} new leads to "${campaign.name || 'campaign'}"! Total leads: ${resultData.count || mergedLeads.length}`);
                setShowExportModal(false);
            } else {
                const errorData = await updateRes.json();
                alert(`Failed to export leads: ${errorData.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error exporting to campaign:', err);
            alert('Failed to export leads to campaign. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // Save leads for campaign creation
    const saveToCampaign = () => {
        if (!selectedList || selectedList.leads.length === 0) {
            alert('No leads to send to campaign');
            return;
        }
        localStorage.setItem('pendingCampaignLeads', JSON.stringify(selectedList.leads));
        localStorage.setItem('pendingCampaignListName', selectedList.name);
        alert(`${selectedList.leads.length} leads from "${selectedList.name}" are ready! Now create a campaign to import them.`);
    };

    // Create new campaign with leads from current list
    const [newCampaignName, setNewCampaignName] = useState('');
    const [creatingCampaign, setCreatingCampaign] = useState(false);

    const createNewCampaignWithLeads = async () => {
        if (!selectedList || selectedList.leads.length === 0) return;

        const campaignName = newCampaignName.trim() || `Campaign from ${selectedList.name}`;

        setCreatingCampaign(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');

            // Create new campaign with leads already included
            const response = await fetch('/api/bulk-email/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: campaignName,
                    status: 'draft',
                    leads: selectedList.leads,
                    totalRecipients: selectedList.leads.length
                })
            });

            if (response.ok) {
                const data = await response.json();
                setShowExportModal(false);
                setNewCampaignName('');

                // Navigate to the new campaign
                if (onNavigateToCampaign && data.id) {
                    onNavigateToCampaign(data.id);
                } else {
                    alert(`Campaign "${campaignName}" created with ${selectedList.leads.length} leads! Go to Campaigns to view it.`);
                }
            } else {
                const errorData = await response.json();
                alert(`Failed to create campaign: ${errorData.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error creating campaign:', err);
            alert('Failed to create campaign. Please try again.');
        } finally {
            setCreatingCampaign(false);
        }
    };

    // Create new list
    const createList = async () => {
        if (!newListName.trim()) return;

        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/bulk-email/lead-lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newListName,
                    description: newListDescription,
                    leads: []
                })
            });

            if (response.ok) {
                const data = await response.json();
                setLeadLists(prev => [...prev, data.list]);
                setSelectedList(data.list);
                setShowCreateModal(false);
                setNewListName('');
                setNewListDescription('');
            }
        } catch (err) {
            console.error('Error creating list:', err);
        }
    };

    // Delete list
    const deleteList = async (listId: string) => {
        if (!confirm('Are you sure you want to delete this list?')) return;

        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/lead-lists/${listId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            setLeadLists(prev => prev.filter(l => l.id !== listId));
            if (selectedList?.id === listId) {
                setSelectedList(null);
            }
        } catch (err) {
            console.error('Error deleting list:', err);
        }
    };

    // Save list (update leads)
    const saveList = async (list: LeadList) => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/lead-lists/${list.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: list.name,
                    description: list.description,
                    leads: list.leads
                })
            });

            setLeadLists(prev => prev.map(l => l.id === list.id ? list : l));
        } catch (err) {
            console.error('Error saving list:', err);
        }
    };

    // Add lead to current list
    const addLead = useCallback(() => {
        if (!selectedList) return;

        const newLead: Lead = {
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
        };

        const updatedList = {
            ...selectedList,
            leads: [...selectedList.leads, newLead],
            updatedAt: new Date().toISOString()
        };

        setSelectedList(updatedList);
        saveList(updatedList);

        // Start editing the email
        setTimeout(() => {
            setEditingCell({ rowId: newLead.id, field: 'email' });
            setEditValue('');
        }, 50);
    }, [selectedList]);

    // Update lead in list
    const updateLead = useCallback((leadId: string, field: string, value: string) => {
        if (!selectedList) return;

        const updatedLeads = selectedList.leads.map(lead =>
            lead.id === leadId ? { ...lead, [field]: value } : lead
        );

        const updatedList = {
            ...selectedList,
            leads: updatedLeads,
            updatedAt: new Date().toISOString()
        };

        setSelectedList(updatedList);
        saveList(updatedList);
    }, [selectedList]);

    // Delete leads
    const deleteSelectedLeads = useCallback(() => {
        if (!selectedList || selectedRows.size === 0) return;

        const updatedLeads = selectedList.leads.filter(l => !selectedRows.has(l.id));
        const updatedList = {
            ...selectedList,
            leads: updatedLeads,
            updatedAt: new Date().toISOString()
        };

        setSelectedList(updatedList);
        saveList(updatedList);
        setSelectedRows(new Set());
    }, [selectedList, selectedRows]);

    // Export as CSV
    const exportCSV = useCallback(() => {
        if (!selectedList) return;

        const headers = columns.map(c => c.id).join(',');
        const rows = selectedList.leads.map(lead =>
            columns.map(c => `"${((lead as any)[c.id] || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedList.name.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [selectedList]);

    // Handle CSV import
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedList) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim());
            if (lines.length < 2) return;

            // Parse headers - handle both comma and tab delimited
            const delimiter = lines[0].includes('\t') ? '\t' : ',';
            const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));

            // Find column indices with flexible matching
            const findColumn = (...patterns: string[]) => {
                return headers.findIndex(h =>
                    patterns.some(p => h === p || h.includes(p))
                );
            };

            const emailIdx = findColumn('email', 'e-mail', 'mail');
            const firstNameIdx = findColumn('firstname', 'first_name', 'first name', 'first');
            const lastNameIdx = findColumn('lastname', 'last_name', 'last name', 'last');
            const nameIdx = findColumn('name', 'full_name', 'fullname'); // Single name column
            const companyIdx = findColumn('company', 'organization', 'org');
            const countryIdx = findColumn('country', 'location');
            const timezoneIdx = findColumn('timezone', 'time_zone', 'tz');

            if (emailIdx === -1) {
                alert('CSV must have an email column');
                return;
            }

            const newLeads: Lead[] = [];
            for (let i = 1; i < lines.length; i++) {
                // Parse CSV values properly (handle quoted values with commas)
                const values: string[] = [];
                let current = '';
                let inQuotes = false;
                for (const char of lines[i]) {
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === delimiter && !inQuotes) {
                        values.push(current.trim().replace(/^"|"$/g, ''));
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim().replace(/^"|"$/g, ''));

                const email = values[emailIdx];
                if (email && email.includes('@')) {
                    let firstName = firstNameIdx >= 0 ? values[firstNameIdx] || '' : '';
                    let lastName = lastNameIdx >= 0 ? values[lastNameIdx] || '' : '';

                    // If no firstName/lastName but we have a 'name' column, split it
                    if (!firstName && !lastName && nameIdx >= 0 && values[nameIdx]) {
                        const nameParts = values[nameIdx].trim().split(/\s+/);
                        firstName = nameParts[0] || '';
                        lastName = nameParts.slice(1).join(' ') || '';
                    }

                    newLeads.push({
                        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        email,
                        firstName,
                        lastName,
                        company: companyIdx >= 0 ? values[companyIdx] || '' : '',
                        country: countryIdx >= 0 ? values[countryIdx] || '' : '',
                        timezone: timezoneIdx >= 0 ? values[timezoneIdx] || '' : '',
                        status: 'pending',
                        customFields: {},
                        addedAt: new Date().toISOString()
                    });
                }
            }

            const updatedList = {
                ...selectedList,
                leads: [...selectedList.leads, ...newLeads],
                updatedAt: new Date().toISOString()
            };

            setSelectedList(updatedList);
            saveList(updatedList);
            alert(`Successfully imported ${newLeads.length} leads!`);
        };
        reader.readAsText(file);
        e.target.value = '';
    }, [selectedList]);

    // Render cell
    const renderCell = (lead: Lead, field: string) => {
        const isEditing = editingCell?.rowId === lead.id && editingCell?.field === field;
        const value = (lead as any)[field] || '';

        // Special handling for bounceStatus column - read-only with icons
        if (field === 'bounceStatus') {
            const status = (lead as any).bounceStatus || bounceResults[lead.email]?.status;
            if (!status) {
                return (
                    <span className={cn('text-[10px]', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
                        —
                    </span>
                );
            }
            if (status === 'valid') {
                return (
                    <div className="flex items-center gap-1" title="Valid email">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-[10px] text-green-500">Valid</span>
                    </div>
                );
            }
            if (status === 'invalid') {
                return (
                    <div className="flex items-center gap-1" title={bounceResults[lead.email]?.reason || 'Invalid'}>
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[10px] text-red-500">Invalid</span>
                    </div>
                );
            }
            if (status === 'risky') {
                return (
                    <div className="flex items-center gap-1" title={bounceResults[lead.email]?.reason || 'Risky'}>
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-[10px] text-yellow-500">Risky</span>
                    </div>
                );
            }
            return <span className="text-[10px] text-gray-500">{status}</span>;
        }

        if (isEditing) {
            if (field === 'country') {
                return (
                    <select
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                            updateLead(lead.id, field, editValue);
                            setEditingCell(null);
                        }}
                        onKeyDown={(e) => e.key === 'Escape' && setEditingCell(null)}
                        className={cn(
                            'w-full px-2 py-1 text-xs border-2 rounded outline-none',
                            theme === 'dark'
                                ? 'bg-neutral-800 border-blue-500 text-white'
                                : 'bg-white border-blue-500 text-gray-900'
                        )}
                    >
                        {countryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            }

            if (field === 'timezone') {
                return (
                    <select
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                            updateLead(lead.id, field, editValue);
                            setEditingCell(null);
                        }}
                        onKeyDown={(e) => e.key === 'Escape' && setEditingCell(null)}
                        className={cn(
                            'w-full px-2 py-1 text-xs border-2 rounded outline-none',
                            theme === 'dark'
                                ? 'bg-neutral-800 border-blue-500 text-white'
                                : 'bg-white border-blue-500 text-gray-900'
                        )}
                    >
                        {timezoneOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            }

            return (
                <input
                    autoFocus
                    type={field === 'email' ? 'email' : 'text'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                        updateLead(lead.id, field, editValue);
                        setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            updateLead(lead.id, field, editValue);
                            setEditingCell(null);
                        } else if (e.key === 'Escape') {
                            setEditingCell(null);
                        }
                    }}
                    className={cn(
                        'w-full px-2 py-1 text-xs border-2 rounded outline-none',
                        theme === 'dark'
                            ? 'bg-neutral-800 border-blue-500 text-white'
                            : 'bg-white border-blue-500 text-gray-900'
                    )}
                    placeholder={`Enter ${field}...`}
                />
            );
        }

        return (
            <div
                onClick={() => {
                    setEditingCell({ rowId: lead.id, field });
                    setEditValue(value);
                }}
                className={cn(
                    'w-full px-1.5 py-1 cursor-text text-xs truncate rounded',
                    'hover:bg-blue-500/10 transition-colors',
                    value ? '' : 'text-gray-400 italic'
                )}
            >
                {value || `Add ${field}...`}
            </div>
        );
    };

    // Filtered lists
    const filteredLists = leadLists.filter(list =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!selectedList && filteredLists.length > 0) {
            setSelectedList(filteredLists[0]);
        }
    }, [filteredLists, selectedList]);

    return (
        <div className="flex flex-1 min-h-0">
            {/* Sidebar - List of Lead Lists */}
            <div className={cn(
                'w-[260px] flex-shrink-0 flex flex-col border-r',
                theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-200'
            )}>
                {/* Sidebar Header */}
                <div className={cn(
                    'px-3 py-3 border-b',
                    theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'
                )}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className={cn(
                            'text-xs font-semibold',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Lead Lists
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            New
                        </button>
                    </div>

                    {/* Search */}
                    <div className={cn(
                        'flex items-center gap-2 h-8 px-2.5 rounded',
                        theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                    )}>
                        <Search className={cn('w-3.5 h-3.5', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                        <input
                            type="text"
                            placeholder="Search lists..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'flex-1 bg-transparent border-0 outline-none text-[11px]',
                                theme === 'dark' ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                    </div>
                </div>

                {/* Lists */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-0.5">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className={cn('w-4 h-4 animate-spin', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                            </div>
                        ) : filteredLists.length === 0 ? (
                            <div className="text-center py-10 px-3">
                                <div className={cn(
                                    'w-10 h-10 rounded mx-auto mb-2 flex items-center justify-center',
                                    theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                                )}>
                                    <Users className={cn('w-5 h-5', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                                </div>
                                <p className={cn('text-[11px] font-medium mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                    No lists yet
                                </p>
                                <p className={cn('text-[10px] mb-2', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                    Create your first lead list
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="text-[10px] text-orange-500 hover:underline font-medium"
                                >
                                    Create list →
                                </button>
                            </div>
                        ) : (
                            filteredLists.map(list => {
                                const isActive = selectedList?.id === list.id;
                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => setSelectedList(list)}
                                        className={cn(
                                            'w-full flex items-center gap-2 p-2 rounded text-left transition-all group',
                                            isActive
                                                ? theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                                                : theme === 'dark' ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-7 h-7 rounded flex items-center justify-center shrink-0',
                                            isActive
                                                ? 'bg-orange-500'
                                                : theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                                        )}>
                                            <Users className={cn(
                                                'w-3.5 h-3.5',
                                                isActive ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                'text-[11px] font-medium truncate',
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            )}>
                                                {list.name}
                                            </p>
                                            <p className={cn(
                                                'text-[9px]',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>
                                                {list.leads.length} leads
                                            </p>
                                        </div>
                                        <ChevronRight className={cn(
                                            'w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        )} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content - Lead Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedList ? (
                    <>
                        {/* Header */}
                        <div className={cn(
                            'flex items-center justify-between px-4 py-3 border-b',
                            theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                        )}>
                            <div>
                                <h1 className={cn(
                                    'text-sm font-semibold',
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    {selectedList.name}
                                </h1>
                                <p className={cn(
                                    'text-[10px]',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )}>
                                    {selectedList.leads.length} leads • Last updated {new Date(selectedList.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => document.getElementById('csv-import')?.click()}
                                    className={cn(
                                        'flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium border transition-colors',
                                        theme === 'dark'
                                            ? 'border-neutral-700 text-gray-300 hover:bg-neutral-800'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    )}
                                >
                                    <Upload className="w-3 h-3" />
                                    Import
                                </button>
                                <input
                                    id="csv-import"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={exportCSV}
                                    className={cn(
                                        'flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium border transition-colors',
                                        theme === 'dark'
                                            ? 'border-neutral-700 text-gray-300 hover:bg-neutral-800'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    )}
                                >
                                    <Download className="w-3 h-3" />
                                    Export
                                </button>
                                <button
                                    onClick={checkEmailBounces}
                                    disabled={checkingBounces || selectedList.leads.length === 0}
                                    className={cn(
                                        'flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium border transition-colors',
                                        theme === 'dark'
                                            ? 'border-blue-500/50 text-blue-400 hover:bg-blue-500/20'
                                            : 'border-blue-300 text-blue-600 hover:bg-blue-50',
                                        'disabled:opacity-50'
                                    )}
                                >
                                    {checkingBounces ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="w-3 h-3" />
                                    )}
                                    {checkingBounces ? 'Checking...' : 'Check Bounces'}
                                </button>
                                <button
                                    onClick={() => {
                                        fetchCampaigns();
                                        setShowExportModal(true);
                                    }}
                                    disabled={selectedList.leads.length === 0}
                                    className="flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium bg-orange-500/10 border border-orange-500/50 text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-3 h-3" />
                                    Send to Campaign
                                </button>
                                <button
                                    onClick={addLead}
                                    className="flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Lead
                                </button>
                                <button
                                    onClick={() => deleteList(selectedList.id)}
                                    className={cn(
                                        'p-1.5 rounded transition-colors',
                                        theme === 'dark'
                                            ? 'text-red-400 hover:bg-red-500/20'
                                            : 'text-red-500 hover:bg-red-50'
                                    )}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Toolbar */}
                        {selectedRows.size > 0 && (
                            <div className={cn(
                                'flex items-center gap-2 px-4 py-2 border-b',
                                theme === 'dark' ? 'bg-blue-500/10 border-neutral-800' : 'bg-blue-50 border-gray-200'
                            )}>
                                <span className={cn(
                                    'text-[10px] font-medium',
                                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                )}>
                                    {selectedRows.size} selected
                                </span>
                                <button
                                    onClick={deleteSelectedLeads}
                                    className="flex items-center gap-1 px-2 py-1 text-[9px] rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            </div>
                        )}

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            {selectedList.leads.length === 0 ? (
                                <div className={cn(
                                    'flex flex-col items-center justify-center h-full',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )}>
                                    <Mail className="w-10 h-10 mb-3 opacity-50" />
                                    <p className="text-sm font-medium mb-1">No leads yet</p>
                                    <p className="text-xs mb-3">Add leads manually or import from CSV</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={addLead}
                                            className="flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium bg-orange-500 text-white hover:bg-orange-600"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Lead
                                        </button>
                                        <button
                                            onClick={() => document.getElementById('csv-import')?.click()}
                                            className={cn(
                                                'flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium border',
                                                theme === 'dark' ? 'border-neutral-700 text-gray-300' : 'border-gray-200 text-gray-600'
                                            )}
                                        >
                                            <Upload className="w-3 h-3" />
                                            Import CSV
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className={cn(
                                        'sticky top-0 z-10',
                                        theme === 'dark' ? 'bg-neutral-900' : 'bg-gray-50'
                                    )}>
                                        <tr className={cn(
                                            'border-b',
                                            theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'
                                        )}>
                                            <th className="w-8 px-2 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.size === selectedList.leads.length && selectedList.leads.length > 0}
                                                    onChange={() => {
                                                        if (selectedRows.size === selectedList.leads.length) {
                                                            setSelectedRows(new Set());
                                                        } else {
                                                            setSelectedRows(new Set(selectedList.leads.map(l => l.id)));
                                                        }
                                                    }}
                                                    className="w-3.5 h-3.5 rounded"
                                                />
                                            </th>
                                            <th className={cn(
                                                'w-10 px-2 py-2 text-left text-[9px] font-semibold uppercase tracking-wide',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>
                                                #
                                            </th>
                                            {columns.map(col => (
                                                <th
                                                    key={col.id}
                                                    className={cn(
                                                        'px-2 py-2 text-left text-[9px] font-semibold uppercase tracking-wide',
                                                        col.width,
                                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    )}
                                                >
                                                    {col.label}
                                                    {col.required && <span className="text-red-400 ml-0.5">*</span>}
                                                </th>
                                            ))}
                                            <th className="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedList.leads.map((lead, index) => (
                                            <tr
                                                key={lead.id}
                                                className={cn(
                                                    'group border-b transition-colors',
                                                    theme === 'dark'
                                                        ? 'border-neutral-800 hover:bg-neutral-800/50'
                                                        : 'border-gray-100 hover:bg-gray-50',
                                                    selectedRows.has(lead.id) && (theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50')
                                                )}
                                            >
                                                <td className="px-2 py-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRows.has(lead.id)}
                                                        onChange={() => {
                                                            const newSelected = new Set(selectedRows);
                                                            if (newSelected.has(lead.id)) {
                                                                newSelected.delete(lead.id);
                                                            } else {
                                                                newSelected.add(lead.id);
                                                            }
                                                            setSelectedRows(newSelected);
                                                        }}
                                                        className="w-3.5 h-3.5 rounded"
                                                    />
                                                </td>
                                                <td className={cn(
                                                    'px-2 py-1 text-[10px] font-mono',
                                                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                )}>
                                                    {index + 1}
                                                </td>
                                                {columns.map(col => (
                                                    <td key={col.id} className={cn('px-1 py-0.5', col.width)}>
                                                        {renderCell(lead, col.id)}
                                                    </td>
                                                ))}
                                                <td className="px-2 py-1">
                                                    <button
                                                        onClick={() => {
                                                            const updatedLeads = selectedList.leads.filter(l => l.id !== lead.id);
                                                            const updatedList = { ...selectedList, leads: updatedLeads };
                                                            setSelectedList(updatedList);
                                                            saveList(updatedList);
                                                        }}
                                                        className={cn(
                                                            'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                                                            theme === 'dark'
                                                                ? 'hover:bg-red-500/20 text-red-400'
                                                                : 'hover:bg-red-50 text-red-500'
                                                        )}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Add row button */}
                                        <tr>
                                            <td colSpan={columns.length + 3} className="px-2 py-1.5">
                                                <button
                                                    onClick={addLead}
                                                    className={cn(
                                                        'flex items-center gap-1.5 w-full px-2 py-1.5 rounded text-[10px] transition-colors',
                                                        theme === 'dark'
                                                            ? 'text-gray-500 hover:bg-neutral-800 hover:text-gray-300'
                                                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                                    )}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    New lead
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className={cn(
                        'flex-1 flex flex-col items-center justify-center',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                        <Users className="w-12 h-12 mb-3 opacity-30" />
                        <h2 className={cn(
                            'text-sm font-medium mb-1',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        )}>
                            Select a list
                        </h2>
                        <p className="text-xs mb-4">Choose a list from the sidebar or create a new one</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium bg-orange-500 text-white hover:bg-orange-600"
                        >
                            <Plus className="w-3 h-3" />
                            Create New List
                        </button>
                    </div>
                )}
            </div>

            {/* Create List Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowCreateModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                'relative w-full max-w-sm rounded-lg shadow-xl p-5',
                                theme === 'dark' ? 'bg-neutral-900' : 'bg-white'
                            )}
                        >
                            <h3 className={cn(
                                'text-sm font-semibold mb-3',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                Create New List
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className={cn(
                                        'block text-[10px] font-medium mb-1',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    )}>
                                        List Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="e.g., Tech Startups Q1"
                                        className={cn(
                                            'w-full px-3 py-2 text-xs rounded border',
                                            theme === 'dark'
                                                ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                                        )}
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className={cn(
                                        'block text-[10px] font-medium mb-1',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    )}>
                                        Description
                                    </label>
                                    <textarea
                                        value={newListDescription}
                                        onChange={(e) => setNewListDescription(e.target.value)}
                                        placeholder="Optional description..."
                                        rows={2}
                                        className={cn(
                                            'w-full px-3 py-2 text-xs rounded border resize-none',
                                            theme === 'dark'
                                                ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className={cn(
                                        'h-7 px-3 rounded text-[10px] font-medium transition-colors',
                                        theme === 'dark' ? 'text-gray-400 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createList}
                                    disabled={!newListName.trim()}
                                    className="h-7 px-3 rounded text-[10px] font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                                >
                                    Create List
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Export to Campaign Modal */}
            <AnimatePresence>
                {showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowExportModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                'relative w-full max-w-sm rounded-lg shadow-xl p-5',
                                theme === 'dark' ? 'bg-neutral-900' : 'bg-white'
                            )}
                        >
                            <h3 className={cn(
                                'text-sm font-semibold mb-1',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                Send to Campaign
                            </h3>
                            <p className={cn(
                                'text-[10px] mb-3',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            )}>
                                Export {selectedList?.leads.length || 0} leads from "{selectedList?.name}" to a campaign
                            </p>

                            {/* Create New Campaign Section */}
                            <div className={cn(
                                'p-3 rounded border-2 border-dashed mb-3',
                                theme === 'dark' ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-300 bg-blue-50'
                            )}>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Plus className={cn(
                                        'w-3.5 h-3.5',
                                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                    )} />
                                    <span className={cn(
                                        'text-[10px] font-medium',
                                        theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
                                    )}>
                                        Create New Campaign
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    <input
                                        type="text"
                                        value={newCampaignName}
                                        onChange={(e) => setNewCampaignName(e.target.value)}
                                        placeholder={`Campaign from ${selectedList?.name || 'list'}`}
                                        className={cn(
                                            'flex-1 px-2.5 py-1.5 text-xs rounded border',
                                            theme === 'dark'
                                                ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                                        )}
                                    />
                                    <button
                                        onClick={createNewCampaignWithLeads}
                                        disabled={creatingCampaign}
                                        className="flex items-center gap-1 h-7 px-2.5 rounded text-[10px] font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                                    >
                                        {creatingCampaign ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Plus className="w-3 h-3" />
                                        )}
                                        Create
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className={cn(
                                    'flex-1 h-px',
                                    theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-200'
                                )} />
                                <span className={cn(
                                    'text-[9px] uppercase',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )}>
                                    or add to existing
                                </span>
                                <div className={cn(
                                    'flex-1 h-px',
                                    theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-200'
                                )} />
                            </div>

                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {campaigns.length === 0 ? (
                                    <div className={cn(
                                        'text-center py-3',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>
                                        <p className="text-[10px]">No existing campaigns</p>
                                    </div>
                                ) : (
                                    campaigns.map(campaign => (
                                        <button
                                            key={campaign.id}
                                            onClick={() => exportToCampaign(campaign.id)}
                                            disabled={exporting}
                                            className={cn(
                                                'w-full flex items-center gap-2 p-2 rounded text-left transition-colors',
                                                theme === 'dark'
                                                    ? 'hover:bg-neutral-800 border border-neutral-800'
                                                    : 'hover:bg-gray-50 border border-gray-200'
                                            )}
                                        >
                                            <Megaphone className={cn(
                                                'w-3.5 h-3.5',
                                                campaign.status === 'active'
                                                    ? 'text-green-500'
                                                    : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )} />
                                            <div className="flex-1">
                                                <p className={cn(
                                                    'text-[10px] font-medium',
                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                )}>
                                                    {campaign.name}
                                                </p>
                                                <p className={cn(
                                                    'text-[9px]',
                                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                )}>
                                                    {campaign.status}
                                                </p>
                                            </div>
                                            {exporting ? (
                                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                            ) : (
                                                <ChevronRight className={cn(
                                                    'w-3.5 h-3.5',
                                                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                                )} />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className={cn(
                                        'h-7 px-3 rounded text-[10px] font-medium transition-colors',
                                        theme === 'dark' ? 'text-gray-400 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
