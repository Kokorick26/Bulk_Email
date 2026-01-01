import React from 'react';
import { Search, Building2, Globe, Users, ArrowRight, Sparkles, Target, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ResearchMockup({ className }: { className?: string }) {
    return (
        <div className={cn("w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl font-sans", className)}>
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center px-4 gap-3 bg-[#0c0c0c]">
                <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center border border-brand-purple/20">
                    <Sparkles className="w-4 h-4 text-brand-purple" />
                </div>
                <span className="font-semibold text-white text-sm">AI Research Engine</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400 border border-white/5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse"></span>
                        Processing
                    </span>
                </div>
            </div>

            <div className="p-6 grid gap-6">
                {/* Input Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Target Criteria</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['SaaS B2B', 'Series A+', 'Revenue > $5M', 'Using HubSpot'].map((tag, i) => (
                            <motion.span 
                                key={i} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1.5"
                            >
                                {i === 0 && <Building2 className="w-3 h-3 text-brand-orange" />}
                                {i === 3 && <Target className="w-3 h-3 text-brand-pink" />}
                                {tag}
                            </motion.span>
                        ))}
                    </div>
                </div>

                {/* AI Analysis Animation */}
                <div className="relative rounded-xl bg-white/[0.02] border border-white/5 p-5 overflow-hidden">
                    <motion.div 
                        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                            <BrainCircuit className="w-5 h-5 text-brand-purple" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div>
                                <h3 className="text-sm font-bold text-white mb-1">Acme Corp.</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> acme.inc
                                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                    <Users className="w-3 h-3" /> 50-200
                                </p>
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-2 text-xs text-brand-orange font-medium">
                                    <Target className="w-3 h-3" />
                                    <span>Pain Point Identified</span>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                                    Recent funding of $12M (Series A) implies pressure to scale sales team. 
                                    Currently hiring 5 SDRs, suggesting a bottleneck in outbound lead generation.
                                </p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="flex items-center gap-3 pt-2"
                            >
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border border-[#0A0A0A] flex items-center justify-center text-[8px] text-white font-bold">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[10px] text-gray-500">3 Decision Makers found</span>
                                <button className="ml-auto text-[10px] font-bold text-brand-purple flex items-center gap-1 hover:underline">
                                    View Strategy <ArrowRight className="w-3 h-3" />
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
