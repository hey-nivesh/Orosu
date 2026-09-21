"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Building,
  CheckCircle2,
  Lock,
  Download,
  Calendar,
  ArrowRight,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";
import { useCareer } from "@/lib/store/career-store";
import { useAuth } from "@/lib/auth/auth-context";
import { tailorApi } from "@/lib/api/client";
import { ResumeVersionRecord } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ResumesLibraryPage() {
  const { experiences, skills, projects, careerProfile } = useCareer();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"tailored" | "master">("tailored");
  const [versions, setVersions] = useState<ResumeVersionRecord[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const displayName = profile?.full_name || "Orosu Candidate";
  const headline = careerProfile?.professional_headline || careerProfile?.target_role || "Software Engineer";

  useEffect(() => {
    tailorApi
      .getVersions()
      .then((data) => {
        setVersions(data || []);
        setIsLoadingVersions(false);
      })
      .catch((err) => {
        console.error("Failed to load versions:", err);
        setIsLoadingVersions(false);
      });
  }, []);

  const handleDeleteVersion = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this tailored resume version?")) {
      try {
        await tailorApi.deleteVersion(id);
        setVersions((prev) => prev.filter((v) => v.id !== id));
      } catch (err: any) {
        alert("Failed to delete version: " + err.message);
      }
    }
  };

  const handleDownloadVersion = async (ver: ResumeVersionRecord, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloadingId(ver.id);
    try {
      const candidateName = ver.tailored_resume_json?.basics?.name || "Candidate";
      const role = ver.target_role || "Resume";
      const company = ver.target_company || "";
      const filename = `${candidateName}_${company}_${role}.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      await tailorApi.downloadPdf(ver.id, filename);
    } catch (err: any) {
      alert("Failed to download PDF: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="eyebrow text-rose-500">
            <span className="eyebrow-dot" />
            <span>VERSION ARCHIVE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Resume Library
          </h2>
          <p className="text-xs sm:text-sm text-[#666666]">
            Every tailored resume is an immutable version grounded in your Master Career Profile.
          </p>
        </div>

        <Link
          href="/jobs/analyze"
          className="gradient-cta text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-soft inline-flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Tailor For New Job</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[rgba(17,17,17,0.08)] pb-3">
        <button
          onClick={() => setActiveTab("tailored")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "tailored"
              ? "bg-[#111111] text-white shadow-sm"
              : "text-[#666666] hover:text-[#111111] hover:bg-white"
          }`}
        >
          Tailored Resumes ({versions.length})
        </button>

        <button
          onClick={() => setActiveTab("master")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "master"
              ? "bg-[#111111] text-white shadow-sm"
              : "text-[#666666] hover:text-[#111111] hover:bg-white"
          }`}
        >
          Master Baseline Resume (Canonical)
        </button>
      </div>

      {/* Tab 1: Tailored Resumes List */}
      {activeTab === "tailored" && (
        <div className="space-y-4">
          {isLoadingVersions ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)]">
              <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-[#666666]">Loading tailored resume versions...</p>
            </div>
          ) : versions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="bg-white p-6 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase">
                        Version {ver.version_number}
                      </span>
                      <span className="text-xs text-[#888888] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(ver.created_at)}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#111111]">{ver.title}</h3>
                    <div className="text-xs text-[#666666] flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-[#888888]" />
                      <span>{ver.target_company || "Target Company"}</span>
                      <span>•</span>
                      <span>{ver.target_role || "Role"}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[rgba(17,17,17,0.06)] flex items-center justify-between">
                    <Link
                      href={`/resumes/${ver.id}`}
                      className="text-xs font-bold text-[#E11D48] hover:underline inline-flex items-center gap-1.5"
                    >
                      <span>View Tailored Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDownloadVersion(ver, e)}
                        disabled={downloadingId === ver.id}
                        className="p-2 rounded-xl bg-[#F8F8F6] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        {downloadingId === ver.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDeleteVersion(ver.id, e)}
                        className="p-2 rounded-xl text-[#888888] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Version"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#111111]">No tailored resumes yet</h3>
                <p className="text-xs text-[#666666] mt-1">
                  Submit or select a target job description to generate an evidence-grounded tailored resume.
                </p>
              </div>
              <Link
                href="/jobs/analyze"
                className="gradient-cta text-white font-bold px-6 py-2.5 rounded-2xl text-xs inline-flex items-center gap-1.5 shadow-soft"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tailor First Resume</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Master Resume Baseline */}
      {activeTab === "master" && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6 max-w-4xl">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-extrabold text-xs">
                Master Baseline Profile
              </span>
              <h3 className="text-2xl font-black text-[#111111] mt-2">{displayName}</h3>
              <p className="text-xs text-[#666666] mt-0.5">{headline}</p>
            </div>

            <Link
              href="/profile"
              className="px-4 py-2 rounded-2xl border border-[rgba(17,17,17,0.12)] text-xs font-bold text-[#111111] hover:bg-[#F8F8F6] transition-colors"
            >
              Edit Master Profile
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] text-xs text-[#666666] leading-relaxed">
            🛡️ <strong>Master Safety Rule:</strong> Orosu never overwrites your Master Resume when tailoring for specific job descriptions. All changes are generated into versioned copies.
          </div>

          {/* Experience Section */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] border-b border-[#EEEEEE] pb-1">
              Work Experience ({experiences.length})
            </h4>

            {experiences.map((exp) => (
              <div key={exp.id} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-extrabold text-[#111111]">
                  <span>{exp.role} — {exp.company}</span>
                  <span className="text-[11px] text-[#666666] font-semibold">
                    {exp.startDate || exp.start_date} – {exp.isCurrent || exp.is_current ? "Present" : exp.endDate || exp.end_date}
                  </span>
                </div>

                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="space-y-1.5 text-[#333333] list-disc list-outside pl-4">
                    {exp.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Skills Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] border-b border-[#EEEEEE] pb-1">
              Technical Skills ({skills.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-2.5 py-1 rounded-xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.08)] text-xs font-bold text-[#111111]"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
