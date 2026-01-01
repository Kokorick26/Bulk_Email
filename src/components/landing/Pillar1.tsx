import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Send, BarChart3, Users } from 'lucide-react';
import InboxMockup from './InboxMockup';

const features = [
    {
        icon: <Inbox className="w-6 h-6 text-brand-pink" />,
        title: "Unified Inbox",
        description: "Manage all your replies in one place. Never miss a lead because you forgot to check an account."
    },
    {
        icon: <Send className="w-6 h-6 text-brand-pink" />,
        title: "Smart Sending",
        description: "Automated warm-up and sending schedules to keep your deliverability high and landing in the primary inbox."
    },
    {
        icon: <BarChart3 className="w-6 h-6 text-brand-pink" />,
        title: "Deep Analytics",
        description: "Track opens, clicks, and replies. Understand what's working and optimize your campaigns in real-time."
    },
    {
        icon: <Users className="w-6 h-6 text-brand-pink" />,
        title: "Audience Management",
        description: "Easily import leads, segment audiences, and manage suppressions to keep your lists clean."
    }
];

const Pillar1 = () => {
    return (
        <section className="py-24 bg-brand-dark relative border-t border-white/5">
            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center rounded-full border border-brand-pink/20 bg-brand-pink/10 px-3 py-1 text-sm text-brand-pink mb-6">
                            <span className="font-bold tracking-wide uppercase">The Foundation</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                            Complete Campaign <br />
                            <span className="text-gray-500">Control.</span>
                        </h2>
                        <p className="text-lg text-gray-400 mb-8 font-body leading-relaxed">
                            Before we add the AI magic, we ensure you have a rock-solid platform for execution. 
                            Manage unlimited campaigns, accounts, and leads without the headache.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="flex flex-col space-y-3">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white font-heading">{feature.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-br from-brand-pink/20 to-transparent rounded-xl blur-xl opacity-50"></div>
                        <InboxMockup className="relative z-10" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Pillar1;
