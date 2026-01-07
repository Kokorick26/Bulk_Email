import { useState, useEffect } from 'react';
import { Save, Zap, Shield, Flame, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import type { Campaign } from '../types';

interface OptionsTabProps {
    campaignId: string;
    options: Campaign['options'];
    onOptionsUpdate: (options: Campaign['options']) => void;
    className?: string;
}

export function OptionsTab({ campaignId, options, onOptionsUpdate, className }: OptionsTabProps) {
    const { theme } = useTheme();
    const [isSaving, setIsSaving] = useState(false);

    // Local state for each toggle
    const [trackOpens, setTrackOpens] = useState(true);
    const [trackClicks, setTrackClicks] = useState(true);
    const [stopOnReply, setStopOnReply] = useState(true);
    const [dailyLimit, setDailyLimit] = useState(15);
    const [timeBetweenEmails, setTimeBetweenEmails] = useState(10);

    // Initialize from props once
    useEffect(() => {
        if (options) {
            setTrackOpens(options.trackOpens ?? true);
            setTrackClicks(options.trackClicks ?? true);
            setStopOnReply(options.stopOnReply ?? true);
            setDailyLimit(options.dailyLimit ?? 15);
            setTimeBetweenEmails(options.timeBetweenEmails ?? 10);
        }
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const newOptions = {
            trackOpens,
            trackClicks,
            stopOnReply,
            stopOnClick: false,
            removeUnsubscribed: false,
            dailyLimit,
            timeBetweenEmails
        };

        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/options`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ options: newOptions })
            });
            onOptionsUpdate(newOptions);
        } catch (err) {
            console.error('Error saving options:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle Switch Component
    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2',
                checked
                    ? theme === 'dark' ? 'bg-[#d97757] focus:ring-[#d97757]' : 'bg-blue-600 focus:ring-blue-500'
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200',
                theme === 'dark' ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
            )}
        >
            <span
                className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    checked ? 'translate-x-5' : 'translate-x-0'
                )}
            />
        </button>
    );

    // Option Row Component - Entire row is clickable
    const OptionRow = ({
        icon: Icon,
        title,
        description,
        checked,
        onChange
    }: {
        icon: any;
        title: string;
        description: string;
        checked: boolean;
        onChange: (val: boolean) => void;
    }) => (
        <div
            onClick={() => onChange(!checked)}
            className={cn(
                'flex items-center justify-between p-5 rounded-xl border transition-all cursor-pointer select-none',
                theme === 'dark'
                    ? 'bg-[#12151a] border-[#252a33] hover:border-[#d97757]/50 hover:bg-[#1a1e25]'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm'
            )}
        >
            <div className="flex items-center gap-4 pointer-events-none">
                <div className={cn(
                    'p-2.5 rounded-lg transition-colors',
                    checked
                        ? theme === 'dark' ? 'bg-[#d97757]/20 text-[#d97757]' : 'bg-blue-100 text-blue-600'
                        : theme === 'dark' ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        {title}
                    </h4>
                    <p className={cn(
                        'text-xs mt-0.5',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    )}>
                        {description}
                    </p>
                </div>
            </div>
            {/* Custom Toggle Display (not a button, just visual) */}
            <div className={cn(
                'relative w-12 h-7 rounded-full transition-colors pointer-events-none',
                checked
                    ? theme === 'dark' ? 'bg-[#d97757]' : 'bg-blue-600'
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            )}>
                <div className={cn(
                    'absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                    checked ? 'left-6' : 'left-1'
                )} />
            </div>
        </div>
    );

    return (
        <div className={cn('max-w-2xl mx-auto animate-in fade-in duration-500', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className={cn(
                        'text-2xl font-[Syne] font-bold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Campaign <span className="text-[#d97757]">Options</span>
                    </h2>
                    <p className={cn(
                        'text-sm mt-1',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    )}>
                        Configure tracking and automation settings
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                        'h-10 px-6 rounded-lg font-semibold',
                        theme === 'dark'
                            ? 'bg-[#d97757] hover:bg-[#c46144] text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                >
                    {isSaving ? (
                        <Clock className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>

            {/* Tracking Options */}
            <div className="space-y-3 mb-8">
                <h3 className={cn(
                    'text-xs font-bold uppercase tracking-wider mb-4',
                    theme === 'dark' ? 'text-[#d97757]' : 'text-blue-600'
                )}>
                    Tracking
                </h3>
                <OptionRow
                    icon={Zap}
                    title="Track Opens"
                    description="Monitor when recipients open your emails"
                    checked={trackOpens}
                    onChange={setTrackOpens}
                />
                <OptionRow
                    icon={Flame}
                    title="Track Clicks"
                    description="Track link clicks within your emails"
                    checked={trackClicks}
                    onChange={setTrackClicks}
                />
            </div>

            {/* Automation Options */}
            <div className="space-y-3 mb-8">
                <h3 className={cn(
                    'text-xs font-bold uppercase tracking-wider mb-4',
                    theme === 'dark' ? 'text-[#d97757]' : 'text-blue-600'
                )}>
                    Automation
                </h3>
                <OptionRow
                    icon={Shield}
                    title="Stop on Reply"
                    description="Pause sequence when lead replies"
                    checked={stopOnReply}
                    onChange={setStopOnReply}
                />
            </div>

            {/* Safety Limits */}
            <div className="space-y-4">
                <h3 className={cn(
                    'text-xs font-bold uppercase tracking-wider mb-4',
                    theme === 'dark' ? 'text-[#d97757]' : 'text-blue-600'
                )}>
                    Safety Limits
                </h3>
                <div className={cn(
                    'p-5 rounded-xl border',
                    theme === 'dark'
                        ? 'bg-[#12151a] border-[#252a33]'
                        : 'bg-white border-gray-200 shadow-sm'
                )}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className={cn(
                                'text-sm font-semibold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                Daily Limit
                            </h4>
                            <p className={cn(
                                'text-xs mt-0.5',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            )}>
                                Max emails per day per account
                            </p>
                        </div>
                        <input
                            type="number"
                            value={dailyLimit}
                            onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                            className={cn(
                                'w-24 px-3 py-2 rounded-lg text-right font-mono font-bold border',
                                theme === 'dark'
                                    ? 'bg-[#0a0c0f] border-[#252a33] text-white focus:border-[#d97757]'
                                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                            )}
                        />
                    </div>
                    <div className={cn(
                        'w-full h-px mb-6',
                        theme === 'dark' ? 'bg-[#252a33]' : 'bg-gray-200'
                    )} />
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className={cn(
                                'text-sm font-semibold',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                Time Gap
                            </h4>
                            <p className={cn(
                                'text-xs mt-0.5',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            )}>
                                Minutes between emails
                            </p>
                        </div>
                        <input
                            type="number"
                            value={timeBetweenEmails}
                            onChange={(e) => setTimeBetweenEmails(parseInt(e.target.value) || 0)}
                            className={cn(
                                'w-24 px-3 py-2 rounded-lg text-right font-mono font-bold border',
                                theme === 'dark'
                                    ? 'bg-[#0a0c0f] border-[#252a33] text-white focus:border-[#d97757]'
                                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
