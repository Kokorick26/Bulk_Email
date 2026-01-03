import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Add actual submission logic here
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white font-body selection:bg-brand-orange selection:text-white overflow-x-hidden">
            <Navbar />
            
            {/* ═══════════════════════════════════════════════════════════════════
                BACKGROUND
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <span className="text-sm font-bold tracking-widest text-brand-orange uppercase block mb-6">Get in Touch</span>
                        <h1 className="text-5xl font-heading font-bold text-white mb-6">Let's talk.</h1>
                        <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                            Have enterprise requirements? Need a custom API integration? Or just want to say hi? We'd love to hear from you.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0 border border-brand-orange/20 group-hover:bg-brand-orange transition-colors">
                                    <Mail className="w-5 h-5 text-brand-orange group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1 text-white font-heading">Email us</h3>
                                    <p className="text-gray-500 mb-2">For general inquiries and sales.</p>
                                    <a href="mailto:hello@warmlo.com" className="text-brand-orange hover:text-brand-pink transition-colors font-medium">hello@warmlo.com</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center shrink-0 border border-brand-pink/20 group-hover:bg-brand-pink transition-colors">
                                    <MessageSquare className="w-5 h-5 text-brand-pink group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1 text-white font-heading">Live Chat</h3>
                                    <p className="text-gray-500 mb-2">Available 9am - 5pm EST.</p>
                                    <button className="text-brand-orange hover:text-brand-pink transition-colors font-medium">Start a conversation</button>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center shrink-0 border border-brand-purple/20 group-hover:bg-brand-purple transition-colors">
                                    <MapPin className="w-5 h-5 text-brand-purple group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1 text-white font-heading">Office</h3>
                                    <p className="text-gray-500">
                                        1209 Market Street<br />
                                        San Francisco, CA 94103
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="p-8 md:p-12 rounded-2xl border border-white/10 bg-[#0A0A0A] backdrop-blur-sm"
                    >
                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20"
                            >
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white font-heading">Message Sent!</h3>
                                <p className="text-gray-400">We'll get back to you within 24 hours.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400">First Name</label>
                                        <Input
                                            type="text"
                                            placeholder="John"
                                            className="bg-white/5 border-white/10 focus:border-brand-orange/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400">Last Name</label>
                                        <Input
                                            type="text"
                                            placeholder="Doe"
                                            className="bg-white/5 border-white/10 focus:border-brand-orange/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="john@company.com"
                                        className="bg-white/5 border-white/10 focus:border-brand-orange/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">Message</label>
                                    <Textarea
                                        placeholder="How can we help you?"
                                        className="bg-white/5 border-white/10 focus:border-brand-orange/50 min-h-[150px]"
                                    />
                                </div>
                                <Button className="w-full h-12 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold tracking-wide">
                                    Send Message
                                    <Send className="w-4 h-4 ml-2" />
                                </Button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
