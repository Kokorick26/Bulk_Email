import React from 'react';
import { 
    Megaphone, Inbox, Target, Users, Server, 
    Plus, Search, MoreHorizontal, 
    Send, Clock, FileText, CheckCircle, Archive,
    BarChart2, TrendingUp, MousePointer, Eye,
    ChevronRight, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DashboardMockup() {
    return (
        <div className="rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden flex h-[600px] text-sm font-sans select-none relative">
            {/* ═══════════════════════════════════════════════════════════════════
                SIDEBAR
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="w-64 border-r border-white/5 bg-[#050505] flex flex-col">
                {/* Sidebar Header */}
                <div className="h-16 flex items-center px-5 gap-3 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(255,85,51,0.3)]">
                        W
                    </div>
                    <span className="font-heading font-bold text-white text-lg tracking-tight">Warmlo</span>
                </div>

                {/* Navigation */}
                <div className="p-3 space-y-1">
                    <NavItem icon={Megaphone} label="Campaigns" active />
                    <NavItem icon={Inbox} label="Inbox" badge="3" />
                    <NavItem icon={Target} label="Discovery" />
                    <NavItem icon={Users} label="Lead Lists" />
                    <NavItem icon={Server} label="Accounts" />
                </div>

                {/* Sidebar Footer */}
                <div className="mt-auto p-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-brand-pink flex items-center justify-center text-xs font-bold text-white">
                            JD
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">John Doe</div>
                            <div className="text-[10px] text-gray-500 truncate">Pro Plan</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MAIN CONTENT - CAMPAIGNS VIEW
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex min-w-0 bg-[#0c0c0c]">
                
                {/* LEFT PANEL - LIST */}
                <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0c0c0c]">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[15px] font-semibold text-white">Campaigns</h2>
                            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-gradient-to-r from-brand-orange to-brand-orange/80 text-white hover:opacity-90 transition-opacity shadow-lg shadow-brand-orange/20">
                                <Plus className="w-3.5 h-3.5" />
                                New
                            </button>
                        </div>
                        {/* Search */}
                        <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/5">
                            <Search className="w-4 h-4 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder="Search campaigns..." 
                                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-gray-600 w-full"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <CampaignItem 
                            title="SaaS Outreach Q1" 
                            status="active" 
                            sent="1,240" 
                            openRate="42%" 
                            active 
                        />
                        <CampaignItem 
                            title="Webinar Invites" 
                            status="completed" 
                            sent="850" 
                            openRate="68%" 
                        />
                        <CampaignItem 
                            title="Follow-up Sequence" 
                            status="paused" 
                            sent="320" 
                            openRate="35%" 
                        />
                        <CampaignItem 
                            title="Cold Leads - Tech" 
                            status="draft" 
                            sent="0" 
                            openRate="-" 
                        />
                        <CampaignItem 
                            title="Partnership Outreach" 
                            status="active" 
                            sent="45" 
                            openRate="82%" 
                        />
                    </div>
                </div>

                {/* RIGHT PANEL - DETAILS */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
                    {/* Detail Header */}
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0c0c0c]">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold text-white">SaaS Outreach Q1</h1>
                                <StatusBadge status="active" />
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Started 2 days ago</span>
                                <span>•</span>
                                <span>Daily limit: 500</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-6 grid grid-cols-4 gap-4">
                        <StatCard label="Sent" value="1,240" icon={Send} color="text-blue-400" />
                        <StatCard label="Open Rate" value="42.5%" icon={Eye} color="text-brand-orange" trend="+2.4%" />
                        <StatCard label="Reply Rate" value="8.2%" icon={MessageCircle} color="text-emerald-400" trend="+1.1%" />
                        <StatCard label="Clicked" value="12.4%" icon={MousePointer} color="text-purple-400" />
                    </div>

                    {/* Chart Area (Simulated) */}
                    <div className="px-6 pb-6 flex-1">
                        <div className="h-full rounded-xl border border-white/5 bg-white/[0.02] p-4 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-medium text-white">Engagement Over Time</h3>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                                        Opens
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Replies
                                    </div>
                                </div>
                            </div>
                            
                            {/* Fake Chart Bars */}
                            <div className="flex items-end justify-between h-[200px] gap-2 px-2">
                                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                                    <div key={i} className="w-full bg-white/5 rounded-t-sm relative group">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ duration: 1, delay: i * 0.05 }}
                                            className="absolute bottom-0 left-0 right-0 bg-brand-orange/20 group-hover:bg-brand-orange/40 transition-colors rounded-t-sm"
                                        ></motion.div>
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h * 0.3}%` }}
                                            transition={{ duration: 1, delay: i * 0.05 + 0.2 }}
                                            className="absolute bottom-0 left-0 right-0 bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-colors rounded-t-sm"
                                        ></motion.div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItem({ icon: Icon, label, active, badge }: { icon: any, label: string, active?: boolean, badge?: string }) {
    return (
        <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-default transition-colors",
            active ? "bg-white text-black font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"
        )}>
            <Icon className="w-4 h-4" />
            <span className="flex-1 text-xs">{label}</span>
            {badge && (
                <span className="px-1.5 py-0.5 rounded-md bg-brand-orange text-white text-[10px] font-bold">
                    {badge}
                </span>
            )}
        </div>
    );
}

function CampaignItem({ title, status, sent, openRate, active }: { title: string, status: string, sent: string, openRate: string, active?: boolean }) {
    return (
        <div className={cn(
            "p-3 rounded-lg border cursor-default transition-all group",
            active 
                ? "bg-white/[0.06] border-white/10" 
                : "bg-transparent border-transparent hover:bg-white/[0.02]"
        )}>
            <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-medium truncate max-w-[140px]", active ? "text-white" : "text-gray-300")}>
                    {title}
                </span>
                <StatusBadge status={status} mini />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>{sent} sent</span>
                <span className={active ? "text-brand-orange" : ""}>{openRate} open</span>
            </div>
        </div>
    );
}

function StatusBadge({ status, mini }: { status: string, mini?: boolean }) {
    const styles = {
        active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
        paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    }[status] || styles.draft;

    if (mini) {
        return (
            <div className={cn("w-2 h-2 rounded-full", styles.split(' ')[1].replace('text-', 'bg-'))} />
        );
    }

    return (
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider", styles)}>
            {status}
        </span>
    );
}

function StatCard({ label, value, icon: Icon, color, trend }: { label: string, value: string, icon: any, color: string, trend?: string }) {
    return (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{label}</span>
                <Icon className={cn("w-4 h-4 opacity-80", color)} />
            </div>
            <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-white">{value}</span>
                {trend && (
                    <span className="text-[10px] text-emerald-500 font-medium mb-1 flex items-center">
                        <ArrowUpRight className="w-3 h-3" />
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}

// Helper icon for reply rate
function MessageCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    )
}
