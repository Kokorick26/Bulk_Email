import React from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, Target, MessageSquare } from 'lucide-react';
import ResearchMockup from './ResearchMockup';

const steps = [
    {
        icon: <Search className="w-5 h-5" />,
        title: "Discovery",
        desc: "AI scans the market for companies matching your ideal customer profile."
    },
    {
        icon: <Brain className="w-5 h-5" />,
        title: "Deep Research",
        desc: "Analyzes news, funding, and hiring to find 'Why now?' signals."
    },
    {
        icon: <Target className="w-5 h-5" />,
        title: "Decision Makers",
        desc: "Identifies the right people and understands their specific role."
    },
    {
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Hyper-Personalization",
        desc: "Drafts unique emails referencing specific pain points and opportunities."
    }
];

const Pillar2 = () => {
    return (
        <section className="py-24 bg-[#080808] relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            
            <div className="container relative z-10 px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1 text-sm text-brand-purple mb-6">
                        <span className="font-bold tracking-wide uppercase">The Differentiator</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                        AI that does the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-pink">
                            homework for you.
                        </span>
                    </h2>
                    <p className="text-lg text-gray-400 font-body leading-relaxed">
                        Most tools just send emails. Warmlo researches your prospects first. 
                        It's like having a team of SDRs working 24/7 to find the perfect opening.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-tr from-brand-purple/40 to-transparent rounded-xl blur-xl opacity-50"></div>
                            <ResearchMockup className="relative z-10" />
                        </motion.div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="flex gap-6 group"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center group-hover:border-brand-purple/50 group-hover:bg-brand-purple/10 transition-colors">
                                    <div className="text-gray-400 group-hover:text-brand-purple transition-colors">
                                        {step.icon}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 font-heading group-hover:text-brand-purple transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pillar2;