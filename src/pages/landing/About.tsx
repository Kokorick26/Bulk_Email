import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, Target, Heart, Rocket, ShieldCheck } from 'lucide-react';

export default function About() {
    return (
        <div className="pt-32 pb-32 px-6 bg-black min-h-screen text-white">
            <div className="max-w-7xl mx-auto">
                <div className="max-w-4xl mx-auto text-center mb-32 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-900/20 blur-[100px] rounded-full pointer-events-none" />
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold mb-8 tracking-tight relative z-10 text-white"
                    >
                        We're building the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">brain for your sales team.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto relative z-10"
                    >
                        Sales is hard. It shouldn't be manual. Kokorick AI exists to automate the drudgery of prospecting so humans can focus on closing deals.
                    </motion.p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 border-y border-white/10 py-12 bg-zinc-900/50 rounded-2xl">
                    {[
                        { label: "Emails Sent", value: "50M+" },
                        { label: "Meetings Booked", value: "120K" },
                        { label: "Data Points", value: "160M+" },
                        { label: "Global Customers", value: "500+" }
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-4xl font-bold text-white mb-2 tracking-tight">{stat.value}</div>
                            <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Story Grid */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 text-xs font-semibold">
                            Our Story
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">For Cold Emailers,<br />By Cold Emailers.</h2>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            In 2023, we realized that 80% of a salesperson's day is spent on non-selling activities: finding emails, verifying data, managing follow-ups, and fighting spam filters.
                        </p>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            We faced high costs scaling our own agency. Other tools charged per seat or per email account. We knew there had to be a better way.
                        </p>
                        <p className="text-lg text-zinc-300 leading-relaxed font-medium">
                            So we built Kokorick AI: The first "Unlimited by Default" sales operating system.
                        </p>
                    </div>
                    <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-indigo-900/20" />
                        {/* Abstract visual representation of "Network" */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3/4 h-3/4 border border-violet-500/20 rounded-full flex items-center justify-center animate-[spin_60s_linear_infinite]">
                                <div className="w-2/3 h-2/3 border border-indigo-500/20 rounded-full flex items-center justify-center animate-[spin_40s_linear_infinite_reverse]">
                                    <div className="w-1/2 h-1/2 border border-blue-500/20 rounded-full bg-zinc-900/80 backdrop-blur-xl shadow-lg flex items-center justify-center">
                                        <Rocket className="w-12 h-12 text-violet-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Floating bubbles */}
                        <div className="absolute top-10 right-10 p-3 bg-zinc-800 rounded-xl shadow-lg border border-white/10 animate-bounce delay-700">
                            <Users className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="absolute bottom-10 left-10 p-3 bg-zinc-800 rounded-xl shadow-lg border border-white/10 animate-bounce">
                            <ShieldCheck className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Values */}
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: Heart, title: "Customer Obsession", desc: "We don't just build software. We help you book meetings. If you don't grow, we don't grow." },
                        { icon: Target, title: "Precision First", desc: "Data quality is everything. We'd rather show you fewer, 100% verified leads than millions of bad ones." },
                        { icon: Globe, title: "Remote Native", desc: "We are a distributed team across 12 countries, building for a global economy." }
                    ].map((value, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-zinc-900 border border-white/10 hover:border-violet-500/30 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:bg-violet-600 transition-colors border border-violet-500/20">
                                <value.icon className="w-6 h-6 text-violet-400 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{value.title}</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                {value.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
