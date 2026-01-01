import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, HelpCircle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
            {/* Background Grid */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
                style={{ 
                    backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }} 
            />

            <div className="relative z-10 pt-32 pb-20">
                <div className="container px-6 mx-auto">
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-mono uppercase tracking-wider mb-8"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>Simple Pricing</span>
                        </motion.div>

                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight"
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
                            Start for free. Upgrade when you're ready to close more deals. No hidden fees, no per-seat pricing.
                        </motion.p>

                        {/* Toggle */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm"
                        >
                            <button
                                onClick={() => setAnnual(true)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${annual ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                Yearly <span className="text-[10px] text-black font-bold ml-1 bg-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">Save 20%</span>
                            </button>
                            <button
                                onClick={() => setAnnual(false)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${!annual ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Monthly
                            </button>
                        </motion.div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative p-8 rounded-3xl border flex flex-col ${
                                    plan.popular 
                                        ? 'bg-[#0A0A0A] border-brand-orange shadow-[0_0_40px_-10px_rgba(255,85,51,0.3)]' 
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-orange text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-heading font-bold text-white mb-2">{plan.name}</h3>
                                    <p className="text-gray-400 text-sm h-10">{plan.desc}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-white">${plan.price}</span>
                                        <span className="text-gray-500">/mo</span>
                                    </div>
                                    {annual && plan.price > 0 && (
                                        <div className="text-xs text-brand-orange mt-2 font-medium">
                                            Billed ${plan.price * 12} yearly
                                        </div>
                                    )}
                                </div>

                                <Button 
                                    className={`w-full mb-8 font-bold ${
                                        plan.popular 
                                            ? 'bg-brand-orange hover:bg-brand-orange/90 text-white' 
                                            : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                                >
                                    {plan.price === 0 ? 'Get Started Free' : 'Start 14-Day Trial'}
                                </Button>

                                <div className="space-y-4 flex-1">
                                    {plan.features.map((feature, j) => (
                                        <div key={j} className="flex items-start gap-3 text-sm text-gray-300">
                                            <Check className={`w-4 h-4 mt-0.5 ${plan.popular ? 'text-brand-orange' : 'text-white'}`} />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                    {plan.notIncluded.map((feature, j) => (
                                        <div key={j} className="flex items-start gap-3 text-sm text-gray-600">
                                            <X className="w-4 h-4 mt-0.5" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ Link */}
                    <div className="mt-20 text-center">
                        <p className="text-gray-400">
                            Have questions? <a href="/contact" className="text-brand-orange hover:underline">Contact our sales team</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
