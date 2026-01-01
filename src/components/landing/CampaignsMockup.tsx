import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

// Compact Campaigns Stats mockup
export default function CampaignsMockup({ className }: { className?: string }) {
    const campaigns = [
        { name: 'Q3 Outreach', status: 'Active', sent: '1,240', openRate: '68%', replyRate: '12.4%', progress: 65 },
        { name: 'Webinar Invites', status: 'Active', sent: '850', openRate: '72%', replyRate: '8.1%', progress: 42 },
    ];

    return (
        <div className={cn("w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl", className)}>
            {/* Mini Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#0c0c0c]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-brand-orange/10 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-brand-orange" />
                    </div>
                    <span className="text-xs font-semibold text-white">Campaign Stats</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-gray-500 font-medium">Live</span>
                </div>
            </div>

            {/* Mini Table */}
            <div className="p-2">
                <div className="grid grid-cols-5 gap-2 px-2 py-1.5 text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                    <span className="col-span-2">Name</span>
                    <span className="text-center">Sent</span>
                    <span className="text-center">Open</span>
                    <span className="text-center">Reply</span>
                </div>
                {campaigns.map((camp, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 px-2 py-2.5 items-center rounded-lg hover:bg-white/[0.02] transition-colors cursor-default">
                        <div className="col-span-2">
                            <div className="text-xs font-medium text-white truncate mb-1.5">{camp.name}</div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-brand-orange to-brand-pink rounded-full" style={{ width: `${camp.progress}%` }} />
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-400 text-center font-mono">{camp.sent}</span>
                        <span className="text-[10px] text-white text-center font-medium">{camp.openRate}</span>
                        <span className="text-[10px] text-emerald-400 text-center font-bold bg-emerald-500/10 py-0.5 rounded border border-emerald-500/20">{camp.replyRate}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
