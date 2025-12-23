import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
    return (
        <div className="pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-bold mb-8"
                >
                    Pioneering the Future of Email Communication
                </motion.h1>
                <div className="prose prose-invert mx-auto text-white/60">
                    <p className="text-xl leading-relaxed mb-6">
                        At BulkMail, we're revolutionizing how businesses connect with their audience through cutting-edge email technology.
                        Our intelligent platform combines simplicity with power, enabling organizations of all sizes to achieve remarkable results.
                    </p>
                    <p className="text-xl leading-relaxed">
                        We've built the most advanced email infrastructure in the industry, trusted by thousands of companies to deliver
                        critical communications with perfect precision. Your success is our mission, and we stop at nothing to ensure it.
                    </p>
                </div>
            </div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                {[
                    { label: "Messages Processed", value: "25B+" },
                    { label: "Uptime", value: "99.99%" },
                    { label: "Response Time", value: "<1hr" },
                    { label: "Experts", value: "200+" }
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        key={stat.label}
                        className="text-center p-6 rounded-2xl bg-white/5 border border-white/10"
                    >
                        <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                        <div className="text-white/40">{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
