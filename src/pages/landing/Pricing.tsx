import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
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
        <div className="pt-32 pb-32 px-6 bg-black min-h-screen relative overflow-hidden text-white font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Global Noise Overlay */}
            <div className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-indigo-900/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-medium mb-6 backdrop-blur-sm"
                    >
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span>Simple, transparent pricing</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
                        Simple pricing for <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">infinite scale</span>.
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Start for free. Upgrade when you're ready to close more deals. No hidden fees, no per-seat pricing.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex items-center p-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                        <button
                            onClick={() => setAnnual(true)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${annual ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-400 hover:text-white'}`}
                        >
                            Yearly <span className="text-[10px] text-emerald-600 font-bold ml-1 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Save 20%</span>
                        </button>
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${!annual ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-400 hover:text-white'}`}
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
                            className={`relative p-8 rounded-3xl border flex flex-col h-full backdrop-blur-md ${plan.popular
                                ? 'bg-gradient-to-b from-[#1a1a20] to-black border-violet-500/50 shadow-[0_0_50px_-10px_rgba(139,92,246,0.2)] scale-105 z-10'
                                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                } transition-all duration-300 group`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg flex items-center gap-1 ring-1 ring-white/20">
                                    <Sparkles className="w-3 h-3 fill-white" />
                                    Most Popular
                                </div>
                            )}

                            {plan.popular && (
                                <div className="absolute inset-0 bg-violet-600/5 pointer-events-none rounded-3xl" />
                            )}

                            <div className="mb-8 relative z-10">
                                <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
                                <p className="text-sm text-slate-400 mb-6 min-h-[40px] leading-snug font-medium">{plan.desc}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-white tracking-tight">${plan.price}</span>
                                    <span className="text-slate-500 font-medium">/mo</span>
                                </div>
                                {annual && plan.price > 0 && (
                                    <div className="text-xs text-emerald-400 mt-2 font-bold bg-emerald-500/10 border border-emerald-500/20 inline-block px-2 py-1 rounded-full">
                                        Billed ${plan.price * 12} yearly
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4 mb-8 relative z-10">
                                <div className={`h-px w-full mb-6 ${plan.popular ? 'bg-violet-500/20' : 'bg-white/10'}`} />
                                {plan.features.map(f => (
                                    <div key={f} className="flex items-start gap-3 text-sm group/item">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.popular ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'bg-white/10 text-white'}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-slate-300 font-medium group-hover/item:text-white transition-colors">{f}</span>
                                    </div>
                                ))}
                                {plan.notIncluded.map(f => (
                                    <div key={f} className="flex items-start gap-3 text-sm opacity-40">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/5 text-slate-400">
                                            <X className="w-3 h-3" />
                                        </div>
                                        <span className="text-slate-500">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link to={plan.price === 0 ? "/signup" : "/signup?plan=" + plan.name.toLowerCase()} className="w-full mt-auto relative z-10">
                                <button
                                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.popular
                                        ? 'bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
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

                <div className="mt-20 text-center text-slate-500 text-sm relative z-10">
                    <p className="flex items-center justify-center gap-2">
                        Questions? <Link to="/contact" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">Talk to an expert</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
