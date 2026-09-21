"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  FileText,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Building,
  Target,
  Plus,
  Clock,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCareer } from "@/lib/store/career-store";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { experiences, projects, skills, jobs, saveJobDescription } = useCareer();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [rawText, setRawText] = useState("");
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [jobError, setJobError] = useState("");

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsSavingJob(true);
    setJobError("");

    try {
      const saved = await saveJobDescription({
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        raw_text: rawText.trim(),
      });

      router.push(`/jobs/${saved.id}`);
    } catch (err: any) {
      setJobError(err.message || "Failed to save job description.");
    } finally {
      setIsSavingJob(false);
    }
  };

  const displayName = profile?.full_name || "there";
  const completionScore = profile?.profile_completion || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative p-6 sm:p-8 lg:p-10 rounded-3xl sm:rounded-[2rem] bg-[#111111] text-white border border-white/10 shadow-2xl overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-bl from-[#E11D48]/25 via-[#7E22CE]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-gradient-to-tr from-[#F97316]/20 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="eyebrow text-rose-400">
              <span className="eyebrow-dot" />
              <span>CAREER WORKSPACE — PHASE 1</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Welcome, <span className="gradient-text">{displayName}</span>.
            </h2>

            <p className="text-sm sm:text-base text-[#AAAAAA] max-w-lg leading-relaxed">
              Your Master Career Profile is active. You can save target job descriptions and manage your structured career data.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/jobs/analyze"
                className="gradient-cta px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-soft inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Save a new job</span>
              </Link>

              <Link
                href="/profile"
                className="bg-white/10 hover:bg-white/15 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold border border-white/10 transition-all inline-flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-[#AAAAAA]" />
                <span>View career profile</span>
              </Link>
            </div>
          </div>

          {/* Profile Status Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm p-5 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#E11D48] to-[#F97316] flex items-center justify-center text-[10px] font-extrabold text-white">
                    O
                  </div>
                  <span className="text-xs font-bold text-white">Master Career Profile</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">
                  PostgreSQL
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#CCCCCC]">
                  <span>User:</span>
                  <strong className="text-white truncate max-w-[170px]">{displayName}</strong>
                </div>
                <div className="flex items-center justify-between text-[#CCCCCC]">
                  <span>Completeness:</span>
                  <strong className="text-rose-400">{completionScore}%</strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7E22CE] via-[#E11D48] to-[#F97316]"
                  style={{ width: `${completionScore}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-[#888888]">
                <span>
                  {experiences.length} positions • {skills.length} skills
                </span>
                <Link href="/profile" className="text-rose-400 font-bold hover:underline">
                  Manage →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Link
          href="/profile"
          className="p-5 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-[#666666] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Profile Strength</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111111]">{completionScore}%</div>
          <div className="text-xs font-semibold text-emerald-600 mt-1">
            {completionScore >= 80 ? "Structured & ready" : "Add more profile items"}
          </div>
        </Link>

        {/* Metric 2 */}
        <Link
          href="/profile"
          className="p-5 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-[#666666] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Experience</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111111]">{experiences.length}</div>
          <div className="text-xs font-semibold text-[#666666] mt-1">
            {experiences.length === 1 ? "1 position recorded" : `${experiences.length} positions recorded`}
          </div>
        </Link>

        {/* Metric 3 */}
        <Link
          href="/profile"
          className="p-5 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-[#666666] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Skills &amp; Projects</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111111]">{skills.length}</div>
          <div className="text-xs font-semibold text-[#666666] mt-1">
            {projects.length} featured {projects.length === 1 ? "project" : "projects"}
          </div>
        </Link>

        {/* Metric 4 */}
        <Link
          href="/jobs"
          className="p-5 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-[#666666] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Saved Jobs</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111111]">{jobs.length}</div>
          <div className="text-xs font-semibold text-[#666666] mt-1">
            {jobs.length === 1 ? "1 job saved" : `${jobs.length} jobs saved`}
          </div>
        </Link>
      </div>

      {/* Quick Job Storage Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow text-rose-500 mb-1">
              <span className="eyebrow-dot" />
              <span>JOB DESCRIPTION STORAGE</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
              Save a new job description
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
              Paste target job requirements to organize your search. (AI analysis &amp; tailoring coming in Phase 2).
            </p>
          </div>
        </div>

        {jobError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
            {jobError}
          </div>
        )}

        <form onSubmit={handleSaveJob} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Company name (optional, e.g. Stripe)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48]"
            />
            <input
              type="text"
              placeholder="Target role (optional, e.g. Senior Frontend Engineer)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48]"
            />
          </div>

          <textarea
            required
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste the job description, responsibilities, or qualifications here..."
            className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl p-4 min-h-[140px] focus:outline-none focus:border-[#E11D48] transition-all placeholder:text-[#999999]"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs text-[#888888] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Saves directly to your Supabase PostgreSQL database</span>
            </div>

            <button
              type="submit"
              disabled={!rawText.trim() || isSavingJob}
              className="w-full sm:w-auto gradient-cta text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm min-h-[46px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSavingJob ? (
                <span>Saving to database...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save job description</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Saved Job Descriptions Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow text-rose-500 mb-1">
              <span className="eyebrow-dot" />
              <span>SAVED TARGETS</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#111111] tracking-tight">
              Recent Job Descriptions
            </h3>
          </div>

          <Link
            href="/jobs"
            className="text-xs font-bold text-[#E11D48] hover:underline flex items-center gap-1"
          >
            <span>View all ({jobs.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] hover:border-[rgba(17,17,17,0.15)] cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-[#111111] group-hover:text-rose-600 transition-colors truncate">
                      {job.role || "Target Opportunity"}
                    </div>
                    <div className="text-[11px] text-[#666666]">
                      {job.company || "Company not specified"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-[#888888]">{formatDate(job.created_at)}</span>
                  <ArrowRight className="w-4 h-4 text-[#AAAAAA] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#F8F8F6] rounded-2xl border border-[rgba(17,17,17,0.04)] space-y-2">
            <FileText className="w-8 h-8 text-[#AAAAAA] mx-auto" />
            <h4 className="text-xs font-bold text-[#111111]">No saved job descriptions yet</h4>
            <p className="text-[11px] text-[#666666]">
              Paste your first target job description in the form above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
