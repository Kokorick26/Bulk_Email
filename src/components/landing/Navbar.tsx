import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Bot, ChevronRight, Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Features", path: "/features" },
        { name: "Pricing", path: "/pricing" },
        { name: "About", path: "/about" },
        { name: "Contact", path: "/contact" }
    ];

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                    scrolled
                        ? "bg-[var(--slate-deep)]/90 backdrop-blur-xl border-b border-white/5 py-4"
                        : "bg-transparent py-6"
                )}
            >
                <div className="container-editorial flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--terracotta)] blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] flex items-center justify-center shadow-lg shadow-[var(--terracotta)]/20 ring-1 ring-white/10">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                            Kokorick <span className="text-[var(--text-muted)] font-normal">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={cn(
                                    "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                                    location.pathname === item.path
                                        ? "text-white"
                                        : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"
                                )}
                            >
                                {item.name}
                                {location.pathname === item.path && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute inset-0 bg-white/5 rounded-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login">
                            <button className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors px-4 py-2">
                                Sign In
                            </button>
                        </Link>
                        <Link to="/signup">
                            <button className="relative group">
                                <div className="absolute inset-0 bg-[var(--terracotta)] rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                                <div className="relative h-10 px-6 bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-dark)] text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[var(--terracotta)]/20 ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                                    <Sparkles className="w-4 h-4" />
                                    Get Started
                                </div>
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: "100%" }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm z-[60] bg-[var(--slate-deep)] border-l border-white/10 p-6 md:hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] flex items-center justify-center ring-1 ring-white/10">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                                        Kokorick AI
                                    </span>
                                </Link>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Nav Links */}
                            <div className="flex flex-col gap-2">
                                {navLinks.map((item, i) => (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors",
                                                location.pathname === item.path
                                                    ? "bg-[var(--terracotta)]/10 text-[var(--terracotta)] border border-[var(--terracotta)]/20"
                                                    : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {item.name}
                                            <ChevronRight className="w-4 h-4 opacity-50" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-6" />

                            {/* Auth Actions */}
                            <div className="space-y-3">
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                    <button className="w-full py-3 px-4 rounded-xl text-base font-medium text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors text-left">
                                        Sign In
                                    </button>
                                </Link>
                                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                                    <button className="w-full py-3.5 px-4 bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-dark)] text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/20">
                                        <Sparkles className="w-4 h-4" />
                                        Get Started Free
                                    </button>
                                </Link>
                            </div>

                            {/* Bottom Decoration */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        All systems operational
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
