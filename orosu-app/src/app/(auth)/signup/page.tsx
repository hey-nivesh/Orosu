"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please complete all required fields.");
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
      const { error: authError } = await signUp(fullName.trim(), email.trim(), password);

      if (authError) {
        setError(authError.message || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during signup.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-center">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl sm:rounded-[2.5rem] border border-[rgba(17,17,17,0.08)] shadow-2xl overflow-hidden min-h-[660px]">
          {/* Left Brand Visual */}
          <div className="lg:col-span-5 bg-[#111111] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-gradient-to-tr from-[#7E22CE]/30 via-[#E11D48]/30 to-[#F97316]/30 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <Link href="/" className="flex items-center gap-3 inline-flex">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E11D48] via-[#FB7185] to-[#F97316] flex items-center justify-center p-1.5 shadow-glow">
                  <Image
                    src="/logo.png"
                    alt="Orosu Logo"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white">OROSU</span>
              </Link>
            </div>

            <div className="my-8 relative z-10 space-y-5">
              <div className="eyebrow text-rose-400">
                <span className="eyebrow-dot" />
                <span>PHASE 1 — ONBOARDING</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15] text-white">
                Build your
                <br />
                <span className="gradient-text">career profile.</span>
              </h2>

              <p className="text-sm text-[#AAAAAA] leading-relaxed">
                Create your Orosu profile once. Parse your resume into a structured format and organize your job search.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-[#CCCCCC]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Parse PDF and DOCX resumes deterministically</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#CCCCCC]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive review of extracted experience &amp; skills</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#CCCCCC]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Save target job descriptions with clean tracking</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 text-[11px] text-[#666666]">
              Secured by Supabase Auth with Row Level Security.
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  Create your account
                </h2>
                <p className="text-sm text-[#666666] mt-1">
                  Start structuring your career workspace.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Google Sign-up Button */}
              <button
                type="button"
                onClick={async () => {
                  setError("");
                  setIsLoading(true);
                  const { error: googleErr } = await signInWithGoogle("/onboarding");
                  if (googleErr) {
                    setError(googleErr.message || "Failed to initiate Google sign up.");
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full bg-white hover:bg-[#F8F8F6] text-[#111111] font-bold py-3 px-4 rounded-2xl border border-[rgba(17,17,17,0.12)] shadow-sm flex items-center justify-center gap-3 transition-all hover:shadow-md cursor-pointer disabled:opacity-50 min-h-[48px]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm font-semibold">Sign up with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[rgba(17,17,17,0.1)] w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#888888] uppercase tracking-wider shrink-0">
                  or sign up with email
                </span>
                <div className="border-t border-[rgba(17,17,17,0.1)] w-full" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 transition-all placeholder:text-[#999999]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Work or personal email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 transition-all placeholder:text-[#999999]"
                  />
                </div>

                {/* Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 chars"
                        className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 pr-10 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 transition-all placeholder:text-[#999999]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[#888888] hover:text-[#111111]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Confirm
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
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gradient-cta text-white font-bold py-3.5 px-6 rounded-2xl text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>Creating workspace...</span>
                  ) : (
                    <>
                      <span>Create account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs text-[#666666]">Already have an account? </span>
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#E11D48] hover:underline"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
