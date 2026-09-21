"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  Building,
  Calendar,
  FileCheck,
  Mail,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { tailorApi, gmailApi } from "@/lib/api/client";
import { ResumeVersionRecord, TailoredBullet } from "@/types";
import { formatDate } from "@/lib/utils";

export default function TailoredResumeDetailPage() {
  const params = useParams();
  const versionId = params?.id as string;

  const [version, setVersion] = useState<ResumeVersionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBullet, setSelectedBullet] = useState<TailoredBullet | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Email Outreach State
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState<{ draftId: string; gmailWebUrl: string } | null>(null);
  const [draftError, setDraftError] = useState("");
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!versionId) return;

    // Check Google Auth Status
    gmailApi
      .getGoogleStatus()
      .then((status) => setIsGoogleConnected(status.isConnected))
      .catch(() => setIsGoogleConnected(false));

    tailorApi
      .getVersion(versionId)
      .then((data) => {
        setVersion(data);
        setIsLoading(false);

        // Pre-fill email outreach fields
        const candidateName = data.tailored_resume_json?.basics?.name || "Candidate";
        const company = data.target_company || "Company";
        const role = data.target_role || "Position";
        setEmailSubject(`Application for ${role} — ${candidateName}`);
      })
      .catch((err) => {
        setError(err.message || "Failed to load tailored resume version.");
        setIsLoading(false);
      });
  }, [versionId]);

  const handleDownload = async () => {
    if (!version) return;
    setIsDownloading(true);
    try {
      const candidateName = version.tailored_resume_json?.basics?.name || "Candidate";
      const role = version.target_role || "Resume";
      const company = version.target_company || "";
      const filename = `${candidateName}_${company}_${role}.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      await tailorApi.downloadPdf(version.id, filename);
    } catch (err: any) {
      alert("Failed to download PDF: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAIDraftEmail = async () => {
    if (!version) return;
    setIsDraftingAI(true);
    setDraftError("");

    try {
      const candidateName = version.tailored_resume_json?.basics?.name || "Candidate";
      const company = version.target_company || "Target Company";
      const role = version.target_role || "Target Role";
      const topSkills = (version.tailored_resume_json?.skills || [])
        .filter((s) => s.relevance === "high")
        .map((s) => s.name);

      const res = await gmailApi.generateDraftBody({
        candidateName,
        recipientName: recipientName || "Hiring Team",
        company,
        role,
        topSkills,
      });

      setEmailSubject(res.subject);
      setEmailBody(res.body);
    } catch (err: any) {
      setDraftError(err.message || "Failed to generate AI email draft.");
    } finally {
      setIsDraftingAI(false);
    }
  };

  const handleCreateGmailDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !recipientEmail.trim() || !emailBody.trim()) return;

    setIsCreatingDraft(true);
    setDraftError("");
    setDraftSuccess(null);

    try {
      const res = await gmailApi.createDraft({
        resumeVersionId: version.id,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        subject: emailSubject.trim() || `Application for ${version.target_role || "Role"}`,
        body: emailBody.trim(),
      });

      setDraftSuccess({
        draftId: res.draftId,
        gmailWebUrl: res.gmailWebUrl || "https://mail.google.com/mail/u/0/#drafts",
      });
    } catch (err: any) {
      setDraftError(err.message || "Failed to create Gmail draft.");
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await gmailApi.getGoogleAuthUrl(`/resumes/${versionId}`);
      if (res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err: any) {
      alert("Failed to initiate Google OAuth: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)]">
        <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-[#666666]">Loading tailored resume version...</p>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] space-y-3">
        <h3 className="text-base font-extrabold text-[#111111]">{error || "Resume version not found"}</h3>
        <Link
          href="/resumes"
          className="text-xs font-bold text-[#E11D48] hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Resume Library</span>
        </Link>
      </div>
    );
  }

  const resume = version.tailored_resume_json;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Action & Navigation Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/resumes"
            className="p-2.5 rounded-2xl bg-[#F8F8F6] text-[#666666] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                Tailored Version {version.version_number}
              </span>
              <span className="text-xs text-[#888888] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(version.created_at)}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight mt-1">
              {version.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#666666] font-semibold mt-0.5">
              <Building className="w-3.5 h-3.5 text-[#888888]" />
              <span>{version.target_company || "Target Company"}</span>
              <span>•</span>
              <span>{version.target_role || "Role"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="gradient-cta px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-soft flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isDownloading ? "Downloading PDF..." : "Download PDF"}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-2xl border border-[rgba(17,17,17,0.1)] text-[#111111] hover:bg-[#F8F8F6] transition-colors"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split View: Resume Document (Left) & Evidence / Email (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: ATS Document Preview (8 cols) */}
        <div className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-2xl space-y-4 text-[#111111] print:shadow-none print:border-none print:p-0 font-sans">
          {/* Resume Header */}
          <div className="text-center pb-2 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-[#0f172a] uppercase">
              {resume.basics.name}
            </h1>
            {resume.basics.headline && (
              <p className="text-xs font-semibold text-[#334155]">
                {resume.basics.headline}
              </p>
            )}
            <div className="text-[11px] text-[#334155] flex flex-wrap items-center justify-center gap-2 pt-0.5">
              {resume.basics.phone && <span>{resume.basics.phone}</span>}
              {resume.basics.email && (
                <>
                  <span>•</span>
                  <a href={`mailto:${resume.basics.email}`} className="text-[#0369a1] underline">
                    {resume.basics.email}
                  </a>
                </>
              )}
              {resume.basics.portfolio && (
                <>
                  <span>•</span>
                  <a
                    href={resume.basics.portfolio.startsWith("http") ? resume.basics.portfolio : `https://${resume.basics.portfolio}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0369a1] underline"
                  >
                    {resume.basics.portfolio.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </>
              )}
              {resume.basics.linkedin && (
                <>
                  <span>•</span>
                  <a
                    href={resume.basics.linkedin.startsWith("http") ? resume.basics.linkedin : `https://${resume.basics.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0369a1] underline"
                  >
                    {resume.basics.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </>
              )}
              {resume.basics.location && (
                <>
                  <span>•</span>
                  <span>{resume.basics.location}</span>
                </>
              )}
            </div>
          </div>

          {/* Summary Section */}
          {resume.summary && (
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                SUMMARY
              </h3>
              <p className="text-xs text-[#1f2937] leading-relaxed text-justify">
                {resume.summary}
              </p>
            </div>
          )}

          {/* Relevant to Role (if present) */}
          {(resume as any).relevantToRole && (resume as any).relevantToRole.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                RELEVANT TO THIS ROLE
              </h3>
              <ul className="space-y-1 text-xs text-[#1f2937] list-disc list-outside pl-4">
                {(resume as any).relevantToRole.map((item: string, rIdx: number) => {
                  const match = item.match(/^([^:]+:)(.+)$/);
                  return (
                    <li key={rIdx} className="leading-relaxed">
                      {match ? (
                        <>
                          <strong>{match[1]}</strong>
                          <span>{match[2]}</span>
                        </>
                      ) : (
                        <span>{item}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Technical Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                TECHNICAL SKILLS
              </h3>
              <div className="space-y-1 pt-0.5 text-xs">
                {(() => {
                  const cats: Record<string, string[]> = {};
                  for (const s of resume.skills) {
                    if (!s.name) continue;
                    const cat = s.category || "Technical Skills";
                    if (!cats[cat]) cats[cat] = [];
                    cats[cat].push(s.name);
                  }
                  return Object.entries(cats).map(([category, items], cIdx) => (
                    <div key={cIdx} className="leading-relaxed">
                      <span className="font-bold text-[#0f172a]">{category}: </span>
                      <span className="text-[#334155]">{items.join(", ")}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {resume.experiences && resume.experiences.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                WORK EXPERIENCE
              </h3>

              {resume.experiences.map((exp, expIdx) => (
                <div key={expIdx} className="space-y-1 text-xs">
                  <div className="flex items-baseline justify-between font-bold text-[#0f172a]">
                    <div>
                      <span className="font-extrabold">{exp.role}</span>
                      <span className="text-[#94a3b8] mx-1">|</span>
                      <span className="font-semibold text-[#475569]">{exp.company}</span>
                    </div>
                  </div>

                  <div className="text-[11px] italic text-[#64748b] flex items-center gap-1.5">
                    <span>
                      {exp.startDate} {exp.endDate ? `– ${exp.endDate}` : ""}
                    </span>
                    {exp.location && (
                      <>
                        <span className="not-italic text-[#94a3b8]">•</span>
                        <span>{exp.location}</span>
                      </>
                    )}
                  </div>

                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="space-y-1 text-[#1f2937] list-disc list-outside pl-4 pt-0.5">
                      {exp.bullets.map((b, bIdx) => (
                        <li
                          key={bIdx}
                          onClick={() => setSelectedBullet(b)}
                          className={`leading-relaxed cursor-pointer p-0.5 rounded transition-colors ${
                            selectedBullet?.text === b.text
                              ? "bg-purple-50 ring-1 ring-purple-300 text-purple-950 font-medium"
                              : "hover:bg-rose-50"
                          }`}
                        >
                          <span>{b.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {(exp as any).technologies && (exp as any).technologies.length > 0 && (
                    <div className="text-[11px] italic text-[#475569] pl-4">
                      Tech: {(exp as any).technologies.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Featured Projects */}
          {resume.projects && resume.projects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                PROJECTS
              </h3>

              {resume.projects.map((proj, pIdx) => (
                <div key={pIdx} className="space-y-1 text-xs">
                  <div className="flex items-baseline justify-between font-bold text-[#0f172a]">
                    <div>
                      <span className="font-extrabold">{proj.name}</span>
                      {proj.description && (
                        <span className="font-semibold text-[#475569]"> — {proj.description}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#64748b] flex items-center gap-2">
                    {(proj as any).startDate && (
                      <span className="italic">
                        {(proj as any).startDate} {(proj as any).endDate ? `– ${(proj as any).endDate}` : ""}
                      </span>
                    )}
                    {proj.url && (
                      <a
                        href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0369a1] underline font-semibold"
                      >
                        {proj.url.includes("github.com") ? "GitHub" : "Preview"}
                      </a>
                    )}
                  </div>

                  {proj.bullets && proj.bullets.length > 0 && (
                    <ul className="space-y-1 text-[#1f2937] list-disc list-outside pl-4 pt-0.5">
                      {proj.bullets.map((b, bIdx) => (
                        <li
                          key={bIdx}
                          onClick={() => setSelectedBullet(b)}
                          className="leading-relaxed cursor-pointer hover:bg-rose-50 p-0.5 rounded"
                        >
                          <span>{b.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="text-[11px] italic text-[#475569] pl-4">
                      Tech: {proj.technologies.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                EDUCATION
              </h3>

              <ul className="space-y-1 text-xs text-[#1f2937] list-disc list-outside pl-4">
                {resume.education.map((ed, edIdx) => (
                  <li key={edIdx} className="leading-relaxed">
                    {ed.degree && ed.degree !== "Degree" ? <strong>{ed.degree}</strong> : null}
                    {ed.degree && ed.institution ? " — " : ""}
                    <strong>{ed.institution}</strong>
                    {(ed as any).cgpa ? ` — CGPA ${(ed as any).cgpa}` : ""}
                    {ed.startDate || (ed as any).start_date ? ` — ${ed.startDate || (ed as any).start_date}–${ed.endDate || (ed as any).end_date || "Present"}` : ""}
                    {ed.description ? (
                      <div className="text-[11px] text-[#475569]">Relevant coursework: {ed.description}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Certifications */}
          {resume.certifications && resume.certifications.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                CERTIFICATIONS
              </h3>

              <ul className="space-y-1 text-xs text-[#1f2937] list-disc list-outside pl-4">
                {resume.certifications.map((c, cIdx) => (
                  <li key={cIdx} className="leading-relaxed">
                    <strong>{c.name}</strong>
                    {c.issuer && c.issuer !== "Accredited Provider" ? ` — ${c.issuer}` : ""}
                    {c.date ? ` — ${c.date}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Evidence Audit & HR Email Outreach (4 cols) */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          {/* Anti-Hallucination Badge Card */}
          <div className="bg-white p-6 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#111111]">100% Grounded in Truth</h4>
                <p className="text-[11px] text-[#666666]">
                  Every statement is verified against your Canonical Profile.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(17,17,17,0.06)] text-center">
              <div className="p-2.5 bg-[#F8F8F6] rounded-xl">
                <div className="text-lg font-black text-emerald-700">
                  {resume.evidenceValidation?.verifiedStatementsCount || 0}
                </div>
                <div className="text-[10px] text-[#666666] font-bold">Verified Claims</div>
              </div>

              <div className="p-2.5 bg-[#F8F8F6] rounded-xl">
                <div className="text-lg font-black text-[#111111]">0</div>
                <div className="text-[10px] text-[#666666] font-bold">Fabrications</div>
              </div>
            </div>
          </div>

          {/* Interactive Evidence Traceability Inspector */}
          <div className="bg-white p-6 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-600" />
              <span>Evidence Traceability</span>
            </h4>

            {selectedBullet ? (
              <div className="space-y-3 text-xs animate-in fade-in">
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-purple-950 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-purple-700">
                    Selected Statement:
                  </div>
                  <div className="font-semibold leading-relaxed">{selectedBullet.text}</div>
                  {selectedBullet.reason && (
                    <div className="text-[10px] text-purple-800 pt-1 font-medium">
                      🎯 {selectedBullet.reason}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase text-[#888888]">
                    Origin Source Evidence:
                  </div>
                  {selectedBullet.evidence && selectedBullet.evidence.length > 0 ? (
                    selectedBullet.evidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#F8F8F6] rounded-xl border border-[rgba(17,17,17,0.06)] text-[11px] text-[#333333] leading-relaxed"
                      >
                        <div className="text-[10px] font-bold text-emerald-700 mb-1 uppercase">
                          ✓ {ev.sourceType}
                        </div>
                        <div>{ev.sourceText}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#888888] italic">
                      Direct match from canonical career profile item.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#888888] bg-[#F8F8F6] rounded-2xl border border-[rgba(17,17,17,0.06)]">
                Click any bullet point on the resume to inspect its original source evidence.
              </div>
            )}
          </div>

          {/* HR / Recruiter Email Outreach Section */}
          <div className="bg-white p-6 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-600" />
                <h4 className="text-sm font-extrabold text-[#111111]">Email HR / Recruiter</h4>
              </div>
              {isGoogleConnected ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Gmail Connected</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                >
                  Connect Gmail
                </button>
              )}
            </div>
            <p className="text-xs text-[#666666] leading-relaxed">
              Create a Gmail draft with your tailored PDF resume attached. You review and send it manually.
            </p>

            {!isGoogleConnected && isGoogleConnected !== null && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-2">
                <span>Connect your Google account to create drafts in your Gmail inbox.</span>
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] shrink-0 cursor-pointer"
                >
                  Authorize
                </button>
              </div>
            )}

            {draftError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{draftError}</span>
              </div>
            )}

            {draftSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Gmail draft created with PDF attached!</span>
                </div>
                <a
                  href={draftSuccess.gmailWebUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="gradient-cta text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 mt-1"
                >
                  <span>Open Gmail Drafts</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <form onSubmit={handleCreateGmailDraft} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                  HR / Recruiter Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="recruiter@company.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                    Message Body *
                  </label>
                  <button
                    type="button"
                    onClick={handleAIDraftEmail}
                    disabled={isDraftingAI}
                    className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isDraftingAI ? "Drafting..." : "AI Draft Email"}</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={6}
                  placeholder="Click 'AI Draft Email' or write your application message..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl p-3 focus:outline-none focus:border-[#E11D48] leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingDraft || !recipientEmail.trim() || !emailBody.trim()}
                className="w-full gradient-cta text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCreatingDraft ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isCreatingDraft ? "Creating Gmail Draft..." : "Create Gmail Draft"}</span>
              </button>

              <div className="text-[10px] text-[#888888] text-center pt-1">
                🛡️ Safe outreach: Orosu never sends emails automatically. Review in Gmail before sending.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
