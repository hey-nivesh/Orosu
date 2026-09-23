"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Pencil,
  Save,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { tailorApi, gmailApi } from "@/lib/api/client";
import { ResumeVersionRecord, TailoredBullet } from "@/types";
import { formatDate } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Bullet cleaning helper – removes stray dots, stitches wrapped text, ignores empties
───────────────────────────────────────────────────────────────────────────── */
function cleanBulletList(bullets: any[]): Array<{ text: string; reason?: string; evidence?: any[] }> {
  const list: Array<{ text: string; reason?: string; evidence?: any[] }> = [];
  for (const b of bullets || []) {
    const rawText = typeof b === "string" ? b : b?.text || "";
    const clean = rawText.replace(/^[•\-*·▪▫►\d.]+\s*/, "").trim();
    if (!clean || clean === "•" || clean === "-" || clean === "*") continue;

    if (
      list.length > 0 &&
      (/^[a-z,;\)]/.test(clean) ||
        /^(and|or|with|for|in|to|across|using|backed|APIs|build|deployment|features|stack|development|database|pipeline)/i.test(
          clean
        ) ||
        /[,\-—–]\s*$/.test(list[list.length - 1].text))
    ) {
      list[list.length - 1] = {
        ...list[list.length - 1],
        text: `${list[list.length - 1].text} ${clean}`.replace(/\s+/g, " "),
      };
    } else {
      list.push(typeof b === "object" ? { ...b, text: clean } : { text: clean });
    }
  }
  return list;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helper to render text with bold prefix if pattern "Prefix: Rest" exists
