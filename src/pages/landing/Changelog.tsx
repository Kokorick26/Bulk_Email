import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, TrendingUp } from 'lucide-react';

const changes = [
    {
        version: "v2.4.0",
        date: "October 24, 2024",
        title: "The Lead Discovery Engine",
        desc: "We completely overhauled how you find prospects. Access 160M+ verified contacts directly from your dashboard.",
        bullets: [
            "Search by technology stack (e.g. 'Uses Shopify')",
            "Filter by revenue and headcount",
            "One-click export to campaign",
            "Real-time email verification on export"
        ],
        tag: "Major Release",
        icon: Sparkles,
        color: "orange"
    },
    {
        version: "v2.3.1",
        date: "October 10, 2024",
        title: "Unibox Performance Improvements",
        desc: "Unified Inbox is now 10x faster when loading threads with 50+ messages.",
        bullets: [
            "Optimized thread rendering",
            "Added 'Snooze' functionality",
            "Keyboard shortcuts for archiving (E) and replying (R)"
        ],
        tag: "Improvement",
        icon: TrendingUp,
        color: "purple"
    },
    {
        version: "v2.3.0",
        date: "September 28, 2024",
        title: "AI Auto-Warmup 2.0",
        desc: "Our warmup network has doubled in size. We also introduced 'Smart Ramping' which automatically adjusts sending limits based on reputation scores.",
        bullets: [
            "Smart Ramping algorithm",
            "Added Outlook and Zoho specific warmup pools",
            "Detailed deliverability analytics dashboard"
        ],
        tag: "Feature",
        icon: Zap,
        color: "pink"
    }
];

export default function Changelog() {
    return (
        <div className="pt-32 pb-32 px-6 bg-brand-dark min-h-screen text-white font-body">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-20 text-center md:text-left"
                >
                    <span className="text-sm font-bold tracking-widest text-brand-orange uppercase block mb-4">What's New</span>
                    <h1 className="text-5xl font-heading font-bold text-white mb-6">Changelog</h1>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        New updates and improvements to Warmlo.
                    </p>
                </motion.div>

                <div className="relative border-l border-white/10 ml-4 md:ml-0 space-y-16">
                    {changes.map((change, i) => (
                        <motion.div
                            key={change.version}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="relative pl-12 md:pl-16"
                        >
                            {/* Dot with Icon */}
                            <div className={`absolute -left-[18px] top-0 w-9 h-9 rounded-full flex items-center justify-center ring-4 ring-[#050505] ${change.color === 'orange'
                                ? 'bg-brand-orange'
                                : change.color === 'pink'
                                    ? 'bg-brand-pink'
                                    : 'bg-brand-purple'
                                }`}>
                                <change.icon className="w-4 h-4 text-white" />
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                <div className="text-sm font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-lg border border-white/5 w-fit">{change.date}</div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit ${change.color === 'orange'
                                    ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                                    : change.color === 'pink'
                                        ? 'bg-brand-pink/10 text-brand-pink border border-brand-pink/20'
                                        : 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
                                    }`}>
                                    {change.tag}
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-3 text-white font-heading">
                                {change.title}
                                <span className="text-gray-500 font-normal ml-3 text-base font-body">{change.version}</span>
                            </h2>
                            <p className="text-gray-400 leading-relaxed mb-6">{change.desc}</p>

                            <ul className="space-y-3">
                                {change.bullets.map((bullet, j) => (
                                    <li key={j} className="flex items-start gap-3 text-sm text-gray-300">
                                        <span className={`block w-1.5 h-1.5 rounded-full mt-2 ${change.color === 'orange'
                                            ? 'bg-brand-orange'
                                            : change.color === 'pink'
                                                ? 'bg-brand-pink'
                                                : 'bg-brand-purple'
                                            }`} />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
