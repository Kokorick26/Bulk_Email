import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Bot, ChevronRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === "/";

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navTextColor = "text-zinc-400 hover:text-white";
    const logoTextColor = "text-white";
    const logoSubTextColor = "text-zinc-500";

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    scrolled
                        ? "bg-[#0c0c10]/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl shadow-black/20"
                        : "bg-transparent py-6"
                )}
            >
                <div className="container px-6 mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <span className={cn("text-xl font-bold tracking-tight transition-colors", logoTextColor)}>
                            Kokorick <span className={logoSubTextColor + " font-normal"}>AI</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {[
                            { name: "Features", path: "/features" },
                            { name: "Pricing", path: "/pricing" },
                            { name: "About", path: "/about" },
                            { name: "Contact", path: "/contact" }
                        ].map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={cn("text-sm font-medium transition-colors", navTextColor)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login">
                            <button className={cn("text-sm font-medium transition-colors", navTextColor)}>
                                Sign In
                            </button>
                        </Link>
                        <Link to="/signup">
                            <button className="h-10 px-5 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] flex items-center gap-1">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className={cn("md:hidden p-2 transition-colors text-white hover:bg-white/10 rounded-lg")}
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-[60] bg-[#0c0c10] p-6 md:hidden border-l border-white/10"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <Link to="/" className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center border border-white/10">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold text-white">Kokorick AI</span>
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-6">
                            {[
                                { name: "Features", path: "/features" },
                                { name: "Pricing", path: "/pricing" },
                                { name: "About", path: "/about" },
                                { name: "Contact", path: "/contact" }
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-lg font-medium text-zinc-300 hover:text-white transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <div className="h-px bg-white/10 my-2" />
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                <span className="block text-lg font-medium text-zinc-400 hover:text-white transition-colors">Sign In</span>
                            </Link>
                            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                                <button className="w-full h-12 bg-white text-black rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors">
                                    Get Started
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
