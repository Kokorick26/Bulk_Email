import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Check, Loader2,
    Mail, Users, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../ui/Button';

interface CampaignCreateProps {
    onBack: () => void;
    onComplete: (campaignId: string) => void;
    className?: string;
}

export function CampaignCreate({ onBack, onComplete, className }: CampaignCreateProps) {
    const { theme } = useTheme();
    const [campaignName, setCampaignName] = useState('My Campaign');
    const [isCreating, setIsCreating] = useState(false);

    const handleContinue = async () => {
        if (!campaignName.trim()) return;

        setIsCreating(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');

            // Create campaign via API
            const response = await fetch('/api/bulk-email/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: campaignName.trim(),
                    status: 'draft'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create campaign');
            }

            const data = await response.json();
            onComplete(data.id || data.campaignId || 'new-campaign');
        } catch (error) {
            console.error('Error creating campaign:', error);
            // For now, just proceed with a mock ID
            onComplete('new-campaign-' + Date.now());
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={cn('min-h-[calc(100vh-100px)]', className)}>
            {/* Header */}
            <button
                onClick={onBack}
                className={cn(
                    'flex items-center gap-2 text-sm font-medium mb-8 transition-colors',
                    theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                )}
            >
                <ChevronLeft className="w-4 h-4" />
                Back
            </button>

            {/* Main Content - Centered */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg mx-auto pt-16"
            >
                {/* Title */}
                <div className="mb-8">
                    <h1 className={cn(
                        'text-2xl font-semibold mb-2',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Let's create a new campaign
                    </h1>
                    <p className={cn(
                        'text-base',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                        What would you like to name it?
                    </p>
                </div>

                {/* Campaign Name Input */}
                <div className="mb-8">
                    <label className={cn(
                        'block text-sm font-medium mb-2',
                        theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    )}>
                        Campaign Name
                    </label>
                    <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Enter campaign name..."
                        autoFocus
                        className={cn(
                            'w-full px-4 py-4 text-lg font-medium rounded-lg border-0 border-b-2 focus:outline-none transition-all',
                            theme === 'dark'
                                ? 'bg-transparent text-white border-[var(--terracotta)] placeholder:text-gray-500'
                                : 'bg-transparent text-gray-900 border-blue-500 placeholder:text-gray-400'
                        )}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className={cn(
                            'px-6 py-2.5 text-sm font-medium rounded-lg transition-colors',
                            theme === 'dark'
                                ? 'text-[var(--terracotta)] hover:text-[var(--terracotta-light)]'
                                : 'text-blue-600 hover:text-blue-700'
                        )}
                    >
                        Cancel
                    </button>
                    <Button
                        onClick={handleContinue}
                        disabled={!campaignName.trim() || isCreating}
                        className={cn(
                            'gap-2 px-6',
                            theme === 'dark'
                                ? 'bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)] text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        )}
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                Continue
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>

            {/* Decorative elements */}
            <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none overflow-hidden">
                <div className={cn(
                    'absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-10',
                    theme === 'dark' ? 'bg-[var(--terracotta)]' : 'bg-blue-400'
                )} />
            </div>
        </div>
    );
}
