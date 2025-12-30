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
        icon: Sparkles
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
        icon: TrendingUp
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
        icon: Zap
    }
];

export default function Changelog() {
    return (
        <div className="pt-32 pb-32 px-6 bg-[var(--slate-deep)] min-h-screen text-[var(--text-primary)]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--terracotta)]/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--gold)]/3 rounded-full blur-[120px]" />
                <div className="absolute inset-0 dot-grid-dark opacity-20" />
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-20 text-center md:text-left"
                >
                    <span className="text-label text-[var(--terracotta)] block mb-4">What's New</span>
                    <h1 className="text-display-sm text-white mb-6">Changelog</h1>
                    <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
                        New updates and improvements to Kokorick AI.
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
                            <div className={`absolute -left-[18px] top-0 w-9 h-9 rounded-full flex items-center justify-center ring-4 ring-[var(--slate-deep)] ${change.tag === 'Major Release'
                                ? 'bg-[var(--terracotta)]'
                                : change.tag === 'Feature'
                                    ? 'bg-[var(--gold)]'
                                    : 'bg-[var(--sage)]'
                                }`}>
                                <change.icon className="w-4 h-4 text-white" />
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                <div className="text-sm font-mono text-[var(--text-muted)] bg-white/5 px-3 py-1 rounded-lg border border-white/5 w-fit">{change.date}</div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit ${change.tag === 'Major Release'
                                    ? 'bg-[var(--terracotta)]/10 text-[var(--terracotta)] border border-[var(--terracotta)]/20'
                                    : change.tag === 'Feature'
                                        ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20'
                                        : 'bg-[var(--sage)]/10 text-[var(--sage)] border border-[var(--sage)]/20'
                                    }`}>
                                    {change.tag}
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                                {change.title}
                                <span className="text-[var(--text-muted)] font-normal ml-3 text-base">{change.version}</span>
                            </h2>
                            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">{change.desc}</p>

                            <ul className="space-y-3">
                                {change.bullets.map((bullet, j) => (
                                    <li key={j} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                                        <span className={`block w-1.5 h-1.5 rounded-full mt-2 ${change.tag === 'Major Release'
                                            ? 'bg-[var(--terracotta)]'
                                            : change.tag === 'Feature'
                                                ? 'bg-[var(--gold)]'
                                                : 'bg-[var(--sage)]'
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
