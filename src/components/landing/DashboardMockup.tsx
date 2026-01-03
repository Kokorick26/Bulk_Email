import React from 'react';
import {
    Megaphone, Inbox, Target, Users, Server,
    Plus, Search, MoreHorizontal,
    Send, Clock, Eye,
    TrendingUp, MousePointer, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DashboardMockup() {
    return (
        <div className="rounded-xl border border-white/10 bg-[#050505] shadow-2xl shadow-black/50 overflow-hidden flex h-[600px] text-sm select-none relative">
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")' }} />

            {/* ═══════════════════════════════════════════════════════════════════
                COLLAPSED SIDEBAR
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="w-16 border-r border-white/5 bg-[#050505] flex flex-col items-center relative z-10">
                {/* Sidebar Header - Just Logo */}
                <div className="h-16 flex items-center justify-center border-b border-white/5 bg-white/[0.01] w-full">
                    <img src="/logo.png" alt="Warmlo" className="w-9 h-9 rounded-lg" />
                </div>

                {/* Navigation - Icons Only */}
                <div className="py-4 space-y-2 w-full flex flex-col items-center">
                    <NavItemCollapsed icon={Megaphone} active />
                    <NavItemCollapsed icon={Inbox} badge="3" />
                    <NavItemCollapsed icon={Target} />
                    <NavItemCollapsed icon={Users} />
                    <NavItemCollapsed icon={Server} />
                </div>

                {/* Sidebar Footer - Avatar Only */}
                <div className="mt-auto p-4 border-t border-white/5 bg-white/[0.01] w-full flex justify-center">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-orange via-brand-pink to-brand-purple flex items-center justify-center text-xs font-bold text-white shadow-[0_0_15px_rgba(255,85,51,0.3)]">
                        JD
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MAIN CONTENT - CAMPAIGNS VIEW
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex min-w-0 bg-[#050505] relative z-10">

                {/* LEFT PANEL - Campaign List */}
                <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0c0c0c]">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[15px] font-semibold text-white">Campaigns</h2>
                            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-gradient-to-r from-brand-orange to-brand-orange/80 text-white hover:opacity-90 transition-opacity shadow-lg shadow-brand-orange/20">
                                <Plus className="w-3.5 h-3.5" />
                                New
                            </button>
                        </div>
                        {/* Search */}
                        <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/[0.04]">
                            <Search className="w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search campaigns..."
                                className="bg-transparent border-none outline-none text-[13px] text-white placeholder:text-gray-500 w-full"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Campaign List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <CampaignItem
                            title="SaaS Outreach Q1"
                            status="active"
                            leads="1,240"
                            progress={65}
                            active
                        />
                        <CampaignItem
                            title="Webinar Invites"
                            status="completed"
                            leads="850"
                            progress={100}
                        />
                        <CampaignItem
                            title="Follow-up Sequence"
                            status="paused"
                            leads="320"
                            progress={35}
                        />
                        <CampaignItem
                            title="Cold Leads - Tech"
                            status="draft"
                            leads="0"
                            progress={0}
                        />
                        <CampaignItem
                            title="Partnership Outreach"
                            status="active"
                            leads="145"
                            progress={12}
                        />
                    </div>
                </div>

                {/* RIGHT PANEL - Campaign Details */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#080808]">
                    {/* Detail Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0c0c0c]">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-[17px] font-semibold text-white">SaaS Outreach Q1</h1>
                                <StatusBadge status="active" />
                            </div>
                            <div className="text-[12px] text-gray-500 mt-0.5 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Created Dec 31, 2025 • 1,240 recipients</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-gradient-to-r from-brand-orange to-brand-orange/80 text-white hover:opacity-90 transition-opacity">
                                <Eye className="w-3.5 h-3.5" />
                                View Details
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-6">
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <StatCard label="Progress" value="65%" icon={TrendingUp} color="text-orange-500" />
                            <StatCard label="Emails Sent" value="1,240" sub="of 1,240" icon={Send} color="text-blue-400" />
                            <StatCard label="Replied" value="0" sub="0% reply rate" icon={ArrowUpRight} color="text-emerald-400" />
                            <StatCard label="Clicked" value="0" sub="0% click rate" icon={MousePointer} color="text-purple-400" />
                        </div>

                        {/* Quick Overview Card */}
                        <div className="p-5 rounded-xl border border-white/5 bg-[#0c0c0c]">
                            <h3 className="text-[13px] font-semibold text-white mb-4">Quick Overview</h3>
                            <div className="space-y-3 mb-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-400">Status</span>
                                    <StatusBadge status="active" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-400">Total Recipients</span>
                                    <span className="text-[13px] font-medium text-white">1,240</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-400">Created</span>
                                    <span className="text-[13px] font-medium text-white">Dec 31, 2025</span>
                                </div>
                            </div>
                            <button className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-medium bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                                View Full Campaign Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItemCollapsed({ icon: Icon, active, badge }: { icon: any, active?: boolean, badge?: string }) {
    return (
        <div className="relative group">
            <div className={cn(
                "w-10 h-10 flex items-center justify-center rounded-lg cursor-default transition-colors relative",
                active ? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}>
                <Icon className="w-5 h-5" />
                {badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-brand-orange text-white text-[9px] font-bold shadow-lg">
                        {badge}
                    </span>
                )}
            </div>
        </div>
    );
}

function CampaignItem({ title, status, leads, progress, active }: { title: string, status: string, leads: string, progress: number, active?: boolean }) {
    const statusStyles: Record<string, { dot: string }> = {
        draft: { dot: 'bg-gray-400' },
        active: { dot: 'bg-emerald-400' },
        paused: { dot: 'bg-amber-400' },
        completed: { dot: 'bg-blue-400' },
    };

    return (
        <button
            className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all group',
                active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
            )}
        >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.06]">
                <Megaphone className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium truncate text-white">
                        {title}
                    </p>
                    <span className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        statusStyles[status]?.dot,
                        status === 'active' && 'animate-pulse'
                    )} />
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span>{leads} leads</span>
                    {progress > 0 && (
                        <>
                            <span>•</span>
                            <span>{progress}% sent</span>
                        </>
                    )}
                </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; text: string; dot: string }> = {
        active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-400' },
        completed: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-400' },
        draft: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
        paused: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-400' },
    };

    const style = styles[status] || styles.draft;

    return (
        <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
            style.bg,
            style.text
        )}>
            <span className={cn('w-1 h-1 rounded-full', style.dot)} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string, value: string, sub?: string, icon: any, color: string }) {
    return (
        <div className="p-4 rounded-xl border border-white/5 bg-[#0c0c0c] hover:bg-white/[0.02] transition-all group backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/10">
                    <Icon className={cn("w-4 h-4", color)} />
                </div>
                <span className="text-[12px] font-medium text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-semibold text-white mb-0.5">{value}</p>
            {sub && (
                <p className="text-[11px] text-gray-500">{sub}</p>
            )}
        </div>
    );
}
