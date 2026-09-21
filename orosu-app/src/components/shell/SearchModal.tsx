"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, FileText, User, Sparkles, X, ArrowRight } from "lucide-react";
import { useCareer } from "@/lib/store/career-store";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { jobs, experiences, skills, projects } = useCareer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open triggered by parent
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingJobs = jobs.filter(
    (j) =>
      (j.company && j.company.toLowerCase().includes(q)) ||
      (j.role && j.role.toLowerCase().includes(q)) ||
      j.raw_text.toLowerCase().includes(q)
  );

  const matchingSkills = skills.filter((s) => s.name.toLowerCase().includes(q));

  const matchingExperiences = experiences.filter(
    (e) =>
      e.company.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      (e.bullets && e.bullets.some((b) => b.toLowerCase().includes(q))) ||
      (e.achievements && e.achievements.some((b) => (typeof b === "string" ? b : b.text).toLowerCase().includes(q)))
  );

  const handleSelect = (url: string) => {
    router.push(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[rgba(17,17,17,0.1)] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center px-6 py-4 border-b border-[rgba(17,17,17,0.08)] bg-white">
          <Search className="w-5 h-5 text-[#888888] shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Search saved jobs, skills, or career experiences..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-base font-medium text-[#111111] placeholder:text-[#999999] focus:outline-none bg-transparent"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="p-1 text-[#888888] hover:text-[#111111]">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-[#888888] bg-[#F1F1ED] rounded border border-[rgba(17,17,17,0.08)]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Quick Actions if empty query */}
          {!q && (
            <div className="space-y-2">
              <div className="px-3 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Quick Navigation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelect("/jobs/analyze")}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F8F8F6] border border-transparent hover:border-[rgba(17,17,17,0.06)] text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Save / Paste Job Description</div>
                    <div className="text-[10px] text-[#666666]">Store target JD into your workspace</div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelect("/profile")}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F8F8F6] border border-transparent hover:border-[rgba(17,17,17,0.06)] text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Master Career Profile</div>
                    <div className="text-[10px] text-[#666666]">Manage skills, experience & projects</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Jobs */}
          {matchingJobs.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Saved Job Descriptions ({matchingJobs.length})
              </div>
              {matchingJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleSelect(`/jobs/${job.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F8F6] border border-transparent hover:border-[rgba(17,17,17,0.06)] text-left transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#111111] truncate">{job.role || "Target Role"}</div>
                      <div className="text-[10px] text-[#666666]">{job.company || "Target Company"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#AAAAAA] group-hover:text-[#111111] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Experiences */}
          {matchingExperiences.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Experience Matches ({matchingExperiences.length})
              </div>
              {matchingExperiences.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => handleSelect("/profile")}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F8F6] border border-transparent hover:border-[rgba(17,17,17,0.06)] text-left transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#111111] truncate">
                        {exp.role} — {exp.company}
                      </div>
                      <div className="text-[10px] text-[#666666]">
                        {exp.start_date} – {exp.is_current ? "Present" : exp.end_date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#AAAAAA] group-hover:text-[#111111]" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Skills */}
          {matchingSkills.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Skills ({matchingSkills.length})
              </div>
              <div className="flex flex-wrap gap-1.5 p-2">
                {matchingSkills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => handleSelect("/profile")}
                    className="px-3 py-1 rounded-full bg-[#F1F1ED] hover:bg-[#E5E5E0] text-xs font-semibold text-[#111111] transition-colors"
                  >
                    {skill.name} {skill.category && <span className="text-[10px] text-[#666666]">({skill.category})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && matchingJobs.length === 0 && matchingExperiences.length === 0 && matchingSkills.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-[#111111]">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-[#666666] mt-1">Try searching for company names, roles, or skills.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
