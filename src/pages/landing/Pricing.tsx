import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, HelpCircle, ArrowRight, Zap, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import FAQ from '@/components/landing/FAQ';

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
        <div className="min-h-screen bg-brand-dark text-white font-body selection:bg-brand-orange selection:text-white overflow-x-hidden">
            <Navbar />
            
            {/* ═══════════════════════════════════════════════════════════════════
                BACKGROUND
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand-purple/10 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 pt-32 pb-20">
                <div className="container px-6 mx-auto">
                    
                    {/* ═══════════════════════════════════════════════════════════════════
                        HERO
                        ═══════════════════════════════════════════════════════════════════ */}
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
                        >
                            <CreditCard className="w-4 h-4 text-brand-pink" />
                            <span className="text-xs font-mono text-gray-300 tracking-wider uppercase">Simple Pricing</span>
                        </motion.div>

                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-[0.9]"
                        >
                            PAY FOR RESULTS, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-pink">NOT SEATS</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
                        >
                            Unlimited team members and email accounts on every plan. Upgrade as you scale your outreach volume.
                        </motion.p>

                        {/* Toggle */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center justify-center gap-4 mb-16"
                        >
                            <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                            <button 
                                onClick={() => setAnnual(!annual)}
                                className="w-14 h-8 rounded-full bg-white/10 border border-white/10 relative p-1 transition-colors hover:bg-white/20"
                            >
                                <div className={`w-6 h-6 rounded-full bg-brand-orange shadow-lg transition-transform duration-300 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-gray-500'}`}>
                                Yearly <span className="text-brand-orange text-xs ml-1 font-bold uppercase">(Save 20%)</span>
                            </span>
                        </motion.div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════
                        PRICING CARDS
                        ═══════════════════════════════════════════════════════════════════ */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-32">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative rounded-3xl p-8 flex flex-col ${
                                    plan.popular 
                                        ? 'bg-[#0A0A0A] border border-brand-orange/50 shadow-[0_0_50px_-10px_rgba(255,85,51,0.2)]' 
                                        : 'bg-[#0A0A0A] border border-white/10'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-orange text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-heading font-bold mb-2">{plan.name}</h3>
                                    <p className="text-gray-400 text-sm h-10">{plan.desc}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold font-heading">${plan.price}</span>
                                        <span className="text-gray-500">/mo</span>
                                    </div>
                                    {annual && plan.price > 0 && (
                                        <div className="text-xs text-brand-orange mt-2 font-medium">
                                            Billed ${plan.price * 12} yearly
                                        </div>
                                    )}
                                </div>

                                <Button 
                                    className={`w-full mb-8 h-12 font-bold tracking-wide ${
                                        plan.popular 
                                            ? 'bg-brand-orange hover:bg-brand-orange/90 text-white' 
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                                >
                                    {plan.price === 0 ? 'Get Started Free' : 'Start 14-Day Trial'}
                                </Button>

                                <div className="space-y-4 flex-1">
                                    {plan.features.map((feature, j) => (
                                        <div key={j} className="flex items-start gap-3 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                    {plan.notIncluded.map((feature, j) => (
                                        <div key={j} className="flex items-start gap-3 text-sm text-gray-600">
                                            <X className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════
                        FAQ
                        ═══════════════════════════════════════════════════════════════════ */}
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-heading font-bold mb-4">Frequently Asked Questions</h2>
                            <p className="text-gray-400">Everything you need to know about the product and billing.</p>
                        </div>
                        <FAQ />
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
