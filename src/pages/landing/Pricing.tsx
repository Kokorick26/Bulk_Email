import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, HelpCircle, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
    const [annual, setAnnual] = useState(true);

    const plans = [
        {
            name: "Starter",
            price: 0,
            desc: "Perfect for testing the waters.",
            features: [
                "1,000 emails/month",
                "1 sender account",
                "Basic Lead Finder access",
                "7-day analytics history",
                "Community support"
            ],
            notIncluded: [
                "Automated Warmup",
                "Unibox",
                "API Access"
            ]
        },
        {
            name: "Growth",
            price: annual ? 30 : 37,
            popular: true,
            desc: "For serious sales teams scaling up.",
            features: [
                "Unlimited emails",
                "Unlimited sender accounts",
                "Full Lead Finder (1,000 credits/mo)",
                "Automated Warmup",
                "Unified Inbox (Unibox)",
                "Advanced Spintax",
                "Priority Support"
            ],
            notIncluded: [
                "Dedicated Customer Success",
                "White-label Reports"
            ]
        },
        {
            name: "Hypergrowth",
            price: annual ? 77 : 97,
            desc: "For agencies & power users.",
            features: [
                "Everything in Growth",
                "Lead Finder (25,000 credits/mo)",
                "Client Management Portal",
                "White-label Reports",
                "Dedicated Success Manager",
                "API Access",
                "25,000 Active Leads"
            ],
            notIncluded: []
        }
    ];

    return (
        <div className="pt-32 pb-32 px-6 bg-[var(--slate-deep)] min-h-screen relative overflow-hidden text-[var(--text-primary)]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--terracotta)]/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--gold)]/3 rounded-full blur-[120px]" />
                <div className="absolute inset-0 dot-grid-dark opacity-20" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[var(--text-secondary)] text-sm font-medium mb-6 backdrop-blur-sm"
                    >
                        <Sparkles className="w-4 h-4 text-[var(--gold)]" />
                        <span>Simple, transparent pricing</span>
                    </motion.div>

                    <h1 className="text-display text-white mb-8">
                        Simple pricing for <span className="text-gradient-terracotta">infinite scale</span>.
                    </h1>
                    <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
                        Start for free. Upgrade when you're ready to close more deals. No hidden fees, no per-seat pricing.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex items-center p-1.5 bg-[var(--slate-rich)] rounded-full border border-white/10 backdrop-blur-sm">
                        <button
                            onClick={() => setAnnual(true)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${annual ? 'bg-[var(--terracotta)] text-white shadow-lg shadow-[var(--terracotta)]/20' : 'text-[var(--text-muted)] hover:text-white'}`}
                        >
                            Yearly <span className="text-[10px] text-emerald-900 font-bold ml-1 bg-emerald-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Save 20%</span>
                        </button>
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${!annual ? 'bg-[var(--terracotta)] text-white shadow-lg shadow-[var(--terracotta)]/20' : 'text-[var(--text-muted)] hover:text-white'}`}
                        >
                            Monthly
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`relative p-8 rounded-2xl border flex flex-col h-full backdrop-blur-md ${plan.popular
                                ? 'bg-gradient-to-b from-[var(--terracotta)]/10 to-[var(--slate-deep)] border-[var(--terracotta)]/50 shadow-[0_0_50px_-10px_rgba(217,119,87,0.3)] scale-105 z-10'
                                : 'bg-[var(--slate-rich)] border-white/10 hover:border-white/20'
                                } transition-all duration-300 group`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-dark)] rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg flex items-center gap-1 ring-1 ring-white/20">
                                    <Sparkles className="w-3 h-3 fill-white" />
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8 relative z-10">
                                <h3 className="text-xl font-bold mb-2 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{plan.name}</h3>
                                <p className="text-sm text-[var(--text-muted)] mb-6 min-h-[40px] leading-snug font-medium">{plan.desc}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>${plan.price}</span>
                                    <span className="text-[var(--text-muted)] font-medium">/mo</span>
                                </div>
                                {annual && plan.price > 0 && (
                                    <div className="text-xs text-emerald-400 mt-2 font-bold bg-emerald-500/10 border border-emerald-500/20 inline-block px-2 py-1 rounded-full">
                                        Billed ${plan.price * 12} yearly
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4 mb-8 relative z-10">
                                <div className={`h-px w-full mb-6 ${plan.popular ? 'bg-[var(--terracotta)]/20' : 'bg-white/10'}`} />
                                {plan.features.map(f => (
                                    <div key={f} className="flex items-start gap-3 text-sm group/item">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.popular ? 'bg-[var(--terracotta)] text-white shadow-lg shadow-[var(--terracotta)]/30' : 'bg-white/10 text-white'}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-[var(--text-secondary)] font-medium group-hover/item:text-white transition-colors">{f}</span>
                                    </div>
                                ))}
                                {plan.notIncluded.map(f => (
                                    <div key={f} className="flex items-start gap-3 text-sm opacity-40">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/5 text-[var(--text-muted)]">
                                            <X className="w-3 h-3" />
                                        </div>
                                        <span className="text-[var(--text-muted)]">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link to={plan.price === 0 ? "/signup" : "/signup?plan=" + plan.name.toLowerCase()} className="w-full mt-auto relative z-10">
                                <button
                                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.popular
                                        ? 'bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta-dark)] shadow-[0_0_20px_rgba(217,119,87,0.3)]'
                                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    {plan.price === 0 ? 'Start Free' : 'Get Started'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 text-center text-[var(--text-muted)] text-sm relative z-10">
                    <p className="flex items-center justify-center gap-2">
                        Questions? <Link to="/contact" className="text-[var(--terracotta)] font-semibold hover:text-[var(--terracotta-light)] transition-colors">Talk to an expert</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
