import React from 'react';
import { cn } from '@/lib/utils';
import { Building2, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { motion } from 'framer-motion';

// Minimal, compact Lead Discovery mockup that fits inside a feature card
export default function LeadDiscoveryMockup({ className }: { className?: string }) {
    return (
        <div className={cn("w-full max-w-md bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm relative", className)}>
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")' }} />
            
            {/* Mini Search Bar */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] relative z-10">
                <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 text-sm text-gray-300 border border-white/10">
                    <Sparkles className="w-4 h-4 text-brand-purple" />
                    <span className="truncate">Find SaaS companies in US with 50-200 employees...</span>
                </div>
            </div>

            {/* Mini Lead Cards */}
            <div className="p-4 space-y-3 relative z-10">
                {[
                    { name: 'TechFlow Solutions', role: 'CTO', score: 98, industry: 'B2B SaaS' },
                    { name: 'GrowthScale.io', role: 'VP Sales', score: 94, industry: 'MarTech' },
                    { name: 'CloudNine Systems', role: 'Head of Growth', score: 91, industry: 'FinTech' },
                ].map((lead, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/10 hover:border-brand-purple/40 hover:bg-white/[0.05] transition-all group cursor-default"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center border border-brand-purple/20 group-hover:bg-brand-purple/20 transition-colors">
                                <Building2 className="w-5 h-5 text-brand-purple" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-white mb-0.5 group-hover:text-brand-purple transition-colors">{lead.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <Target className="w-3 h-3" />
                                    <span>{lead.role}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                    <span>{lead.industry}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-bold text-brand-orange">{lead.score}%</span>
                            <CheckCircle2 className="w-4 h-4 text-brand-orange" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
