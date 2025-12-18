import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Github, Twitter, Linkedin, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ShinyButton } from '../components/ui/ShinyButton';
import { cn } from '../lib/utils';

export default function MarketingLayout() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/', label: 'Product' },
        { href: '/features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/about', label: 'About' },
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Navigation */}
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                    scrolled ? "bg-black/60 backdrop-blur-xl border-white/[0.05] py-4" : "bg-transparent py-6"
                )}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-tr from-white to-white/80 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <Mail className="w-5 h-5 text-black" />
                        </div>
                        <span className="font-bold text-xl tracking-tight pl-1">BulkMail</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-white",
                                    location.pathname === link.href ? "text-white" : "text-white/60"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                            Log in
                        </Link>
                        <Link to="/login">
                            <ShinyButton size="sm">Get Started</ShinyButton>
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden text-white/70 hover:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden overflow-hidden bg-black/95 backdrop-blur-xl border-b border-white/[0.05]"
                        >
                            <div className="px-6 py-8 space-y-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block text-lg font-medium text-white/80 hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <div className="pt-4 flex flex-col gap-3">
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <ShinyButton variant="secondary" className="w-full">Log In</ShinyButton>
                                    </Link>
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <ShinyButton className="w-full">Get Started</ShinyButton>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Page Content */}
            <main className="relative z-10 pt-24 min-h-[90vh]">
                <Outlet />
            </main>

            {/* Rich Footer */}
            <footer className="relative z-10 bg-black border-t border-white/[0.05] pt-20 pb-10 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
                    <div className="col-span-2 lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg">BulkMail</span>
                        </Link>
                        <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">
                            The enterprise-grade email infrastructure managed by thousands of developers.
                            Send, track, and optimize your email campaigns with confidence.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"><Github className="w-4 h-4" /></a>
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-white">Product</h4>
                        <ul className="space-y-3 text-sm text-white/40">
                            <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Integration</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-white">Company</h4>
                        <ul className="space-y-3 text-sm text-white/40">
                            <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-white">Resources</h4>
                        <ul className="space-y-3 text-sm text-white/40">
                            <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto pt-8 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-white/40">
                        © 2025 BulkMail Inc. All rights reserved.
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono text-emerald-500">SYSTEM OPERATIONAL</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
