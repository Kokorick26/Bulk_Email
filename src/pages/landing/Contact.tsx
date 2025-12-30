import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Add actual submission logic here
    };

    return (
        <div className="pt-32 pb-32 px-6 bg-[var(--slate-deep)] min-h-screen text-[var(--text-primary)] relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--terracotta)]/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--gold)]/3 rounded-full blur-[120px]" />
                <div className="absolute inset-0 dot-grid-dark opacity-20" />
            </div>

            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="text-label text-[var(--terracotta)] block mb-6">Get in Touch</span>
                    <h1 className="text-display-sm text-white mb-6">Let's talk.</h1>
                    <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed">
                        Have enterprise requirements? Need a custom API integration? Or just want to say hi? We'd love to hear from you.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-[var(--terracotta)]/10 flex items-center justify-center shrink-0 border border-[var(--terracotta)]/20 group-hover:bg-[var(--terracotta)] transition-colors">
                                <Mail className="w-5 h-5 text-[var(--terracotta)] group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-1 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Email us</h3>
                                <p className="text-[var(--text-muted)] mb-2">For general inquiries and sales.</p>
                                <a href="mailto:hello@kokorick.ai" className="text-[var(--terracotta)] hover:text-[var(--terracotta-light)] transition-colors font-medium">hello@kokorick.ai</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center shrink-0 border border-[var(--gold)]/20 group-hover:bg-[var(--gold)] transition-colors">
                                <MessageSquare className="w-5 h-5 text-[var(--gold)] group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-1 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Live Chat</h3>
                                <p className="text-[var(--text-muted)] mb-2">Available 9am - 5pm EST.</p>
                                <button className="text-[var(--terracotta)] hover:text-[var(--terracotta-light)] transition-colors font-medium">Start a conversation</button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-[var(--sage)]/10 flex items-center justify-center shrink-0 border border-[var(--sage)]/20 group-hover:bg-[var(--sage)] transition-colors">
                                <MapPin className="w-5 h-5 text-[var(--sage)] group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-1 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Office</h3>
                                <p className="text-[var(--text-muted)]">
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
                    className="card-glass p-8 md:p-12"
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
                            <h3 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Message Sent!</h3>
                            <p className="text-[var(--text-secondary)]">We'll get back to you within 24 hours.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[var(--text-secondary)]">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/50 focus:border-[var(--terracotta)] transition-all font-medium placeholder:text-[var(--text-muted)]"
                                        placeholder="Jane"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[var(--text-secondary)]">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/50 focus:border-[var(--terracotta)] transition-all font-medium placeholder:text-[var(--text-muted)]"
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--text-secondary)]">Work Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/50 focus:border-[var(--terracotta)] transition-all font-medium placeholder:text-[var(--text-muted)]"
                                    placeholder="jane@company.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--text-secondary)]">Message</label>
                                <textarea
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/50 focus:border-[var(--terracotta)] transition-all resize-none font-medium placeholder:text-[var(--text-muted)]"
                                    placeholder="Tell us about your needs..."
                                    required
                                />
                            </div>

                            <button className="w-full btn-terracotta py-4 text-base group">
                                <span>Send Message</span>
                                <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
