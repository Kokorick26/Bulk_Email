import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

// Compact Campaigns Stats mockup
export default function CampaignsMockup({ className }: { className?: string }) {
    const campaigns = [
        { name: 'SaaS Outreach Q1', status: 'Active', sent: '1,240', openRate: '42%', replyRate: '8.2%', progress: 65 },
        { name: 'Webinar Invites', status: 'Active', sent: '850', openRate: '68%', replyRate: '12.4%', progress: 89 },
        { name: 'Follow-up Sequence', status: 'Paused', sent: '320', openRate: '35%', replyRate: '5.1%', progress: 32 },
    ];

    return (
        <div className={cn("w-full max-w-lg bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm relative", className)}>
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")' }} />
            
            {/* Mini Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20">
                        <TrendingUp className="w-4 h-4 text-brand-orange" />
                    </div>
                    <span className="text-sm font-bold text-white font-heading">Active Campaigns</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse shadow-[0_0_8px_rgba(255,85,51,0.5)]"></span>
                    <span className="text-xs text-gray-400 font-medium">Live</span>
                </div>
            </div>

            {/* Mini Table */}
            <div className="p-3 relative z-10">
                <div className="grid grid-cols-5 gap-3 px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-white/5">
                    <span className="col-span-2">Campaign</span>
                    <span className="text-center">Sent</span>
                    <span className="text-center">Open</span>
                    <span className="text-center">Reply</span>
                </div>
                {campaigns.map((camp, i) => (
                    <div key={i} className="grid grid-cols-5 gap-3 px-3 py-3 items-center rounded-lg hover:bg-white/[0.03] transition-all cursor-default border-b border-white/5 last:border-0 group">
                        <div className="col-span-2">
                            <div className="text-xs font-semibold text-white truncate mb-2 group-hover:text-brand-orange transition-colors">{camp.name}</div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple rounded-full shadow-[0_0_8px_rgba(255,85,51,0.3)]" style={{ width: `${camp.progress}%` }} />
                            </div>
                        </div>
                        <span className="text-xs text-gray-400 text-center font-mono">{camp.sent}</span>
                        <span className="text-xs text-white text-center font-semibold">{camp.openRate}</span>
                        <span className="text-xs text-brand-orange text-center font-bold bg-brand-orange/10 py-1 px-2 rounded-md border border-brand-orange/20 shadow-sm">{camp.replyRate}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
