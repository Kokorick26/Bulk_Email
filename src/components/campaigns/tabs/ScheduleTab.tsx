import { useState, useEffect } from 'react';
import {
    Clock, Calendar, Globe, Save, Check, AlertCircle,
    ChevronDown, Sun, Moon, Zap, ArrowRight, Search
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import { ALL_TIMEZONES, POPULAR_TIMEZONES, formatTimezone, getTimezoneOffset } from '../../../lib/timezones';
import type { Campaign } from '../types';

interface ScheduleTabProps {
    campaignId: string;
    schedule: Campaign['schedule'];
    onScheduleUpdate: (schedule: Campaign['schedule']) => void;
    className?: string;
}

const DAYS = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' }
];

export function ScheduleTab({ campaignId, schedule, onScheduleUpdate, className }: ScheduleTabProps) {
    const { theme } = useTheme();
    const [localSchedule, setLocalSchedule] = useState(schedule || {
        timezone: 'UTC',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '09:00',
        endTime: '17:00'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [timezoneSearch, setTimezoneSearch] = useState('');
    const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);

    useEffect(() => {
        if (schedule) {
            setLocalSchedule(schedule);
        }
    }, [schedule]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/schedule`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ schedule: localSchedule })
            });
            onScheduleUpdate(localSchedule);
        } catch (err) {
            console.error('Error saving schedule:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDay = (dayId: string) => {
        const currentDays = localSchedule?.days || [];
        const newDays = currentDays.includes(dayId)
            ? currentDays.filter((d: string) => d !== dayId)
            : [...currentDays, dayId];

        setLocalSchedule((prev: any) => ({ ...prev, days: newDays }));
    };

    return (
        <div className={cn(
            'max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700',
            className
        )}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-dashed pb-8" style={{ borderColor: theme === 'dark' ? '#252a33' : '#e5e7eb' }}>
                <div className="space-y-1 text-center md:text-left">
                    <h2 className={cn(
                        'text-4xl font-[Syne] font-bold tracking-tight',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Campaign <span className="text-[#d97757]">Rhythm</span>
                    </h2>
                    <p className={cn(
                        'text-sm font-light leading-relaxed opacity-60',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                        Define precisely when your audience hears from you.
                    </p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                        'h-12 px-8 rounded-xl font-[Syne] font-bold transition-all duration-300 shadow-lg shadow-[#d97757]/10',
                        theme === 'dark'
                            ? 'bg-[#d97757] hover:bg-[#c46144] text-white'
                            : 'bg-blue-600 text-white'
                    )}
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Synchronizing...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Schedule
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Schedule Card */}
                <div className={cn(
                    'lg:col-span-8 p-8 rounded-3xl border relative overflow-hidden group',
                    theme === 'dark'
                        ? 'bg-[#12151a] border-[#252a33]'
                        : 'bg-white border-gray-100 shadow-xl'
                )}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#d97757_1px,transparent_1px)] [background-size:24px_24px]" />

                    <div className="relative space-y-10">
                        {/* Time Window Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn(
                                    'p-2 rounded-lg',
                                    theme === 'dark' ? 'bg-[#1a1e25] text-[#d97757]' : 'bg-orange-50 text-orange-600'
                                )}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                <h3 className="font-[Syne] text-lg font-bold uppercase tracking-widest opacity-90">
                                    Active Hours
                                </h3>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border bg-opacity-50 transition-all hover:border-[#d97757]/50"
                                style={{
                                    backgroundColor: theme === 'dark' ? 'rgba(26, 30, 37, 0.5)' : 'rgba(249, 250, 251, 0.5)',
                                    borderColor: theme === 'dark' ? '#252a33' : '#e5e7eb'
                                }}
                            >
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-xs uppercase tracking-widest font-semibold opacity-60 ml-1">Start Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={localSchedule?.startTime || '09:00'}
                                            onChange={(e) => setLocalSchedule((prev: any) => ({ ...prev, startTime: e.target.value }))}
                                            className={cn(
                                                'w-full px-6 py-4 rounded-xl text-xl font-mono font-medium outline-none transition-all',
                                                theme === 'dark'
                                                    ? 'bg-[#0a0c0f] border border-[#252a33] focus:border-[#d97757] text-white'
                                                    : 'bg-white border border-gray-200 focus:border-blue-500 text-gray-900'
                                            )}
                                        />
                                        <Sun className={cn(
                                            'absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40',
                                            theme === 'dark' ? 'text-yellow-400' : 'text-orange-400'
                                        )} />
                                    </div>
                                </div>

                                <div className="hidden sm:block pt-6">
                                    <ArrowRight className="w-6 h-6 opacity-30" />
                                </div>

                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-xs uppercase tracking-widest font-semibold opacity-60 ml-1">End Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={localSchedule?.endTime || '17:00'}
                                            onChange={(e) => setLocalSchedule((prev: any) => ({ ...prev, endTime: e.target.value }))}
                                            className={cn(
                                                'w-full px-6 py-4 rounded-xl text-xl font-mono font-medium outline-none transition-all',
                                                theme === 'dark'
                                                    ? 'bg-[#0a0c0f] border border-[#252a33] focus:border-[#d97757] text-white'
                                                    : 'bg-white border border-gray-200 focus:border-blue-500 text-gray-900'
                                            )}
                                        />
                                        <Moon className={cn(
                                            'absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40',
                                            theme === 'dark' ? 'text-blue-400' : 'text-indigo-400'
                                        )} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Days Selection Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn(
                                    'p-2 rounded-lg',
                                    theme === 'dark' ? 'bg-[#1a1e25] text-[#d97757]' : 'bg-orange-50 text-orange-600'
                                )}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h3 className="font-[Syne] text-lg font-bold uppercase tracking-widest opacity-90">
                                    Sending Days
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                {DAYS.map(day => {
                                    const isSelected = localSchedule?.days?.includes(day.id);
                                    return (
                                        <button
                                            key={day.id}
                                            onClick={() => toggleDay(day.id)}
                                            className={cn(
                                                'relative h-14 rounded-xl font-[Syne] font-bold text-sm transition-all duration-300 overflow-hidden group/day',
                                                isSelected
                                                    ? theme === 'dark'
                                                        ? 'bg-[#d97757] text-white shadow-[0_0_20px_rgba(217,119,87,0.3)]'
                                                        : 'bg-blue-600 text-white shadow-lg'
                                                    : theme === 'dark'
                                                        ? 'bg-[#1a1e25] text-gray-500 hover:bg-[#252a33] hover:text-gray-300'
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                            )}
                                        >
                                            <span className="relative z-10">{day.label}</span>
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Card (Timezone & Info) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Timezone Card */}
                    <div className={cn(
                        'p-6 rounded-3xl border',
                        theme === 'dark' ? 'bg-[#0a0c0f] border-[#252a33]' : 'bg-white border-gray-100 shadow-lg'
                    )}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={cn(
                                'p-2 rounded-lg',
                                theme === 'dark' ? 'bg-[#1a1e25] text-[#d97757]' : 'bg-orange-50 text-orange-600'
                            )}>
                                <Globe className="w-5 h-5" />
                            </div>
                            <h3 className="font-[Syne] text-lg font-bold uppercase tracking-widest opacity-90">
                                Timezone
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className={cn(
                                    'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )} />
                                <input
                                    type="text"
                                    placeholder="Search timezones..."
                                    value={timezoneSearch}
                                    onChange={(e) => setTimezoneSearch(e.target.value)}
                                    onFocus={() => setShowTimezoneDropdown(true)}
                                    className={cn(
                                        'w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all',
                                        theme === 'dark'
                                            ? 'bg-[#1a1e25] border border-[#252a33] text-white focus:border-[#d97757]'
                                            : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500'
                                    )}
                                />
                            </div>

                            {/* Current Selection */}
                            <div className={cn(
                                'px-4 py-3 rounded-xl text-sm font-medium',
                                theme === 'dark' ? 'bg-[#1a1e25] text-white' : 'bg-gray-100 text-gray-900'
                            )}>
                                <div className="flex items-center justify-between">
                                    <span>{formatTimezone(localSchedule?.timezone || 'UTC')}</span>
                                    <span className={cn(
                                        'text-xs',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                    )}>
                                        {getTimezoneOffset(localSchedule?.timezone || 'UTC')}
                                    </span>
                                </div>
                            </div>

                            {/* Timezone Dropdown */}
                            {showTimezoneDropdown && (
                                <div className={cn(
                                    'absolute z-50 w-full mt-1 max-h-96 overflow-y-auto rounded-xl border shadow-2xl',
                                    theme === 'dark' ? 'bg-[#1a1e25] border-[#252a33]' : 'bg-white border-gray-200'
                                )}>
                                    {/* Popular Timezones */}
                                    {!timezoneSearch && (
                                        <div className="p-2">
                                            <div className={cn(
                                                'px-3 py-2 text-xs font-semibold uppercase tracking-wider',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                            )}>
                                                Popular
                                            </div>
                                            {POPULAR_TIMEZONES.map(tz => (
                                                <button
                                                    key={tz}
                                                    onClick={() => {
                                                        setLocalSchedule((prev: any) => ({ ...prev, timezone: tz }));
                                                        setShowTimezoneDropdown(false);
                                                        setTimezoneSearch('');
                                                    }}
                                                    className={cn(
                                                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                                                        localSchedule?.timezone === tz
                                                            ? theme === 'dark'
                                                                ? 'bg-[#d97757] text-white'
                                                                : 'bg-blue-100 text-blue-900'
                                                            : theme === 'dark'
                                                                ? 'hover:bg-[#252a33] text-gray-300'
                                                                : 'hover:bg-gray-100 text-gray-700'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{formatTimezone(tz)}</span>
                                                        <span className="text-xs opacity-60">{getTimezoneOffset(tz)}</span>
                                                    </div>
                                                </button>
                                            ))}
                                            <div className={cn(
                                                'my-2 border-t',
                                                theme === 'dark' ? 'border-[#252a33]' : 'border-gray-200'
                                            )} />
                                        </div>
                                    )}

                                    {/* All Timezones (filtered) */}
                                    <div className="p-2">
                                        {ALL_TIMEZONES
                                            .filter(tz =>
                                                !timezoneSearch ||
                                                tz.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
                                                formatTimezone(tz).toLowerCase().includes(timezoneSearch.toLowerCase())
                                            )
                                            .map(tz => (
                                                <button
                                                    key={tz}
                                                    onClick={() => {
                                                        setLocalSchedule((prev: any) => ({ ...prev, timezone: tz }));
                                                        setShowTimezoneDropdown(false);
                                                        setTimezoneSearch('');
                                                    }}
                                                    className={cn(
                                                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                                                        localSchedule?.timezone === tz
                                                            ? theme === 'dark'
                                                                ? 'bg-[#d97757] text-white'
                                                                : 'bg-blue-100 text-blue-900'
                                                            : theme === 'dark'
                                                                ? 'hover:bg-[#252a33] text-gray-300'
                                                                : 'hover:bg-gray-100 text-gray-700'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{formatTimezone(tz)}</span>
                                                        <span className="text-xs opacity-60">{getTimezoneOffset(tz)}</span>
                                                    </div>
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Click outside to close */}
                        {showTimezoneDropdown && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => {
                                    setShowTimezoneDropdown(false);
                                    setTimezoneSearch('');
                                }}
                            />
                        )}

                        <div className={cn(
                            'mt-6 p-4 rounded-xl text-xs leading-relaxed flex gap-3',
                            theme === 'dark' ? 'bg-[#1a1e25]/50 text-gray-400' : 'bg-blue-50 text-blue-700'
                        )}>
                            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
                            <p>
                                Sending times are adjusted to this timezone. We recommend matching your prospect's primary location.
                            </p>
                        </div>
                    </div>

                    {/* Stats / Info */}
                    <div className={cn(
                        'p-6 rounded-3xl border flex items-center justify-between',
                        theme === 'dark' ? 'bg-[#12151a] border-[#252a33]' : 'bg-white border-gray-100 shadow-md'
                    )}>
                        <div>
                            <p className="text-xs uppercase tracking-widest opacity-50 font-bold mb-1">Total Hours</p>
                            <p className={cn(
                                'text-2xl font-[Syne] font-bold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                {parseInt(localSchedule.endTime) - parseInt(localSchedule.startTime)}h / day
                            </p>
                        </div>
                        <div className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center border-2',
                            theme === 'dark' ? 'border-[#3a424f] text-[#d97757]' : 'border-gray-200 text-blue-600'
                        )}>
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}
