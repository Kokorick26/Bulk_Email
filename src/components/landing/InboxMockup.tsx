import React from 'react';
import { 
    Inbox, Star, Clock, Send, File, Trash, 
    Search, MoreHorizontal, Reply, Forward,
    Paperclip, Smile, Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function InboxMockup({ className }: { className?: string }) {
    return (
        <div className={cn("w-full max-w-2xl bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-2xl font-body flex h-[500px]", className)}>
            {/* Sidebar */}
            <div className="w-16 border-r border-white/5 bg-[#050505] flex flex-col items-center py-4 gap-4">
                <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center text-white font-bold text-sm">
                    W
                </div>
                <div className="w-full h-[1px] bg-white/5"></div>
                <div className="p-2 rounded-lg bg-white/10 text-white">
                    <Inbox className="w-5 h-5" />
                </div>
                <div className="p-2 rounded-lg text-gray-500 hover:text-white transition-colors">
                    <Star className="w-5 h-5" />
                </div>
                <div className="p-2 rounded-lg text-gray-500 hover:text-white transition-colors">
                    <Send className="w-5 h-5" />
                </div>
                <div className="mt-auto">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink"></div>
                </div>
            </div>

            {/* Email List */}
            <div className="w-64 border-r border-white/5 bg-white/[0.02] flex flex-col">
                <div className="p-3 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full bg-white/5 border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-purple/50"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {[
                        { name: "Sarah Miller", subject: "Re: Partnership Opportunity", time: "10:42 AM", active: true, preview: "That sounds interesting. Let's schedule a call for next Tuesday." },
                        { name: "David Chen", subject: "Question about pricing", time: "Yesterday", active: false, preview: "Hi, I was looking at your enterprise plan and had a few questions." },
                        { name: "Alex Thompson", subject: "Demo Request", time: "Yesterday", active: false, preview: "I'd love to see a demo of the new features you mentioned." },
                        { name: "Marketing Team", subject: "Q2 Campaign Assets", time: "Mon", active: false, preview: "Here are the final assets for the upcoming campaign launch." },
                        { name: "Support", subject: "Ticket #4920 Updated", time: "Mon", active: false, preview: "Your support ticket has been updated. Click here to view." },
                    ].map((email, i) => (
                        <div key={i} className={cn(
                            "p-3 border-b border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors",
                            email.active && "bg-white/[0.04] border-l-2 border-l-brand-purple"
                        )}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={cn("text-xs font-semibold", email.active ? "text-white" : "text-gray-300")}>{email.name}</span>
                                <span className="text-[10px] text-gray-500">{email.time}</span>
                            </div>
                            <div className="text-xs font-medium text-gray-400 truncate mb-1">{email.subject}</div>
                            <div className="text-[10px] text-gray-600 line-clamp-2">{email.preview}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Email View */}
            <div className="flex-1 flex flex-col bg-[#050505]">
                {/* Header */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-purple/20 text-brand-purple flex items-center justify-center text-xs font-bold">
                            SM
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white">Sarah Miller</div>
                            <div className="text-[10px] text-gray-500">VP of Sales at TechCorp</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <button className="p-1.5 hover:bg-white/5 rounded"><Reply className="w-4 h-4" /></button>
                        <button className="p-1.5 hover:bg-white/5 rounded"><Forward className="w-4 h-4" /></button>
                        <button className="p-1.5 hover:bg-white/5 rounded"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="text-lg font-bold text-white mb-4 font-heading">Re: Partnership Opportunity</div>
                    <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                        <p>Hi John,</p>
                        <p>Thanks for reaching out. I've reviewed your proposal and it looks very promising. We've been looking for a solution exactly like this to help scale our outbound efforts.</p>
                        <p className="p-3 border-l-2 border-brand-purple bg-brand-purple/5 text-gray-200 italic">
                            "Warmlo combines powerful campaign management with AI-driven sales research to help you contact the right companies..."
                        </p>
                        <p>That sounds interesting. Let's schedule a call for next Tuesday at 2 PM EST to discuss the details?</p>
                        <p>Best,<br/>Sarah</p>
                    </div>
                </div>

                {/* Reply Box */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                    <div className="border border-white/10 rounded-lg bg-[#050505] overflow-hidden">
                        <div className="p-3 min-h-[80px] text-sm text-gray-400">
                            Sounds great, Sarah! I'll send over a calendar invite...
                        </div>
                        <div className="bg-white/[0.02] p-2 flex items-center justify-between border-t border-white/5">
                            <div className="flex items-center gap-2 text-gray-500">
                                <button className="p-1.5 hover:text-white"><Paperclip className="w-4 h-4" /></button>
                                <button className="p-1.5 hover:text-white"><ImageIcon className="w-4 h-4" /></button>
                                <button className="p-1.5 hover:text-white"><Smile className="w-4 h-4" /></button>
                            </div>
                            <button className="bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-bold px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors">
                                Send <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
