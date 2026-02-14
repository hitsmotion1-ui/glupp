"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-all rounded-glupp disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-glupp-accent text-white hover:bg-glupp-accent/90 active:scale-[0.98]",
      secondary:
        "bg-glupp-card text-glupp-cream border border-glupp-border hover:bg-glupp-card-alt active:scale-[0.98]",
      ghost:
        "text-glupp-text-soft hover:text-glupp-cream hover:bg-glupp-card/50",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
