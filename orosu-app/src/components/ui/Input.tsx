"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#666666]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full bg-white border border-[rgba(17,17,17,0.12)] text-[#111111] text-sm rounded-2xl px-4 py-3 min-h-[46px] transition-all placeholder:text-[#999999] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 disabled:bg-[#F8F8F6] disabled:cursor-not-allowed",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-[#666666]">{rightIcon}</div>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[#666666]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full bg-white border border-[rgba(17,17,17,0.12)] text-[#111111] text-sm rounded-2xl p-4 min-h-[120px] transition-all placeholder:text-[#999999] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 disabled:bg-[#F8F8F6] disabled:cursor-not-allowed resize-y",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[#666666]">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
