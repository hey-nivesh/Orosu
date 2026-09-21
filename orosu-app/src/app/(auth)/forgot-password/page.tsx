"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError("");

    try {
      const { error: resetError } = await resetPassword(email.trim());
      if (resetError) {
        setError(resetError.message || "Failed to send reset instructions.");
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-center p-4 sm:p-6">
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-2xl p-8 sm:p-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-[#666666] hover:text-[#111111]">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to log in</span>
          </Link>

          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E11D48] to-[#F97316] flex items-center justify-center p-1">
            <Image src="/logo.png" alt="Orosu Logo" width={20} height={20} className="w-full h-full object-contain" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-[#111111] tracking-tight">Reset password</h2>
          <p className="text-xs text-[#666666] mt-1">
            Enter your email address and we will send you a secure password reset link.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Password reset link dispatched</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              We&apos;ve sent an email to <strong>{email}</strong>. Check your inbox and follow the secure link to update your password.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 hover:underline"
              >
                <span>Return to log in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#888888] absolute left-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl pl-10 pr-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 transition-all placeholder:text-[#999999]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-cta text-white font-bold py-3.5 px-6 rounded-2xl text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? <span>Sending link...</span> : <span>Send reset link</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
