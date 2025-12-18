import { cn } from '../../lib/utils';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    pulse?: boolean;
    className?: string;
}

const statusConfig: Record<StatusType, { color: string; bg: string; text: string; label: string }> = {
    success: { color: 'bg-[#1e8e3e]', bg: 'bg-[#e6f4ea]', text: 'text-[#1e8e3e]', label: 'Success' },
    warning: { color: 'bg-[#f9ab00]', bg: 'bg-[#fef7e0]', text: 'text-[#e37400]', label: 'Warning' },
    error: { color: 'bg-[#d93025]', bg: 'bg-[#fce8e6]', text: 'text-[#d93025]', label: 'Error' },
    info: { color: 'bg-[#1a73e8]', bg: 'bg-[#e8f0fe]', text: 'text-[#1a73e8]', label: 'Info' },
    pending: { color: 'bg-[#5f6368]', bg: 'bg-[#f1f3f4]', text: 'text-[#5f6368]', label: 'Pending' },
};

export function StatusBadge({ status, label, pulse, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span className={cn(
            'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium',
            config.bg,
            className
        )}>
            <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                config.color,
                pulse && 'animate-pulse'
            )} />
            <span className={config.text}>{label || config.label}</span>
        </span>
    );
}

// Simple dot indicator
export function StatusDot({ status, pulse, className }: { status: StatusType; pulse?: boolean; className?: string }) {
    const config = statusConfig[status];

    return (
        <span className={cn(
            'w-2 h-2 rounded-full',
            config.color,
            pulse && 'animate-pulse',
            className
        )} />
    );
}
