import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, BarChart3, Globe, Code2, Lock } from 'lucide-react';

export default function Features() {
    return (
        <div className="pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24 transition-all">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                        Built for developers.
                    </h1>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto">
                        A complete email infrastructure platform designed to help you send faster, scale easier, and deliver better.
                    </p>
                </div>

                <div className="space-y-32">
                    {/* Feature 1 */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                                <Code2 className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">REST API & SMTP</h2>
                            <p className="text-white/60 text-lg leading-relaxed mb-6">
                                Integrate in minutes using our REST API or standard SMTP. We provide libraries for Node.js, Python, Go, and Ruby.
                            </p>
                            <div className="rounded-xl overflow-hidden bg-[#0d0d0d] border border-white/10 p-4 font-mono text-sm">
                                <div className="flex gap-2 mb-4 text-white/20">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20" />
                                </div>
                                <code className="text-blue-400">const</code> <code className="text-white">email</code> <code className="text-purple-400">=</code> <code className="text-yellow-400">await</code> <code className="text-white">client.send(&#123;</code><br />
                                &nbsp;&nbsp;<code className="text-white">from:</code> <code className="text-green-400">'hello@company.com'</code>,<br />
                                &nbsp;&nbsp;<code className="text-white">to:</code> <code className="text-green-400">'user@gmail.com'</code>,<br />
                                &nbsp;&nbsp;<code className="text-white">subject:</code> <code className="text-green-400">'Welcome!'</code><br />
                                <code className="text-white">&#125;);</code>
                            </div>
                        </motion.div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full" />
                            <div className="relative border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl p-8 aspect-square flex items-center justify-center">
                                {/* Visual abstraction */}
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-white/5 rounded-lg h-32 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                            <div className="relative border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl p-8 aspect-video flex items-center justify-center">
                                <div className="w-full space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/60">Delivered</span>
                                        <span className="text-emerald-400">98.5%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-[98.5%] bg-emerald-500" />
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/60">Opened</span>
                                        <span className="text-blue-400">42%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-[42%] bg-blue-500" />
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/60">Clicked</span>
                                        <span className="text-purple-400">12%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-[12%] bg-purple-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 md:order-2"
                        >
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                                <BarChart3 className="w-6 h-6 text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Granular Analytics</h2>
                            <p className="text-white/60 text-lg leading-relaxed">
                                Go beyond open rates. Track geolocation, device types, and operating systems.
                                Spot delivery issues before they affect your users with our real-time dashboard.
                            </p>
                        </motion.div>
                    </div>

                    {/* Feature 3 */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                                <Globe className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Dedicated IPS & Pooling</h2>
                            <p className="text-white/60 text-lg leading-relaxed">
                                Isolate your reputation with dedicated IPs.
                                Or use our warm IP pools for instant deliverability on smaller volumes.
                                We automatically handle warm-up schedules.
                            </p>
                        </motion.div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full" />
                            <div className="relative border border-white/10 bg-black/50 backdrop-blur-xl rounded-2xl p-8 aspect-[4/3] flex items-center justify-center">
                                <Globe className="w-32 h-32 text-white/10 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
