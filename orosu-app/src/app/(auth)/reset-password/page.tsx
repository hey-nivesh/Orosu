"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(updateError.message || "Failed to reset password.");
      } else {
        setIsSuccess(true);
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
          <h2 className="text-2xl font-extrabold text-[#111111] tracking-tight">Set new password</h2>
          <p className="text-xs text-[#666666] mt-1">
            Create a strong, secure password for your Orosu account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Password successfully updated</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your credentials have been updated. You can now log into your workspace.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full gradient-cta text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2"
            >
              <span>Go to log in</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                New password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 pr-10 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 transition-all placeholder:text-[#999999]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#888888] hover:text-[#111111]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                Confirm new password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 transition-all placeholder:text-[#999999]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-cta text-white font-bold py-3.5 px-6 rounded-2xl text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? <span>Updating password...</span> : <span>Update password</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
