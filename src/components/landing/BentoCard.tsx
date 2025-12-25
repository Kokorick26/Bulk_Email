import React from 'react';
import { cn } from '@/lib/utils';
import { Target, Sparkles, Search, CheckCircle2, Mail, TrendingUp, Users, Calendar, MessageSquare, Play } from 'lucide-react';

// ============================================
// BENTO CARD WRAPPER
// ============================================
export function BentoCard({
    children,
    className,
    ...props
}: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/70",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

// ============================================
// LEAD DISCOVERY MOCKUP (Compact)
// ============================================
export function LeadDiscoveryMockup() {
    return (
        <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900/80 overflow-hidden">
            {/* Search Bar */}
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-400 flex-1">Find SaaS founders in US...</span>
                <span className="px-2 py-0.5 bg-violet-500 rounded text-[10px] font-medium text-white">Search</span>
            </div>
            {/* Results */}
            <div className="p-3 space-y-2">
                {[
                    { name: 'Sarah Chen', role: 'CTO @ TechFlow', score: 98 },
                    { name: 'Michael Ross', role: 'VP Sales @ Growth.io', score: 94 },
                ].map((lead, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 border border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400">
                                {lead.name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-xs text-white font-medium">{lead.name}</div>
                                <div className="text-[10px] text-zinc-500">{lead.role}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-emerald-400">{lead.score}%</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// INBOX MOCKUP (Compact)
// ============================================
export function InboxMockup() {
    const emails = [
        { sender: 'Alex from Stripe', subject: 'Re: Partnership', color: 'bg-indigo-500', unread: true },
        { sender: 'Vanessa Wu', subject: 'Demo Request', color: 'bg-emerald-500', unread: true },
        { sender: 'David Miller', subject: 'Contract signed ✓', color: 'bg-amber-500', unread: false },
    ];
    return (
        <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900/80 overflow-hidden">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-white font-medium">All Inboxes</span>
                <span className="ml-auto text-[10px] text-zinc-500">3 unread</span>
            </div>
            <div className="divide-y divide-white/5">
                {emails.map((email, i) => (
                    <div key={i} className="flex items-center gap-2 p-3">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white", email.color)}>
                            {email.sender.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={cn("text-xs truncate", email.unread ? "text-white font-medium" : "text-zinc-400")}>{email.sender}</div>
                            <div className="text-[10px] text-zinc-600 truncate">{email.subject}</div>
                        </div>
                        {email.unread && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// CAMPAIGN STATS MOCKUP (Compact)
// ============================================
export function CampaignStatsMockup() {
    const campaigns = [
        { name: 'Q3 Outreach', sent: 1240, openRate: '68%', replyRate: '12.4%', progress: 65 },
        { name: 'Webinar Invites', sent: 850, openRate: '72%', replyRate: '8.1%', progress: 42 },
    ];
    return (
        <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900/80 overflow-hidden">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs text-white font-medium">Campaign Stats</span>
            </div>
            <table className="w-full text-[10px]">
                <thead className="bg-zinc-800/50 text-zinc-500">
                    <tr>
                        <th className="text-left px-3 py-2 font-medium">Campaign</th>
                        <th className="text-center px-2 py-2 font-medium">Sent</th>
                        <th className="text-center px-2 py-2 font-medium">Open</th>
                        <th className="text-center px-2 py-2 font-medium">Reply</th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map((c, i) => (
                        <tr key={i} className="border-t border-white/5">
                            <td className="px-3 py-2 text-white font-medium">{c.name}</td>
                            <td className="text-center px-2 py-2 text-zinc-400 tabular-nums">{c.sent}</td>
                            <td className="text-center px-2 py-2 text-zinc-300">{c.openRate}</td>
                            <td className="text-center px-2 py-2"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{c.replyRate}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============================================
// PERSONALIZATION MOCKUP (Text skeleton)
// ============================================
export function PersonalizationMockup() {
    return (
        <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900/80 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] text-blue-400 font-medium">AI-Generated Email</span>
            </div>
            <div className="w-3/4 h-2 bg-zinc-700 rounded animate-pulse" />
            <div className="w-full h-2 bg-zinc-700 rounded animate-pulse" />
            <div className="w-2/3 h-2 bg-zinc-700 rounded animate-pulse" />
            <div className="w-1/2 h-2 bg-zinc-700/50 rounded animate-pulse mt-4" />
        </div>
    );
}

// ============================================
// EXPORTS
// ============================================
export default BentoCard;
