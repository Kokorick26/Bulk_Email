import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, BarChart3, Globe, Code2, Lock, Target, Inbox, Users, Search, Mail, FileText, CheckCircle2, Server, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Features() {
    return (
        <div className="pt-32 pb-32 px-6 bg-black min-h-screen text-white overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-32 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-white">
                            The complete <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400">outreach operating system.</span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            Stop stitching together 5 different tools. Kokorick AI gives you the entire stack: Lead finding, email infrastructure, and CRM.
                        </p>
                    </motion.div>
                </div>

                <div className="space-y-40">
                    {/* Feature 1: Scale & Unlimited Accounts */}
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1 relative group">
                            <div className="absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full opacity-50" />
                            <motion.div
                                className="relative border border-white/10 bg-zinc-900/50 rounded-2xl p-6 shadow-2xl overflow-hidden backdrop-blur-sm"
                            >
                                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                    <div className="font-semibold text-white flex items-center gap-2">
                                        <Server className="w-5 h-5 text-blue-400" />
                                        Connected Accounts
                                    </div>
                                    <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">UNLIMITED</div>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-hidden">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm bg-gradient-to-br ${['from-blue-500 to-cyan-500', 'from-violet-500 to-purple-500', 'from-emerald-500 to-teal-500'][i % 3]
                                                }`}>
                                                {['JD', 'MK', 'AS'][i % 3]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-white">john.doe+{i}@acme.com</div>
                                                <div className="text-[10px] text-zinc-500">98% Health Score</div>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
                            </motion.div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="order-1 md:order-2"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
                                <Users className="w-4 h-4" />
                                <span>Total Scalability</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Connect Unlimited Email Accounts.</h2>
                            <p className="text-zinc-400 leading-relaxed mb-8">
                                Most platforms charge you per inbox. We don't. Connect 10, 50, or 500 accounts to send thousands of emails daily without hitting spam filters.
                            </p>
                            <ul className="space-y-4">
                                {["Separate infrastructure for every client", "Auto-rotation to prevent burn", "Unified billing"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* Feature 2: Lead Finder */}
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-6">
                                <Search className="w-4 h-4" />
                                <span>Lead Discovery Engine</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">160M+ Verified Contacts<br />at your fingertips.</h2>
                            <p className="text-zinc-400 leading-relaxed mb-8">
                                Don't buy stale lists. Our real-time search engine finds prospects matching your exact ICP. Filter by revenue, technology, headcount, and even recent funding news.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { title: "Real-time Verification", desc: "We ping every email before showing it to you. 0% bounce rate guarantee." },
                                    { title: "Waterfalls Enrichment", desc: "We combine data from 10+ providers to find valid emails where others fail." },
                                    { title: "Technology Tracking", desc: "Target companies using Shopify, Salesforce, or any specific tech stack." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{item.title}</h4>
                                            <p className="text-sm text-zinc-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-violet-500/10 blur-[80px] rounded-full opacity-50" />
                            <motion.div
                                className="relative border border-white/10 bg-zinc-900/50 rounded-2xl p-6 shadow-2xl overflow-hidden backdrop-blur-sm"
                            >
                                {/* Browser Toolbar */}
                                <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-md px-3 py-1 flex-1 text-xs text-zinc-500 text-center font-mono">kokorick.ai/leads</div>
                                </div>

                                {/* Results List */}
                                <div className="space-y-3">
                                    {[
                                        { name: "Sarah Connor", role: "VP Sales @ Cyberdyne", badge: "Verified", email: "sarah@cyberdyne.sys" },
                                        { name: "John Wick", role: "Head of Security @ Continental", badge: "Verified", email: "j.wick@continental.com" },
                                        { name: "Tony Stark", role: "CEO @ Stark Ind", badge: "Verified", email: "tony@stark.com" },
                                        { name: "Bruce Wayne", role: "Chairman @ Wayne Ent", badge: "Risky", email: "bruce@wayne.com" }
                                    ].map((person, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-violet-600 text-white' : 'bg-zinc-800 border border-white/10 text-zinc-400'}`}>
                                                {person.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-sm">{person.name}</div>
                                                <div className="text-xs text-zinc-500 truncate">{person.role}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block mb-1 font-bold ${person.badge === 'Verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    {person.badge}
                                                </div>
                                                <div className="text-[10px] text-zinc-600 font-mono">{person.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Feature 3: Unibox */}
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1 relative group">
                            <div className="absolute inset-0 bg-orange-500/10 blur-[80px] rounded-full opacity-50" />
                            <motion.div
                                className="relative border border-white/10 bg-zinc-900/50 rounded-2xl p-0 shadow-2xl overflow-hidden backdrop-blur-sm flex"
                            >
                                {/* Left Sidebar (Mini) */}
                                <div className="w-16 border-r border-white/10 flex flex-col items-center py-4 gap-4 bg-zinc-900/80">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`w-8 h-8 rounded-full border border-white/10 ${i === 1 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                                    ))}
                                </div>
                                {/* Message List */}
                                <div className="flex-1 p-4 bg-zinc-900/50">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                        <div className="font-bold text-white text-sm">Inbox (12)</div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold text-white">Jason @ Acme</span>
                                                <span className="text-[10px] text-zinc-500">2m</span>
                                            </div>
                                            <div className="text-xs text-zinc-400 line-clamp-1">Interested in that demo...</div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 opacity-60">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold text-white">Mike @ Hooli</span>
                                                <span className="text-[10px] text-zinc-600">1h</span>
                                            </div>
                                            <div className="text-xs text-zinc-500 line-clamp-1">Can you send pricing?</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="order-1 md:order-2"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-6">
                                <Inbox className="w-4 h-4" />
                                <span>Unified Master Inbox</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">One inbox to rule<br />them all.</h2>
                            <p className="text-zinc-400 leading-relaxed mb-8">
                                Managing 50 email accounts shouldn't be a nightmare. Unibox aggregates all your replies into a single, lightning-fast interface to close deals faster.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 rounded-xl bg-zinc-900 border border-white/10">
                                    <div className="text-2xl font-bold text-white mb-1">10x</div>
                                    <div className="text-sm text-zinc-500">Faster Response Time</div>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-900 border border-white/10">
                                    <div className="text-2xl font-bold text-white mb-1">Zero</div>
                                    <div className="text-sm text-zinc-500">Login Fatigue</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Feature 4: Warmup & Analytics */}
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
                                <Zap className="w-4 h-4" />
                                <span>Infrastructure & Warmup</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Deliverability solved.<br />Forever.</h2>
                            <p className="text-zinc-400 leading-relaxed mb-8">
                                Our AI-driven warmup network interacts with your emails 24/7, mimicking human behavior to build ironclad sender reputation.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Rotates sender IPs automatically",
                                    "Gradual ramp-up schedules",
                                    "Positive reply generation",
                                    "Spam folder rescue"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full opacity-50" />
                            <motion.div
                                className="relative border border-white/10 bg-zinc-900/50 rounded-2xl p-8 aspect-square flex items-center justify-center backdrop-blur-sm"
                            >
                                <div className="relative w-full max-w-[280px] aspect-square">
                                    {/* Circular Progress */}
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgb(16 185 129)" strokeWidth="12" strokeDasharray="283" strokeDashoffset="10" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-6xl font-bold text-white tracking-tighter">99.8%</div>
                                        <div className="text-emerald-400 text-sm font-bold uppercase tracking-widest mt-2">Inbox Rate</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <div className="mt-32 text-center">
                    <Link to="/signup">
                        <button className="px-10 py-5 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all shadow-xl hover:shadow-2xl hover:scale-105">
                            Start Free 14-Day Trial
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
