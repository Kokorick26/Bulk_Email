import React from 'react';
import { motion } from 'framer-motion';
import { 
    ArrowRight, Zap, Globe, Shield, CheckCircle2, 
    BarChart3, Mail, Target, BrainCircuit, Sparkles,
    Users, Layers, ChevronRight
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import DashboardMockup from '@/components/landing/DashboardMockup';
import ResearchMockup from '@/components/landing/ResearchMockup';
import InboxMockup from '@/components/landing/InboxMockup';
import Marquee from '@/components/ui/Marquee';
import { Button } from '@/components/ui/Button';

const HomeRedesign = () => {
    return (
        <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-orange selection:text-white font-body overflow-x-hidden">
            <Navbar />
            
            <main>
                {/* ═══════════════════════════════════════════════════════════════════
                    HERO SECTION
                    ═══════════════════════════════════════════════════════════════════ */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-orange/10 rounded-full blur-[120px] opacity-50" />
                        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-brand-purple/5 rounded-full blur-[120px]" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                    </div>

                    <div className="container relative z-10 px-6 mx-auto">
                        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-20">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 hover:bg-white/10 transition-colors cursor-default"
                            >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                                </span>
                                <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">AI-Powered Outbound V2.4</span>
                            </motion.div>

                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white leading-[0.95] tracking-tight mb-8"
                            >
                                RESEARCH FIRST. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple">REACH SMARTER.</span>
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
                            >
                                The only platform that combines enterprise-grade campaign management with an AI research engine. Stop spamming. Start connecting.
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-center gap-4"
                            >
                                <Button className="h-14 px-8 rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 font-bold text-lg tracking-wide shadow-[0_0_30px_-5px_rgba(255,85,51,0.4)] hover:shadow-[0_0_40px_-5px_rgba(255,85,51,0.6)] transition-all">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                                <Button variant="outline" className="h-14 px-8 rounded-lg border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-lg tracking-wide backdrop-blur-sm">
                                    View Interactive Demo
                                </Button>
                            </motion.div>
                        </div>

                        {/* Hero Mockup */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40, rotateX: 10 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="relative mx-auto max-w-6xl perspective-1000"
                        >
                            <div className="absolute -inset-4 bg-gradient-to-r from-brand-orange/20 to-brand-purple/20 blur-3xl opacity-30 rounded-[3rem]" />
                            <DashboardMockup />
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                    SOCIAL PROOF
                    ═══════════════════════════════════════════════════════════════════ */}
                <section className="py-10 border-y border-white/5 bg-black/40 backdrop-blur-sm">
                    <div className="container px-6 mx-auto mb-6 text-center">
                        <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Trusted by 12,000+ revenue teams</p>
                    </div>
                    <Marquee className="[--duration:40s]" pauseOnHover>
                        {['SHOPIFY', 'NETFLIX', 'STRIPE', 'DISCORD', 'LINEAR', 'VERCEL', 'RAYCAST', 'FIGMA', 'AIRBNB', 'NOTION'].map((brand) => (
                            <div key={brand} className="mx-12 flex items-center gap-2 group cursor-default">
                                <span className="w-1.5 h-1.5 bg-white/20 rounded-full group-hover:bg-brand-orange transition-colors" />
                                <span className="text-xl font-heading font-bold text-white/20 group-hover:text-white transition-colors">
                                    {brand}
                                </span>
                            </div>
                        ))}
                    </Marquee>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                    PILLAR 1: CAMPAIGN MANAGEMENT
                    ═══════════════════════════════════════════════════════════════════ */}
                <section className="py-32 relative">
                    <div className="container px-6 mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-brand-pink text-xs font-bold uppercase tracking-wider mb-6">
                                    <Layers className="w-3 h-3" />
                                    The Foundation
                                </div>
                                <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                                    Complete Campaign <br />
                                    <span className="text-brand-pink">Command Center</span>
                                </h2>
                                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                                    Manage your entire outbound operation from a single pane of glass. Connect unlimited accounts, automate follow-ups, and handle replies in one unified inbox.
                                </p>
                                
                                <div className="space-y-6">
                                    {[
                                        { title: "Unified Inbox", desc: "Manage replies from all accounts in one place.", icon: Mail },
                                        { title: "Unlimited Sending", desc: "Scale without per-seat pricing limits.", icon: Zap },
                                        { title: "Smart Rotation", desc: "Automatically rotate sender accounts to protect deliverability.", icon: Shield },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <item.icon className="w-6 h-6 text-brand-pink" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                                                <p className="text-sm text-gray-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="order-1 lg:order-2 relative">
                                <div className="absolute -inset-10 bg-brand-pink/10 blur-[100px] rounded-full opacity-50" />
                                <div className="relative grid gap-6">
                                    <InboxMockup className="ml-auto transform hover:-translate-y-2 transition-transform duration-500" />
                                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 shadow-2xl max-w-md mr-auto transform hover:-translate-y-2 transition-transform duration-500 delay-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <BarChart3 className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">Campaign Performance</div>
                                                <div className="text-xs text-gray-500">Last 30 Days</div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Open Rate</span>
                                                <span className="text-white font-bold">68.4%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full w-[68%] bg-emerald-500 rounded-full" />
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Reply Rate</span>
                                                <span className="text-white font-bold">12.1%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full w-[12%] bg-brand-pink rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                    TRANSITION: THE PROBLEM
                    ═══════════════════════════════════════════════════════════════════ */}
                <section className="py-32 bg-brand-dark relative overflow-hidden border-y border-white/5">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-shine opacity-10 pointer-events-none" />
                    
                    <div className="container px-6 mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="max-w-4xl mx-auto"
                        >
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white leading-tight mb-8">
                                "BUT SENDING EMAILS IS <br />
                                <span className="text-brand-orange">ONLY HALF THE BATTLE.</span>"
                            </h2>
                            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                                Traditional tools focus on execution. They don't tell you <span className="text-white font-bold">who</span> to contact, <span className="text-white font-bold">why</span> now, or <span className="text-white font-bold">what</span> to say.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                    PILLAR 2: AI RESEARCH
                    ═══════════════════════════════════════════════════════════════════ */}
                <section className="py-32 relative">
                    <div className="container px-6 mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="relative">
                                <div className="absolute -inset-10 bg-brand-purple/20 blur-[100px] rounded-full opacity-50" />
                                <ResearchMockup />
                            </div>
                            
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-xs font-bold uppercase tracking-wider mb-6">
                                    <BrainCircuit className="w-3 h-3" />
                                    The Differentiator
                                </div>
                                <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                                    Deep Research, <br />
                                    <span className="text-brand-purple">Before You Send</span>
                                </h2>
                                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                                    Our AI doesn't just find emails. It researches the company, identifies pain points, and maps out the decision-making unit before a single email is drafted.
                                </p>
                                
                                <div className="space-y-6">
                                    {[
                                        { title: "Company Intelligence", desc: "AI analyzes funding, hiring, and news to find triggers.", icon: Globe },
                                        { title: "Pain Point Detection", desc: "Identify challenges the prospect is facing right now.", icon: Target },
                                        { title: "Decision Maker Mapping", desc: "Find the right people and understand their roles.", icon: Users },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-purple/10 group-hover:border-brand-purple/20 transition-colors">
                                                <item.icon className="w-6 h-6 text-brand-purple" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                                                <p className="text-sm text-gray-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                    HOW IT WORKS
                    ═══════════════════════════════════════════════════════════════════ */}
                <section className="py-32 bg-[#080808] border-t border-white/5">
                    <div className="container px-6 mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl font-heading font-bold text-white mb-6">From Research to Inbox</h2>
                            <p className="text-gray-400">A completely automated workflow that feels like magic.</p>
                        </div>

                        <div className="grid md:grid-cols-4 gap-8">
                            {[
                                { step: "01", title: "Define Target", desc: "Input your ideal customer profile and market segment." },
                                { step: "02", title: "AI Research", desc: "System scans thousands of companies for relevance signals." },
                                { step: "03", title: "Drafting", desc: "Personalized emails are generated based on research insights." },
                                { step: "04", title: "Execution", desc: "Campaigns launch automatically with smart follow-ups." },
                            ].map((item, i) => (
                                <div key={i} className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                                    <div className="text-4xl font-heading font-bold text-white/10 mb-4 group-hover:text-brand-orange/20 transition-colors">{item.step}</div>
                                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                    {i < 3 && (
                                        <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                            <ChevronRight className="w-6 h-6 text-white/10" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                    CTA SECTION
                    ═══════════════════════════════════════════════════════════════════ */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-orange/5"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]"></div>
                    
                    <div className="container relative z-10 px-6 text-center">
                        <h2 className="text-5xl md:text-8xl font-heading font-bold text-white mb-10 tracking-tighter">
                            READY TO <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-pink">DOMINATE?</span>
                        </h2>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-mono">
                            Join 12,000+ companies scaling their revenue with Warmlo.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Button className="h-16 px-12 rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 font-bold text-xl tracking-wide shadow-[0_0_40px_-10px_rgba(255,85,51,0.3)]">
                                Get Started Now
                                <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default HomeRedesign;
