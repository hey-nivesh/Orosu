"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Calendar,
  Sparkles,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Check,
  XCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  FileText,
  Briefcase,
  Cpu,
} from "lucide-react";
import { jobsApi, tailorApi } from "@/lib/api/client";
import { useCareer } from "@/lib/store/career-store";
import {
  JobDescriptionRecord,
  JDAnalysis,
  MatchRadar,
  RequirementMatch,
  PipelineProgressStage,
} from "@/types";
import { formatDate } from "@/lib/utils";

const PIPELINE_STAGES: PipelineProgressStage[] = [
  { id: "analyze", name: "Analyzing Job Requirements", status: "waiting" },
  { id: "match", name: "Matching Candidate Evidence", status: "waiting" },
  { id: "tailor", name: "Evidence-Grounded Resume Tailoring", status: "waiting" },
  { id: "validate", name: "Validating against Ground Truth", status: "waiting" },
  { id: "render_html", name: "Rendering ATS Template HTML", status: "waiting" },
  { id: "render_pdf", name: "Generating Server-Side PDF (Chromium)", status: "waiting" },
  { id: "upload", name: "Uploading Asset to Storage", status: "waiting" },
  { id: "save", name: "Saving Immutable Resume Version", status: "waiting" },
];

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const { deleteJobDescription } = useCareer();
  const [job, setJob] = useState<JobDescriptionRecord | null>(null);
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [matchRadar, setMatchRadar] = useState<MatchRadar | null>(null);
  const [evidenceMap, setEvidenceMap] = useState<RequirementMatch[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "matched" | "partially_matched" | "not_found">("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [stages, setStages] = useState<PipelineProgressStage[]>(PIPELINE_STAGES);
  const [error, setError] = useState("");

  // Load Job and existing Analysis
  useEffect(() => {
    if (!jobId) return;

    jobsApi
      .getJob(jobId)
      .then((data) => {
        setJob(data);
        // Try fetching existing analysis
        return jobsApi.getAnalysis(jobId).catch(() => null);
      })
      .then((analysisData) => {
        if (analysisData) {
          setAnalysis(analysisData.analysis);
          setMatchRadar(analysisData.matchRadar);
          setEvidenceMap(analysisData.evidenceMap || []);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load job description.");
        setIsLoading(false);
      });
  }, [jobId]);

  const handleRunAnalysis = async () => {
    if (!job) return;
    setIsAnalyzing(true);
    setError("");

    try {
      const res = await jobsApi.analyzeJob(job.id);
      setAnalysis(res.analysis);
      setMatchRadar(res.matchRadar);
      setEvidenceMap(res.evidenceMap || []);
    } catch (err: any) {
      setError(err.message || "Failed to analyze job description.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateTailoredResume = async () => {
    if (!job) return;
    setIsTailoring(true);
    setError("");

    // Simulate observable progression while backend executes
    const stageInterval = setInterval(() => {
      setActiveStageIndex((prev) => {
        if (prev < stages.length - 2) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      const result = await tailorApi.generateTailoredResume(job.id, "modern_clean");
      clearInterval(stageInterval);
      setActiveStageIndex(stages.length - 1);

      // Brief pause to show completion before navigating
      setTimeout(() => {
        router.push(`/resumes/${result.versionId}`);
      }, 700);
    } catch (err: any) {
      clearInterval(stageInterval);
      setIsTailoring(false);
      setError(err.message || "Failed to generate tailored resume.");
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    if (confirm("Are you sure you want to delete this job description?")) {
      try {
        await deleteJobDescription(job.id);
        router.push("/jobs");
      } catch (err: any) {
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const filteredEvidence = evidenceMap.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.status === selectedFilter;
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)]">
        <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-[#666666]">Loading job details...</p>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] space-y-3">
        <h3 className="text-base font-extrabold text-[#111111]">{error || "Job not found"}</h3>
        <Link
          href="/jobs"
          className="text-xs font-bold text-[#E11D48] hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to saved jobs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/jobs"
            className="p-2.5 rounded-2xl bg-[#F8F8F6] text-[#666666] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                Target Role
              </span>
              <span className="text-xs text-[#888888] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{job ? formatDate(job.created_at) : ""}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight mt-1">
              {job?.role || analysis?.jobTitle || "Job Description"}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#666666] font-semibold mt-0.5">
              <Building className="w-3.5 h-3.5 text-[#888888]" />
              <span>{job?.company || analysis?.company || "Target Company"}</span>
              {analysis?.seniority && (
                <>
                  <span>•</span>
                  <span>{analysis.seniority}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!analysis ? (
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="gradient-cta px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-soft flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? "Analyzing Requirements..." : "Analyze Match"}</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateTailoredResume}
              disabled={isTailoring}
              className="gradient-cta px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-soft flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Tailored Resume</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-2.5 rounded-2xl border border-[rgba(17,17,17,0.1)] text-[#888888] hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Job"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Tailoring Progress Modal / Overlay */}
      {isTailoring && (
        <div className="p-8 rounded-3xl bg-[#111111] text-white shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
                <span>Orosu Resume Intelligence Pipeline</span>
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Generating Tailored Resume for {analysis?.jobTitle || "Role"}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
              {Math.round(((activeStageIndex + 1) / stages.length) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stages.map((stage, idx) => {
              const isDone = idx < activeStageIndex;
              const isCurrent = idx === activeStageIndex;

              return (
                <div
                  key={stage.id}
                  className={`p-3.5 rounded-2xl border transition-all text-xs flex items-center gap-2.5 ${
                    isDone
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : isCurrent
                      ? "bg-white/10 border-rose-500 text-white font-bold animate-pulse"
                      : "bg-white/5 border-white/5 text-white/40"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                      isDone
                        ? "bg-emerald-500 text-black font-extrabold"
                        : isCurrent
                        ? "bg-rose-500 text-white font-bold"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  <span className="truncate">{stage.name}</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-white/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Anti-Hallucination Enforced:</strong> All generated bullets are validated against source evidence in your Canonical Career Profile.
            </span>
          </div>
        </div>
      )}

      {/* Match Radar Card (When Analyzed) */}
      {matchRadar && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#888888]">
              Overall Match
            </div>
            <div className="text-3xl font-black text-[#111111] mt-1">
              {matchRadar.overallScore}%
            </div>
            <div className="text-[11px] text-[#666666] mt-1">
              Based on {matchRadar.totalRequirements} verified criteria
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              Matched Skills
            </div>
            <div className="text-3xl font-black text-emerald-700 mt-1">
              {matchRadar.skillsMatchPercent}%
            </div>
            <div className="text-[11px] text-[#666666] mt-1">
              {matchRadar.matchedCount} verified in profile
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">
              Partial Mentions
            </div>
            <div className="text-3xl font-black text-amber-700 mt-1">
              {matchRadar.partialCount}
            </div>
            <div className="text-[11px] text-[#666666] mt-1">
              Transferable skills identified
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
              Missing Evidence
            </div>
            <div className="text-3xl font-black text-rose-700 mt-1">
              {matchRadar.missingCount}
            </div>
            <div className="text-[11px] text-[#666666] mt-1">
              Will not be fabricated
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: JD Requirements + Evidence Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Evidence Match Audit & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {analysis && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(17,17,17,0.08)] pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">
                    Evidence Match Audit
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Every item is evaluated against your Master Career Profile.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["all", "matched", "partially_matched", "not_found"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedFilter === filter
                          ? "bg-[#111111] text-white"
                          : "bg-[#F8F8F6] text-[#666666] hover:text-[#111111]"
                      }`}
                    >
                      {filter === "all"
                        ? `All (${evidenceMap.length})`
                        : filter === "matched"
                        ? `Matched (${matchRadar?.matchedCount || 0})`
                        : filter === "partially_matched"
                        ? `Partial (${matchRadar?.partialCount || 0})`
                        : `Missing (${matchRadar?.missingCount || 0})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtered Evidence Items */}
              <div className="space-y-3">
                {filteredEvidence.map((item, idx) => {
                  const isMatched = item.status === "matched";
                  const isPartial = item.status === "partially_matched";

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all space-y-2 text-xs ${
                        isMatched
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                          : isPartial
                          ? "bg-amber-50/50 border-amber-200 text-amber-950"
                          : "bg-rose-50/40 border-rose-200 text-rose-950"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold">
                          {isMatched ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : isPartial ? (
                            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className="text-sm font-extrabold text-[#111111]">
                            {item.requirement}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isMatched
                              ? "bg-emerald-600 text-white"
                              : isPartial
                              ? "bg-amber-600 text-white"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Evidence snippets */}
                      {item.evidence && item.evidence.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-[#666666]">
                            Source Provenance:
                          </div>
                          {item.evidence.map((ev, evIdx) => (
                            <div
                              key={evIdx}
                              className="p-2 rounded-xl bg-white border border-[rgba(17,17,17,0.06)] text-[11px] text-[#333333] leading-relaxed"
                            >
                              {ev.sourceText}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#888888] italic">
                          No direct evidence in profile. Orosu will not claim this skill.
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredEvidence.length === 0 && (
                  <div className="p-8 text-center text-xs text-[#888888]">
                    No items match the selected filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw JD Text */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#888888]" />
              <span>Full Job Description</span>
            </h3>
            <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] text-xs text-[#444444] font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
              {job?.raw_text}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Key Skills, Responsibilities & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Tailor CTA Card */}
          <div className="p-6 rounded-3xl bg-[#111111] text-white shadow-soft space-y-4">
            <div className="eyebrow text-rose-400">
              <span className="eyebrow-dot" />
              <span>NEXT STEP</span>
            </div>
            <h4 className="text-lg font-extrabold text-white">
              Ready to tailor your resume?
            </h4>
            <p className="text-xs text-[#AAAAAA] leading-relaxed">
              Orosu will generate an ATS-optimized, evidence-grounded version targeted specifically for this position.
            </p>
            <button
              onClick={handleGenerateTailoredResume}
              disabled={isTailoring}
              className="w-full gradient-cta text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Tailored Resume</span>
            </button>
          </div>

          {/* Extracted Technologies */}
          {analysis?.technologies && analysis.technologies.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>Detected Technologies ({analysis.technologies.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.08)] text-xs font-bold text-[#111111]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Responsibilities */}
          {analysis?.responsibilities && analysis.responsibilities.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-rose-600" />
                <span>Key Responsibilities</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#555555]">
                {analysis.responsibilities.slice(0, 6).map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#111111] font-bold">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
