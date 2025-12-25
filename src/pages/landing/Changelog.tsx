import React from 'react';
import { motion } from 'framer-motion';

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
        tag: "Major Release"
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
        tag: "Improvement"
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
        tag: "Feature"
    }
];

export default function Changelog() {
    return (
        <div className="pt-32 pb-32 px-6 bg-white min-h-screen text-slate-900">
            <div className="max-w-3xl mx-auto">
                <div className="mb-20 text-center md:text-left">
                    <h1 className="text-5xl font-bold mb-6 tracking-tight text-slate-900">Changelog</h1>
                    <p className="text-xl text-slate-500">
                        New updates and improvements to Kokorick AI.
                    </p>
                </div>

                <div className="relative border-l border-slate-200 ml-4 md:ml-0 space-y-20">
                    {changes.map((change, i) => (
                        <motion.div
                            key={change.version}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="relative pl-12 md:pl-16"
                        >
                            {/* Dot */}
                            <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-slate-900 ring-4 ring-white shadow-sm" />

                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                <div className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{change.date}</div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded w-fit ${change.tag === 'Major Release' ? 'bg-violet-100 text-violet-700' :
                                    change.tag === 'Feature' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {change.tag}
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-3 text-slate-900">{change.title} <span className="text-slate-400 font-normal ml-2">{change.version}</span></h2>
                            <p className="text-slate-600 leading-relaxed mb-6">{change.desc}</p>

                            <ul className="space-y-2">
                                {change.bullets.map((bullet, j) => (
                                    <li key={j} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="block w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
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
