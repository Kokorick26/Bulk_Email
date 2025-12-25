import React from 'react';
import { cn } from '@/lib/utils';
import { Search, Star, Mail } from 'lucide-react';

// Compact Inbox mockup that fits inside a feature card
export default function InboxMockup({ className }: { className?: string }) {
    const emails = [
        { sender: "Alex from Stripe", subject: "Re: Partnership", color: "bg-indigo-500", unread: true },
        { sender: "Vanessa Wu", subject: "Demo Request", color: "bg-emerald-500", unread: true },
        { sender: "David Miller", subject: "Contract signed", color: "bg-amber-500", unread: false },
    ];

    return (
        <div className={cn("w-full max-w-xs bg-[#0c0c10]/80 border border-white/10 rounded-xl overflow-hidden shadow-xl backdrop-blur-md", className)}>
            {/* Mini Header */}
            <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/[0.02]">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-white">All Inboxes</span>
                <span className="ml-auto text-[10px] text-zinc-500">3 unread</span>
            </div>

            {/* Mini Email List */}
            <div className="divide-y divide-white/5">
                {emails.map((email, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 hover:bg-white/[0.02] transition-colors">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white", email.color)}>
                            {email.sender.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={cn("text-xs truncate", email.unread ? "text-white font-medium" : "text-zinc-400")}>{email.sender}</div>
                            <div className="text-[10px] text-zinc-600 truncate">{email.subject}</div>
                        </div>
                        {email.unread && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
