"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  UploadCloud,
  Globe,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  FileCheck,
  Edit2,
  Plus,
  Trash2,
  Check,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCareer } from "@/lib/store/career-store";
import { resumeApi, profileApi } from "@/lib/api/client";
import { StructuredCareerProfile } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { saveCareerProfile } = useCareer();

  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basics
  const [fullName, setFullName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");

  // Step 2: Resume upload & parsing
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [rawResumeText, setRawResumeText] = useState("");

  // Step 3: Sources
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Step 4: Structured Profile Draft for Review
  const [profileDraft, setProfileDraft] = useState<StructuredCareerProfile>({
    basics: {
      name: "",
      email: "",
      phone: "",
      location: "",
      headline: "",
      linkedin: "",
      portfolio: "",
    },
    summary: "",
    experiences: [],
    projects: [],
    skills: [],
    education: [],
    certifications: [],
  });

  const [newSkillInput, setNewSkillInput] = useState("");
  const [editingSummary, setEditingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync user initial name if available
  useEffect(() => {
    if (user && !fullName) {
      const name = profile?.full_name || (user.user_metadata?.full_name as string) || "";
      setFullName(name);
      setProfileDraft((prev) => ({
        ...prev,
        basics: {
          ...prev.basics,
          name: name || prev.basics.name,
          email: user.email || prev.basics.email,
        },
      }));
    }
  }, [user, profile, fullName]);

  const steps = [
    { num: 1, label: "Profile" },
    { num: 2, label: "Resume" },
    { num: 3, label: "Sources" },
    { num: 4, label: "Review" },
    { num: 5, label: "Ready" },
  ];

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit. Please upload a smaller resume.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setFileName(file.name);

    try {
      const response = await resumeApi.upload(file);
      setRawResumeText(response.rawText);

      // Merge parsed profile with user inputs
      setProfileDraft({
        ...response.parsedProfile,
        basics: {
          ...response.parsedProfile.basics,
          name: fullName || response.parsedProfile.basics.name,
          headline: headline || response.parsedProfile.basics.headline || currentRole,
          location: location || response.parsedProfile.basics.location,
          email: user?.email || response.parsedProfile.basics.email,
        },
      });

      if (response.parsedProfile.basics.name && !fullName) {
        setFullName(response.parsedProfile.basics.name);
      }
      if (response.parsedProfile.basics.headline && !headline) {
        setHeadline(response.parsedProfile.basics.headline);
        setCurrentRole(response.parsedProfile.basics.headline);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to parse resume. Please ensure it is a valid PDF or DOCX file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileDraft((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        name: fullName,
        headline: headline || currentRole,
        location,
        email: user?.email || prev.basics.email,
      },
    }));
    setCurrentStep(2);
  };

  const handleStep3Submit = () => {
    setProfileDraft((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        linkedin: linkedinUrl,
        portfolio: portfolioUrl,
      },
    }));
    setCurrentStep(4);
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    setProfileDraft((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: newSkillInput.trim(), category: "General", source: "user" }],
    }));
    setNewSkillInput("");
  };

  const handleDeleteSkill = (index: number) => {
    setProfileDraft((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteExperience = (index: number) => {
    setProfileDraft((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteProject = (index: number) => {
    setProfileDraft((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      await saveCareerProfile(profileDraft, rawResumeText);
      await profileApi.updateProfile({ onboarding_completed: true });
      await refreshProfile();
      setCurrentStep(5);
    } catch (err: any) {
      alert("Failed to save profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Orosu Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-[#111111]">OROSU</span>
        </div>

        <div className="text-xs font-bold text-[#666666]">
          Step <span className="text-[#111111]">{currentStep}</span> of 5
        </div>
      </div>

      {/* Step Indicators */}
      <div className="max-w-xl w-full mx-auto my-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[rgba(17,17,17,0.08)] z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#7E22CE] to-[#E11D48] transition-all duration-300 z-0"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-[#111111] text-white ring-4 ring-rose-500/20"
                      : "bg-[#F1F1ED] text-[#888888]"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : `0${s.num}`}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isCurrent ? "text-[#111111]" : "text-[#888888]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl w-full mx-auto my-auto">
        <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-[rgba(17,17,17,0.08)] shadow-2xl p-6 sm:p-10 transition-all">
          {/* ============================================================ */}
          {/* STEP 1: PROFILE IDENTITY */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="eyebrow text-rose-500">
                  <span className="eyebrow-dot" />
                  <span>STEP 01 — IDENTITY</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  Let&apos;s build your career profile.
                </h2>
                <p className="text-xs sm:text-sm text-[#666666]">
                  Enter your core career information to calibrate your workspace.
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Current role *
                    </label>
                    <input
                      type="text"
                      required
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Professional headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Full Stack Architect specializing in React, Next.js & Node.js"
                    className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl px-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full gradient-cta text-white font-bold py-3.5 px-6 rounded-2xl text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: RESUME UPLOAD & PARSING */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="eyebrow text-rose-500">
                  <span className="eyebrow-dot" />
                  <span>STEP 02 — EXTRACTION</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  Start with your resume.
                </h2>
                <p className="text-xs sm:text-sm text-[#666666]">
                  Upload your current resume (PDF or DOCX). Orosu extracts and structures the information inside it.
                </p>
              </div>

              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                  e.target.value = "";
                }}
              />

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className={`border-2 border-dashed p-8 rounded-3xl text-center cursor-pointer transition-all group ${
                  isDragging
                    ? "border-[#E11D48] bg-[#FFF1F2] scale-[1.01]"
                    : "border-[rgba(17,17,17,0.15)] hover:border-[#E11D48] bg-[#F8F8F6] hover:bg-[#F1F1ED]"
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm flex items-center justify-center text-[#E11D48] mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm text-[#111111]">
                  Click to select your resume, or <span className="text-[#E11D48]">browse files</span>
                </div>
                <p className="text-xs text-[#888888] mt-1">Supports PDF or DOCX up to 10MB</p>
              </div>

              {/* Uploading progress indicator */}
              {isUploading && (
                <div className="p-5 rounded-2xl bg-[#111111] text-white space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-rose-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Parsing and structuring resume contents...
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7E22CE] via-[#E11D48] to-[#F97316] animate-shimmer" />
                  </div>
                </div>
              )}

              {/* Extracted Stats Preview */}
              {rawResumeText && !isUploading && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Resume parsed: {fileName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                      Extracted
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <div className="text-base font-extrabold text-[#111111]">
                        {profileDraft.experiences.length}
                      </div>
                      <div className="text-[10px] text-[#666666]">Positions</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <div className="text-base font-extrabold text-[#111111]">
                        {profileDraft.projects.length}
                      </div>
                      <div className="text-[10px] text-[#666666]">Projects</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <div className="text-base font-extrabold text-[#111111]">
                        {profileDraft.skills.length}
                      </div>
                      <div className="text-[10px] text-[#666666]">Skills</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <div className="text-base font-extrabold text-[#111111]">
                        {profileDraft.education.length + profileDraft.certifications.length}
                      </div>
                      <div className="text-[10px] text-[#666666]">Credentials</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3 rounded-2xl border border-[rgba(17,17,17,0.12)] text-xs font-bold text-[#666666] hover:text-[#111111] hover:bg-[#F8F8F6] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={isUploading}
                  className="flex-1 gradient-cta text-white font-bold py-3.5 px-6 rounded-2xl text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span>Continue to Sources</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SOURCES */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="eyebrow text-rose-500">
                  <span className="eyebrow-dot" />
                  <span>STEP 03 — SOURCES</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  Add more context.
                </h2>
                <p className="text-xs sm:text-sm text-[#666666]">
                  Optionally link your LinkedIn and portfolio URLs to anchor your Master Profile.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                    LinkedIn profile URL (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-[#888888]">in/</span>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl pl-10 pr-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Portfolio or GitHub URL (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="w-4 h-4 text-[#888888] absolute left-3.5" />
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-[#111111] text-sm rounded-2xl pl-10 pr-4 py-3 min-h-[46px] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] text-[11px] text-[#666666] leading-relaxed">
                  💡 <strong>Deterministic Extraction:</strong> In Phase 1, all profile items are saved securely in your PostgreSQL database with Row Level Security.
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 rounded-2xl border border-[rgba(17,17,17,0.12)] text-xs font-bold text-[#666666] hover:text-[#111111] hover:bg-[#F8F8F6] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStep3Submit()}
                  className="px-4 py-3 text-xs font-bold text-[#666666] hover:text-[#111111]"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={() => handleStep3Submit()}
                  className="flex-1 gradient-cta text-white font-bold py-3.5 px-6 rounded-2xl text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Review Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: REVIEW & CONFIRM EXTRACTED DATA */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="eyebrow text-rose-500">
                    <span className="eyebrow-dot" />
                    <span>STEP 04 — REVIEW</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                    Review extracted profile.
                  </h2>
                  <p className="text-xs sm:text-sm text-[#666666]">
                    You can edit, add, or delete any extracted information before saving to PostgreSQL.
                  </p>
                </div>
              </div>

              {/* Review sections */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {/* Summary */}
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Professional Summary
                    </span>
                    <button
                      onClick={() => setEditingSummary(!editingSummary)}
                      className="text-xs font-bold text-[#E11D48] hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{editingSummary ? "Done" : "Edit"}</span>
                    </button>
                  </div>
                  {editingSummary ? (
                    <textarea
                      value={profileDraft.summary}
                      onChange={(e) =>
                        setProfileDraft({ ...profileDraft, summary: e.target.value })
                      }
                      className="w-full bg-white border border-[rgba(17,17,17,0.15)] text-xs rounded-xl p-3 min-h-[90px] text-[#111111]"
                    />
                  ) : (
                    <p className="text-xs text-[#555555] leading-relaxed">
                      {profileDraft.summary || "No summary provided."}
                    </p>
                  )}
                </div>

                {/* Experience */}
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] space-y-2.5">
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Work Experience ({profileDraft.experiences.length})
                  </span>
                  <div className="space-y-2">
                    {profileDraft.experiences.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-[rgba(17,17,17,0.06)] flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#111111]">{exp.role}</div>
                          <div className="text-[11px] text-[#666666]">{exp.company}</div>
                          {exp.achievements && exp.achievements.length > 0 && (
                            <ul className="list-disc list-inside text-[11px] text-[#555555] mt-1 space-y-0.5">
                              {exp.achievements.slice(0, 2).map((a, aIdx) => (
                                <li key={aIdx} className="truncate">
                                  {typeof a === "string" ? a : a.text}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteExperience(idx)}
                          className="text-[#AAAAAA] hover:text-rose-600 p-1"
                          title="Delete experience"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {profileDraft.experiences.length === 0 && (
                      <p className="text-xs text-[#888888]">No experiences extracted.</p>
                    )}
                  </div>
                </div>

                {/* Projects */}
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] space-y-2.5">
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Projects ({profileDraft.projects.length})
                  </span>
                  <div className="space-y-2">
                    {profileDraft.projects.map((prj, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-[rgba(17,17,17,0.06)] flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#111111]">{prj.name}</div>
                          <div className="text-[11px] text-[#666666]">{prj.description}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteProject(idx)}
                          className="text-[#AAAAAA] hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Skills ({profileDraft.skills.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="bg-white border border-[rgba(17,17,17,0.1)] text-xs rounded-xl px-3 py-2 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3 py-2 rounded-xl gradient-cta text-white text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profileDraft.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-white border border-[rgba(17,17,17,0.08)] text-xs font-semibold text-[#111111] flex items-center gap-1.5"
                      >
                        <span>{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(idx)}
                          className="text-[#AAAAAA] hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-3 rounded-2xl border border-[rgba(17,17,17,0.12)] text-xs font-bold text-[#666666] hover:text-[#111111] hover:bg-[#F8F8F6] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSave}
                  disabled={isSaving}
                  className="flex-1 gradient-cta text-white font-bold py-3.5 px-6 rounded-2xl text-sm min-h-[48px] shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Saving to Database...</span>
                  ) : (
                    <>
                      <span>Save &amp; Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: READY */}
          {/* ============================================================ */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#E11D48] via-[#FB7185] to-[#F97316] flex items-center justify-center text-white shadow-glow">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="eyebrow text-rose-500 justify-center">
                  <span className="eyebrow-dot" />
                  <span>PROFILE SAVED</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
                  Your career profile is ready.
                </h2>
                <p className="text-xs sm:text-sm text-[#666666] max-w-md mx-auto">
                  Your Master Career Profile has been structured and stored in Supabase PostgreSQL.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)]">
                  <div className="text-xs font-bold text-[#666666]">Completeness</div>
                  <div className="text-2xl font-extrabold text-rose-600 mt-1">
                    {profile?.profile_completion || 80}%
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)]">
                  <div className="text-xs font-bold text-[#666666]">Experiences</div>
                  <div className="text-2xl font-extrabold text-[#111111] mt-1">
                    {profileDraft.experiences.length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)]">
                  <div className="text-xs font-bold text-[#666666]">Projects</div>
                  <div className="text-2xl font-extrabold text-[#111111] mt-1">
                    {profileDraft.projects.length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)]">
                  <div className="text-xs font-bold text-[#666666]">Skills</div>
                  <div className="text-2xl font-extrabold text-[#111111] mt-1">
                    {profileDraft.skills.length}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto min-w-[280px] gradient-cta text-white font-extrabold py-4 px-8 rounded-2xl text-base shadow-soft inline-flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-105"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#888888] pt-4">
        Orosu Career Intelligence Platform © 2026. All rights reserved.
      </div>
    </div>
  );
}
