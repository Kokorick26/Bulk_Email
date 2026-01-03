import React from 'react';
import { Search, Building2, Globe, Users, ArrowRight, Sparkles, Target, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ResearchMockup({ className }: { className?: string }) {
    return (
        <div className={cn("w-full max-w-2xl bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm relative", className)}>
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")' }} />
            
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center px-5 gap-3 bg-white/[0.02] relative z-10">
                <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center border border-brand-purple/20">
                    <Sparkles className="w-5 h-5 text-brand-purple" />
                </div>
                <span className="font-bold text-white text-base font-heading">AI Research Engine</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-gray-400 border border-white/10 flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                        Processing
                    </span>
                </div>
            </div>

            <div className="p-6 grid gap-6 relative z-10">
                {/* Input Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Criteria</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['SaaS B2B', 'Series A+', 'Revenue > $5M', 'Using HubSpot'].map((tag, i) => (
                            <motion.span 
                                key={i} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-200 flex items-center gap-2 font-medium hover:bg-white/10 transition-colors cursor-default"
                            >
                                {i === 0 && <Building2 className="w-3.5 h-3.5 text-brand-orange" />}
                                {i === 3 && <Target className="w-3.5 h-3.5 text-brand-pink" />}
                                {tag}
                            </motion.span>
                        ))}
                    </div>
                </div>

                {/* AI Analysis Animation */}
                <div className="relative rounded-xl bg-white/[0.03] border border-white/10 p-6 overflow-hidden backdrop-blur-sm">
                    <motion.div 
                        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0 border border-brand-purple/20">
                            <BrainCircuit className="w-6 h-6 text-brand-purple" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div>
                                <h3 className="text-base font-bold text-white mb-2 font-heading">Acme Corp.</h3>
                                <p className="text-sm text-gray-400 flex items-center gap-3">
                                    <Globe className="w-3.5 h-3.5" /> acme.inc
                                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                    <Users className="w-3.5 h-3.5" /> 50-200 employees
                                </p>
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center gap-2 text-sm text-brand-orange font-bold">
                                    <Target className="w-4 h-4" />
                                    <span>Pain Point Identified</span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/10">
                                    Recent funding of $12M (Series A) implies pressure to scale sales team. 
                                    Currently hiring 5 SDRs, suggesting a bottleneck in outbound lead generation.
                                </p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="flex items-center gap-4 pt-2"
                            >
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink border-2 border-[#050505] flex items-center justify-center text-[9px] text-white font-bold shadow-lg">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 font-medium">3 Decision Makers found</span>
                                <button className="ml-auto text-xs font-bold text-brand-purple flex items-center gap-1.5 hover:text-brand-purple/80 transition-colors">
                                    View Strategy <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
