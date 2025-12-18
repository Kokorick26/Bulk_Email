import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ShinyButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
    ({ className, children, variant = 'primary', size = 'md', onClick, disabled, type = 'button' }, ref) => {
        const baseStyles = "relative inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 overflow-hidden group";

        const variants = {
            primary: "bg-white text-black hover:scale-105",
            secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/10",
            outline: "bg-transparent text-white border border-white/20 hover:bg-white/5",
            glass: "bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10"
        };

        const sizes = {
            sm: "px-4 py-2 text-sm",
            md: "px-6 py-2.5 text-base",
            lg: "px-8 py-4 text-lg"
        };

        return (
            <motion.button
                ref={ref}
                type={type}
                onClick={onClick}
                disabled={disabled}
                whileTap={{ scale: 0.98 }}
                className={cn(baseStyles, variants[variant], sizes[size], disabled && "opacity-50 cursor-not-allowed", className)}
            >
                {/* Sheen effect */}
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                    <div className="relative h-full w-8 bg-white/20" />
                </div>
                <span className="relative z-10 flex items-center gap-2">{children}</span>
            </motion.button>
        );
    }
);

ShinyButton.displayName = 'ShinyButton';
