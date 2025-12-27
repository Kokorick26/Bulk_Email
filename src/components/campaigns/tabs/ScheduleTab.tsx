import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Clock, Calendar, Globe, Plus, ChevronDown
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import type { CampaignSchedule } from '../types';

interface ScheduleTabProps {
    campaignId: string;
    schedule: CampaignSchedule | null;
    onScheduleUpdate: (schedule: CampaignSchedule) => void;
    className?: string;
}

interface ScheduleItem {
    id: string;
    name: string;
    isActive: boolean;
}

const defaultSchedule: CampaignSchedule = {
    timezone: 'America/New_York',
    sendDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:00',
    endTime: '18:00',
    maxEmailsPerDay: 100,
    delayBetweenEmails: 600  // 10 minutes default (in seconds)
};

const weekDays = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
] as const;

const commonTimezones = [
    { label: 'Eastern Time (US & Canada) (UTC-05:00)', value: 'America/New_York' },
    { label: 'Central Time (US & Canada) (UTC-06:00)', value: 'America/Chicago' },
    { label: 'Mountain Time (US & Canada) (UTC-07:00)', value: 'America/Denver' },
    { label: 'Pacific Time (US & Canada) (UTC-08:00)', value: 'America/Los_Angeles' },
    { label: 'UTC', value: 'UTC' },
    { label: 'London (GMT/BST)', value: 'Europe/London' },
    { label: 'Paris (CET/CEST)', value: 'Europe/Paris' },
    { label: 'India Standard Time (UTC+05:30)', value: 'Asia/Kolkata' },
    { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
    { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
    { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
];

const timeOptions = [
    '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM',
];

export function ScheduleTab({ campaignId, schedule, onScheduleUpdate, className }: ScheduleTabProps) {
    const { theme } = useTheme();
    const [localSchedule, setLocalSchedule] = useState<CampaignSchedule>(schedule || defaultSchedule);
    const [scheduleName, setScheduleName] = useState('New schedule');
    const [schedules, setSchedules] = useState<ScheduleItem[]>([
        { id: '1', name: 'New schedule', isActive: true }
    ]);
    const [activeScheduleId, setActiveScheduleId] = useState('1');

    useEffect(() => {
        if (schedule) {
            setLocalSchedule(schedule);
        }
    }, [schedule]);

    const handleUpdate = (updates: Partial<CampaignSchedule>) => {
        setLocalSchedule(prev => ({ ...prev, ...updates }));
    };

    const handleToggleDay = (day: typeof weekDays[number]['id']) => {
        setLocalSchedule(prev => ({
            ...prev,
            sendDays: prev.sendDays.includes(day)
                ? prev.sendDays.filter(d => d !== day)
                : [...prev.sendDays, day]
        }));
    };

    const handleSave = async () => {
        // Save to backend
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
        } catch (err) {
            console.error('Error saving schedule:', err);
        }

        onScheduleUpdate(localSchedule);
    };

    const handleAddSchedule = () => {
        const newSchedule: ScheduleItem = {
            id: Date.now().toString(),
            name: 'New schedule',
            isActive: false
        };
        setSchedules(prev => [...prev, newSchedule]);
    };

    const convertTo12Hour = (time24: string) => {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className={cn('flex gap-6', className)}>
            {/* Left Sidebar */}
            <div className="w-72 flex-shrink-0 space-y-4">
                {/* Start/End */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Calendar className={cn('w-4 h-4', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')} />
                        <span className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>Start</span>
                        <span className="text-sm text-blue-500 cursor-pointer hover:underline">Now</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className={cn('w-4 h-4', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')} />
                        <span className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>End</span>
                        <span className="text-sm text-blue-500 cursor-pointer hover:underline">No end date</span>
                    </div>
                </div>

                {/* Schedule List */}
                <div className="space-y-2">
                    {schedules.map((sched) => (
                        <button
                            key={sched.id}
                            onClick={() => setActiveScheduleId(sched.id)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left',
                                activeScheduleId === sched.id
                                    ? theme === 'dark'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-600 text-white'
                                    : theme === 'dark'
                                        ? 'bg-[#1a1a1a] text-gray-300 hover:bg-[#252525]'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            )}
                        >
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">{sched.name}</span>
                        </button>
                    ))}
                </div>

                {/* Add Schedule Button */}
                <button
                    onClick={handleAddSchedule}
                    className={cn(
                        'w-full py-2.5 rounded-lg border text-sm font-medium transition-colors',
                        theme === 'dark'
                            ? 'border-gray-700 text-gray-400 hover:bg-[#252525]'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                >
                    Add schedule
                </button>
            </div>

            {/* Right Panel - Schedule Form */}
            <div className="flex-1 space-y-6">
                {/* Schedule Name */}
                <div className={cn(
                    'p-6 rounded-xl border',
                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                )}>
                    <label className={cn(
                        'block text-sm font-medium mb-2',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                        Schedule Name
                    </label>
                    <input
                        type="text"
                        value={scheduleName}
                        onChange={(e) => setScheduleName(e.target.value)}
                        className={cn(
                            'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2',
                            theme === 'dark'
                                ? 'bg-[#252525] border-gray-700 text-white focus:ring-blue-500/30'
                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-blue-500/30'
                        )}
                    />
                </div>

                {/* Timing */}
                <div className={cn(
                    'p-6 rounded-xl border',
                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                )}>
                    <h3 className={cn(
                        'text-sm font-medium mb-4',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                        Timing
                    </h3>

                    <div className="grid grid-cols-3 gap-4">
                        {/* From Time */}
                        <div>
                            <label className={cn(
                                'block text-xs mb-2',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )}>
                                From
                            </label>
                            <div className="relative">
                                <select
                                    value={convertTo12Hour(localSchedule.startTime)}
                                    onChange={(e) => {
                                        // Convert 12-hour back to 24-hour
                                        const [time, period] = e.target.value.split(' ');
                                        const [hours, minutes] = time.split(':').map(Number);
                                        let hours24 = hours;
                                        if (period === 'PM' && hours !== 12) hours24 += 12;
                                        if (period === 'AM' && hours === 12) hours24 = 0;
                                        handleUpdate({ startTime: `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` });
                                    }}
                                    className={cn(
                                        'w-full px-4 py-3 pr-10 rounded-lg border appearance-none cursor-pointer',
                                        theme === 'dark'
                                            ? 'bg-[#252525] border-gray-700 text-white'
                                            : 'bg-gray-50 border-gray-200 text-gray-900'
                                    )}
                                >
                                    {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                                <ChevronDown className={cn(
                                    'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )} />
                            </div>
                        </div>

                        {/* To Time */}
                        <div>
                            <label className={cn(
                                'block text-xs mb-2',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )}>
                                To
                            </label>
                            <div className="relative">
                                <select
                                    value={convertTo12Hour(localSchedule.endTime)}
                                    onChange={(e) => {
                                        const [time, period] = e.target.value.split(' ');
                                        const [hours, minutes] = time.split(':').map(Number);
                                        let hours24 = hours;
                                        if (period === 'PM' && hours !== 12) hours24 += 12;
                                        if (period === 'AM' && hours === 12) hours24 = 0;
                                        handleUpdate({ endTime: `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` });
                                    }}
                                    className={cn(
                                        'w-full px-4 py-3 pr-10 rounded-lg border appearance-none cursor-pointer',
                                        theme === 'dark'
                                            ? 'bg-[#252525] border-gray-700 text-white'
                                            : 'bg-gray-50 border-gray-200 text-gray-900'
                                    )}
                                >
                                    {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                                <ChevronDown className={cn(
                                    'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )} />
                            </div>
                        </div>

                        {/* Timezone */}
                        <div>
                            <label className={cn(
                                'block text-xs mb-2',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )}>
                                Timezone
                            </label>
                            <div className="relative">
                                <select
                                    value={localSchedule.timezone}
                                    onChange={(e) => handleUpdate({ timezone: e.target.value })}
                                    className={cn(
                                        'w-full px-4 py-3 pr-10 rounded-lg border appearance-none cursor-pointer text-sm',
                                        theme === 'dark'
                                            ? 'bg-[#252525] border-gray-700 text-white'
                                            : 'bg-gray-50 border-gray-200 text-gray-900'
                                    )}
                                >
                                    {commonTimezones.map(tz => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className={cn(
                                    'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                )} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Days */}
                <div className={cn(
                    'p-6 rounded-xl border',
                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                )}>
                    <h3 className={cn(
                        'text-sm font-medium mb-4',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                        Days
                    </h3>

                    <div className="flex flex-wrap gap-4">
                        {weekDays.map((day) => (
                            <label
                                key={day.id}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={localSchedule.sendDays.includes(day.id)}
                                    onChange={() => handleToggleDay(day.id)}
                                    className={cn(
                                        'w-4 h-4 rounded border-2 cursor-pointer',
                                        theme === 'dark'
                                            ? 'border-gray-600 bg-transparent checked:bg-blue-600 checked:border-blue-600'
                                            : 'border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600'
                                    )}
                                />
                                <span className={cn(
                                    'text-sm',
                                    localSchedule.sendDays.includes(day.id)
                                        ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    {day.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Delay Between Emails */}
                <div className={cn(
                    'p-6 rounded-xl border',
                    theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className={cn(
                                'text-sm font-medium mb-1',
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                                Delay Between Emails
                            </h3>
                            <p className={cn(
                                'text-xs',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )}>
                                Time to wait between sending each email (helps with deliverability)
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="60"
                                value={Math.round((localSchedule.delayBetweenEmails || 600) / 60)}
                                onChange={(e) => handleUpdate({
                                    delayBetweenEmails: Math.max(60, Math.min(3600, parseInt(e.target.value) * 60 || 600))
                                })}
                                className={cn(
                                    'w-20 px-4 py-2.5 rounded-lg border text-center',
                                    theme === 'dark'
                                        ? 'bg-[#252525] border-gray-700 text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'
                                )}
                            />
                            <span className={cn(
                                'text-sm',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            )}>
                                minutes
                            </span>
                        </div>
                    </div>
                    <div className={cn(
                        'mt-4 p-3 rounded-lg',
                        theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                    )}>
                        <p className={cn(
                            'text-xs flex items-center gap-2',
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        )}>
                            <Clock className="w-4 h-4" />
                            <span>
                                At {Math.round((localSchedule.delayBetweenEmails || 600) / 60)} min delay, you can send up to {Math.floor(60 / Math.round((localSchedule.delayBetweenEmails || 600) / 60)) > 0 ? Math.floor(60 / Math.round((localSchedule.delayBetweenEmails || 600) / 60)) : '< 1'} emails/hour
                            </span>
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    className={cn(
                        'px-6',
                        theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                >
                    Save
                </Button>
            </div>
        </div>
    );
}
