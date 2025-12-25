import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
    {
        question: "How does the AI personalization work?",
        answer: "Our AI agents analyze your prospect's LinkedIn profile, company website, and recent news to create highly relevant, personalized openers and email content that sounds like it was written by a human researcher."
    },
    {
        question: "Is my email account safe from being blacklisted?",
        answer: "Yes. We use advanced warm-up algorithms and inbox rotation to ensure your sending volume stays within safe limits. We strictly adhere to daily sending caps and ramp up volume gradually."
    },
    {
        question: "Can I connect multiple email accounts?",
        answer: "Absolutely. You can connect unlimited email accounts (Gmail, Outlook, SMTP) to scale your outreach volume while keeping per-account volume low for safety."
    },
    {
        question: "Do you provide the leads or do I need to bring my own?",
        answer: "Both! You can bring your own lists, or use our built-in B2B database of over 10M+ verified contacts to find your perfect customers."
    },
    {
        question: "What happens if I exceed my plan limits?",
        answer: "We'll notify you before you hit your limit. You can easily upgrade your plan or purchase add-on credits for additional leads or warm-up slots."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 px-6 bg-black border-t border-white/5">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-zinc-400">Everything you need to know about Kokorick AI</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl border transition-all duration-200 ${openIndex === i
                                ? "bg-[#0c0c10] border-violet-500/50 shadow-[0_0_30px_-5px_rgba(139,92,246,0.1)]"
                                : "bg-transparent border-white/5 hover:bg-white/5"
                                }`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <span className={`font-medium text-lg ${openIndex === i ? "text-violet-200" : "text-zinc-300"}`}>
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openIndex === i ? "rotate-180 text-violet-400" : ""
                                        }`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 text-zinc-400 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
