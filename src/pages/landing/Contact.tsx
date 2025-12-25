import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, MapPin } from 'lucide-react';
import { ShinyButton } from '../../components/ui/ShinyButton';

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Add actual submission logic here
    };

    return (
        <div className="pt-32 pb-32 px-6 bg-black min-h-screen text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-900/20 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 relative z-10">
                <div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight text-white">Let's talk.</h1>
                    <p className="text-xl text-zinc-400 mb-12">
                        Have enterprise requirements? Need a custom API integration? Or just want to say hi? We'd love to hear from you.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                                <Mail className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-1 text-white">Email us</h3>
                                <p className="text-zinc-400 mb-2">For general inquiries and sales.</p>
                                <a href="mailto:hello@kokorick.ai" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">hello@kokorick.ai</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-1 text-white">Live Chat</h3>
                                <p className="text-zinc-400 mb-2">Available 9am - 5pm EST.</p>
                                <button className="text-violet-400 hover:text-violet-300 transition-colors font-medium">Start a conversation</button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                <MapPin className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-1 text-white">Office</h3>
                                <p className="text-zinc-400">
                                    1209 Market Street<br />
                                    San Francisco, CA 94103
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0c0c10] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-emerald-500/30">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-white">Message Sent!</h3>
                            <p className="text-zinc-400">We'll get back to you within 24 hours.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-300">First Name</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all font-medium placeholder:text-zinc-600" placeholder="Jane" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-300">Last Name</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all font-medium placeholder:text-zinc-600" placeholder="Doe" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-300">Work Email</label>
                                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all font-medium placeholder:text-zinc-600" placeholder="jane@company.com" required />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-300">Message</label>
                                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all resize-none font-medium placeholder:text-zinc-600" placeholder="Tell us about your needs..." required />
                            </div>

                            <button className="w-full h-12 bg-white text-black font-bold rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-200 transition-all hover:scale-[1.01]">Send Message</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
