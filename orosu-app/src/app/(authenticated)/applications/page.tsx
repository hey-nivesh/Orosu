"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useCareer } from "@/lib/store/career-store";
import { formatDate } from "@/lib/utils";

export default function ApplicationsPage() {
  const router = useRouter();
  const { jobs, deleteJobDescription } = useCareer();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    return (
      (job.company && job.company.toLowerCase().includes(q)) ||
      (job.role && job.role.toLowerCase().includes(q)) ||
      job.raw_text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="eyebrow text-rose-500">
            <span className="eyebrow-dot" />
            <span>OPPORTUNITY PIPELINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Target Job Opportunities
          </h2>
          <p className="text-xs sm:text-sm text-[#666666]">
            Every target job description you save in Orosu is stored and grounded in your workspace.
          </p>
        </div>

        <Link
          href="/jobs/analyze"
          className="gradient-cta text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-soft inline-flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Save New Job</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96 flex items-center">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search saved target roles or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.08)] text-xs rounded-xl pl-10 pr-4 py-2.5 min-h-[42px] focus:outline-none focus:border-[#E11D48] text-[#111111]"
          />
        </div>

        <div className="text-xs font-semibold text-[#777777]">
          <span>{filteredJobs.length} target opportunities recorded</span>
        </div>
      </div>

      {/* Real Jobs Table / Desktop */}
      <div className="hidden md:block bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[rgba(17,17,17,0.08)] bg-[#F8F8F6]/50 text-[#888888] uppercase tracking-wider">
              <th className="py-3.5 px-6 font-bold">Company &amp; Target Role</th>
              <th className="py-3.5 px-4 font-bold">JD Text Preview</th>
              <th className="py-3.5 px-4 font-bold">Saved Date</th>
              <th className="py-3.5 px-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(17,17,17,0.04)]">
            {filteredJobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-[#F8F8F6] transition-colors group cursor-pointer"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center font-extrabold text-xs">
                      {(job.company && job.company[0]) || "J"}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-[#111111] group-hover:text-rose-600 transition-colors">
                        {job.role || "Target Role"}
                      </div>
                      <div className="text-[11px] text-[#666666]">{job.company || "Target Company"}</div>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4 text-[#666666] max-w-xs truncate">
                  {job.raw_text.slice(0, 100)}...
                </td>

                <td className="py-4 px-4 text-[#666666] font-medium">
                  {formatDate(job.created_at)}
                </td>

                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-[#F8F8F6] hover:bg-[#111111] hover:text-white text-[#111111] font-bold text-xs transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredJobs.length === 0 && (
          <div className="p-12 text-center text-xs text-[#888888] space-y-3">
            <Briefcase className="w-8 h-8 text-[#AAAAAA] mx-auto" />
            <p className="font-bold text-[#111111]">No target job descriptions saved yet</p>
            <p>Paste your first job description to save it into your workspace.</p>
            <Link
              href="/jobs/analyze"
              className="gradient-cta text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm mt-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Paste Job Description</span>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="p-5 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                  {(job.company && job.company[0]) || "J"}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-[#111111]">{job.role || "Target Role"}</div>
                  <div className="text-xs text-[#666666]">{job.company || "Target Company"}</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#666666] line-clamp-2">{job.raw_text}</p>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[rgba(17,17,17,0.06)]">
              <span className="text-[#888888]">{formatDate(job.created_at)}</span>
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
