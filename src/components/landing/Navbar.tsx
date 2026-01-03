import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navBackground = useTransform(
        scrollY,
        [0, 50],
        ['rgba(5, 5, 5, 0)', 'rgba(5, 5, 5, 0.8)']
    );

    const navBackdrop = useTransform(
        scrollY,
        [0, 50],
        ['blur(0px)', 'blur(16px)']
    );

    const navBorder = useTransform(
        scrollY,
        [0, 50],
        ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.08)']
    );

    const navHeight = useTransform(
        scrollY,
        [0, 50],
        ['96px', '72px']
    );

    return (
        <motion.nav
            style={{
                backgroundColor: navBackground,
                backdropFilter: navBackdrop,
                borderBottom: `1px solid`,
                borderColor: navBorder,
                height: navHeight
            }}
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex items-center"
        >
            <div className="max-w-7xl w-full mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <img src="/logo.png" alt="Warmlo" className="w-10 h-10 rounded-lg group-hover:scale-105 transition-transform duration-300" />
                    <span className="font-heading font-bold text-xl text-white tracking-tight group-hover:text-brand-orange transition-colors duration-300">WARMLO</span>
                </Link>

                <div className="hidden md:flex items-center gap-10">
                    {['Features', 'About', 'Pricing'].map((item) => (
                        <Link
                            key={item}
                            to={`/${item.toLowerCase()}`}
                            className="relative text-sm font-mono uppercase tracking-wider text-gray-400 hover:text-white transition-colors group py-2"
                        >
                            {item}
                            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-brand-orange group-hover:w-full transition-all duration-300"></span>
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    <Link to="/login" className="text-sm font-mono uppercase tracking-wider text-white hover:text-brand-orange transition-colors">
                        Login
                    </Link>
                    <Link to="/login">
                        <Button className="group relative overflow-hidden bg-white text-black hover:text-white font-bold rounded-lg px-6 h-10 uppercase tracking-wide transition-all duration-300 border border-transparent hover:border-brand-orange/50">
                            <span className="relative z-10 flex items-center gap-2">
                                Get Started
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-brand-orange translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
