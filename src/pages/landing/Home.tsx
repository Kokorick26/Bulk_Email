import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Zap, BarChart3, ChevronRight, Users, CheckCircle2, Search, Mail,
    Bot, Sparkles, Target, Clock, Shield, Globe, ArrowRight, Play,
    MessageSquare, Database, Workflow, Settings, Star, Check, Cpu,
    TrendingUp, Send, Layers, Lock, Cloud, Rocket, InboxIcon, Server,
    FileText, RefreshCw, PieChart, Bell, MoreHorizontal, Plus
} from 'lucide-react';
import { DashboardMockup } from '../../components/landing/DashboardMockup';
import { BentoCard, LeadDiscoveryMockup, InboxMockup, CampaignStatsMockup, PersonalizationMockup } from '../../components/landing/BentoCard';
import TestimonialsSection from '../../components/landing/TestimonialsSection';
import LogoMarquee from '../../components/landing/LogoMarquee';



export default function Home() {
    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-violet-100 selection:text-violet-900 overflow-x-hidden">

            {/* ==================== HERO SECTION (Requested Style) ==================== */}
            <div className="relative min-h-screen overflow-hidden bg-black flex flex-col justify-center">
                {/* Gradient background with grain effect */}
                <div className="absolute inset-0 bg-black z-0">
                    <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0 opacity-50">
                        <div className="h-[20rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600" />
                        <div className="h-[20rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400" />
                        <div className="h-[20rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500" />
                    </div>
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                </div>

                <div className="relative z-10 pt-32 pb-20 px-4 text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto mb-8 flex max-w-fit items-center justify-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/15 transition-colors"
                    >
                        <span className="text-sm font-medium text-white">
                            Join the revolution today!
                        </span>
                        <ArrowRight className="h-4 w-4 text-white" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mx-auto max-w-5xl text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]"
                    >
                        Unbeatable Scalability for<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">Cold Email Outreach</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-8 max-w-2xl text-lg text-zinc-400 leading-relaxed"
                    >
                        Delivering unmatched email campaigns every day at unbeatable rates. Our AI-driven platform redefines cost-effectiveness. Connect unlimited accounts today.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
                    >
                        <Link to="/signup">
                            <button className="h-12 rounded-full bg-white px-8 text-base font-bold text-black hover:bg-white/90 hover:scale-[1.02] transition-all">
                                Start Your 7 Day Free Trial
                            </button>
                        </Link>
                        <button className="h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/10 transition-all flex items-center gap-2">
                            <Play className="w-4 h-4 fill-white text-white" /> Watch Demo
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="relative mx-auto mt-20 w-full max-w-6xl"
                    >
                        <div className="absolute inset-0 rounded-3xl shadow-lg bg-white/20 blur-[5rem] opacity-30 pointer-events-none" />
                        <DashboardMockup />
                    </motion.div>
                </div>
            </div>

            {/* ==================== INTEGRATIONS MARQUEE ==================== */}
            <LogoMarquee />

            {/* ==================== HOW IT WORKS ==================== */}
            <section className="py-32 px-6 bg-black relative">
                <div className="max-w-5xl mx-auto relative z-10">
                    {/* Header */}
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            From prospect to meeting<br />in three steps.
                        </h2>
                        <p className="text-lg text-zinc-500 max-w-xl mx-auto">
                            We've simplified the complex world of cold email into a streamlined workflow.
                        </p>
                    </div>

                    {/* Steps Grid */}
                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {/* Step 1 */}
                        <div className="text-center group">
                            <div className="relative inline-block mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:border-violet-500/50 group-hover:bg-zinc-900/80">
                                    <Server className="w-7 h-7 text-violet-400" />
                                </div>
                                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">1</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-3">Connect & Scale</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                                Link unlimited email accounts. Our AI automatically warms them up to ensure 99% deliverability.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center group">
                            <div className="relative inline-block mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:border-blue-500/50 group-hover:bg-zinc-900/80">
                                    <Target className="w-7 h-7 text-blue-400" />
                                </div>
                                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">2</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-3">Find Leads</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                                Use our Lead Discovery Engine to find verified contacts from a database of 160M+ B2B professionals.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center group">
                            <div className="relative inline-block mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:border-emerald-500/50 group-hover:bg-zinc-900/80">
                                    <Rocket className="w-7 h-7 text-emerald-400" />
                                </div>
                                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">3</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-3">Launch & Close</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                                Launch personalized campaigns. Manage replies in one Unified Inbox and book meetings on autopilot.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== FEATURES BENTO GRID ==================== */}
            <section className="py-32 px-6 bg-black relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Subtle BG Elements */}
                <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto mb-20 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Powerful features to simplify<br />your outreach
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Everything you need to scale your outbound sales process, built right into one intuitive platform.
                    </p>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {/* Feature 1 - AI Lead Discovery */}
                    <BentoCard className="md:col-span-1">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-violet-500/30">
                            <Target className="w-5 h-5 text-violet-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">AI Lead Discovery</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Our AI scans 160M+ verified profiles to find your perfect customers based on tech stack, hiring intent, and funding.
                        </p>
                        <LeadDiscoveryMockup />
                    </BentoCard>

                    {/* Feature 2 - Personalization */}
                    <BentoCard className="md:col-span-1">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 ring-1 ring-blue-500/30">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Personalization at Scale</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            AI writes unique openers for every prospect, referencing their recent news or posts.
                        </p>
                        <PersonalizationMockup />
                    </BentoCard>

                    {/* Feature 3 - Unified Inbox */}
                    <BentoCard className="md:col-span-1">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 ring-1 ring-emerald-500/30">
                            <InboxIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Unified Inbox</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Manage replies from all your email accounts in one master inbox. Never miss a lead.
                        </p>
                        <InboxMockup />
                    </BentoCard>

                    {/* Feature 4 - Campaign Analytics - Full Width */}
                    <BentoCard className="md:col-span-3">
                        <div className="flex flex-col md:flex-row md:items-start gap-8">
                            <div className="flex-1">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 ring-1 ring-orange-500/30">
                                    <TrendingUp className="w-5 h-5 text-orange-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Campaign Performance</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                                    Track the exact ROI of your campaigns. Our system automatically attributes closed deals and revenue to specific email campaigns.
                                </p>
                            </div>
                            <div className="flex-1">
                                <CampaignStatsMockup />
                            </div>
                        </div>
                    </BentoCard>
                </div>
            </section>

            {/* ==================== TESTIMONIALS ==================== */}
            <TestimonialsSection />

            {/* ==================== VALUE PROPOSITION / COMPARISON ==================== */}
            <section className="py-24 px-6 bg-black">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    {/* Left Side - Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-6">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Why Sales Teams Switch</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                            Stop paying per email account.
                        </h2>
                        <p className="text-zinc-500 mb-8 leading-relaxed">
                            Legacy tools charge you for every seat and every email account you connect. We don't. Connect unlimited accounts to scale your outreach volume without scaling your costs.
                        </p>

                        {/* Comparison Cards */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                    <span className="font-bold text-sm">L</span>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-white text-sm">Legacy Tools</div>
                                    <div className="text-xs text-zinc-600">Charges per inbox ($30/mo each)</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-violet-500/5 rounded-xl border border-violet-500/20 relative">
                                <span className="absolute top-2 right-2 text-[9px] uppercase font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Winner</span>
                                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-white text-sm">Kokorick AI</div>
                                    <div className="text-xs text-violet-400">Unlimited Inboxes (Flat Rate)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Pricing Comparison */}
                    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/10">
                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-6">
                            Cost to send 50k emails/mo
                        </div>

                        <div className="space-y-5">
                            {/* Competitor L */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-zinc-400">Competitor L</span>
                                    <span className="text-sm font-semibold text-white">$1,200/mo</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-600 rounded-full" style={{ width: '100%' }} />
                                </div>
                            </div>

                            {/* Competitor I */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-zinc-400">Competitor I</span>
                                    <span className="text-sm font-semibold text-white">$499/mo</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-600 rounded-full" style={{ width: '42%' }} />
                                </div>
                            </div>

                            {/* Kokorick */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-violet-400 flex items-center gap-1.5">
                                        <Bot className="w-3.5 h-3.5" />
                                        Kokorick AI
                                    </span>
                                    <span className="text-sm font-bold text-violet-400">$79/mo</span>
                                </div>
                                <div className="h-2 bg-violet-500/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500 rounded-full" style={{ width: '7%' }} />
                                </div>
                            </div>
                        </div>

                        {/* Savings callout */}
                        <div className="mt-6 pt-5 border-t border-white/5 text-center">
                            <span className="text-2xl font-bold text-emerald-400">Save up to 93%</span>
                            <span className="text-sm text-zinc-500 ml-2">vs competitors</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== FINAL CTA ==================== */}
            <section className="py-24 px-6 relative overflow-hidden bg-black border-t border-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/20 via-black to-black pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                        Ready to automate your growth?
                    </h2>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Join thousands of innovative sales teams changing the way they do outreach today.
                    </p>
                    <Link to="/signup">
                        <button className="px-10 py-5 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105">
                            Start Free Trial Today
                        </button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
