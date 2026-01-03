import React from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, Shield, BarChart3, Globe, Users, Server, 
    Mail, Target, Sparkles, Cpu, Lock, Activity,
    GitBranch, Database, Code2, ArrowRight, BrainCircuit, CheckCircle2
} from 'lucide-react';
import DashboardMockup from '@/components/landing/DashboardMockup';
import InboxMockup from '@/components/landing/InboxMockup';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Button } from '@/components/ui/Button';

const Features = () => {
    return (
        <div className="min-h-screen bg-brand-dark text-white font-body selection:bg-brand-orange selection:text-white overflow-x-hidden">
            <Navbar />
            
            {/* ═══════════════════════════════════════════════════════════════════
                BACKGROUND
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-brand-orange/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-32 pb-20">
                
                {/* ═══════════════════════════════════════════════════════════════════
                    HERO
                    ═══════════════════════════════════════════════════════════════════ */}
                <div className="container px-6 mx-auto mb-32">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
                        >
                            <Cpu className="w-4 h-4 text-brand-orange" />
                            <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">System Architecture v2.4</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-8 leading-[0.9]"
                        >
                            ENGINEERED FOR <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple">HYPER-SCALE</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
                        >
                            The only sales engagement platform built on a distributed cloud infrastructure. Send millions of emails without compromising deliverability.
                        </motion.p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                    BENTO GRID
                    ═══════════════════════════════════════════════════════════════════ */}
                <div className="container px-6 mx-auto mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Card 1: Infrastructure (Large) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="md:col-span-2 row-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A0A0A] to-[#050505] overflow-hidden relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 via-transparent to-brand-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="p-6 md:p-8 relative z-10 h-full flex flex-col">
                                <div className="w-14 h-14 rounded-xl bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20 mb-4 shadow-[0_0_20px_rgba(255,85,51,0.15)]">
                                    <Server className="w-7 h-7 text-brand-orange" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-heading font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                    Distributed Sending Nodes
                                </h3>
                                <p className="text-gray-400 text-sm md:text-base max-w-xl mb-6 leading-relaxed">
                                    Unlike traditional tools that send from a single IP, Warmlo rotates your emails through a global network of residential and commercial IPs to mimic human behavior.
                                </p>
                                <div className="relative rounded-xl overflow-hidden flex-1 min-h-0 -mx-2 md:-mx-4 -mb-6 md:-mb-8">
                                    {/* Subtle glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-orange/5 to-transparent pointer-events-none z-10" />
                                    <DashboardMockup />
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 2: AI (Tall) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="md:col-span-1 row-span-2 rounded-3xl border border-white/10 bg-gradient-to-b from-[#0A0A0A] to-[#050505] overflow-hidden relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="p-8 h-full flex flex-col relative z-10">
                                <div className="w-14 h-14 rounded-xl bg-brand-purple/10 flex items-center justify-center border border-brand-purple/20 mb-6 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                                    <BrainCircuit className="w-7 h-7 text-brand-purple" />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-heading font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                    AI Personalization Engine
                                </h3>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    Our LLM analyzes prospect data (LinkedIn, Website, News) to generate unique icebreakers for every single email.
                                </p>
                                <div className="flex-1 flex flex-col justify-center space-y-4">
                                    {[
                                        { icon: <BrainCircuit className="w-5 h-5" />, title: "Company Intelligence", desc: "AI analyzes funding, hiring, and news to find triggers." },
                                        { icon: <Target className="w-5 h-5" />, title: "Pain Point Detection", desc: "Identify challenges the prospect is facing right now." },
                                        { icon: <Users className="w-5 h-5" />, title: "Decision Maker Mapping", desc: "Find the right people and understand their roles." }
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple flex-shrink-0">
                                                {feature.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
                                                <p className="text-xs text-gray-500">{feature.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 3: Deliverability (Wide) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="md:col-span-3 rounded-3xl border border-white/10 bg-gradient-to-r from-[#0A0A0A] to-[#050505] overflow-hidden relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-pink/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 relative z-10">
                                <div className="flex-1">
                                    <div className="w-14 h-14 rounded-xl bg-brand-pink/10 flex items-center justify-center border border-brand-pink/20 mb-6 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
                                        <Shield className="w-7 h-7 text-brand-pink" />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-heading font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                        Smart Warmup & Ramp-up
                                    </h3>
                                    <p className="text-gray-400 text-base md:text-lg mb-6 leading-relaxed">
                                        Never burn a domain again. Our system automatically warms up your inboxes and gradually increases sending volume based on reputation scores.
                                    </p>
                                    <ul className="space-y-3">
                                        {["Automated reply handling", "Spam trap detection", "Blacklist monitoring"].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                                                <div className="w-2 h-2 rounded-full bg-brand-pink shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex-1 w-full max-w-md">
                                    <div className="rounded-xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm shadow-2xl shadow-black/50">
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Domain Health</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-green-400">98</span>
                                                <span className="text-sm text-gray-500">/100</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { label: "SPF Record", status: "Valid", color: "green" },
                                                { label: "DKIM Signature", status: "Valid", color: "green" },
                                                { label: "DMARC Policy", status: "Enforced", color: "green" },
                                                { label: "Blacklist Status", status: "Clean", color: "green" }
                                            ].map((stat, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                                    <span className="text-sm text-gray-300 font-medium">{stat.label}</span>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-green-400 uppercase tracking-wide">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {stat.status}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                    CTA
                    ═══════════════════════════════════════════════════════════════════ */}
                <div className="container px-6 mx-auto">
                    <div className="rounded-3xl bg-gradient-to-br from-brand-orange to-brand-pink p-1">
                        <div className="rounded-[22px] bg-[#0A0A0A] px-6 py-20 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            <div className="relative z-10 max-w-2xl mx-auto">
                                <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">Ready to scale your outreach?</h2>
                                <p className="text-xl text-gray-400 mb-10">
                                    Join 12,000+ revenue teams using Warmlo to book more meetings.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button className="h-14 px-8 rounded-lg bg-white text-black hover:bg-gray-200 font-bold text-lg tracking-wide">
                                        Start Free Trial
                                    </Button>
                                    <Button variant="outline" className="h-14 px-8 rounded-lg border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-lg tracking-wide">
                                        Book Demo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Features;
