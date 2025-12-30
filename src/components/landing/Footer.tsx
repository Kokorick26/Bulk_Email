import { Bot, Twitter, Github, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
    product: [
        { label: "Features", to: "/features" },
        { label: "Pricing", to: "/pricing" },
        { label: "Changelog", to: "/changelog" },
        { label: "Roadmap", to: "#" }
    ],
    company: [
        { label: "About", to: "/about" },
        { label: "Blog", to: "#" },
        { label: "Careers", to: "#" },
        { label: "Contact", to: "/contact" }
    ],
    legal: [
        { label: "Privacy Policy", to: "#" },
        { label: "Terms of Service", to: "#" },
        { label: "Security", to: "#" },
        { label: "GDPR", to: "#" }
    ]
};

const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" }
];

export default function Footer() {
    return (
        <footer className="relative pt-24 pb-8 overflow-hidden bg-[var(--slate-deep)] border-t border-white/5">
            {/* Background Effects */}
            <div className="absolute inset-0 dot-grid-dark opacity-20" />
            <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-gradient-to-tr from-[var(--terracotta)]/5 to-transparent pointer-events-none" />

            <div className="container-editorial relative z-10">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-3 mb-6 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[var(--terracotta)] blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] flex items-center justify-center shadow-lg ring-1 ring-white/10">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                                Kokorick <span className="text-[var(--text-muted)] font-normal">AI</span>
                            </span>
                        </Link>
                        <p className="text-[var(--text-secondary)] mb-8 max-w-sm leading-relaxed text-sm">
                            The AI-powered outreach platform that helps you discover, engage, and convert your ideal customers on autopilot.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 hover:border-white/10 transition-all"
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-6 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                            Product
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.to}
                                        className="text-sm text-[var(--text-muted)] hover:text-white transition-colors inline-flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-6 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                            Company
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.to}
                                        className="text-sm text-[var(--text-muted)] hover:text-white transition-colors inline-flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-6 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                            Legal
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.to}
                                        className="text-sm text-[var(--text-muted)] hover:text-white transition-colors inline-flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-semibold text-white mb-6 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                            Stay Updated
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">
                            Get product updates and tips straight to your inbox.
                        </p>
                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter email"
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--terracotta)] focus:ring-2 focus:ring-[var(--terracotta)]/20 transition-all"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2.5 bg-[var(--terracotta)] text-white rounded-xl font-medium text-sm hover:bg-[var(--terracotta-dark)] transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-[var(--text-muted)]">
                        © {new Date().getFullYear()} Kokorick AI Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            All systems operational
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
