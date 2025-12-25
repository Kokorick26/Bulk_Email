import React from 'react';
import { Mail, BarChart3, Users, Send, Settings, Plus, Search, MoreHorizontal, ArrowUpRight, ArrowDownRight, Bell, HelpCircle, ChevronDown, Filter, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardMockup = () => {
    return (
        <div className="w-full h-full bg-[#09090b] rounded-xl overflow-hidden flex border border-white/10 shadow-2xl font-sans relative select-none ring-1 ring-white/5">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[100px] rounded-full" />
            </div>

            {/* Glass Overlay Texture */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent mix-blend-overlay opacity-50" />

            {/* Sidebar */}
            <div className="w-16 md:w-64 border-r border-white/10 flex flex-col bg-[#0c0c10]/80 backdrop-blur-xl relative z-10">
                <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                        <Mail className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white tracking-tight hidden md:block text-lg">Kokorick AI</span>
                </div>

                <div className="flex-1 py-6 space-y-1 px-3">
                    {[
                        { icon: BarChart3, label: 'Overview', active: true },
                        { icon: Send, label: 'Campaigns', active: false },
                        { icon: Users, label: 'Audience', active: false },
                        { icon: Mail, label: 'Unified Inbox', badge: '12' },
                        { icon: Search, label: 'Lead Finder', active: false, new: true },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-default transition-all duration-300 ${item.active
                                ? 'bg-gradient-to-r from-indigo-600/10 to-indigo-600/5 text-indigo-400 font-medium border border-indigo-500/10'
                                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 transition-colors ${item.active ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                            <span className={`hidden md:block text-sm transition-colors ${!item.active && 'group-hover:text-zinc-200'}`}>{item.label}</span>
                            {item.badge && (
                                <span className="hidden md:flex ml-auto bg-indigo-500 text-white text-[10px] items-center justify-center h-5 px-1.5 rounded-full font-bold shadow-sm ring-1 ring-white/10">
                                    {item.badge}
                                </span>
                            )}
                            {item.new && (
                                <span className="hidden md:flex ml-auto text-[10px] text-emerald-400 font-bold tracking-wide px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                                    NEW
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-auto p-4 border-t border-white/5">
                    <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-white/10 relative overflow-hidden hidden md:block shadow-lg">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Users className="w-16 h-16 text-white" /></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-white text-xs font-semibold">Scale Plan</div>
                                <div className="text-[10px] text-indigo-400 font-mono">PRO</div>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full mb-3 overflow-hidden ring-1 ring-white/5">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full w-[75%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                            </div>
                            <div className="text-[10px] text-zinc-500">75% of monthly credits used</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 ring-1 ring-white/20 flex items-center justify-center text-xs font-bold text-white shadow-md">
                            JD
                        </div>
                        <div className="hidden md:block overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">John Doe</div>
                            <div className="text-xs text-zinc-500 truncate">john@company.com</div>
                        </div>
                        <Settings className="w-4 h-4 text-zinc-500 ml-auto hover:text-white transition-colors cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-[#09090b] relative z-0">
                {/* Header */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0c0c10]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span className="hover:text-white transition-colors cursor-pointer">Dashboard</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-white font-medium">Overview</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-xs text-zinc-400 font-mono hover:bg-white/10 transition-colors cursor-pointer ring-1 ring-white/5">
                            <Search className="w-3.5 h-3.5" />
                            <span>Cmd + K</span>
                        </div>
                        <div className="h-5 w-px bg-white/10 mx-2" />
                        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors group">
                            <Bell className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-[#0c0c10]" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors group">
                            <HelpCircle className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8 overflow-hidden flex-1 relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Welcome back, Alex 👋</h2>
                            <div className="text-sm text-zinc-400">Here's what's happening with your outreach today.</div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white text-sm font-medium border border-white/10 hover:bg-white/10 transition-all">
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 ring-1 ring-white/20">
                                <Plus className="w-4 h-4" />
                                <span>New Campaign</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-5 mb-8">
                        {[
                            { label: 'Total Revenue', value: '$12,450', change: '+12.5%', isUp: true, sub: 'last 30 days' },
                            { label: 'Emails Sent', value: '45,231', change: '+8.2%', isUp: true, sub: '99% delivered' },
                            { label: 'Avg. Reply Rate', value: '12.8%', change: '+2.1%', isUp: true, sub: 'top 5% of users' },
                            { label: 'Meetings Booked', value: '48', change: '+5', isUp: true, sub: 'this week' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-gradient-to-br from-[#121215] to-[#0c0c10] border border-white/10 p-5 rounded-2xl hover:border-white/20 transition-all group shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">{stat.label}</div>
                                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                        {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                                <div className="text-xs text-zinc-500 font-medium">{stat.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Area */}
                    <div className="grid grid-cols-3 gap-6 h-[20rem]">
                        <div className="col-span-2 bg-gradient-to-br from-[#121215] to-[#0c0c10] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                                    Campaign Performance
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                        <div className="text-xs text-zinc-400 font-medium">Sent</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <div className="text-xs text-zinc-400 font-medium">Replies</div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Chart Bars */}
                            <div className="flex-1 flex items-end justify-between gap-3 px-2">
                                {[45, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95, 85, 90].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end gap-1.5 h-full group cursor-pointer">
                                        {/* Background Bar (Total) */}
                                        <div className="w-full bg-white/5 rounded-t-sm h-full absolute bottom-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Reply Bar */}
                                        <div
                                            className="w-full bg-emerald-500/80 rounded-[2px] opacity-60 group-hover:opacity-100 transition-all duration-300 relative"
                                            style={{ height: `${h * 0.3}%` }}
                                        >
                                            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20" />
                                        </div>

                                        {/* Sent Bar */}
                                        <div
                                            className="w-full bg-indigo-500 rounded-[2px] opacity-80 group-hover:opacity-100 transition-all duration-300 relative shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                                            style={{ height: `${h * 0.6}%` }}
                                        >
                                            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20" />
                                            {/* Tooltip */}
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-xl whitespace-nowrap z-20 pointer-events-none">
                                                {h * 12} Sent
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between pt-4 text-[10px] text-zinc-600 uppercase font-mono tracking-wider">
                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div className="bg-gradient-to-br from-[#121215] to-[#0c0c10] border border-white/10 rounded-2xl p-0 overflow-hidden flex flex-col shadow-sm">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="text-white font-semibold text-sm">Live Feed</h3>
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                {/* Gradient fades */}
                                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#121215] to-transparent z-10 pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0c0c10] to-transparent z-10 pointer-events-none" />

                                <div className="space-y-1 p-3">
                                    {[
                                        { user: 'Sarah Vance', action: 'opened email', time: 'Just now', icon: '👀', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                                        { user: 'Mike Ross', action: 'replied to "Q4 Intro"', time: '2m ago', icon: '↩️', highlight: true, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                                        { user: 'TechCorp', action: 'clicked link', time: '12m ago', icon: '🔗', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                                        { user: 'John Doe', action: 'visited website', time: '15m ago', icon: '🌐', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                                        { user: 'Alice Wu', action: 'opened email', time: '32m ago', icon: '👀', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                                    ].map((item, i) => (
                                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${item.highlight ? 'bg-white/5 border border-white/5' : 'hover:bg-white/[0.02] border border-transparent'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${item.color}`}>
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs text-zinc-200 truncate">
                                                    <span className="font-semibold text-white">{item.user}</span> {item.action}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 mt-0.5">{item.time}</div>
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
