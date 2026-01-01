import React from 'react';
import { motion } from 'framer-motion';
import { Mail, BarChart3, Users, Zap, Lock, Globe } from 'lucide-react';

const features = [
    {
        title: "Smart Warmup",
        desc: "Automated reputation management ensures your domain stays healthy.",
        icon: Zap,
        colSpan: "md:col-span-2",
        bg: "bg-gradient-to-br from-brand-dark to-brand-dark border-brand-orange/20"
    },
    {
        title: "Global Infrastructure",
        desc: "Distributed sending nodes across 15 regions.",
        icon: Globe,
        colSpan: "md:col-span-1",
        bg: "bg-brand-dark border-white/10"
    },
    {
        title: "AI Personalization",
        desc: "Dynamic content injection based on prospect data.",
        icon: Users,
        colSpan: "md:col-span-1",
        bg: "bg-brand-dark border-white/10"
    },
    {
        title: "Real-time Analytics",
        desc: "Track opens, clicks, and replies with millisecond precision.",
        icon: BarChart3,
        colSpan: "md:col-span-2",
        bg: "bg-gradient-to-br from-brand-dark to-brand-dark border-brand-purple/20"
    }
];

const FeatureGridNeo = () => {
    return (
        <section className="py-32 bg-brand-dark relative">
            <div className="container px-6 mx-auto">
                <div className="mb-20">
                    <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
                        BUILT FOR <span className="text-brand-orange">SCALE</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        Enterprise-grade infrastructure for high-volume senders.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`${feature.colSpan} group relative p-8 rounded-2xl border ${feature.bg.includes('border-') ? '' : 'border-white/10'} ${feature.bg} overflow-hidden hover:border-white/30 transition-colors duration-500`}
                        >
                            <div className="absolute inset-0 bg-noise opacity-5 mix-blend-overlay" />
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="mb-8">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-heading font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm font-mono text-gray-500 group-hover:text-white transition-colors">
                                    <span>LEARN MORE</span>
                                    <span className="block w-4 h-[1px] bg-current" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureGridNeo;
