import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    suffix?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    gradient?: string;
    className?: string;
}

export function StatsCard({
    label,
    value,
    icon: Icon,
    suffix = '',
    trend,
    className,
}: StatsCardProps) {
    return (
        <div
            className={cn(
                'gmail-card p-4 hover:shadow-md transition-all duration-200',
                className
            )}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#1a73e8]" />
                </div>
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-medium text-[#202124]">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                        {suffix && (
                            <span className="text-lg text-[#5f6368]">{suffix}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[#5f6368]">{label}</span>
                        {trend && (
                            <span className={cn(
                                'text-xs font-medium',
                                trend.isPositive ? 'text-[#1e8e3e]' : 'text-[#d93025]'
                            )}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
