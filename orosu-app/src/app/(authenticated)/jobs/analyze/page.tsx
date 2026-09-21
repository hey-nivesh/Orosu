"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useCareer } from "@/lib/store/career-store";

export default function JobInputPage() {
  const router = useRouter();
  const { saveJobDescription } = useCareer();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [rawText, setRawText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsSaving(true);
    setError("");

    try {
      const savedJob = await saveJobDescription({
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        raw_text: rawText.trim(),
      });

      router.push(`/jobs/${savedJob.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to save job description.");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft">
        <div className="eyebrow text-rose-500 mb-1">
          <span className="eyebrow-dot" />
          <span>JOB DESCRIPTION INPUT</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
          Analyze a new job
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] mt-1 max-w-2xl">
          Paste the target job description to save it to your PostgreSQL database.
        </p>
      </div>

      {/* Main Form */}
      <div className="max-w-3xl bg-white p-6 sm:p-8 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                Company (Optional)
              </label>
              <div className="relative flex items-center">
                <Building className="w-4 h-4 text-[#888888] absolute left-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl pl-10 pr-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                Target Role (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
              Job Description *
            </label>
            <textarea
              required
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl p-4 min-h-[300px] focus:outline-none focus:border-[#E11D48] leading-relaxed transition-all placeholder:text-[#999999]"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] flex items-center justify-between text-xs text-[#666666]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Job descriptions are stored securely in Supabase PostgreSQL with RLS.</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!rawText.trim() || isSaving}
              className="gradient-cta text-white font-bold py-3.5 px-8 rounded-2xl text-xs sm:text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving to database...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
