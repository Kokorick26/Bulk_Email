import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, UserPlus } from 'lucide-react';

const LEADS = [
    {
        id: 1,
        name: 'Sarah Chen',
        role: 'VP of Sales',
        company: 'TechFlow',
        avatar: 'https://avatars.githubusercontent.com/u/1234567?v=4',
        status: 'Verified',
    },
    {
        id: 2,
        name: 'Michael Ross',
        role: 'Founder',
        company: 'Growth.io',
        avatar: 'https://avatars.githubusercontent.com/u/2345678?v=4',
        status: 'Verified',
    },
    {
        id: 3,
        name: 'Jessica Wu',
        role: 'Head of Marketing',
        company: 'ScaleAI',
        avatar: 'https://avatars.githubusercontent.com/u/3456789?v=4',
        status: 'Verified',
    },
];

export default function LeadsListCard({ className }: { className?: string }) {
    return (
        <div className={cn("w-full bg-[#0c0c10] border border-white/10 rounded-xl overflow-hidden shadow-2xl", className)}>
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-xs font-medium text-violet-200">Live Scraper</span>
                </div>
                <span className="text-xs text-zinc-500">160M+ Database</span>
            </div>

            <div className="divide-y divide-white/5">
                {LEADS.map((lead, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                                {lead.name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white flex items-center gap-2">
                                    {lead.name}
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                </div>
                                <div className="text-xs text-zinc-500">{lead.role} @ {lead.company}</div>
                            </div>
                        </div>
                        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-violet-500 hover:text-white text-zinc-400 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                            <UserPlus className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Skeleton item to suggest more */}
                <div className="p-4 flex items-center gap-3 opacity-30">
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                    <div className="space-y-2 flex-1">
                        <div className="w-24 h-2 bg-white/10 rounded" />
                        <div className="w-16 h-2 bg-white/10 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
