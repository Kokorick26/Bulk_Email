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
                    Transforming Digital Communication Through Email
                </motion.h1>
                <div className="prose prose-invert mx-auto text-white/60">
                    <p className="text-xl leading-relaxed mb-6">
                        BulkMail was born from a vision to democratize email communication. We're breaking down the barriers 
                        that make email infrastructure complex and inaccessible, empowering businesses of all sizes to connect 
                        with their audiences effectively and efficiently.
                    </p>
                    <p className="text-xl leading-relaxed">
                        Since our inception, we've become the trusted partner for thousands of businesses, delivering billions 
                        of emails with unparalleled reliability and insights. Our commitment to innovation drives us to constantly 
                        push the boundaries of what's possible in email communication.
                    </p>
                </div>
            </div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                {[
                    { label: "Emails Delivered", value: "15B+" },
                    { label: "Uptime", value: "99.99%" },
                    { label: "Global Support", value: "24/7" },
                    { label: "Team Members", value: "100+" }
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
