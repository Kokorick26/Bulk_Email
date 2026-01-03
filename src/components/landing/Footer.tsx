import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-brand-dark border-t border-white/10 py-12 md:py-20 relative overflow-hidden">
            {/* Background Noise */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            
            <div className="container px-6 mx-auto relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-3 mb-6 group">
                            <div className="w-8 h-8 bg-brand-orange flex items-center justify-center text-white font-heading font-bold text-lg group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-brand-orange/20">
                                W
                            </div>
                            <span className="font-heading font-bold text-xl text-white tracking-tight">WARMLO</span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed font-mono">
                            The only outbound platform that researches before it reaches.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-heading font-bold text-white mb-6 text-sm uppercase tracking-wider">Product</h4>
                        <ul className="space-y-3 text-sm text-gray-500 font-mono">
                            <li><a href="#" className="hover:text-brand-orange transition-colors">Campaigns</a></li>
                            <li><a href="#" className="hover:text-brand-orange transition-colors">AI Research</a></li>
                            <li><a href="#" className="hover:text-brand-orange transition-colors">Pricing</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold text-white mb-6 text-sm uppercase tracking-wider">Company</h4>
                        <ul className="space-y-3 text-sm text-gray-500 font-mono">
                            <li><a href="#" className="hover:text-brand-orange transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-brand-orange transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-brand-orange transition-colors">Careers</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold text-white mb-6 text-sm uppercase tracking-wider">Legal</h4>
                        <ul className="space-y-3 text-sm text-gray-500 font-mono">
                            <li><a href="#" className="hover:text-brand-orange transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-brand-orange transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>
                
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-xs font-mono uppercase tracking-wider">
                        © {new Date().getFullYear()} Warmlo Inc. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        {/* Social Icons could go here */}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
