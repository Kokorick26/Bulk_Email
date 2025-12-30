import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import {
    ArrowUpRight, ArrowRight, Play, Target, Sparkles, Inbox,
    TrendingUp, Zap, Server, Users, Shield, Clock, Check,
    Mail, BarChart3, Search, Bot, ChevronRight, Layers,
    LineChart, MessageSquare, Globe, Lock, Cpu
} from 'lucide-react';
import { DashboardMockup } from '../../components/landing/DashboardMockup';
import TestimonialsSection from '../../components/landing/TestimonialsSection';
import LogoMarquee from '../../components/landing/LogoMarquee';

// Animation variants
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: "easeOut" as const
        }
    }
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6 }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 1, ease: "easeOut" as const }
    }
};


// Feature data - Bento Grid
const bentoFeatures = [
    {
        title: "AI-Powered Lead Discovery",
        description: "Our intelligence engine scans 160M+ verified profiles to surface your ideal prospects based on tech stack, hiring patterns, and funding signals.",
        icon: Search,
        span: "col-span-2 row-span-2",
        variant: "primary"
    },
    {
        title: "Smart Personalization",
        description: "Generate unique opening lines that reference recent news and company updates.",
        icon: Sparkles,
        span: "col-span-1",
        variant: "secondary"
    },
    {
        title: "Unified Inbox",
        description: "All replies, one place. Never miss a hot lead.",
        icon: Inbox,
        span: "col-span-1",
        variant: "accent"
    },
    {
        title: "Campaign Analytics",
        description: "Track opens, clicks, replies in real-time. Understand what resonates.",
        icon: LineChart,
        span: "col-span-1",
        variant: "secondary"
    },
    {
        title: "Multi-Account Scaling",
        description: "Connect unlimited email accounts. Scale without limits.",
        icon: Layers,
        span: "col-span-1",
        variant: "dark"
    }
];

// Process steps
const steps = [
    {
        number: "01",
        title: "Connect Your Accounts",
        description: "Link unlimited email accounts. Our AI automatically warms them up to ensure maximum deliverability across all your outreach.",
        icon: Server,
        detail: "99% Deliverability"
    },
    {
        number: "02",
        title: "Discover Your Leads",
        description: "Use our Lead Discovery Engine to find verified contacts from a database of 160M+ professionals matching your ideal customer profile.",
        icon: Search,
        detail: "AI-Powered"
    },
    {
        number: "03",
        title: "Launch & Close",
        description: "Launch hyper-personalized campaigns. Manage all replies in one unified inbox and book meetings on autopilot.",
        icon: Zap,
        detail: "Fully Automated"
    }
];

// Stats data
const stats = [
    { value: "10K+", label: "Active Users", description: "Trusted by sales teams globally" },
    { value: "50M+", label: "Emails Sent", description: "Powered by our infrastructure" },
    { value: "99%", label: "Deliverability", description: "Industry-leading inbox placement" }
];

// Value props for comparison
const valueProps = [
    { icon: Users, title: "Unlimited Accounts", description: "No per-inbox pricing ever" },
    { icon: Shield, title: "Enterprise Security", description: "SOC 2 compliant infrastructure" },
    { icon: Clock, title: "5-Minute Setup", description: "Get started in under 5 minutes" },
    { icon: Globe, title: "Global Reach", description: "Reach prospects anywhere" }
];

