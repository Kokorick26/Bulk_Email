import { motion } from 'framer-motion';
import { Bot, Mail, Check, User, Search, RefreshCw, Send, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const HeroTerminal = () => {
    const [step, setStep] = useState(0); // 0: Idle, 1: Typing, 2: Searching, 3: Found, 4: Emailing
    const [typedText, setTypedText] = useState('');
    const fullText = "Find VP of Sales at TechCorp";

    useEffect(() => {
        // Typing Animation Sequence
        let timer: NodeJS.Timeout;

        const startTyping = () => {
            let i = 0;
            setStep(1);
            timer = setInterval(() => {
                if (i < fullText.length) {
                    setTypedText(fullText.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(timer);
                    setTimeout(() => setStep(2), 500); // Searching
                    setTimeout(() => setStep(3), 2000); // Found
                    setTimeout(() => setStep(4), 4000); // Emailing
                    setTimeout(() => { // Reset
                        setStep(0);
                        setTypedText('');
                    }, 8000);
                }
            }, 50);
        };

        const initialDelay = setTimeout(startTyping, 1000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="relative w-full max-w-xl mx-auto md:mr-0 aspect-[16/10] glass-card shadow-2xl overflow-hidden border-t-white/10 border-l-white/5 border-r-white/5 border-b-black bg-[#0A0A0F]">
            {/* Terminal Header */}
            <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-1.5 opacity-50">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center">
                    <span className="text-[10px] font-mono text-white/30 bg-white/5 px-3 py-1 rounded-full">
                        kokorick-ai-engine — v5.2.0
                    </span>
                </div>
            </div>

            {/* Terminal Content */}
            <div className="p-6 font-mono text-sm relative h-full">

                {/* Step 1: Search Input */}
                <div className="flex items-center gap-3 text-white/90 mb-6">
                    <span className="text-brand-purple">➜</span>
                    <span className="text-brand-cyan">~</span>
                    <span className="text-white/50">search</span>
                    <span className="border-r-2 border-brand-purple animate-pulse pr-1">
                        "{typedText}"
                    </span>
                </div>

                {/* Step 2: Processing */}
                {step >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 space-y-2"
                    >
                        <div className="flex items-center gap-2 text-yellow-400/80">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Mistral AI analyzing 142 data points...</span>
                        </div>
                        <div className="pl-5 text-white/30 text-xs">
                            Checking LinkedIn... <span className="text-green-500">Done</span><br />
                            Verifying Email... <span className="text-green-500">Done</span><br />
                            Analyzing Intent... <span className="text-green-500">High</span>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Result Card */}
                {step >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-lg font-bold">
                                    JS
                                </div>
                                <div>
                                    <div className="text-white font-medium">Jason Smith</div>
                                    <div className="text-white/50 text-xs">VP of Sales @ TechCorp</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] border border-green-500/20">Verified</span>
                                <span className="text-[10px] text-white/30 mt-1">Confidence: 98%</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: AI Email Draft */}
                {step >= 4 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-brand-purple/10 border border-brand-purple/20 rounded-lg p-4 relative"
                    >
                        <div className="absolute top-2 right-2">
                            <Bot className="w-4 h-4 text-brand-purple" />
                        </div>
                        <div className="opacity-80">
                            <p className="text-white/40 text-xs mb-2">Generating personalized outreach...</p>
                            <div className="text-white/80 italic border-l-2 border-brand-purple pl-3">
                                "Hi Jason, saw TechCorp just raised Series B. Given your focus on scaling the sales team..."
                            </div>
                        </div>
                        <motion.button
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="bg-brand-blue h-0.5 mt-3 rounded-full"
                        />
                    </motion.div>
                )}

                {/* Floating "Sent" Toast final touch */}
                {step >= 4 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: 20 }}
                        animate={{ opacity: 1, y: -20, x: 0 }}
                        transition={{ delay: 2.5 }}
                        className="absolute bottom-6 right-6 bg-green-500 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg z-20"
                    >
                        <Send className="w-3 h-3" />
                        Sent
                    </motion.div>
                )}
            </div>

            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-brand-purple/20 blur-[80px] rounded-full pointer-events-none" />
        </div>
    );
};

export default HeroTerminal;
