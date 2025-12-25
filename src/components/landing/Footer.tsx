import { Bot, Twitter, Github, Linkedin, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Footer() {
    const location = useLocation();
    const isDark = location.pathname === "/"; // Only dark on home for now

    return (
        <footer className="relative pt-24 pb-10 overflow-hidden border-t transition-colors duration-300 bg-black border-white/10 text-zinc-400">
            <div className="container px-6 mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight transition-colors text-white">
                                Kokorick <span className="text-zinc-500 font-normal">AI</span>
                            </span>
                        </Link>
                        <p className="mb-6 max-w-sm leading-relaxed text-sm">
                            The AI-powered outreach platform that helps you find, contact, and close your ideal customers on autopilot.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Github, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {[
                        { title: "Product", links: [{ l: "Features", to: "/features" }, { l: "Pricing", to: "/pricing" }, { l: "Changelog", to: "/changelog" }] },
                        { title: "Company", links: [{ l: "About", to: "/about" }, { l: "Contact", to: "/contact" }] },
                        { title: "Legal", links: [{ l: "Privacy", to: "#" }, { l: "Terms", to: "#" }, { l: "Security", to: "#" }] }
                    ].map((col, i) => (
                        <div key={i}>
                            <h3 className="font-bold mb-6 transition-colors text-white">{col.title}</h3>
                            <ul className="space-y-4">
                                {col.links.map((link) => (
                                    <li key={link.l}>
                                        <Link
                                            to={link.to}
                                            className={cn(
                                                "text-sm font-medium transition-colors hover:text-white text-zinc-500",
                                            )}
                                        >
                                            {link.l}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 transition-colors border-white/10">
                    <p className="text-sm">
                        © {new Date().getFullYear()} Kokorick AI Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            All systems operational
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
