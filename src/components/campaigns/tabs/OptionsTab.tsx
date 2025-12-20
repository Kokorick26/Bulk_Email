import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Server, ChevronDown, Plus
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../lib/ThemeContext';
import { Button } from '../../ui/Button';
import type { CampaignOptions } from '../types';

interface OptionsTabProps {
    campaignId: string;
    options: CampaignOptions | null;
    onOptionsUpdate: (options: CampaignOptions) => void;
    className?: string;
}

interface ExtendedOptions extends CampaignOptions {
    linkTracking: boolean;
    sendTextOnly: boolean;
    sendFirstEmailTextOnly: boolean;
    dailyLimit: number;
}

const defaultOptions: ExtendedOptions = {
    trackOpens: true,
    trackClicks: true,
    stopOnReply: true,
    stopOnClick: false,
    removeUnsubscribed: true,
    smtpAccountId: undefined,
    linkTracking: false,
    sendTextOnly: false,
    sendFirstEmailTextOnly: false,
    dailyLimit: 30
};

interface ToggleButtonGroupProps {
    value: boolean;
    onChange: (value: boolean) => void;
    enableLabel?: string;
    disableLabel?: string;
    theme: 'dark' | 'light';
}

function ToggleButtonGroup({
    value,
    onChange,
    enableLabel = 'Enable',
    disableLabel = 'Disable',
    theme
}: ToggleButtonGroupProps) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onChange(false)}
                className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    !value
                        ? theme === 'dark'
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-200 text-gray-900'
                        : theme === 'dark'
                            ? 'text-gray-400 hover:bg-gray-800'
                            : 'text-gray-500 hover:bg-gray-100'
                )}
            >
                {disableLabel}
            </button>
            <button
                onClick={() => onChange(true)}
                className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    value
                        ? 'bg-emerald-500 text-white'
                        : theme === 'dark'
                            ? 'text-gray-400 hover:bg-gray-800'
                            : 'text-gray-500 hover:bg-gray-100'
                )}
            >
                {enableLabel}
            </button>
        </div>
    );
}

