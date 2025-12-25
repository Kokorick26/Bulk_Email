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
        <div className={cn("w-full max-w-md bg-[#0c0c10]/80 border border-white/10 rounded-xl overflow-hidden shadow-xl backdrop-blur-md", className)}>
            {/* Mini Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-medium text-white">Campaign Stats</span>
                </div>
                <span className="text-[10px] text-zinc-500">Live</span>
            </div>

            {/* Mini Table */}
            <div className="p-2">
                <div className="grid grid-cols-5 gap-2 px-2 py-1.5 text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
                    <span className="col-span-2">Name</span>
                    <span className="text-center">Sent</span>
                    <span className="text-center">Open</span>
                    <span className="text-center">Reply</span>
                </div>
                {campaigns.map((camp, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 px-2 py-2.5 items-center rounded-lg hover:bg-white/[0.02] transition-colors">
                        <div className="col-span-2">
                            <div className="text-xs font-medium text-white truncate">{camp.name}</div>
                            <div className="w-full h-1 mt-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${camp.progress}%` }} />
                            </div>
                        </div>
                        <span className="text-[10px] text-zinc-400 text-center font-mono">{camp.sent}</span>
                        <span className="text-[10px] text-white text-center font-medium">{camp.openRate}</span>
                        <span className="text-[10px] text-emerald-400 text-center font-bold bg-emerald-500/10 py-0.5 rounded">{camp.replyRate}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
