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
                    We are changing how the world emails.
                </motion.h1>
                <div className="prose prose-invert mx-auto text-white/60">
                    <p className="text-xl leading-relaxed mb-6">
                        BulkMail started with a simple idea: Email infrastructure shouldn't be a black box.
                        We believe in transparency, speed, and giving developers the tools they need to build better user experiences.
                    </p>
                    <p className="text-xl leading-relaxed">
                        Founded in 2025, we process billions of emails for the most innovative companies on the planet.
                        And we are just getting started.
                    </p>
                </div>
            </div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                {[
                    { label: "Emails Sent", value: "10B+" },
                    { label: "Uptime", value: "99.99%" },
                    { label: "Support", value: "24/7" },
                    { label: "Team", value: "Global" }
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
