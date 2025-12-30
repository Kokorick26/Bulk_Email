import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, BarChart3, Globe, Code2, Lock, Target, Inbox, Users, Search, Mail, FileText, CheckCircle2, Server, Check, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }
    }
};

export default function Features() {
    return (
        <div className="pt-32 pb-32 px-6 bg-[var(--slate-deep)] min-h-screen text-[var(--text-primary)] overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-[var(--terracotta)]/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--gold)]/3 rounded-full blur-[120px]" />
                <div className="absolute inset-0 dot-grid-dark opacity-30" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Hero Section */}
                <div className="text-center mb-32 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10"
                    >
                        <span className="text-label text-[var(--terracotta)] block mb-6">Features</span>
                        <h1 className="text-display text-white mb-8">
                            The complete<br />
                            <span className="text-gradient-terracotta">outreach operating system.</span>
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                            Stop stitching together 5 different tools. Kokorick AI gives you the entire stack: Lead finding, email infrastructure, and CRM.
                        </p>
                    </motion.div>
                </div>

                <div className="space-y-40">
                    {/* Feature 1: Scale & Unlimited Accounts */}
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1 relative group">
                            <div className="absolute -inset-4 bg-[var(--terracotta)]/10 blur-[60px] rounded-full opacity-50" />
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="relative card-glass p-6 overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                    <div className="font-semibold text-white flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                                        <Server className="w-5 h-5 text-[var(--terracotta)]" />
                                        Connected Accounts
                                    </div>
                                    <div className="bg-[var(--terracotta)]/20 text-[var(--terracotta)] px-3 py-1 rounded-full text-xs font-bold border border-[var(--terracotta)]/30">UNLIMITED</div>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-hidden">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm bg-gradient-to-br ${['from-[var(--terracotta)] to-[var(--gold)]', 'from-[var(--sage)] to-emerald-600', 'from-[var(--gold)] to-amber-600'][i % 3]
                                                }`}>
                                                {['JD', 'MK', 'AS'][i % 3]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-white">john.doe+{i}@acme.com</div>
                                                <div className="text-[10px] text-[var(--text-muted)]">98% Health Score</div>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[var(--slate-rich)] to-transparent pointer-events-none" />
                            </motion.div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="order-1 md:order-2"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--terracotta)]/10 border border-[var(--terracotta)]/20 text-[var(--terracotta)] text-xs font-semibold mb-6">
                                <Users className="w-4 h-4" />
                                <span>Total Scalability</span>
                            </div>
                            <h2 className="text-display-sm text-white mb-6">Connect Unlimited Email Accounts.</h2>
                            <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-lg">
                                Most platforms charge you per inbox. We don't. Connect 10, 50, or 500 accounts to send thousands of emails daily without hitting spam filters.
                            </p>
                            <ul className="space-y-4">
                                {["Separate infrastructure for every client", "Auto-rotation to prevent burn", "Unified billing"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[var(--text-secondary)] font-medium">
                                        <div className="w-6 h-6 rounded-full bg-[var(--terracotta)]/20 flex items-center justify-center text-[var(--terracotta)]">
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
                            transition={{ duration: 0.7 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-xs font-semibold mb-6">
                                <Search className="w-4 h-4" />
                                <span>Lead Discovery Engine</span>
                            </div>
                            <h2 className="text-display-sm text-white mb-6">160M+ Verified Contacts<br />at your fingertips.</h2>
                            <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-lg">
                                Don't buy stale lists. Our real-time search engine finds prospects matching your exact ICP. Filter by revenue, technology, headcount, and even recent funding news.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { title: "Real-time Verification", desc: "We ping every email before showing it to you. 0% bounce rate guarantee." },
                                    { title: "Waterfalls Enrichment", desc: "We combine data from 10+ providers to find valid emails where others fail." },
                                    { title: "Technology Tracking", desc: "Target companies using Shopify, Salesforce, or any specific tech stack." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 w-6 h-6 rounded-full bg-[var(--gold)]/20 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4 text-[var(--gold)]" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{item.title}</h4>
                                            <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="relative group">
                            <div className="absolute -inset-4 bg-[var(--gold)]/10 blur-[80px] rounded-full opacity-50" />
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="relative card-glass p-6 overflow-hidden"
                            >
                                {/* Browser Toolbar */}
                                <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-md px-3 py-1 flex-1 text-xs text-[var(--text-muted)] text-center font-mono">kokorick.ai/leads</div>
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
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-[var(--terracotta)] text-white' : 'bg-[var(--slate-mid)] border border-white/10 text-[var(--text-muted)]'}`}>
                                                {person.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-sm">{person.name}</div>
                                                <div className="text-xs text-[var(--text-muted)] truncate">{person.role}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block mb-1 font-bold ${person.badge === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'}`}>
                                                    {person.badge}
                                                </div>
                                                <div className="text-[10px] text-[var(--text-muted)] font-mono">{person.email}</div>
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
                            <div className="absolute -inset-4 bg-[var(--sage)]/10 blur-[80px] rounded-full opacity-50" />
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="relative card-glass p-0 overflow-hidden flex"
                            >
                                {/* Left Sidebar (Mini) */}
                                <div className="w-16 border-r border-white/5 flex flex-col items-center py-4 gap-4 bg-[var(--slate-rich)]/80">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`w-8 h-8 rounded-full border border-white/10 ${i === 1 ? 'bg-[var(--terracotta)]' : 'bg-[var(--slate-mid)]'}`} />
                                    ))}
                                </div>
                                {/* Message List */}
                                <div className="flex-1 p-4 bg-[var(--slate-rich)]/50">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                        <div className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Inbox (12)</div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-[var(--terracotta)]/10 p-3 rounded-lg border border-[var(--terracotta)]/20">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold text-white">Jason @ Acme</span>
                                                <span className="text-[10px] text-[var(--text-muted)]">2m</span>
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)] line-clamp-1">Interested in that demo...</div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 opacity-60">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold text-white">Mike @ Hooli</span>
                                                <span className="text-[10px] text-[var(--text-muted)]">1h</span>
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] line-clamp-1">Can you send pricing?</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="order-1 md:order-2"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--sage)]/10 border border-[var(--sage)]/20 text-[var(--sage)] text-xs font-semibold mb-6">
                                <Inbox className="w-4 h-4" />
                                <span>Unified Master Inbox</span>
                            </div>
                            <h2 className="text-display-sm text-white mb-6">One inbox to rule<br />them all.</h2>
                            <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-lg">
                                Managing 50 email accounts shouldn't be a nightmare. Unibox aggregates all your replies into a single, lightning-fast interface to close deals faster.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 rounded-xl bg-[var(--slate-rich)] border border-white/5">
                                    <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>10x</div>
                                    <div className="text-sm text-[var(--text-muted)]">Faster Response Time</div>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--slate-rich)] border border-white/5">
                                    <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Zero</div>
                                    <div className="text-sm text-[var(--text-muted)]">Login Fatigue</div>
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
                            transition={{ duration: 0.7 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
                                <Zap className="w-4 h-4" />
                                <span>Infrastructure & Warmup</span>
                            </div>
                            <h2 className="text-display-sm text-white mb-6">Deliverability solved.<br />Forever.</h2>
                            <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-lg">
                                Our AI-driven warmup network interacts with your emails 24/7, mimicking human behavior to build ironclad sender reputation.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Rotates sender IPs automatically",
                                    "Gradual ramp-up schedules",
                                    "Positive reply generation",
                                    "Spam folder rescue"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[var(--text-secondary)] font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <div className="relative group">
                            <div className="absolute -inset-4 bg-emerald-500/10 blur-[80px] rounded-full opacity-50" />
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="relative card-glass p-8 aspect-square flex items-center justify-center"
                            >
                                <div className="relative w-full max-w-[280px] aspect-square">
                                    {/* Circular Progress */}
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgb(16 185 129)" strokeWidth="12" strokeDasharray="283" strokeDashoffset="10" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-6xl font-bold text-white tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>99.8%</div>
                                        <div className="text-emerald-400 text-sm font-bold uppercase tracking-widest mt-2">Inbox Rate</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 text-center"
                >
                    <Link to="/signup">
                        <button className="btn-terracotta text-lg px-10 py-5 group">
                            Start Free 14-Day Trial
                            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
