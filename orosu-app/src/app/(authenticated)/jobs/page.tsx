"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Building, Plus, FileText, Calendar } from "lucide-react";
import { useCareer } from "@/lib/store/career-store";
import { formatDate } from "@/lib/utils";

export default function JobsPage() {
  const router = useRouter();
  const { jobs } = useCareer();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="eyebrow text-rose-500">
            <span className="eyebrow-dot" />
            <span>SAVED OPPORTUNITIES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Saved Job Descriptions
          </h2>
          <p className="text-xs sm:text-sm text-[#666666]">
            Target opportunities saved to your Supabase PostgreSQL database.
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

      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => router.push(`/jobs/${job.id}`)}
              className="p-6 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#888888] bg-[#F8F8F6] px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(job.created_at)}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#111111] group-hover:text-rose-600 transition-colors">
                    {job.role || "Target Role"}
                  </h3>
                  <div className="text-xs text-[#666666] font-semibold mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{job.company || "Company not specified"}</span>
                  </div>
                </div>

                <p className="text-xs text-[#777777] line-clamp-3 leading-relaxed">
                  {job.raw_text}
                </p>
              </div>

              <div className="pt-3 border-t border-[rgba(17,17,17,0.06)] flex items-center justify-between text-xs font-bold text-[#111111]">
                <span>View Full JD</span>
                <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-3">
          <FileText className="w-10 h-10 text-[#AAAAAA] mx-auto" />
          <h3 className="text-base font-extrabold text-[#111111]">No saved job descriptions yet</h3>
          <p className="text-xs text-[#666666]">
            Paste a target job posting to save it into your PostgreSQL database.
          </p>
          <Link
            href="/jobs/analyze"
            className="gradient-cta text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-soft inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save a Job</span>
          </Link>
        </div>
      )}
    </div>
  );
}
