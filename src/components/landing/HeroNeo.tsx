import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const HeroNeo = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-dark pt-20">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20" 
                style={{ 
                    backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }} 
            />
            
            {/* Ambient Glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="container relative z-10 px-6 mx-auto">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                        <span className="text-sm font-mono text-gray-300 tracking-wider">SYSTEM V2.0 ONLINE</span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white leading-[0.9] tracking-tight mb-8"
                    >
                        COLD EMAIL <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-pink">REINVENTED</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
                    >
                        Stop sending into the void. Our AI-driven infrastructure ensures your emails land in the primary inbox, every single time.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-4"
                    >
                        <Button className="h-14 px-8 rounded-none bg-brand-orange text-white hover:bg-brand-orange/90 font-bold text-lg tracking-wide uppercase border-2 border-transparent hover:border-brand-orange transition-all">
                            Start Campaign
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button variant="outline" className="h-14 px-8 rounded-none border-2 border-white/20 text-white hover:bg-white/10 font-bold text-lg tracking-wide uppercase">
                            View Demo
                        </Button>
                    </motion.div>

                    {/* Stats / Social Proof */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-t border-white/10 pt-10"
                    >
                        {[
                            { label: "Deliverability", value: "99.8%", icon: Shield },
                            { label: "Active Users", value: "12k+", icon: Globe },
                            { label: "Emails Sent", value: "140M", icon: Zap },
                            { label: "ROI Increase", value: "3.5x", icon: ArrowRight },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center justify-center gap-2">
                                <stat.icon className="w-6 h-6 text-brand-orange mb-2 opacity-80" />
                                <span className="text-3xl font-heading font-bold text-white">{stat.value}</span>
                                <span className="text-sm text-gray-500 font-mono uppercase tracking-wider">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroNeo;
