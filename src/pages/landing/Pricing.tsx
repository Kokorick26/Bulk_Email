import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { ShinyButton } from '../../components/ui/ShinyButton';
import { Link } from 'react-router-dom';

export default function Pricing() {
    const [annual, setAnnual] = useState(true);

    const plans = [
        {
            name: "Starter",
            price: annual ? 0 : 0,
            desc: "Perfect for side projects and hobbies.",
            features: ["5,000 emails/month", "1 verified domain", "3 day log retention", "Basic analytics", "Community support"],
            notIncluded: ["Dedicated IP", "Subaccount management", "Priority support"]
        },
        {
            name: "Pro",
            price: annual ? 29 : 39,
            popular: true,
            desc: "For growing businesses and startups.",
            features: ["100,000 emails/month", "5 verified domains", "30 day log retention", "Advanced analytics", "Email support", "A/B Testing"],
            notIncluded: ["Dedicated IP"]
        },
        {
            name: "Enterprise",
            price: annual ? 199 : 249,
            desc: "For high-volume senders requiring control.",
            features: ["Unlimited emails", "Unlimited domains", "90 day log retention", "Custom reporting", "Dedicated IP addresses", "24/7 Phone support", "SLA Guarantee"],
            notIncluded: []
        }
    ];

    return (
        <div className="pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-6">Simple, transparent pricing</h1>
                    <p className="text-xl text-white/50 mb-8">
                        Start for free, scale as you grow. No credit card required.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/10">
                        <button
                            onClick={() => setAnnual(true)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${annual ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            Annual (Save 20%)
                        </button>
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            Monthly
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-8 rounded-3xl border flex flex-col ${plan.popular ? 'bg-white/10 border-white/20 ring-1 ring-white/20' : 'bg-black/40 border-white/10'}`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-bold">${plan.price}</span>
                                    <span className="text-white/50">/mo</span>
                                </div>
                                <p className="text-sm text-white/50">{plan.desc}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {plan.features.map(f => (
                                    <div key={f} className="flex items-start gap-3 text-sm">
                                        <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-500 mt-0.5">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-white/80">{f}</span>
                                    </div>
                                ))}
                                {plan.notIncluded.map(f => (
                                    <div key={f} className="flex items-start gap-3 text-sm opacity-50">
                                        <div className="p-0.5 rounded-full bg-white/10 text-white/40 mt-0.5">
                                            <X className="w-3 h-3" />
                                        </div>
                                        <span className="text-white/60">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link to="/login" className="w-full">
                                <ShinyButton
                                    variant={plan.popular ? 'primary' : 'secondary'}
                                    className="w-full"
                                >
                                    Get Started
                                </ShinyButton>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
