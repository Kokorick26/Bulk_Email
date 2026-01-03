import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, Target, Heart, Rocket, ShieldCheck, Sparkles, History, Flag } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function About() {
    return (
        <div className="min-h-screen bg-brand-dark text-white font-body selection:bg-brand-orange selection:text-white overflow-x-hidden">
            <Navbar />
            
            {/* ═══════════════════════════════════════════════════════════════════
                BACKGROUND
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-purple/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-32 pb-20">
                <div className="container px-6 mx-auto">
                    
                    {/* ═══════════════════════════════════════════════════════════════════
                        HERO
                        ═══════════════════════════════════════════════════════════════════ */}
                    <div className="max-w-4xl mx-auto text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
                        >
                            <Flag className="w-4 h-4 text-brand-orange" />
                            <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">Our Mission</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-8 leading-[0.9]"
                        >
                            WE ARE BUILDING THE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-pink">SALES BRAIN</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
                        >
                            Sales is hard. It shouldn't be manual. Warmlo exists to automate the drudgery of prospecting so humans can focus on closing deals.
                        </motion.p>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════
                        STATS
                        ═══════════════════════════════════════════════════════════════════ */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 border-y border-white/10 py-12 bg-[#0A0A0A]/50 backdrop-blur-sm"
                    >
                        {[
                            { label: "Emails Sent", value: "50M+" },
                            { label: "Meetings Booked", value: "120K" },
                            { label: "Data Points", value: "160M+" },
                            { label: "Global Customers", value: "500+" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center group">
                                <div className="text-4xl md:text-5xl font-heading font-bold text-white mb-2 group-hover:text-brand-orange transition-colors">{stat.value}</div>
                                <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* ═══════════════════════════════════════════════════════════════════
                        STORY
                        ═══════════════════════════════════════════════════════════════════ */}
                    <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl font-heading font-bold text-white">For Cold Emailers,<br />By Cold Emailers.</h2>
                            <div className="space-y-6 text-lg text-gray-400 leading-relaxed">
                                <p>
                                    In 2023, we realized that 80% of a salesperson's day is spent on non-selling activities: finding emails, verifying data, managing follow-ups, and fighting spam filters.
                                </p>
                                <p>
                                    We faced high costs scaling our own agency. Other tools charged per seat or per email account. We knew there had to be a better way.
                                </p>
                                <div className="p-6 rounded-xl bg-brand-orange/10 border-l-4 border-brand-orange">
                                    <p className="text-white font-medium italic">
                                        "We built Warmlo to be the first 'Unlimited by Default' sales operating system."
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative aspect-square md:aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0A]"
                        >
                            {/* Abstract Visualization */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-orange/10 via-[#0A0A0A] to-[#0A0A0A]" />
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.1 }}></div>
                            
                            {/* Timeline Visual */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-full max-w-md">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-orange to-transparent" />
                                    <div className="space-y-12 relative z-10">
                                        <div className="flex items-center justify-end pr-8 relative">
                                            <div className="absolute right-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-brand-orange shadow-[0_0_10px_rgba(255,85,51,0.5)]" />
                                            <div className="text-right">
                                                <div className="text-brand-orange font-mono text-xs mb-1">2023</div>
                                                <div className="text-white font-bold">Agency Founded</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-start pl-8 relative">
                                            <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-pink shadow-[0_0_10px_rgba(255,51,153,0.5)]" />
                                            <div className="text-left">
                                                <div className="text-brand-pink font-mono text-xs mb-1">2024</div>
                                                <div className="text-white font-bold">Warmlo Beta</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end pr-8 relative">
                                            <div className="absolute right-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-brand-purple shadow-[0_0_10px_rgba(102,51,255,0.5)]" />
                                            <div className="text-right">
                                                <div className="text-brand-purple font-mono text-xs mb-1">2025</div>
                                                <div className="text-white font-bold">Series A</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════
                        VALUES
                        ═══════════════════════════════════════════════════════════════════ */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-heading font-bold text-center mb-16">Our Core Values</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: Target, title: "Outcome Obsessed", desc: "We don't care about vanity metrics. We care about revenue generated for our customers." },
                                { icon: Rocket, title: "Ship Fast", desc: "We deploy code daily. If it's broken, we fix it. If it's slow, we optimize it." },
                                { icon: Heart, title: "Customer First", desc: "We build what you ask for. Our roadmap is public and driven by user feedback." }
                            ].map((value, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-8 rounded-2xl border border-white/10 bg-[#0A0A0A] hover:border-brand-orange/30 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-brand-orange/10 transition-colors">
                                        <value.icon className="w-6 h-6 text-gray-400 group-hover:text-brand-orange transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-white">{value.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{value.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
