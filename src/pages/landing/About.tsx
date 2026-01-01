import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, Target, Heart, Rocket, ShieldCheck, Sparkles } from 'lucide-react';

export default function About() {
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
                    <div className="max-w-4xl mx-auto text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-mono uppercase tracking-wider mb-8"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>Our Mission</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight"
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

                    {/* Stats */}
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
                                <div className="text-4xl font-heading font-bold text-white mb-2 group-hover:text-brand-orange transition-colors">{stat.value}</div>
                                <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Story Section */}
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
                                <p className="text-white font-medium border-l-4 border-brand-orange pl-6">
                                    So we built Warmlo: The first "Unlimited by Default" sales operating system.
                                </p>
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
                            
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-32 h-32">
                                    <div className="absolute inset-0 border-2 border-brand-orange/30 rounded-full animate-[spin_10s_linear_infinite]" />
                                    <div className="absolute inset-4 border-2 border-brand-pink/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                                    <div className="absolute inset-8 border-2 border-brand-purple/30 rounded-full animate-[spin_20s_linear_infinite]" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Rocket className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Values Grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Transparency",
                                desc: "No hidden fees. No per-seat pricing. We believe in clear, predictable billing.",
                                icon: ShieldCheck
                            },
                            {
                                title: "Innovation",
                                desc: "We ship fast. Our changelog is a testament to our obsession with improvement.",
                                icon: Rocket
                            },
                            {
                                title: "Customer First",
                                desc: "We don't just sell software; we help you build a revenue engine.",
                                icon: Heart
                            }
                        ].map((value, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-orange/30 transition-colors group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:bg-brand-orange/20 transition-colors">
                                    <value.icon className="w-6 h-6 text-gray-400 group-hover:text-brand-orange transition-colors" />
                                </div>
                                <h3 className="text-xl font-heading font-bold text-white mb-3">{value.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{value.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
