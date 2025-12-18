import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarItem {
    id: string;
    label: string;
    icon: LucideIcon;
    badge?: number | string;
    badgeVariant?: 'default' | 'success' | 'warning' | 'error';
}

interface SidebarProps {
    items: SidebarItem[];
    activeId: string;
    onSelect: (id: string) => void;
    title?: string;
    footer?: React.ReactNode;
    className?: string;
}

export function Sidebar({ items, activeId, onSelect, title, footer, className }: SidebarProps) {
    return (
        <div className={cn('flex flex-col h-full', className)}>
            {title && (
                <div className="px-4 py-3">
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                        {title}
                    </span>
                </div>
            )}

            <nav className="flex-1 px-2 space-y-1">
                {items.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-white text-black'
                                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.badge !== undefined && (
                                <span className={cn(
                                    'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                                    isActive ? 'bg-black/20 text-black' : getBadgeColors(item.badgeVariant)
                                )}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {footer && (
                <div className="p-4 border-t border-white/5">
                    {footer}
                </div>
            )}
        </div>
    );
}

function getBadgeColors(variant?: 'default' | 'success' | 'warning' | 'error') {
    switch (variant) {
        case 'success':
            return 'bg-emerald-500/20 text-emerald-400';
        case 'warning':
            return 'bg-amber-500/20 text-amber-400';
        case 'error':
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-white/10 text-white/60';
    }
}
