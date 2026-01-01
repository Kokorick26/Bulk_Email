'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Testimonial {
    text: string;
    name: string;
    role: string;
    image?: string;
}

// Sample testimonials data
export const testimonials: Testimonial[] = [
    {
        text: "The AI personalization is a game changer. We've seen a 3x increase in reply rates since switching from Outreach.",
        name: "Sarah K.",
        role: "Sales Director @ TechFlow",
    },
    {
        text: "Building a sales pipeline used to take hours of manual work. Now it runs on autopilot while I focus on closing deals.",
        name: "James L.",
        role: "Founder @ GrowthLabs",
    },
    {
        text: "The unified inbox saves my team so much time. I don't have to check 10 different email accounts anymore.",
        name: "Emily R.",
        role: "Head of Growth @ ScaleUp",
    },
    {
        text: "We closed $240K in new ARR within the first 2 months of using Warmlo. The ROI is insane.",
        name: "Michael Chen",
        role: "CEO @ DataStack",
    },
    {
        text: "Finally, a tool that actually delivers on its promises. Our SDRs are booking 40% more meetings.",
        name: "Amanda Torres",
        role: "VP Sales @ CloudSync",
    },
    {
        text: "The lead discovery feature alone is worth 10x the price. We found contacts we couldn't find anywhere else.",
        name: "David Park",
        role: "Growth Lead @ Fintech.io",
    },
];

// Testimonial Card Component
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    const initials = testimonial.name.split(' ').map(n => n[0]).join('');

    return (
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 max-w-xs w-full hover:border-brand-orange/30 transition-all duration-300 group">
            {/* Quote Icon */}
            <div className="mb-4">
                <Quote className="w-8 h-8 text-brand-orange/30 group-hover:text-brand-orange/50 transition-colors" />
            </div>

            {/* Testimonial Text */}
            <p className="text-sm text-gray-400 leading-relaxed mb-6">"{testimonial.text}"</p>

            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
                ))}
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                {testimonial.image ? (
                    <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-orange/20"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-brand-pink flex items-center justify-center text-white text-sm font-bold ring-2 ring-brand-orange/20">
                        {initials}
                    </div>
                )}
                <div>
                    <div className="font-semibold text-white text-sm font-heading">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.role}</div>
                </div>
            </div>
        </div>
    );
}

// Animated Testimonials Column
export function TestimonialsColumn({
    testimonials,
    duration = 20,
    className,
    reverse = false,
}: {
    testimonials: Testimonial[];
    duration?: number;
    className?: string;
    reverse?: boolean;
}) {
    return (
        <div className={cn("overflow-hidden", className)}>
            <motion.div
                animate={{
                    translateY: reverse ? "0%" : "-50%",
                }}
                initial={{
                    translateY: reverse ? "-50%" : "0%",
                }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }}
                className="flex flex-col gap-6"
            >
                {/* Duplicate testimonials for seamless loop */}
                {[...testimonials, ...testimonials].map((testimonial, i) => (
                    <TestimonialCard key={i} testimonial={testimonial} />
                ))}
            </motion.div>
        </div>
    );
}

// Main Testimonials Section Component
export default function TestimonialsSection() {
    const col1 = testimonials.slice(0, 3);
    const col2 = testimonials.slice(3, 6);
    const col3 = [...testimonials.slice(0, 2), ...testimonials.slice(4, 6)];

    return (
        <section className="py-32 px-6 bg-[var(--slate-deep)] overflow-hidden relative">
            {/* Background */}
            <div className="absolute inset-0 dot-grid-dark opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--terracotta)]/5 rounded-full blur-[150px]" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <span className="text-label text-[var(--terracotta)] block mb-4">Testimonials</span>
                    <h2 className="text-display-sm text-white mb-6">
                        Loved by fast-growing<br />sales teams
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] max-w-lg mx-auto">
                        Join thousands of sales professionals who've transformed their outbound with Kokorick.
                    </p>
                </motion.div>

                {/* Scrolling Columns */}
                <div className="flex justify-center gap-6 h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
                    <TestimonialsColumn
                        testimonials={col1}
                        duration={25}
                        className="hidden md:flex"
                    />
                    <TestimonialsColumn
                        testimonials={col2}
                        duration={20}
                        reverse
                    />
                    <TestimonialsColumn
                        testimonials={col3}
                        duration={22}
                        className="hidden lg:flex"
                    />
                </div>
            </div>
        </section>
    );
}
