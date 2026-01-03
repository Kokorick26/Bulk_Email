import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight, Zap, Shield, Globe, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface LoginProps {
    onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            toast.success('Welcome back!');
            onLogin(data.token);
        } catch (err: any) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--slate-deep)] flex" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {/* Left - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 dot-grid-dark opacity-30" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--terracotta)]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--gold)]/5 rounded-full blur-[100px]" />

                <div className="relative z-10 flex flex-col justify-center px-16 max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-4 mb-12">
                            <img src="/logo.png" alt="Warmlo" className="w-12 h-12 rounded-xl shadow-lg ring-1 ring-white/10" />
                            <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                                WARMLO
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl font-bold text-white leading-tight mb-6 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                            Cold email<br />
                            <span className="text-gradient-terracotta">made simple.</span>
                        </h1>

                        <p className="text-lg text-[var(--text-secondary)] mb-12 leading-relaxed">
                            The most reliable way to scale your outreach. Beautiful, fast, and enterprise-ready.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            {[
                                { icon: Zap, text: 'Lightning fast delivery', color: 'terracotta' },
                                { icon: Shield, text: 'Enterprise security', color: 'gold' },
                                { icon: Globe, text: 'Global infrastructure', color: 'sage' },
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${feature.color === 'terracotta'
                                        ? 'bg-[var(--terracotta)]/10 border-[var(--terracotta)]/20'
                                        : feature.color === 'gold'
                                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/20'
                                            : 'bg-[var(--sage)]/10 border-[var(--sage)]/20'
                                        }`}>
                                        <feature.icon className={`w-5 h-5 ${feature.color === 'terracotta'
                                            ? 'text-[var(--terracotta)]'
                                            : feature.color === 'gold'
                                                ? 'text-[var(--gold)]'
                                                : 'text-[var(--sage)]'
                                            }`} />
                                    </div>
                                    <span className="text-[var(--text-secondary)]">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Border */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            </div>

            {/* Right - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
                        <img src="/logo.png" alt="Warmlo" className="w-10 h-10 rounded-xl shadow-lg" />
                        <span className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                            WARMLO
                        </span>
                    </div>

                    {/* Form */}
                    <div className="space-y-8">
                        <div className="text-center lg:text-left">
                            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Welcome back</h2>
                            <p className="text-[var(--text-muted)]">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--text-muted)] block">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/50 focus:border-[var(--terracotta)] transition-all placeholder:text-[var(--text-muted)]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-[var(--text-muted)] block">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/50 focus:border-[var(--terracotta)] transition-all placeholder:text-[var(--text-muted)]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-dark)] text-white font-semibold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--terracotta)]/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo credentials */}
                        <div className="pt-6 border-t border-white/5">
                            <p className="text-sm text-[var(--text-muted)] text-center mb-3">Demo credentials</p>
                            <div className="flex justify-center">
                                <code className="text-sm text-[var(--text-secondary)] bg-white/5 px-4 py-2 rounded-xl border border-white/5 font-mono">
                                    admin@example.com / admin123
                                </code>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[var(--text-muted)] text-sm mt-12">
                        Built with ❤️ by WARMLO
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
