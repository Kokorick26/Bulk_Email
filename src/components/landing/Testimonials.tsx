import { Star } from "lucide-react";
import Marquee from "@/components/ui/Marquee"; // Assuming reuse of existing Marquee

const testimonials = [
    {
        name: "Alex Rivera",
        role: "Head of Sales, TechFlow",
        content: "Kokorick AI doubled our meeting booking rate in the first month. The personalization is scary good.",
        avatar: "AR"
    },
    {
        name: "Sarah Chen",
        role: "Founder, GrowthLabs",
        content: "Finally an outreach tool that doesn't feel like spam. Our domain reputation has never been better.",
        avatar: "SC"
    },
    {
        name: "Michael Ross",
        role: "VP Marketing, Sscale",
        content: "The unified inbox saves my team 10+ hours a week. No more tab switching between accounts.",
        avatar: "MR"
    },
    {
        name: "Emily Watson",
        role: "Director, CloudNine",
        content: "Set it up in 15 minutes. The AI lead discovery found prospects we missed for years.",
        avatar: "EW"
    },
    {
        name: "David Kim",
        role: "Sales Ops, FintechCo",
        content: "We replaced three different tools with Kokorick. It's the only platform we need now.",
        avatar: "DK"
    }
];

const TestimonialCard = ({ name, role, content, avatar }: { name: string; role: string; content: string; avatar: string }) => (
    <div className="w-[350px] p-6 mx-4 rounded-2xl bg-[#0A0A0A] border border-white/10 hover:border-violet-500/30 transition-colors">
        <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-violet-500 text-violet-500" />
            ))}
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">"{content}"</p>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/5 flex items-center justify-center font-bold text-violet-300">
                {avatar}
            </div>
            <div>
                <div className="font-semibold text-white">{name}</div>
                <div className="text-xs text-gray-500">{role}</div>
            </div>
        </div>
    </div>
);

export default function Testimonials() {
    return (
        <section className="py-24 bg-black overflow-hidden">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-4">
                    Loved by Growth Teams
                </h2>
                <p className="text-gray-500">Join thousands of happy customers scaling their sales</p>
            </div>

            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

                <Marquee pauseOnHover className="[--duration:40s]">
                    {testimonials.map((t, i) => (
                        <TestimonialCard key={i} {...t} />
                    ))}
                </Marquee>

                <div className="mt-8">
                    <Marquee reverse pauseOnHover className="[--duration:40s]">
                        {testimonials.map((t, i) => (
                            <TestimonialCard key={i} {...t} />
                        ))}
                    </Marquee>
                </div>
            </div>
        </section>
    );
}
