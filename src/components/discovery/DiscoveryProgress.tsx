import { useState, useEffect } from 'react';
import {
    Brain, Search, Filter, CheckCircle2, Sparkles, Globe, Building2, Users
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { DiscoveryStep } from './types';

interface DiscoveryProgressProps {
    isActive: boolean;
    currentStep: number;
    onComplete?: () => void;
}

const DISCOVERY_STEPS: DiscoveryStep[] = [
    {
        id: 1,
        title: 'Understanding Intent',
        description: 'Analyzing your business prompt and requirements...',
        status: 'pending'
    },
    {
        id: 2,
        title: 'Multi-Platform Research',
        description: 'Searching LinkedIn, websites, and directories...',
        status: 'pending'
    },
    {
        id: 3,
        title: 'Qualification & Scoring',
        description: 'Evaluating companies against your criteria...',
        status: 'pending'
    },
    {
        id: 4,
        title: 'Generating Results',
        description: 'Selecting top 5 highest-scoring matches...',
        status: 'pending'
    }
];

export function DiscoveryProgress({ isActive, currentStep }: DiscoveryProgressProps) {
    const { theme } = useTheme();
    const [animatedDots, setAnimatedDots] = useState('');

    // Animate dots for active step
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setAnimatedDots(prev => {
                if (prev.length >= 3) return '';
                return prev + '.';
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isActive]);

    const getStepIcon = (step: number) => {
        switch (step) {
            case 1: return Brain;
            case 2: return Search;
            case 3: return Filter;
            case 4: return Sparkles;
            default: return CheckCircle2;
        }
    };

    const getStepStatus = (stepId: number): 'pending' | 'active' | 'completed' => {
        if (stepId < currentStep) return 'completed';
        if (stepId === currentStep) return 'active';
        return 'pending';
    };

    return (
        <div className={cn(
            'rounded-2xl border overflow-hidden',
            theme === 'dark'
                ? 'bg-gradient-to-br from-[#292a2d] to-[#1f2023] border-[#3c4043]'
                : 'bg-gradient-to-br from-white to-[#f8f9fa] border-[#dadce0]'
        )}>
            {/* Header with animated background */}
            <div className={cn(
                'relative overflow-hidden px-6 py-5 border-b',
                theme === 'dark' ? 'border-[#3c4043]' : 'border-[#e8eaed]'
            )}>
                {/* Animated gradient background */}
                <div className="absolute inset-0 opacity-30">
                    <div className={cn(
                        'absolute inset-0 bg-gradient-to-r from-transparent via-[#1a73e8]/20 to-transparent',
                        'animate-shimmer'
                    )}
                        style={{ backgroundSize: '200% 100%' }}
                    />
                </div>

                <div className="relative flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        'bg-gradient-to-br from-[#1a73e8] to-[#8ab4f8]'
                    )}>
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className={cn(
                            'text-lg font-semibold',
                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                        )}>
                            AI Discovery in Progress
                        </h3>
                        <p className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                        )}>
                            Finding your ideal clients{animatedDots}
                        </p>
                    </div>
                </div>
            </div>

            {/* Steps */}
            <div className="p-6 space-y-4">
                {DISCOVERY_STEPS.map((step, index) => {
                    const status = getStepStatus(step.id);
                    const Icon = getStepIcon(step.id);
                    const isLast = index === DISCOVERY_STEPS.length - 1;

                    return (
                        <div key={step.id} className="relative">
                            <div className="flex items-start gap-4">
                                {/* Step indicator */}
                                <div className="relative">
                                    <div className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500',
                                        status === 'completed'
                                            ? 'bg-emerald-500 text-white'
                                            : status === 'active'
                                                ? theme === 'dark'
                                                    ? 'bg-[#8ab4f8] text-[#202124]'
                                                    : 'bg-[#1a73e8] text-white'
                                                : theme === 'dark'
                                                    ? 'bg-[#3c4043] text-[#9aa0a6]'
                                                    : 'bg-[#e8eaed] text-[#5f6368]'
                                    )}>
                                        {status === 'completed' ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <Icon className={cn(
                                                'w-5 h-5',
                                                status === 'active' && 'animate-pulse'
                                            )} />
                                        )}
                                    </div>

                                    {/* Connector line */}
                                    {!isLast && (
                                        <div className={cn(
                                            'absolute left-1/2 top-10 w-0.5 h-8 -translate-x-1/2 transition-colors duration-500',
                                            status === 'completed'
                                                ? 'bg-emerald-500'
                                                : theme === 'dark'
                                                    ? 'bg-[#3c4043]'
                                                    : 'bg-[#e8eaed]'
                                        )} />
                                    )}
                                </div>

                                {/* Step content */}
                                <div className={cn(
                                    'flex-1 pb-6 transition-opacity duration-300',
                                    status === 'pending' && 'opacity-50'
                                )}>
                                    <h4 className={cn(
                                        'text-sm font-semibold mb-1',
                                        status === 'active'
                                            ? theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                            : theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                    )}>
                                        {step.title}
                                    </h4>
                                    <p className={cn(
                                        'text-xs',
                                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                    )}>
                                        {step.description}
                                    </p>

                                    {/* Active step animation */}
                                    {status === 'active' && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map(i => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            'w-1.5 h-1.5 rounded-full',
                                                            theme === 'dark' ? 'bg-[#8ab4f8]' : 'bg-[#1a73e8]'
                                                        )}
                                                        style={{
                                                            animation: 'bounce 1s infinite',
                                                            animationDelay: `${i * 0.15}s`
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <span className={cn(
                                                'text-xs',
                                                theme === 'dark' ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'
                                            )}>
                                                Processing
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating icons animation */}
            <div className="relative h-16 overflow-hidden border-t"
                style={{ borderColor: theme === 'dark' ? '#3c4043' : '#e8eaed' }}>
                <div className="absolute inset-0 flex items-center justify-center gap-8">
                    {[Globe, Building2, Users, Search].map((Icon, i) => (
                        <Icon
                            key={i}
                            className={cn(
                                'w-5 h-5',
                                theme === 'dark' ? 'text-[#3c4043]' : 'text-[#e8eaed]'
                            )}
                            style={{
                                animation: 'float 3s ease-in-out infinite',
                                animationDelay: `${i * 0.5}s`
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
