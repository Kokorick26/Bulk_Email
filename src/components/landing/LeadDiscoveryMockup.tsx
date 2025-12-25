import React from 'react';
import { cn } from '@/lib/utils';
import { Building2, CheckCircle2, Sparkles } from 'lucide-react';

// Minimal, compact Lead Discovery mockup that fits inside a feature card
export default function LeadDiscoveryMockup({ className }: { className?: string }) {
    return (
        <div className={cn("w-full max-w-xs bg-[#0c0c10]/80 border border-white/10 rounded-xl overflow-hidden shadow-xl backdrop-blur-md", className)}>
            {/* Mini Search Bar */}
            <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 bg-zinc-800/80 rounded-lg px-3 py-1.5 text-xs text-zinc-400">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span className="truncate">Find SaaS founders in US...</span>
                </div>
            </div>

            {/* Mini Lead Cards */}
            <div className="p-3 space-y-2">
                {[
                    { name: 'TechFlow Solutions', role: 'CTO', score: 98 },
                    { name: 'GrowthScale.io', role: 'VP Sales', score: 94 },
                ].map((lead, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <div>
                                <div className="text-xs font-medium text-white">{lead.name}</div>
                                <div className="text-[10px] text-zinc-500">Target: {lead.role}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-400">{lead.score}%</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