export function OptionsTab({ campaignId, options, onOptionsUpdate, className }: OptionsTabProps) {
    const { theme } = useTheme();
    const [localOptions, setLocalOptions] = useState<ExtendedOptions>({
        ...defaultOptions,
        ...options
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (options) {
            setLocalOptions(prev => ({ ...prev, ...options }));
        }
    }, [options]);

    const handleUpdate = (key: keyof ExtendedOptions, value: any) => {
        setLocalOptions(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async () => {
        // Save to backend
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/bulk-email/campaigns/${campaignId}/options`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ options: localOptions })
            });
        } catch (err) {
            console.error('Error saving options:', err);
        }

        onOptionsUpdate(localOptions);
    };

    return (
        <div className={cn('max-w-3xl space-y-4', className)}>
            {/* Accounts to use */}
            <div className={cn(
                'p-5 rounded-xl border',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
            )}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={cn(
                            'font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Accounts to use
                        </h4>
                        <p className={cn(
                            'text-sm mt-0.5',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            Select one or more accounts to send emails from
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="relative w-48">
                            <select
                                value={localOptions.smtpAccountId || ''}
                                onChange={(e) => handleUpdate('smtpAccountId', e.target.value || undefined)}
                                className={cn(
                                    'w-full px-4 py-2.5 pr-10 rounded-lg border appearance-none cursor-pointer text-sm',
                                    theme === 'dark'
                                        ? 'bg-[#252525] border-gray-700 text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'
                                )}
                            >
                                <option value="">Select...</option>
                            </select>
                            <ChevronDown className={cn(
                                'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )} />
                        </div>
                        <button className="text-sm text-blue-500 hover:underline mt-2">
                            Connect new email account
                        </button>
                    </div>
                </div>
            </div>

            {/* Stop sending emails on reply */}
            <div className={cn(
                'p-5 rounded-xl border',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
            )}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={cn(
                            'font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Stop sending emails on reply
                        </h4>
                        <p className={cn(
                            'text-sm mt-0.5',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            Stop sending emails to a lead if a response has been received
                        </p>
                    </div>
                    <ToggleButtonGroup
                        value={localOptions.stopOnReply}
                        onChange={(v) => handleUpdate('stopOnReply', v)}
                        theme={theme}
                    />
                </div>
            </div>

            {/* Open Tracking */}
            <div className={cn(
                'p-5 rounded-xl border',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
            )}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={cn(
                            'font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Open Tracking
                        </h4>
                        <p className={cn(
                            'text-sm mt-0.5',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            Track email opens
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localOptions.linkTracking}
                                onChange={(e) => handleUpdate('linkTracking', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600"
                            />
                            <span className={cn(
                                'text-sm',
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                                Link tracking
                            </span>
                        </label>
                        <ToggleButtonGroup
                            value={localOptions.trackOpens}
                            onChange={(v) => handleUpdate('trackOpens', v)}
                            theme={theme}
                        />
                    </div>
                </div>
            </div>

            {/* Delivery Optimization */}
            <div className={cn(
                'p-5 rounded-xl border',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
            )}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={cn(
                            'font-medium flex items-center gap-2',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Delivery Optimization
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-500">
                                Recommended
                            </span>
                        </h4>
                        <p className={cn(
                            'text-sm mt-0.5',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            Disables open tracking
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localOptions.sendTextOnly}
                                onChange={(e) => handleUpdate('sendTextOnly', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600"
                            />
                            <span className={cn(
                                'text-sm',
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                                Send emails as text-only (no HTML)
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localOptions.sendFirstEmailTextOnly}
                                onChange={(e) => handleUpdate('sendFirstEmailTextOnly', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600"
                            />
                            <span className={cn(
                                'text-sm flex items-center gap-2',
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                                Send first email as text-only
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-500">
                                    Pro
                                </span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Daily Limit */}
            <div className={cn(
                'p-5 rounded-xl border',
                theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
            )}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={cn(
                            'font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                            Daily Limit
                        </h4>
                        <p className={cn(
                            'text-sm mt-0.5',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                            Max number of emails to send per day for this campaign
                        </p>
                    </div>
                    <input
                        type="number"
                        min="1"
                        max="1000"
                        value={localOptions.dailyLimit}
                        onChange={(e) => handleUpdate('dailyLimit', parseInt(e.target.value) || 30)}
                        className={cn(
                            'w-24 px-4 py-2.5 rounded-lg border text-center',
                            theme === 'dark'
                                ? 'bg-[#252525] border-gray-700 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900'
                        )}
                    />
                </div>
            </div>

            {/* Show advanced options */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 text-sm transition-colors',
                    theme === 'dark'
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-blue-600 hover:text-blue-700'
                )}
            >
                <span className={cn(
                    'w-2 h-2 rounded-full',
                    theme === 'dark' ? 'bg-blue-400' : 'bg-blue-600'
                )} />
                {showAdvanced ? 'Hide' : 'Show'} advanced options
                <ChevronDown className={cn(
                    'w-4 h-4 transition-transform',
                    showAdvanced && 'rotate-180'
                )} />
            </button>

            {/* Advanced Options */}
            {showAdvanced && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                >
                    {/* Stop on click */}
                    <div className={cn(
                        'p-5 rounded-xl border',
                        theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                    )}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className={cn(
                                    'font-medium',
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    Stop sending emails on click
                                </h4>
                                <p className={cn(
                                    'text-sm mt-0.5',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Stop sending emails to a lead if they click a link
                                </p>
                            </div>
                            <ToggleButtonGroup
                                value={localOptions.stopOnClick}
                                onChange={(v) => handleUpdate('stopOnClick', v)}
                                theme={theme}
                            />
                        </div>
                    </div>

                    {/* Remove unsubscribed */}
                    <div className={cn(
                        'p-5 rounded-xl border',
                        theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
                    )}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className={cn(
                                    'font-medium',
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    Remove unsubscribed contacts
                                </h4>
                                <p className={cn(
                                    'text-sm mt-0.5',
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Automatically remove contacts who unsubscribe
                                </p>
                            </div>
                            <ToggleButtonGroup
                                value={localOptions.removeUnsubscribed}
                                onChange={(v) => handleUpdate('removeUnsubscribed', v)}
                                theme={theme}
                            />
                        </div>
                    </div>
                </motion.div>
            )}

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
    );
}
