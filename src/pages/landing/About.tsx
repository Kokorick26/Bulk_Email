import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, Target, Heart, Rocket, ShieldCheck } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }
    }
};

export default function About() {
    return (
        <div className="pt-32 pb-32 px-6 bg-[var(--slate-deep)] min-h-screen text-[var(--text-primary)]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--terracotta)]/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--gold)]/3 rounded-full blur-[120px]" />
                <div className="absolute inset-0 dot-grid-dark opacity-20" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-32 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10"
                    >
                        <span className="text-label text-[var(--terracotta)] block mb-6">About Us</span>
                        <h1 className="text-display text-white mb-8">
                            We're building the<br />
                            <span className="text-gradient-terracotta">brain for your sales team.</span>
                        </h1>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto relative z-10"
                    >
                        Sales is hard. It shouldn't be manual. Kokorick AI exists to automate the drudgery of prospecting so humans can focus on closing deals.
                    </motion.p>
                </div>

                {/* Stats */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 border-y border-white/5 py-12 bg-[var(--slate-rich)] rounded-2xl"
                >
                    {[
                        { label: "Emails Sent", value: "50M+" },
                        { label: "Meetings Booked", value: "120K" },
                        { label: "Data Points", value: "160M+" },
                        { label: "Global Customers", value: "500+" }
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-4xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{stat.value}</div>
                            <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Story Grid */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--slate-rich)] border border-white/10 text-[var(--text-muted)] text-xs font-semibold">
                            Our Story
                        </div>
                        <h2 className="text-display-sm text-white">For Cold Emailers,<br />By Cold Emailers.</h2>
                        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            In 2023, we realized that 80% of a salesperson's day is spent on non-selling activities: finding emails, verifying data, managing follow-ups, and fighting spam filters.
                        </p>
                        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            We faced high costs scaling our own agency. Other tools charged per seat or per email account. We knew there had to be a better way.
                        </p>
                        <p className="text-lg text-white leading-relaxed font-medium">
                            So we built Kokorick AI: The first "Unlimited by Default" sales operating system.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[var(--slate-rich)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--terracotta)]/10 to-[var(--gold)]/5" />
                        {/* Abstract visual representation of "Network" */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3/4 h-3/4 border border-[var(--terracotta)]/20 rounded-full flex items-center justify-center animate-[spin_60s_linear_infinite]">
                                <div className="w-2/3 h-2/3 border border-[var(--gold)]/20 rounded-full flex items-center justify-center animate-[spin_40s_linear_infinite_reverse]">
                                    <div className="w-1/2 h-1/2 border border-[var(--sage)]/20 rounded-full bg-[var(--slate-rich)]/80 backdrop-blur-xl shadow-lg flex items-center justify-center">
                                        <Rocket className="w-12 h-12 text-[var(--terracotta)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Floating bubbles */}
                        <div className="absolute top-10 right-10 p-3 bg-[var(--slate-mid)] rounded-xl shadow-lg border border-white/10 animate-bounce delay-700">
                            <Users className="w-6 h-6 text-[var(--sage)]" />
                        </div>
                        <div className="absolute bottom-10 left-10 p-3 bg-[var(--slate-mid)] rounded-xl shadow-lg border border-white/10 animate-bounce">
                            <ShieldCheck className="w-6 h-6 text-[var(--terracotta)]" />
                        </div>
                    </motion.div>
                </div>

                {/* Values */}
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: Heart, title: "Customer Obsession", desc: "We don't just build software. We help you book meetings. If you don't grow, we don't grow.", color: "terracotta" },
                        { icon: Target, title: "Precision First", desc: "Data quality is everything. We'd rather show you fewer, 100% verified leads than millions of bad ones.", color: "gold" },
                        { icon: Globe, title: "Remote Native", desc: "We are a distributed team across 12 countries, building for a global economy.", color: "sage" }
                    ].map((value, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="card-glass p-8 hover:border-[var(--terracotta)]/30 transition-all duration-300 group"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors border ${value.color === 'terracotta'
                                ? 'bg-[var(--terracotta)]/10 border-[var(--terracotta)]/20 group-hover:bg-[var(--terracotta)]'
                                : value.color === 'gold'
                                    ? 'bg-[var(--gold)]/10 border-[var(--gold)]/20 group-hover:bg-[var(--gold)]'
                                    : 'bg-[var(--sage)]/10 border-[var(--sage)]/20 group-hover:bg-[var(--sage)]'
                                }`}>
                                <value.icon className={`w-6 h-6 transition-colors ${value.color === 'terracotta'
                                    ? 'text-[var(--terracotta)] group-hover:text-white'
                                    : value.color === 'gold'
                                        ? 'text-[var(--gold)] group-hover:text-white'
                                        : 'text-[var(--sage)] group-hover:text-white'
                                    }`} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{value.title}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                {value.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
