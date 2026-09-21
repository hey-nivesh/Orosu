"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "dark" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs font-semibold rounded-xl min-h-[36px]",
    md: "px-5 py-2.5 text-sm font-semibold rounded-2xl min-h-[44px]",
    lg: "px-7 py-3.5 text-base font-bold rounded-2xl min-h-[50px]",
  };

  const variantClasses = {
    primary: "gradient-cta text-white shadow-soft",
    secondary: "bg-[#F1F1ED] text-[#111111] hover:bg-[#E8E8E3] border border-[rgba(17,17,17,0.06)]",
    dark: "bg-[#111111] text-white hover:bg-[#222222] shadow-soft",
    outline: "bg-white text-[#111111] border border-[rgba(17,17,17,0.12)] hover:bg-[#F8F8F6]",
    ghost: "bg-transparent text-[#666666] hover:text-[#111111] hover:bg-[#F1F1ED]",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-soft",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
