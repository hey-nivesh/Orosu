"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, profile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await signIn(email.trim(), password);

      if (authError) {
        setError(authError.message || "Invalid login credentials.");
        setIsLoading(false);
        return;
      }

      // Check onboarding completion redirect
      if (profile && profile.onboarding_completed) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-center">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl sm:rounded-[2.5rem] border border-[rgba(17,17,17,0.08)] shadow-2xl overflow-hidden min-h-[640px]">
          {/* Left Brand Visual */}
          <div className="lg:col-span-5 bg-[#111111] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-gradient-to-tr from-[#7E22CE]/30 via-[#E11D48]/30 to-[#F97316]/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#E11D48]/20 to-[#F97316]/20 blur-3xl pointer-events-none" />

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

            <div className="my-8 relative z-10 space-y-6">
              <div className="eyebrow text-rose-400">
                <span className="eyebrow-dot" />
                <span>STRUCTURED CAREER WORKSPACE</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] text-white">
                Your job search,
                <br />
                <span className="gradient-text">without the busywork.</span>
              </h2>

              <p className="text-sm text-[#AAAAAA] leading-relaxed max-w-sm">
                One structured Master Profile. Parse your resume deterministically and organize target job descriptions.
              </p>

              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-2xl space-y-2.5 animate-float">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    Structured Profile Engine
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">
                    Real Database
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-3/4 rounded-full bg-white/20" />
                  <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500" />
                  <div className="h-1.5 w-1/2 rounded-full bg-white/10" />
                </div>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-[#888888]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Real Supabase PostgreSQL storage with RLS.</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 text-[11px] text-[#666666]">
              Protected by Supabase Auth session tokens.
            </div>
          </div>

          {/* Right Login Form */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-sm text-[#666666] mt-1">
                  Continue where you left off.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Google Sign-in Button */}
              <button
                type="button"
                onClick={async () => {
                  setError("");
                  setIsLoading(true);
                  const { error: googleErr } = await signInWithGoogle("/dashboard");
                  if (googleErr) {
                    setError(googleErr.message || "Failed to initiate Google sign in.");
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
                <span className="text-sm font-semibold">Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[rgba(17,17,17,0.1)] w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#888888] uppercase tracking-wider shrink-0">
                  or continue with email
                </span>
                <div className="border-t border-[rgba(17,17,17,0.1)] w-full" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Email address
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

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold text-[#E11D48] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 pr-11 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 transition-all placeholder:text-[#999999]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-[#888888] hover:text-[#111111] p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gradient-cta text-white font-bold py-3.5 px-6 rounded-2xl text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Log in</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Signup Link */}
              <div className="text-center pt-2">
                <span className="text-xs text-[#666666]">Don&apos;t have an account? </span>
                <Link
                  href="/signup"
                  className="text-xs font-bold text-[#E11D48] hover:underline"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
