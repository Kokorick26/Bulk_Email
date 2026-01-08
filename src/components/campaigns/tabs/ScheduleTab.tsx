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
        <div className={cn('space-y-6', className)}>
            {/* Compact Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className={cn(
                        'text-lg font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Schedule
                    </h2>
                    <div className={cn(
                        'text-xs px-2 py-0.5 rounded flex items-center gap-1.5',
                        theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'
                    )}>
                        <Globe className="w-3 h-3" />
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                            {localSchedule?.timezone || 'UTC'}
                        </span>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    className={cn(
                        'h-8 text-xs gap-1.5',
                        theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                >
                    {isSaving ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-3.5 h-3.5" />
                            Save
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Main Schedule Card */}
                <div className={cn(
                    'lg:col-span-8 p-4 rounded border',
                    theme === 'dark'
                        ? 'bg-neutral-900 border-neutral-800'
                        : 'bg-white border-gray-200'
                )}>
                    <div className="space-y-6">
                        {/* Time Window Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Clock className={cn('w-4 h-4', theme === 'dark' ? 'text-orange-500' : 'text-blue-600')} />
                                <h3 className={cn(
                                    'text-xs font-semibold uppercase tracking-wider',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    Active Hours
                                </h3>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-1">
                                    <label className={cn(
                                        'text-[10px] uppercase tracking-wide font-medium',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>Start Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={localSchedule?.startTime || '09:00'}
                                            onChange={(e) => setLocalSchedule((prev: any) => ({ ...prev, startTime: e.target.value }))}
                                            className={cn(
                                                'w-full px-3 py-2 rounded text-sm font-mono outline-none transition-all',
                                                theme === 'dark'
                                                    ? 'bg-neutral-800 border border-neutral-700 focus:border-orange-500 text-white'
                                                    : 'bg-gray-50 border border-gray-200 focus:border-blue-500 text-gray-900'
                                            )}
                                        />
                                        <Sun className={cn(
                                            'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4',
                                            theme === 'dark' ? 'text-yellow-500/50' : 'text-orange-400/50'
                                        )} />
                                    </div>
                                </div>

                                <ArrowRight className={cn('w-4 h-4 mt-5', theme === 'dark' ? 'text-gray-600' : 'text-gray-300')} />

                                <div className="flex-1 space-y-1">
                                    <label className={cn(
                                        'text-[10px] uppercase tracking-wide font-medium',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    )}>End Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={localSchedule?.endTime || '17:00'}
                                            onChange={(e) => setLocalSchedule((prev: any) => ({ ...prev, endTime: e.target.value }))}
                                            className={cn(
                                                'w-full px-3 py-2 rounded text-sm font-mono outline-none transition-all',
                                                theme === 'dark'
                                                    ? 'bg-neutral-800 border border-neutral-700 focus:border-orange-500 text-white'
                                                    : 'bg-gray-50 border border-gray-200 focus:border-blue-500 text-gray-900'
                                            )}
                                        />
                                        <Moon className={cn(
                                            'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4',
                                            theme === 'dark' ? 'text-blue-400/50' : 'text-indigo-400/50'
                                        )} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Days Selection Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar className={cn('w-4 h-4', theme === 'dark' ? 'text-orange-500' : 'text-blue-600')} />
                                <h3 className={cn(
                                    'text-xs font-semibold uppercase tracking-wider',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    Sending Days
                                </h3>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {DAYS.map(day => {
                                    const isSelected = localSchedule?.days?.includes(day.id);
                                    return (
                                        <button
                                            key={day.id}
                                            onClick={() => toggleDay(day.id)}
                                            className={cn(
                                                'px-4 py-2 rounded text-xs font-semibold transition-all',
                                                isSelected
                                                    ? theme === 'dark'
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-blue-600 text-white'
                                                    : theme === 'dark'
                                                        ? 'bg-neutral-800 text-gray-400 hover:bg-neutral-700 hover:text-gray-300'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600'
                                            )}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Card (Timezone & Info) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Timezone Card */}
                    <div className={cn(
                        'p-4 rounded border',
                        theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                    )}>
                        <div className="flex items-center gap-2 mb-4">
                            <Globe className={cn('w-4 h-4', theme === 'dark' ? 'text-orange-500' : 'text-blue-600')} />
                            <h3 className={cn(
                                'text-xs font-semibold uppercase tracking-wider',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                                Timezone
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className={cn(
                                    'absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )} />
                                <input
                                    type="text"
                                    placeholder="Search timezones..."
                                    value={timezoneSearch}
                                    onChange={(e) => setTimezoneSearch(e.target.value)}
                                    onFocus={() => setShowTimezoneDropdown(true)}
                                    className={cn(
                                        'w-full pl-9 pr-3 py-2 rounded text-xs outline-none transition-all',
                                        theme === 'dark'
                                            ? 'bg-neutral-800 border border-neutral-700 text-white focus:border-orange-500'
                                            : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500'
                                    )}
                                />
                            </div>

                            {/* Current Selection */}
                            <div className={cn(
                                'px-3 py-2 rounded text-xs font-medium',
                                theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                            )}>
                                <div className="flex items-center justify-between">
                                    <span>{formatTimezone(localSchedule?.timezone || 'UTC')}</span>
                                    <span className={cn(
                                        'text-[10px]',
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
                            'mt-4 p-3 rounded text-[10px] leading-relaxed flex gap-2',
                            theme === 'dark' ? 'bg-neutral-800/50 text-gray-500' : 'bg-blue-50 text-blue-600'
                        )}>
                            <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <p>
                                Sending times are adjusted to this timezone. We recommend matching your prospect's primary location.
                            </p>
                        </div>
                    </div>

                    {/* Stats / Info */}
                    <div className={cn(
                        'p-4 rounded border flex items-center justify-between',
                        theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                    )}>
                        <div>
                            <p className={cn(
                                'text-[10px] uppercase tracking-wider font-medium mb-0.5',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )}>Total Hours</p>
                            <p className={cn(
                                'text-lg font-bold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                {parseInt(localSchedule.endTime) - parseInt(localSchedule.startTime)}h / day
                            </p>
                        </div>
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center border',
                            theme === 'dark' ? 'border-neutral-700 text-orange-500' : 'border-gray-200 text-blue-600'
                        )}>
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}
