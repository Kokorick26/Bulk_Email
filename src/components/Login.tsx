import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
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
        <div className="min-h-screen bg-black flex">
            {/* Left - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden dot-grid">
                {/* Subtle gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col justify-center px-16 max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                                <Mail className="w-6 h-6 text-black" />
                            </div>
                            <span className="text-2xl font-semibold text-white tracking-tight">Bulk Email</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl font-semibold text-white leading-tight mb-6 tracking-tight">
                            Email delivery<br />
                            made simple.
                        </h1>

                        <p className="text-lg text-white/50 mb-12 leading-relaxed">
                            The most reliable way to send bulk emails to your audience.
                            Beautiful, fast, and enterprise-ready.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            {[
                                { icon: Zap, text: 'Lightning fast delivery' },
                                { icon: Shield, text: 'Enterprise security' },
                                { icon: Globe, text: 'Global infrastructure' },
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                                        <feature.icon className="w-5 h-5 text-white/70" />
                                    </div>
                                    <span className="text-white/70">{feature.text}</span>
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
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <Mail className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-white">Bulk Email</span>
                    </div>

                    {/* Form */}
                    <div className="space-y-8">
                        <div className="text-center lg:text-left">
                            <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
                            <p className="text-white/50">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm text-white/50 block">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/50 block">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium py-3.5 rounded-lg transition-all hover:bg-white/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="pt-6 border-t border-white/[0.08]">
                            <p className="text-sm text-white/30 text-center mb-3">Demo credentials</p>
                            <div className="flex justify-center">
                                <code className="text-sm text-white/50 bg-white/[0.03] px-4 py-2 rounded-lg border border-white/[0.05]">
                                    admin@example.com / admin123
                                </code>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-white/20 text-sm mt-12">
                        Built by Kokorick
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
