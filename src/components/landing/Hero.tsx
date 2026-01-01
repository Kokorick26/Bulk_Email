import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import DashboardMockup from './DashboardMockup';

const Hero = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-32 pb-20">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-brand-dark">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-brand-orange opacity-20 blur-[100px]"></div>
                <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-brand-purple opacity-20 blur-[100px]"></div>
            </div>

            <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center">
                <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white backdrop-blur-xl"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-brand-orange mr-2 animate-pulse"></span>
                        <span className="text-xs font-medium tracking-wide uppercase text-gray-300">
                            The Future of Outbound
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight text-white leading-[1.1]"
                    >
                        Research first. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple">
                            Reach smarter.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-body leading-relaxed"
                    >
                        Stop sending generic spam. Warmlo combines powerful campaign management with 
                        <span className="text-white font-medium"> AI-driven sales research </span> 
                        to help you contact the right companies with the right message.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-4 pt-4"
                    >
                        <Button className="h-12 px-8 rounded-full bg-gradient-to-r from-brand-orange to-brand-pink text-white hover:opacity-90 font-bold text-lg transition-all hover:scale-105 border-0">
                            Start Researching
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button variant="outline" className="h-12 px-8 rounded-full border-white/20 text-white hover:bg-white/10 font-medium text-lg backdrop-blur-sm">
                            View Demo
                        </Button>
                    </motion.div>
                </div>

                {/* Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="w-full max-w-6xl mx-auto relative"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple rounded-xl blur opacity-30"></div>
                    <DashboardMockup />
                </motion.div>

                {/* Stats / Social Proof */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 w-full max-w-4xl mx-auto"
                >
                    {[
                        { label: 'Data Points', value: '10M+' },
                        { label: 'Companies', value: '50k+' },
                        { label: 'Reply Rate', value: '3x' },
                        { label: 'Setup Time', value: '< 5m' },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="text-2xl md:text-3xl font-heading font-bold text-white">{stat.value}</span>
                            <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
