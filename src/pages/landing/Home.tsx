import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Zap, Shield, BarChart3, ChevronRight, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { ShinyButton } from '../../components/ui/ShinyButton';

export default function Home() {
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-6 flex flex-col items-center justify-center text-center">
                <motion.div style={{ opacity, scale }} className="relative z-10 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-white/70">v2.0 is now live</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-8"
                    >
                        Email Marketing
                        <br />
                        <span className="text-white">Reimagined.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        The most powerful platform for high-volume email delivery.
                        Smart routing, real-time analytics, and infinite scalability.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/login">
                            <ShinyButton size="lg" className="min-w-[180px]">Start Free Trial</ShinyButton>
                        </Link>
                        <Link to="/features">
                            <button className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-medium text-lg transition-colors backdrop-blur-md flex items-center gap-2 group">
                                View Demo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Abstract UI Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                    className="relative mt-20 w-full max-w-6xl mx-auto perspective-1000"
                >
                    <div className="relative rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-white/10">
                        <div className="rounded-lg overflow-hidden bg-black/90 border border-white/10 aspect-[16/9] relative group">
                            {/* Mock Interface */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

                            {/* Dashboard Mock Content */}
                            <div className="p-8 h-full flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <div className="h-2 w-24 bg-white/20 rounded-full" />
                                        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 w-8 rounded-full bg-white/10" />
                                        <div className="h-8 w-8 rounded-full bg-white/10" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-6 flex-1">
                                    <div className="col-span-2 bg-white/5 rounded-xl border border-white/5 p-6 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent" />
                                        <div className="flex items-end justify-between h-full gap-2">
                                            {[40, 70, 45, 90, 65, 85, 50, 95, 75, 60, 80, 55].map((h, i) => (
                                                <div key={i} className="w-full bg-white/20 rounded-t-sm" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-white/5 rounded-xl border border-white/5 p-6 h-[48%] relative overflow-hidden group-hover:border-white/20 transition-colors">
                                            <div className="absolute top-0 right-0 p-4">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>
                                            <div className="mt-8 text-4xl font-bold">99.9%</div>
                                            <div className="text-white/40 text-sm">Delivery Rate</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl border border-white/5 p-6 h-[48%] relative overflow-hidden group-hover:border-white/20 transition-colors">
                                            <div className="mt-8 text-4xl font-bold">1.2M</div>
                                            <div className="text-white/40 text-sm">Emails Sent</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Social Proof */}
            <section className="py-10 border-y border-white/[0.05] bg-white/[0.01]">
                <p className="text-center text-sm text-white/30 mb-8 font-medium tracking-wide uppercase">Trusted by modern engineering teams</p>
                <div className="max-w-7xl mx-auto px-6 overflow-hidden">
                    <div className="flex items-center justify-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Fake Logos using simple text for demo */}
                        {['Acme Corp', 'GlobalBank', 'Nebula', 'Spherule', 'Vortex'].map((brand) => (
                            <span key={brand} className="text-xl font-bold font-mono">{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid (Bento) */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to send<br />at planet scale.</h2>
                        <p className="text-white/60 text-lg">
                            Stop worrying about IP reputation and warm-up. We handle the infrastructure so you can focus on your product.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-neutral-900/50 border border-white/10 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Lightning Fast Delivery</h3>
                                <p className="text-white/50 max-w-md">
                                    Our distributed edge nodes ensure your emails are routed through the fastest available path.
                                    With under 100ms latency processing, your OTPs and transactional emails land instantly.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-8 rounded-3xl bg-neutral-900/50 border border-white/10 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Secure by Default</h3>
                                <p className="text-white/50">
                                    SOC2 compliant, encrypted at rest and in transit. Your data never stays longer than needed.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-8 rounded-3xl bg-neutral-900/50 border border-white/10 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                                    <BarChart3 className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Real-time Analytics</h3>
                                <p className="text-white/50">
                                    Track opens, clicks, and bounces in real-time. Webhooks for every event.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-neutral-900/50 border border-white/10 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                                    <Globe className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Global Infrastructure</h3>
                                <p className="text-white/50 max-w-md">
                                    Multi-region redundancy ensures 99.99% uptime. If one region goes down, traffic is automatically rerouted instantly.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="rounded-[2.5rem] bg-gradient-to-b from-white/10 to-black border border-white/10 p-12 md:p-20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-white/20 blur-[100px] rounded-full" />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to start sending?</h2>
                            <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
                                Join thousands of companies using BulkMail to power their communications.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link to="/login">
                                    <ShinyButton size="lg" className="w-full sm:w-auto">Create Free Account</ShinyButton>
                                </Link>
                                <Link to="/contact">
                                    <button className="px-8 py-4 w-full sm:w-auto bg-transparent border border-white/20 hover:bg-white/5 text-white rounded-full font-medium transition-colors">
                                        Contact Sales
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
