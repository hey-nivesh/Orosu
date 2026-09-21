import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "brand" | "outline" | "success" | "warning" | "danger" | "purple";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
  dot = false,
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#F1F1ED] text-[#111111] border-[rgba(17,17,17,0.06)]",
    brand: "bg-[#E11D48]/10 text-[#E11D48] border-[#E11D48]/20",
    outline: "bg-transparent text-[#666666] border-[rgba(17,17,17,0.14)]",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs font-semibold",
    md: "px-3 py-1 text-xs font-bold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border tracking-wide",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