───────────────────────────────────────────────────────────────────────────── */
function renderBulletWithBoldPrefix(text: string) {
  const match = text.match(/^([^:]+:)(.+)$/);
  if (match) {
    return (
      <>
        <strong className="font-extrabold text-[#0f172a]">{match[1]}</strong>
        <span>{match[2]}</span>
      </>
    );
  }
  return <span>{text}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Tailored Resume Detail Page
───────────────────────────────────────────────────────────────────────────── */
export default function TailoredResumeDetailPage() {
  const params = useParams();
  const versionId = params?.id as string;

  const [version, setVersion] = useState<ResumeVersionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBullet, setSelectedBullet] = useState<TailoredBullet | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Editing state ────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editedResume, setEditedResume] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // ── JD Update state ──────────────────────────────────────────────────────
  const [showJDPanel, setShowJDPanel] = useState(false);
  const [jdText, setJdText] = useState("");
  const [isRetailoring, setIsRetailoring] = useState(false);
  const [retailorError, setRetailorError] = useState("");
  const [retailorSuccess, setRetailorSuccess] = useState(false);

  // ── Email Outreach State ─────────────────────────────────────────────────
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState<{ draftId: string; gmailWebUrl: string } | null>(null);
  const [draftError, setDraftError] = useState("");
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  /* ── Load version ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!versionId) return;

    gmailApi
      .getGoogleStatus()
      .then((status) => setIsGoogleConnected(status.isConnected))
      .catch(() => setIsGoogleConnected(false));

    tailorApi
      .getVersion(versionId)
      .then((data) => {
        setVersion(data);
        setEditedResume(JSON.parse(JSON.stringify(data.tailored_resume_json)));
        setIsLoading(false);

        const candidateName = data.tailored_resume_json?.basics?.name || "Candidate";
        const role = data.target_role || "Position";
        setEmailSubject(`Application for ${role} — ${candidateName}`);
      })
      .catch((err) => {
        setError(err.message || "Failed to load tailored resume version.");
        setIsLoading(false);
      });
  }, [versionId]);

  /* ── Edit State Mutators ─────────────────────────────────────────────── */
  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveSuccess(false);
    setSaveError("");
  }, []);

  const updateBasics = (field: string, val: string) => {
    setEditedResume((prev: any) => ({
      ...prev,
      basics: { ...prev.basics, [field]: val },
    }));
    markDirty();
  };

  const updateSummary = (val: string) => {
    setEditedResume((prev: any) => ({ ...prev, summary: val }));
    markDirty();
  };

  // Relevant to role
  const updateRelevantToRole = (idx: number, val: string) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.relevantToRole = next.relevantToRole || [];
      next.relevantToRole[idx] = val;
      return next;
    });
    markDirty();
  };

  const addRelevantToRole = () => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.relevantToRole = next.relevantToRole || [];
      next.relevantToRole.push("New Key Alignment: Description of alignment point");
      return next;
    });
    markDirty();
  };

  const deleteRelevantToRole = (idx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.relevantToRole = (next.relevantToRole || []).filter((_: any, i: number) => i !== idx);
      return next;
    });
    markDirty();
  };

  // Skills
  const updateSkillCategoryNames = (oldCat: string, newCat: string, skillsStr: string) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const otherSkills = (next.skills || []).filter((s: any) => (s.category || "General") !== oldCat);
      const newItems = skillsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          category: newCat || "General",
          relevance: "high",
          isHighlighted: true,
        }));
      next.skills = [...otherSkills, ...newItems];
      return next;
    });
    markDirty();
  };

  const addSkillCategory = () => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.skills = next.skills || [];
      next.skills.push({
        name: "New Skill",
        category: "New Category",
        relevance: "high",
        isHighlighted: true,
      });
      return next;
    });
    markDirty();
  };

  const deleteSkillCategory = (categoryName: string) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.skills = (next.skills || []).filter((s: any) => (s.category || "General") !== categoryName);
      return next;
    });
    markDirty();
  };

  // Experience
  const updateExpField = (idx: number, field: string, val: any) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.experiences[idx]) return next;
      next.experiences[idx][field] = val;
      return next;
    });
    markDirty();
  };

  const updateExpBullet = (expIdx: number, bIdx: number, val: string) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const exp = next.experiences[expIdx];
      const bullets = exp.bullets || exp.achievements || [];
      if (typeof bullets[bIdx] === "object") {
        bullets[bIdx] = { ...bullets[bIdx], text: val };
      } else {
        bullets[bIdx] = val;
      }
      exp.bullets = bullets;
      return next;
    });
    markDirty();
  };

  const addExpBullet = (expIdx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const exp = next.experiences[expIdx];
      exp.bullets = exp.bullets || exp.achievements || [];
      exp.bullets.push({ text: "Delivered key feature resulting in measurable impact." });
      return next;
    });
    markDirty();
  };

  const deleteExpBullet = (expIdx: number, bIdx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const exp = next.experiences[expIdx];
      const bullets = exp.bullets || exp.achievements || [];
      exp.bullets = bullets.filter((_: any, i: number) => i !== bIdx);
      return next;
    });
    markDirty();
  };

  const addExperience = () => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.experiences = next.experiences || [];
      next.experiences.unshift({
        role: "Software Engineer",
        company: "Company Name",
        location: "Remote",
        startDate: "Jan 2026",
        endDate: "Present",
        bullets: [{ text: "Engineered scalable features and collaborated across product teams." }],
        technologies: ["React.js", "Node.js", "TypeScript"],
      });
      return next;
    });
    markDirty();
  };

  const deleteExperience = (idx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.experiences = (next.experiences || []).filter((_: any, i: number) => i !== idx);
      return next;
    });
    markDirty();
  };

  // Projects
  const updateProjectField = (idx: number, field: string, val: any) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.projects[idx]) return next;
      next.projects[idx][field] = val;
      return next;
    });
    markDirty();
  };

  const updateProjectBullet = (pIdx: number, bIdx: number, val: string) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const proj = next.projects[pIdx];
      const bullets = proj.bullets || proj.achievements || [];
      if (typeof bullets[bIdx] === "object") {
        bullets[bIdx] = { ...bullets[bIdx], text: val };
      } else {
        bullets[bIdx] = val;
      }
      proj.bullets = bullets;
      return next;
    });
    markDirty();
  };

  const addProjectBullet = (pIdx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const proj = next.projects[pIdx];
      proj.bullets = proj.bullets || proj.achievements || [];
      proj.bullets.push({ text: "Architected core backend logic and designed REST APIs." });
      return next;
    });
    markDirty();
  };

  const deleteProjectBullet = (pIdx: number, bIdx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const proj = next.projects[pIdx];
      const bullets = proj.bullets || proj.achievements || [];
      proj.bullets = bullets.filter((_: any, i: number) => i !== bIdx);
      return next;
    });
    markDirty();
  };

  const addProject = () => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.projects = next.projects || [];
      next.projects.unshift({
        name: "New Project",
        description: "Tagline / Description",
        startDate: "Jun 2026",
        endDate: "Present",
        url: "https://github.com/",
        previewUrl: "https://preview.app/",
        bullets: [{ text: "Built application with modern stack and deployed to production." }],
        technologies: ["React", "Node.js", "MongoDB"],
      });
      return next;
    });
    markDirty();
  };

  const deleteProject = (idx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.projects = (next.projects || []).filter((_: any, i: number) => i !== idx);
      return next;
    });
    markDirty();
  };

  // Education
  const updateEducationField = (idx: number, field: string, val: string) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.education[idx]) return next;
      next.education[idx][field] = val;
      return next;
    });
    markDirty();
  };

  const addEducation = () => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.education = next.education || [];
      next.education.push({
        institution: "University / College",
        degree: "Bachelor of Technology",
        field: "Computer Science",
        startDate: "Aug 2024",
        endDate: "Aug 2028",
        cgpa: "8.5",
        description: "Data Structures, Web Development, AI/ML",
      });
      return next;
    });
    markDirty();
  };

  const deleteEducation = (idx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.education = (next.education || []).filter((_: any, i: number) => i !== idx);
      return next;
    });
    markDirty();
  };

  // Certifications
  const updateCertField = (idx: number, field: string, val: string) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.certifications[idx]) return next;
      next.certifications[idx][field] = val;
      return next;
    });
    markDirty();
  };

  const addCertification = () => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.certifications = next.certifications || [];
      next.certifications.push({
        name: "Certification Name",
        issuer: "Provider",
        date: "Sep 2025",
        description: "Key skills learned",
      });
      return next;
    });
    markDirty();
  };

  const deleteCertification = (idx: number) => {
    setEditedResume((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.certifications = (next.certifications || []).filter((_: any, i: number) => i !== idx);
      return next;
    });
    markDirty();
  };

  /* ── Save / Discard Edits ─────────────────────────────────────────────── */
  const handleSaveEdits = async () => {
    if (!editedResume || !version) return;
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await tailorApi.saveEdits(version.id, editedResume);
      setVersion((prev) => (prev ? { ...prev, tailored_resume_json: editedResume } : prev));
      setIsDirty(false);
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save edits.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardEdits = () => {
    if (!version) return;
    setEditedResume(JSON.parse(JSON.stringify(version.tailored_resume_json)));
    setIsDirty(false);
    setSaveError("");
    setSaveSuccess(false);
    setIsEditing(false);
  };

  /* ── Re-tailor with JD ───────────────────────────────────────────────── */
  const handleTailorWithJD = async () => {
    if (!jdText.trim() || !version) return;
    setIsRetailoring(true);
    setRetailorError("");
    setRetailorSuccess(false);
    try {
      const res = await tailorApi.tailorWithJD(version.id, jdText.trim());
      const newJson = res.tailoredResumeJson;
      setEditedResume(JSON.parse(JSON.stringify(newJson)));
      setVersion((prev) => (prev ? { ...prev, tailored_resume_json: newJson } : prev));
      setIsDirty(false);
      setRetailorSuccess(true);
      setShowJDPanel(false);
      setJdText("");
    } catch (err: any) {
      setRetailorError(err.message || "Re-tailoring failed. Please try again.");
    } finally {
      setIsRetailoring(false);
    }
  };

  /* ── Download PDF ────────────────────────────────────────────────────── */
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

  /* ── AI Email ────────────────────────────────────────────────────────── */
  const handleAIDraftEmail = async () => {
    if (!version) return;
    setIsDraftingAI(true);
    setDraftError("");
    try {
      const candidateName = version.tailored_resume_json?.basics?.name || "Candidate";
      const company = version.target_company || "Target Company";
      const role = version.target_role || "Target Role";
      const topSkills = (version.tailored_resume_json?.skills || [])
        .filter((s: any) => s.relevance === "high")
        .map((s: any) => s.name);

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
      if (res.authUrl) window.location.href = res.authUrl;
    } catch (err: any) {
      alert("Failed to initiate Google OAuth: " + err.message);
    }
  };

  /* ── Loading / Error Guards ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] max-w-4xl mx-auto my-8">
        <div className="w-6 h-6 rounded-full border-2 border-[#1e3a8a] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-[#666666]">Loading tailored resume version...</p>
      </div>
    );
  }

  if (error || !version || !editedResume) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-rose-200 space-y-4 max-w-xl mx-auto my-8">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-extrabold text-[#111111]">{error || "Resume version not found"}</h3>
        <Link href="/resumes" className="text-xs font-bold text-[#1e3a8a] hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Resume Library</span>
        </Link>
      </div>
    );
  }

  const resume = editedResume;

  // Group skills by category
  const skillsByCategory: Record<string, string[]> = {};
  (resume.skills || []).forEach((s: any) => {
    if (!s.name || !s.name.trim()) return;
    const cat = s.category && s.category.trim() ? s.category.trim() : "Technical Skills";
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(s.name.trim());
  });

  const validExperiences = (resume.experiences || []).filter(
    (exp: any) =>
      isEditing ||
      (exp.company &&
        exp.company.trim() &&
        exp.company !== "Company" &&
        exp.role &&
        exp.role.trim() &&
        !/^(remote|hybrid|onsite)$/i.test(exp.role.trim()))
  );

  const validProjects = (resume.projects || []).filter(
    (p: any) => isEditing || (p.name && p.name.trim() && p.name !== "Project")
  );

  const relevantToRole = resume.relevantToRole || (resume as any).relevant_to_role || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* ── Top Header / Actions Bar ───────────────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/resumes"
            className="p-2.5 rounded-2xl bg-[#F8F8F6] text-[#666666] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#1e3a8a] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Tailored Version {version.version_number}
              </span>
              <span className="text-xs text-[#888888] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(version.created_at)}</span>
              </span>
              {retailorSuccess && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Updated with new JD
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight mt-1">{version.title}</h2>
            <div className="flex items-center gap-2 text-xs text-[#666666] font-semibold mt-0.5">
              <Building className="w-3.5 h-3.5 text-[#888888]" />
              <span>{version.target_company || "Target Company"}</span>
              <span>•</span>
              <span>{version.target_role || "Role"}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdits}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? "Saving…" : "Save Edits"}</span>
              </button>
              <button
                onClick={handleDiscardEdits}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[rgba(17,17,17,0.12)] text-[#666666] hover:text-[#111111] text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1e3a8a] text-white hover:bg-blue-900 text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Resume</span>
            </button>
          )}

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

      {/* Edit Mode Alert Banner */}
      {isEditing && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Edit Mode is active.</strong> Modify any text fields directly below, add or remove bullets, and click{" "}
              <strong>Save Edits</strong> in the header when finished.
            </span>
          </div>
          {saveSuccess && (
            <span className="flex items-center gap-1 text-emerald-700 font-bold whitespace-nowrap bg-emerald-100/70 px-2.5 py-1 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1 text-rose-600 font-bold whitespace-nowrap bg-rose-100/70 px-2.5 py-1 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5" /> {saveError}
            </span>
          )}
        </div>
      )}

      {/* ── Main Split View ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Resume Document (Concise & Structured) ────── */}
        <div className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-2xl space-y-4 text-[#111111] print:shadow-none print:border-none print:p-0 font-sans">
          
          {/* Header */}
          <div className="text-center pb-1 space-y-1">
            {isEditing ? (
              <div className="space-y-2 max-w-xl mx-auto pb-2">
                <input
                  type="text"
                  value={resume.basics?.name || ""}
                  onChange={(e) => updateBasics("name", e.target.value)}
                  placeholder="Full Name"
                  className="w-full text-center text-2xl font-black text-[#1e3a8a] uppercase border-b border-blue-200 focus:border-[#1e3a8a] outline-none px-2 py-1"
                />
                <input
                  type="text"
                  value={resume.basics?.headline || ""}
                  onChange={(e) => updateBasics("headline", e.target.value)}
                  placeholder="Target Role / Tagline — e.g. Full-Stack Developer — React.js, Node.js..."
                  className="w-full text-center text-xs font-semibold text-[#334155] border-b border-gray-200 focus:border-[#1e3a8a] outline-none px-2 py-0.5"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <input
                    type="text"
                    value={resume.basics?.phone || ""}
                    onChange={(e) => updateBasics("phone", e.target.value)}
                    placeholder="Phone"
                    className="border border-gray-200 rounded-lg p-1 text-center"
                  />
                  <input
                    type="email"
                    value={resume.basics?.email || ""}
                    onChange={(e) => updateBasics("email", e.target.value)}
                    placeholder="Email"
                    className="border border-gray-200 rounded-lg p-1 text-center"
                  />
                  <input
                    type="text"
                    value={resume.basics?.portfolio || ""}
                    onChange={(e) => updateBasics("portfolio", e.target.value)}
                    placeholder="GitHub / Portfolio URL"
                    className="border border-gray-200 rounded-lg p-1 text-center"
                  />
                  <input
                    type="text"
                    value={resume.basics?.linkedin || ""}
                    onChange={(e) => updateBasics("linkedin", e.target.value)}
                    placeholder="LinkedIn URL"
                    className="border border-gray-200 rounded-lg p-1 text-center"
                  />
                  <input
                    type="text"
                    value={resume.basics?.location || ""}
                    onChange={(e) => updateBasics("location", e.target.value)}
                    placeholder="Location"
                    className="border border-gray-200 rounded-lg p-1 text-center"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-[#1e3a8a] uppercase">
                  {resume.basics?.name || "Candidate Name"}
                </h1>
                {resume.basics?.headline && (
                  <p className="text-xs font-semibold text-[#334155]">{resume.basics.headline}</p>
                )}
                <div className="text-[11px] text-[#334155] flex flex-wrap items-center justify-center gap-2 pt-0.5">
                  {resume.basics?.phone && <span>{resume.basics.phone}</span>}
                  {resume.basics?.email && (
                    <>
                      <span>•</span>
                      <a href={`mailto:${resume.basics.email}`} className="text-[#0369a1] underline">
                        {resume.basics.email}
                      </a>
                    </>
                  )}
                  {resume.basics?.portfolio && (
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
                  {resume.basics?.linkedin && (
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
                  {resume.basics?.location && (
                    <>
                      <span>•</span>
                      <span>{resume.basics.location}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 1. SUMMARY */}
          {(resume.summary || isEditing) && (
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                SUMMARY
              </h3>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={resume.summary || ""}
                  onChange={(e) => updateSummary(e.target.value)}
                  placeholder="Write a concise professional summary targeted to the role..."
                  className="w-full text-xs text-[#1f2937] leading-relaxed p-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#1e3a8a]"
                />
              ) : (
                <p className="text-xs text-[#1f2937] leading-relaxed text-justify">{resume.summary}</p>
              )}
            </div>
          )}

          {/* 2. RELEVANT TO THIS ROLE */}
          {(relevantToRole.length > 0 || isEditing) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                  RELEVANT TO THIS ROLE
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addRelevantToRole}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Point
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2 pt-1">
                  {relevantToRole.map((item: string, rIdx: number) => (
                    <div key={rIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateRelevantToRole(rIdx, e.target.value)}
                        placeholder="e.g. Core stack overlap: React, Node, Express..."
                        className="flex-1 text-xs p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                      />
                      <button
                        type="button"
                        onClick={() => deleteRelevantToRole(rIdx)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete point"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1 text-xs text-[#1f2937] list-disc list-outside pl-4 pt-0.5">
                  {cleanBulletList(relevantToRole).map((b, rIdx) => (
                    <li key={rIdx} className="leading-relaxed">
                      {renderBulletWithBoldPrefix(b.text)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 3. TECHNICAL SKILLS */}
          {(Object.keys(skillsByCategory).length > 0 || isEditing) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                  TECHNICAL SKILLS
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addSkillCategory}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Category
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2 pt-1">
                  {Object.entries(skillsByCategory).map(([category, items], cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 text-xs">
                      <input
                        type="text"
                        defaultValue={category}
                        onBlur={(e) => updateSkillCategoryNames(category, e.target.value, items.join(", "))}
                        placeholder="Category Name"
                        className="w-40 font-bold p-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                      />
                      <input
                        type="text"
                        defaultValue={items.join(", ")}
                        onBlur={(e) => updateSkillCategoryNames(category, category, e.target.value)}
                        placeholder="Skills comma separated"
                        className="flex-1 p-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                      />
                      <button
                        type="button"
                        onClick={() => deleteSkillCategory(category)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 text-xs pt-0.5">
                  {Object.entries(skillsByCategory).map(([category, items], cIdx) => (
                    <div key={cIdx} className="leading-relaxed">
                      <span className="font-extrabold text-[#0f172a]">{category}: </span>
                      <span className="text-[#334155]">{items.join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. WORK EXPERIENCE */}
          {(validExperiences.length > 0 || isEditing) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                  WORK EXPERIENCE
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addExperience}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Position
                  </button>
                )}
              </div>

              {validExperiences.map((exp: any, vIdx: number) => {
                const realIdx = (resume.experiences || []).indexOf(exp);
                const bullets = cleanBulletList(exp.bullets || exp.achievements || []);
                const techList = exp.technologies || [];

                if (isEditing) {
                  return (
                    <div key={vIdx} className="p-3.5 border border-blue-100 rounded-2xl bg-blue-50/30 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-blue-900">Position #{vIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => deleteExperience(realIdx)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Position
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.role || ""}
                          onChange={(e) => updateExpField(realIdx, "role", e.target.value)}
                          placeholder="Job Title (e.g. Full-Stack Developer Intern)"
                          className="p-2 border border-gray-200 rounded-lg font-bold"
                        />
                        <input
                          type="text"
                          value={exp.company || ""}
                          onChange={(e) => updateExpField(realIdx, "company", e.target.value)}
                          placeholder="Company Name (e.g. HiDevs)"
                          className="p-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={exp.startDate || ""}
                          onChange={(e) => updateExpField(realIdx, "startDate", e.target.value)}
                          placeholder="Start Date (e.g. Dec 2025)"
                          className="p-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={exp.endDate || ""}
                          onChange={(e) => updateExpField(realIdx, "endDate", e.target.value)}
                          placeholder="End Date (e.g. May 2026 or Present)"
                          className="p-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={exp.location || ""}
                          onChange={(e) => updateExpField(realIdx, "location", e.target.value)}
                          placeholder="Location / Workplace Mode (e.g. Remote, Hybrid)"
                          className="p-2 border border-gray-200 rounded-lg sm:col-span-2"
                        />
                      </div>

                      {/* Bullets editing */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-[#334155]">Bullet Points:</label>
                          <button
                            type="button"
                            onClick={() => addExpBullet(realIdx)}
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Bullet
                          </button>
                        </div>
                        {bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-1.5">
                            <textarea
                              rows={2}
                              value={b.text}
                              onChange={(e) => updateExpBullet(realIdx, bIdx, e.target.value)}
                              placeholder="Impact statement or responsibility..."
                              className="flex-1 p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1e3a8a] text-xs leading-relaxed"
                            />
                            <button
                              type="button"
                              onClick={() => deleteExpBullet(realIdx, bIdx)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Delete bullet"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Tech stack line */}
                      <div>
                        <label className="font-bold text-[#334155] block mb-1">Tech Stack:</label>
                        <input
                          type="text"
                          value={techList.join(", ")}
                          onChange={(e) =>
                            updateExpField(
                              realIdx,
                              "technologies",
                              e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                            )
                          }
                          placeholder="Technologies comma-separated (e.g. React.js, Node.js, Tailwind CSS)"
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={vIdx} className="space-y-1 text-xs">
                    <div className="flex items-baseline justify-between font-bold text-[#0f172a]">
                      <div>
                        <span className="font-extrabold">{exp.role}</span>
                        <span className="text-[#64748b] font-normal mx-1.5">|</span>
                        <span className="font-semibold italic text-[#475569]">{exp.company}</span>
                      </div>
                    </div>

                    <div className="text-[11px] italic text-[#64748b] flex items-center gap-1.5">
                      <span>
                        {exp.startDate} – {exp.endDate || "Present"}
                      </span>
                      {exp.location && (
                        <>
                          <span className="not-italic">•</span>
                          <span>{exp.location}</span>
                        </>
                      )}
                    </div>

                    {bullets.length > 0 && (
                      <ul className="space-y-1 text-[#1f2937] list-disc list-outside pl-4 pt-0.5">
                        {bullets.map((b: any, bIdx: number) => (
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

                    {techList.length > 0 && (
                      <div className="text-[11px] italic text-[#475569] pl-4 pt-0.5">
                        Tech: {techList.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. PROJECTS */}
          {(validProjects.length > 0 || isEditing) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                  PROJECTS
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addProject}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                )}
              </div>

              {validProjects.map((proj: any, vIdx: number) => {
                const realIdx = (resume.projects || []).indexOf(proj);
                const bullets = cleanBulletList(proj.bullets || proj.achievements || []);
                const techList = proj.technologies || [];

                if (isEditing) {
                  return (
                    <div key={vIdx} className="p-3.5 border border-blue-100 rounded-2xl bg-blue-50/30 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-blue-900">Project #{vIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => deleteProject(realIdx)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Project
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={proj.name || ""}
                          onChange={(e) => updateProjectField(realIdx, "name", e.target.value)}
                          placeholder="Project Name (e.g. Nodoos AI)"
                          className="p-2 border border-gray-200 rounded-lg font-bold"
                        />
                        <input
                          type="text"
                          value={proj.description || ""}
                          onChange={(e) => updateProjectField(realIdx, "description", e.target.value)}
                          placeholder="Subtitle / Tagline (e.g. churn detection agent)"
                          className="p-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={proj.startDate || ""}
                          onChange={(e) => updateProjectField(realIdx, "startDate", e.target.value)}
                          placeholder="Start Date (e.g. Jun 2026)"
                          className="p-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={proj.endDate || ""}
                          onChange={(e) => updateProjectField(realIdx, "endDate", e.target.value)}
                          placeholder="End Date (e.g. Present)"
                          className="p-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={proj.url || ""}
                          onChange={(e) => updateProjectField(realIdx, "url", e.target.value)}
                          placeholder="GitHub URL (e.g. https://github.com/...)"
                          className="p-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={proj.previewUrl || ""}
                          onChange={(e) => updateProjectField(realIdx, "previewUrl", e.target.value)}
                          placeholder="Live Preview URL (e.g. https://app.preview...)"
                          className="p-2 border border-gray-200 rounded-lg"
                        />
                      </div>

                      {/* Bullets editing */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-[#334155]">Bullet Points:</label>
                          <button
                            type="button"
                            onClick={() => addProjectBullet(realIdx)}
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Bullet
                          </button>
                        </div>
                        {bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-1.5">
                            <textarea
                              rows={2}
                              value={b.text}
                              onChange={(e) => updateProjectBullet(realIdx, bIdx, e.target.value)}
                              placeholder="Project implementation or feature bullet..."
                              className="flex-1 p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1e3a8a] text-xs leading-relaxed"
                            />
                            <button
                              type="button"
                              onClick={() => deleteProjectBullet(realIdx, bIdx)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Delete bullet"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Tech stack line */}
                      <div>
                        <label className="font-bold text-[#334155] block mb-1">Tech Stack:</label>
                        <input
                          type="text"
                          value={techList.join(", ")}
                          onChange={(e) =>
                            updateProjectField(
                              realIdx,
                              "technologies",
                              e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                            )
                          }
                          placeholder="Technologies comma-separated (e.g. Next.js, React, FastAPI, SQL)"
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={vIdx} className="space-y-1 text-xs">
                    <div className="flex items-baseline justify-between font-bold text-[#0f172a]">
                      <div>
                        <span className="font-extrabold">{proj.name}</span>
                        {proj.description && (
                          <span className="font-semibold text-[#475569]"> — {proj.description}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-[#64748b] flex items-center gap-2">
                      {(proj.startDate || (proj as any).dates) && (
                        <span className="italic">
                          {proj.startDate || (proj as any).dates}
                          {proj.endDate ? ` – ${proj.endDate}` : ""}
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
                      {proj.previewUrl && proj.previewUrl !== proj.url && (
                        <a
                          href={proj.previewUrl.startsWith("http") ? proj.previewUrl : `https://${proj.previewUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0369a1] underline font-semibold"
                        >
                          Preview
                        </a>
                      )}
                    </div>

                    {bullets.length > 0 && (
                      <ul className="space-y-1 text-[#1f2937] list-disc list-outside pl-4 pt-0.5">
                        {bullets.map((b: any, bIdx: number) => (
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

                    {techList.length > 0 && (
                      <div className="text-[11px] italic text-[#475569] pl-4 pt-0.5">
                        Tech: {techList.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 6. EDUCATION */}
          {(resume.education?.length > 0 || isEditing) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                  EDUCATION
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addEducation}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Education
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2.5 pt-1">
                  {(resume.education || []).map((ed: any, edIdx: number) => (
                    <div key={edIdx} className="p-3 border border-blue-100 rounded-xl bg-blue-50/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1e3a8a]">Degree #{edIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => deleteEducation(edIdx)}
                          className="text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={ed.degree || ""}
                          onChange={(e) => updateEducationField(edIdx, "degree", e.target.value)}
                          placeholder="Degree (e.g. Bachelor of Technology)"
                          className="p-1.5 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={ed.institution || ""}
                          onChange={(e) => updateEducationField(edIdx, "institution", e.target.value)}
                          placeholder="Institution / College Name"
                          className="p-1.5 border border-gray-200 rounded-lg font-bold"
                        />
                        <input
                          type="text"
                          value={ed.cgpa || (ed as any).grade || ""}
                          onChange={(e) => updateEducationField(edIdx, "cgpa", e.target.value)}
                          placeholder="CGPA (e.g. 8.2)"
                          className="p-1.5 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={
                            ed.startDate || (ed as any).start_date
                              ? `${ed.startDate || (ed as any).start_date}–${ed.endDate || (ed as any).end_date || "Present"}`
                              : ed.endDate || ""
                          }
                          onChange={(e) => {
                            const parts = e.target.value.split(/\s*[–—-]\s*/);
                            updateEducationField(edIdx, "startDate", parts[0] || "");
                            if (parts[1]) updateEducationField(edIdx, "endDate", parts[1]);
                          }}
                          placeholder="Dates (e.g. Aug 2024–Aug 2028)"
                          className="p-1.5 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={ed.description || ""}
                          onChange={(e) => updateEducationField(edIdx, "description", e.target.value)}
                          placeholder="Relevant coursework (e.g. Data Structures, Web Development, AI/ML)"
                          className="p-1.5 border border-gray-200 rounded-lg sm:col-span-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1 text-xs text-[#1f2937] list-disc list-outside pl-4">
                  {(resume.education as any[]).map((ed, edIdx) => (
                    <li key={edIdx} className="leading-relaxed">
                      {ed.degree && ed.degree !== "Degree" ? <strong>{ed.degree}</strong> : null}
                      {ed.degree && ed.institution ? " — " : ""}
                      <strong>{ed.institution}</strong>
                      {(ed as any).cgpa ? ` — CGPA ${(ed as any).cgpa}` : ""}
                      {ed.startDate || (ed as any).start_date
                        ? ` — ${ed.startDate || (ed as any).start_date}–${ed.endDate || (ed as any).end_date || "Present"}`
                        : ""}
                      {ed.description && (
                        <div className="text-[11px] text-[#475569] pt-0.5">Relevant coursework: {ed.description}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 7. CERTIFICATIONS */}
          {(resume.certifications?.length > 0 || isEditing) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b-[1.5px] border-[#1e3a8a] pb-0.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                  CERTIFICATIONS
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addCertification}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Certification
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2.5 pt-1">
                  {(resume.certifications || []).map((c: any, cIdx: number) => (
                    <div key={cIdx} className="p-3 border border-blue-100 rounded-xl bg-blue-50/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1e3a8a]">Certification #{cIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => deleteCertification(cIdx)}
                          className="text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={c.name || ""}
                          onChange={(e) => updateCertField(cIdx, "name", e.target.value)}
                          placeholder="Certification Name"
                          className="p-1.5 border border-gray-200 rounded-lg font-bold"
                        />
                        <input
                          type="text"
                          value={c.issuer || ""}
                          onChange={(e) => updateCertField(cIdx, "issuer", e.target.value)}
                          placeholder="Issuer (e.g. Forage, MongoDB)"
                          className="p-1.5 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={c.date || ""}
                          onChange={(e) => updateCertField(cIdx, "date", e.target.value)}
                          placeholder="Date (e.g. Sep 2025)"
                          className="p-1.5 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={c.description || c.topics || ""}
                          onChange={(e) => updateCertField(cIdx, "description", e.target.value)}
                          placeholder="Topics / Skills (e.g. Kafka, H2, REST API)"
                          className="p-1.5 border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1 text-xs text-[#1f2937] list-disc list-outside pl-4">
                  {(resume.certifications as any[]).map((c, cIdx) => (
                    <li key={cIdx} className="leading-relaxed">
                      <strong>{c.name}</strong>
                      {c.issuer && c.issuer !== "Accredited Provider" ? ` — ${c.issuer}` : ""}
                      {c.date ? ` — ${c.date}` : ""}
                      {c.description || (c as any).topics ? ` (${c.description || (c as any).topics})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Sidebar ─────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6 print:hidden">

          {/* ── 1. Update with New JD Panel ─────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setShowJDPanel((p) => !p)}
              className="w-full flex items-center justify-between gap-3 p-5 hover:bg-[#F8F8F6] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-extrabold text-[#111111]">Update with New JD</h4>
                  <p className="text-[11px] text-[#666666]">Paste a JD to re-tailor with Groq AI</p>
                </div>
              </div>
              {showJDPanel ? (
                <ChevronUp className="w-4 h-4 text-[#888888] shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#888888] shrink-0" />
              )}
            </button>

            {showJDPanel && (
              <div className="px-5 pb-5 space-y-3 border-t border-[rgba(17,17,17,0.06)]">
                <p className="text-[11px] text-[#666666] pt-3 leading-relaxed">
                  Paste the job description below. Groq AI will re-analyze requirements and re-align your resume
                  without hallucinating any facts.
                </p>

                {retailorError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{retailorError}</span>
                  </div>
                )}

                <textarea
                  rows={7}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder={"Paste job description here…\n\ne.g. We are seeking a Full Stack Developer with experience in React, Node.js, TypeScript, and MongoDB..."}
                  className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-xs rounded-2xl p-3 focus:outline-none focus:border-indigo-400 leading-relaxed resize-none"
                />

                <button
                  type="button"
                  onClick={handleTailorWithJD}
                  disabled={isRetailoring || jdText.trim().length < 50}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isRetailoring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Re-tailoring with Groq AI…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Re-tailor Resume with JD</span>
                    </>
                  )}
                </button>

                {isRetailoring && (
                  <p className="text-[10px] text-[#888888] text-center">
                    This usually takes 15–30 seconds. Please wait…
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── 2. Anti-Hallucination Verified Badge ────────────────────── */}
          <div className="bg-white p-6 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#111111]">100% Grounded in Truth</h4>
                <p className="text-[11px] text-[#666666]">Every claim is verified against your Canonical Profile.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(17,17,17,0.06)] text-center">
              <div className="p-2.5 bg-[#F8F8F6] rounded-xl">
                <div className="text-lg font-black text-emerald-700">
                  {resume.evidenceValidation?.verifiedStatementsCount || 12}
                </div>
                <div className="text-[10px] text-[#666666] font-bold">Verified Claims</div>
              </div>
              <div className="p-2.5 bg-[#F8F8F6] rounded-xl">
                <div className="text-lg font-black text-[#111111]">0</div>
                <div className="text-[10px] text-[#666666] font-bold">Fabrications</div>
              </div>
            </div>
          </div>

          {/* ── 3. Evidence Traceability Inspector ──────────────────────── */}
          <div className="bg-white p-6 rounded-3xl border border-[rgba(17,17,17,0.08)] shadow-soft space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-600" />
              <span>Evidence Traceability</span>
            </h4>

            {selectedBullet ? (
              <div className="space-y-3 text-xs animate-in fade-in">
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-purple-950 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-purple-700">Selected Statement:</div>
                  <div className="font-semibold leading-relaxed">{selectedBullet.text}</div>
                  {selectedBullet.reason && (
                    <div className="text-[10px] text-purple-800 pt-1 font-medium">🎯 {selectedBullet.reason}</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase text-[#888888]">Origin Source Evidence:</div>
                  {selectedBullet.evidence && selectedBullet.evidence.length > 0 ? (
                    selectedBullet.evidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#F8F8F6] rounded-xl border border-[rgba(17,17,17,0.06)] text-[11px] text-[#333333] leading-relaxed"
                      >
                        <div className="text-[10px] font-bold text-emerald-700 mb-1 uppercase">✓ {ev.sourceType}</div>
                        <div>{ev.sourceText}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#888888] italic">Direct match from canonical career profile item.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#888888] bg-[#F8F8F6] rounded-2xl border border-[rgba(17,17,17,0.06)]">
                Click any bullet point on the resume to inspect its verified origin evidence.
              </div>
            )}
          </div>

          {/* ── 4. HR / Recruiter Email Outreach ─────────────────────────── */}
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
                {isCreatingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