export default function Home() {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    return (
        <div className="min-h-screen bg-[var(--slate-deep)] text-[var(--text-primary)] overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════════
                HERO SECTION - Bold Editorial Style
            ═══════════════════════════════════════════════════════════════ */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center pt-24 pb-20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    {/* Gradient Orbs */}
                    <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-[var(--terracotta)]/10 rounded-full blur-[150px] animate-pulse-subtle" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--gold)]/5 rounded-full blur-[120px]" />

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 dot-grid-dark opacity-40" />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--slate-deep)]/50 to-[var(--slate-deep)]" />
                </div>

                {/* Main Content */}
                <motion.div
                    style={{ y: heroY, opacity: heroOpacity }}
                    className="container-editorial relative z-10"
                >
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="max-w-5xl mx-auto"
                    >
                        {/* Top Badge */}
                        <motion.div variants={fadeUp} className="flex justify-center mb-8">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                                <span className="flex items-center gap-1.5 text-[var(--terracotta)] text-sm font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-[var(--terracotta)] animate-pulse" />
                                    New
                                </span>
                                <span className="text-sm text-[var(--text-secondary)]">
                                    AI-Powered Email Outreach Platform
                                </span>
                                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                            </div>
                        </motion.div>

                        {/* Main Headline */}
                        <motion.h1
                            variants={fadeUp}
                            className="text-center mb-8"
                        >
                            <span className="block text-display text-white leading-[1.05]">
                                Scale Your Outreach.
                            </span>
                            <span className="block text-display leading-[1.05]">
                                <span className="text-gradient-terracotta">Close More Deals.</span>
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            variants={fadeUp}
                            className="text-center text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-12 leading-relaxed font-light"
                        >
                            The AI-powered cold email platform that discovers leads, personalizes at scale, and delivers unmatched results—all at a fraction of the cost.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={fadeUp}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                        >
                            <Link to="/signup">
                                <button className="btn-terracotta text-base px-8 py-4 group">
                                    Start Free Trial
                                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </Link>
                            <button className="btn-glass text-base px-8 py-4 group">
                                <Play className="w-5 h-5 fill-current" />
                                Watch Demo
                            </button>
                        </motion.div>

                        {/* Stats Row */}
                        <motion.div
                            variants={fadeUp}
                            className="flex flex-wrap justify-center gap-12 lg:gap-20"
                        >
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center group">
                                    <div className="text-4xl md:text-5xl font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-[var(--terracotta)] font-semibold uppercase tracking-wider mb-1">
                                        {stat.label}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)]">
                                        {stat.description}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
                    className="container-editorial mt-16 relative z-10"
                >
                    <div className="relative max-w-6xl mx-auto">
                        {/* Glow Effect */}
                        <div className="absolute -inset-8 bg-gradient-to-b from-[var(--terracotta)]/10 via-[var(--terracotta)]/5 to-transparent rounded-3xl blur-3xl" />

                        {/* Dashboard Container */}
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                            <DashboardMockup />
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--slate-rich)] border border-white/10 shadow-xl">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm text-[var(--text-secondary)]">Live Dashboard Preview</span>
                        </div>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                >
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-medium">Scroll</span>
                    <div className="w-px h-10 bg-gradient-to-b from-[var(--terracotta)] to-transparent" />
                </motion.div>
            </section>

            {/* Logo Marquee */}
            <LogoMarquee />

            {/* ═══════════════════════════════════════════════════════════════
                HOW IT WORKS - Editorial Steps
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-32 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-[var(--slate-rich)]" />
                <div className="absolute inset-0 dot-grid-dark opacity-30" />

                <div className="container-editorial relative z-10">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="max-w-3xl mb-20"
                    >
                        <span className="text-label text-[var(--terracotta)] block mb-4">
                            How It Works
                        </span>
                        <h2 className="text-display-sm text-white mb-6">
                            From prospect to meeting in three steps.
                        </h2>
                        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            We've distilled the complex world of cold email into a streamlined, AI-powered workflow that actually works.
                        </p>
                    </motion.div>

                    {/* Steps Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.6 }}
                                className="group relative"
                            >
                                <div className="card-glass p-8 h-full hover:border-[var(--terracotta)]/30 transition-all duration-300">
                                    {/* Step Header */}
                                    <div className="flex items-start justify-between mb-8">
                                        <span className="text-6xl font-bold text-[var(--terracotta)]/30" style={{ fontFamily: 'Syne, sans-serif' }}>
                                            {step.number}
                                        </span>
                                        <div className="w-14 h-14 rounded-xl bg-[var(--terracotta)]/10 border border-[var(--terracotta)]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <step.icon className="w-7 h-7 text-[var(--terracotta)]" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                                        {step.description}
                                    </p>

                                    {/* Detail Badge */}
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--terracotta)]/10 border border-[var(--terracotta)]/20">
                                        <Check className="w-4 h-4 text-[var(--terracotta)]" />
                                        <span className="text-sm font-medium text-[var(--terracotta)]">{step.detail}</span>
                                    </div>
                                </div>

                                {/* Connector Line */}
                                {i < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-[var(--terracotta)]/50 to-transparent" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                FEATURES - Bento Grid
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--slate-deep)]" />

                <div className="container-editorial relative z-10">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <span className="text-label text-[var(--terracotta)] block mb-4">Features</span>
                        <h2 className="text-display-sm text-white mb-6">
                            Everything you need to dominate outbound.
                        </h2>
                        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            Built for ambitious sales teams who want to scale without the complexity.
                        </p>
                    </motion.div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {bentoFeatures.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                className={`${feature.span} group`}
                            >
                                <div className={`h-full p-6 lg:p-8 rounded-2xl transition-all duration-300 ${feature.variant === 'primary'
                                    ? 'bg-gradient-to-br from-[var(--terracotta)]/20 to-[var(--terracotta)]/5 border border-[var(--terracotta)]/30 hover:border-[var(--terracotta)]/50'
                                    : feature.variant === 'accent'
                                        ? 'bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 border border-[var(--gold)]/30 hover:border-[var(--gold)]/50'
                                        : feature.variant === 'dark'
                                            ? 'bg-[var(--slate-mid)] border border-white/10 hover:border-white/20'
                                            : 'card-glass card-glass-hover'
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.variant === 'primary'
                                        ? 'bg-[var(--terracotta)]/20'
                                        : feature.variant === 'accent'
                                            ? 'bg-[var(--gold)]/20'
                                            : 'bg-white/5'
                                        }`}>
                                        <feature.icon className={`w-6 h-6 ${feature.variant === 'primary'
                                            ? 'text-[var(--terracotta)]'
                                            : feature.variant === 'accent'
                                                ? 'text-[var(--gold)]'
                                                : 'text-[var(--text-secondary)]'
                                            }`} />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-lg lg:text-xl font-semibold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
                                        {feature.title}
                                    </h3>
                                    <p className="text-[var(--text-secondary)] text-sm lg:text-base leading-relaxed">
                                        {feature.description}
                                    </p>

                                    {/* Learn More Link (Primary card) */}
                                    {feature.variant === 'primary' && (
                                        <div className="mt-8 flex items-center gap-2 text-[var(--terracotta)] font-medium group-hover:gap-3 transition-all">
                                            <span>Learn more</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <TestimonialsSection />

            {/* ═══════════════════════════════════════════════════════════════
                VALUE PROPOSITION - Why Switch
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--slate-rich)]" />
                <div className="absolute inset-0 dot-grid-dark opacity-20" />

                <div className="container-editorial relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left - Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <span className="text-label text-[var(--terracotta)] block mb-4">Why Switch?</span>
                            <h2 className="text-display-sm text-white mb-6">
                                Stop paying per email account.
                            </h2>
                            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-10">
                                Legacy tools charge you for every seat and every email account. We don't. Connect unlimited accounts to scale your outreach without scaling your costs.
                            </p>

                            {/* Value Props Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {valueProps.map((prop, i) => (
                                    <motion.div
                                        key={prop.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[var(--terracotta)]/10 flex items-center justify-center shrink-0">
                                            <prop.icon className="w-5 h-5 text-[var(--terracotta)]" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white text-sm">{prop.title}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{prop.description}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right - Pricing Comparison */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--terracotta)]/20 to-transparent rounded-3xl blur-2xl" />
                            <div className="relative card-glass p-8">
                                <div className="text-overline text-[var(--text-muted)] mb-8">
                                    Cost to send 50K emails/month
                                </div>

                                <div className="space-y-6">
                                    {/* Competitor L */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm text-[var(--text-muted)]">Competitor L</span>
                                            <span className="text-lg font-bold text-white">$1,200/mo</span>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-white/20 rounded-full" style={{ width: '100%' }} />
                                        </div>
                                    </div>

                                    {/* Competitor I */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm text-[var(--text-muted)]">Competitor I</span>
                                            <span className="text-lg font-bold text-white">$499/mo</span>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-white/20 rounded-full" style={{ width: '42%' }} />
                                        </div>
                                    </div>

                                    {/* Kokorick */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-medium text-[var(--terracotta)] flex items-center gap-2">
                                                <Bot className="w-4 h-4" />
                                                Kokorick AI
                                            </span>
                                            <span className="text-lg font-bold text-[var(--terracotta)]">$79/mo</span>
                                        </div>
                                        <div className="h-3 bg-[var(--terracotta)]/10 rounded-full overflow-hidden border border-[var(--terracotta)]/30">
                                            <div className="h-full bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-light)] rounded-full" style={{ width: '7%' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Savings */}
                                <div className="mt-10 pt-6 border-t border-white/10 text-center">
                                    <div className="inline-flex items-baseline gap-3">
                                        <span className="text-5xl font-bold text-[var(--sage)]" style={{ fontFamily: 'Syne, sans-serif' }}>93%</span>
                                        <span className="text-[var(--text-secondary)]">savings vs competitors</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                FINAL CTA
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-32 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-[var(--slate-deep)]" />
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--terracotta)]/10 rounded-full blur-[150px]" />
                </div>

                <div className="container-editorial relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <h2 className="text-display-sm text-white mb-8">
                            Ready to transform your outreach?
                        </h2>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed">
                            Join thousands of sales teams who've already made the switch to smarter, more effective cold email.
                        </p>
                        <Link to="/signup">
                            <button className="btn-terracotta text-lg px-10 py-5 group">
                                Start Your Free Trial Today
                                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </Link>
                        <p className="mt-6 text-sm text-[var(--text-muted)]">
                            No credit card required · Cancel anytime
                        </p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
