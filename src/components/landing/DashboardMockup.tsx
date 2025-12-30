import React from 'react';
import { Mail, BarChart3, Users, Send, Settings, Plus, Search, MoreHorizontal, ArrowUpRight, ArrowDownRight, Bell, HelpCircle, ChevronDown, Filter, Download, Inbox, Sparkles, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardMockup = () => {
    return (
        <div className="w-full h-full bg-[var(--slate-deep)] rounded-xl overflow-hidden flex border border-white/10 shadow-2xl font-sans relative select-none" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-[var(--terracotta)]/8 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[var(--gold)]/5 blur-[100px] rounded-full" />
            </div>

            {/* Sidebar */}
            <div className="w-16 md:w-64 border-r border-white/5 flex flex-col bg-[var(--slate-rich)]/80 backdrop-blur-xl relative z-10">
                <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] flex items-center justify-center shrink-0 shadow-lg shadow-[var(--terracotta)]/20 ring-1 ring-white/10">
                        <Mail className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white tracking-tight hidden md:block text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Kokorick AI</span>
                </div>

                <div className="flex-1 py-6 space-y-1 px-3">
                    {[
                        { icon: BarChart3, label: 'Overview', active: true },
                        { icon: Send, label: 'Campaigns', active: false },
                        { icon: Users, label: 'Leads', active: false },
                        { icon: Inbox, label: 'Unified Inbox', badge: '12' },
                        { icon: Target, label: 'Lead Finder', active: false, isNew: true },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-default transition-all duration-200 ${item.active
                                ? 'bg-[var(--terracotta)]/10 text-[var(--terracotta)] font-medium border-l-2 border-[var(--terracotta)]'
                                : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-secondary)] border-l-2 border-transparent'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 transition-colors ${item.active ? 'text-[var(--terracotta)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`} />
                            <span className={`hidden md:block text-sm transition-colors ${!item.active && 'group-hover:text-[var(--text-secondary)]'}`}>{item.label}</span>
                            {item.badge && (
                                <span className="hidden md:flex ml-auto bg-[var(--terracotta)] text-white text-[10px] items-center justify-center h-5 px-2 rounded-full font-bold shadow-sm">
                                    {item.badge}
                                </span>
                            )}
                            {item.isNew && (
                                <span className="hidden md:flex ml-auto text-[10px] text-emerald-400 font-bold tracking-wide px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    NEW
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-auto p-4 border-t border-white/5">
                    <div className="bg-gradient-to-br from-[var(--slate-mid)] to-[var(--slate-deep)] rounded-xl p-4 border border-white/5 relative overflow-hidden hidden md:block">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Sparkles className="w-12 h-12 text-[var(--terracotta)]" /></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-white text-xs font-semibold">Pro Plan</div>
                                <div className="text-[10px] text-[var(--terracotta)] font-mono bg-[var(--terracotta)]/10 px-2 py-0.5 rounded">ACTIVE</div>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full mb-3 overflow-hidden">
                                <div className="bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-light)] h-full w-[75%] rounded-full" />
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">75% of monthly credits used</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 px-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--terracotta)] to-[var(--gold)] ring-2 ring-white/10 flex items-center justify-center text-xs font-bold text-white shadow-md">
                            JD
                        </div>
                        <div className="hidden md:block overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">John Doe</div>
                            <div className="text-xs text-[var(--text-muted)] truncate">john@company.com</div>
                        </div>
                        <Settings className="w-4 h-4 text-[var(--text-muted)] ml-auto hover:text-white transition-colors cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-[var(--slate-deep)] relative z-0">
                {/* Header */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[var(--slate-rich)]/50 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <span className="hover:text-white transition-colors cursor-pointer">Dashboard</span>
                        <span className="text-[var(--text-muted)]/50">/</span>
                        <span className="text-white font-medium">Overview</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 text-xs text-[var(--text-muted)] font-mono hover:bg-white/10 transition-colors cursor-pointer">
                            <Search className="w-3.5 h-3.5" />
                            <span>⌘K</span>
                        </div>
                        <div className="h-5 w-px bg-white/10 mx-1" />
                        <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors group">
                            <Bell className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white transition-colors" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--terracotta)] rounded-full ring-2 ring-[var(--slate-rich)]" />
                        </button>
                        <button className="p-2 rounded-xl hover:bg-white/5 transition-colors group">
                            <HelpCircle className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8 overflow-hidden flex-1 relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Welcome back, Alex 👋</h2>
                            <div className="text-sm text-[var(--text-muted)]">Here's what's happening with your outreach today.</div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm font-medium border border-white/10 hover:bg-white/10 transition-all">
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-dark)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--terracotta)]/20 ring-1 ring-white/10">
                                <Plus className="w-4 h-4" />
                                <span>New Campaign</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Revenue', value: '$12,450', change: '+12.5%', isUp: true, sub: 'Last 30 days' },
                            { label: 'Emails Sent', value: '45,231', change: '+8.2%', isUp: true, sub: '99% delivered' },
                            { label: 'Avg. Reply Rate', value: '12.8%', change: '+2.1%', isUp: true, sub: 'Top 5% of users' },
                            { label: 'Meetings Booked', value: '48', change: '+5', isUp: true, sub: 'This week' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-[var(--slate-rich)] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider">{stat.label}</div>
                                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                        {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{stat.value}</div>
                                <div className="text-xs text-[var(--text-muted)]">{stat.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Area */}
                    <div className="grid grid-cols-3 gap-5 h-[18rem]">
                        <div className="col-span-2 bg-[var(--slate-rich)] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-semibold text-sm flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                                    <TrendingUp className="w-4 h-4 text-[var(--terracotta)]" />
                                    Campaign Performance
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--terracotta)]" />
                                        <div className="text-xs text-[var(--text-muted)]">Sent</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <div className="text-xs text-[var(--text-muted)]">Replies</div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Bars */}
                            <div className="flex-1 flex items-end justify-between gap-2 px-2">
                                {[45, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95, 85, 90].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group cursor-pointer">
                                        {/* Reply Bar */}
                                        <div
                                            className="w-full bg-emerald-500/70 rounded-sm opacity-70 group-hover:opacity-100 transition-all duration-300"
                                            style={{ height: `${h * 0.3}%` }}
                                        />
                                        {/* Sent Bar */}
                                        <div
                                            className="w-full bg-[var(--terracotta)] rounded-sm opacity-90 group-hover:opacity-100 transition-all duration-300 relative"
                                            style={{ height: `${h * 0.6}%` }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--slate-mid)] text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-xl whitespace-nowrap z-20 pointer-events-none">
                                                {h * 12} Sent
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between pt-4 text-[10px] text-[var(--text-muted)] uppercase font-mono tracking-wider">
                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div className="bg-[var(--slate-rich)] border border-white/5 rounded-2xl p-0 overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Live Feed</h3>
                                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                {/* Gradient fades */}
                                <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[var(--slate-rich)] to-transparent z-10 pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[var(--slate-rich)] to-transparent z-10 pointer-events-none" />

                                <div className="space-y-1 p-3">
                                    {[
                                        { user: 'Sarah Vance', action: 'opened email', time: 'Just now', icon: '👀', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                                        { user: 'Mike Ross', action: 'replied to "Q4 Intro"', time: '2m ago', icon: '↩️', highlight: true, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                                        { user: 'TechCorp', action: 'clicked link', time: '12m ago', icon: '🔗', color: 'text-[var(--terracotta)] bg-[var(--terracotta)]/10 border-[var(--terracotta)]/20' },
                                        { user: 'John Doe', action: 'visited website', time: '15m ago', icon: '🌐', color: 'text-[var(--gold)] bg-[var(--gold)]/10 border-[var(--gold)]/20' },
                                        { user: 'Alice Wu', action: 'opened email', time: '32m ago', icon: '👀', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                                    ].map((item, i) => (
                                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${item.highlight ? 'bg-white/5 border border-white/5' : 'hover:bg-white/[0.02] border border-transparent'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${item.color}`}>
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs text-[var(--text-secondary)] truncate">
                                                    <span className="font-semibold text-white">{item.user}</span> {item.action}
                                                </div>
                                                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
