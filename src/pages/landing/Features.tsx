import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, BarChart3, Globe, Users, Server, Mail, Target, Sparkles } from 'lucide-react';
import DashboardMockup from '@/components/landing/DashboardMockup';
import InboxMockup from '@/components/landing/InboxMockup';

const Features = () => {
    return (
        <div className="min-h-screen bg-brand-dark text-white font-body selection:bg-brand-orange selection:text-white overflow-x-hidden">
            {/* Background Grid */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
                style={{ 
                    backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }} 
            />

            <div className="relative z-10 pt-32 pb-20">
                <div className="container px-6 mx-auto">
                    {/* Hero */}
                    <div className="text-center max-w-4xl mx-auto mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-mono uppercase tracking-wider mb-8"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>System Architecture</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight"
                        >
                            BUILT FOR <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-pink">HIGH VELOCITY</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 max-w-2xl mx-auto"
                        >
                            The only platform that combines enterprise-grade email infrastructure with AI-powered lead discovery.
                        </motion.p>
                    </div>

                    {/* Feature 1: Infrastructure */}
                    <div className="grid md:grid-cols-2 gap-12 items-center mb-40">
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 bg-brand-orange/20 blur-[100px] rounded-full opacity-50" />
                            <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] p-2 shadow-2xl">
                                <DashboardMockup />
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="w-12 h-12 rounded-lg bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20">
                                <Server className="w-6 h-6 text-brand-orange" />
                            </div>
                            <h2 className="text-4xl font-heading font-bold">Unlimited Scale. <br />Zero Compromises.</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Stop paying per seat. Connect unlimited email accounts and scale your outreach to millions of prospects without hitting spam filters.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Smart Rotation Technology",
                                    "Automated IP Warmup",
                                    "99.9% Deliverability Guarantee"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white font-medium">
                                        <div className="w-5 h-5 rounded-full bg-brand-orange flex items-center justify-center text-black">
                                            <Target className="w-3 h-3" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* Feature 2: Unibox */}
                    <div className="grid md:grid-cols-2 gap-12 items-center mb-40">
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-2 md:order-1 space-y-8"
                        >
                            <div className="w-12 h-12 rounded-lg bg-brand-pink/10 flex items-center justify-center border border-brand-pink/20">
                                <Mail className="w-6 h-6 text-brand-pink" />
                            </div>
                            <h2 className="text-4xl font-heading font-bold">One Inbox to <br />Rule Them All.</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Manage replies from 100+ email accounts in a single, unified interface. Never miss a deal because you forgot to check an inbox.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-2xl font-bold text-white mb-1">10x</div>
                                    <div className="text-sm text-gray-500">Faster Response Time</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-2xl font-bold text-white mb-1">0</div>
                                    <div className="text-sm text-gray-500">Missed Opportunities</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 md:order-2 relative flex justify-center"
                        >
                            <div className="absolute -inset-4 bg-brand-pink/20 blur-[100px] rounded-full opacity-50" />
                            <div className="relative w-full max-w-md">
                                <InboxMockup className="w-full shadow-2xl border-brand-pink/20" />
                                {/* Floating Elements */}
                                <motion.div 
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute -right-8 top-10 p-4 rounded-xl bg-[#0A0A0A] border border-white/10 shadow-xl flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white">New Lead</div>
                                        <div className="text-[10px] text-gray-500">Just now</div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bento Grid for Other Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "AI Personalization",
                                desc: "Generate unique intros for every prospect based on their LinkedIn activity.",
                                icon: Zap,
                                color: "text-brand-orange"
                            },
                            {
                                title: "Global Infrastructure",
                                desc: "Sending nodes in 15+ countries to ensure optimal delivery times.",
                                icon: Globe,
                                color: "text-brand-purple"
                            },
                            {
                                title: "Real-time Analytics",
                                desc: "Track opens, clicks, and replies with millisecond precision.",
                                icon: BarChart3,
                                color: "text-brand-pink"
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group"
                            >
                                <feature.icon className={`w-8 h-8 ${feature.color} mb-6 group-hover:scale-110 transition-transform`} />
                                <h3 className="text-xl font-heading font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Features;
