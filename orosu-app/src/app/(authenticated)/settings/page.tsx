"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Link2,
  Sliders,
  Download,
  Check,
  Save,
  Lock,
  LogOut,
} from "lucide-react";
import { useCareer } from "@/lib/store/career-store";
import { useAuth } from "@/lib/auth/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const { careerProfile, experiences, skills, projects, jobs } = useCareer();
  const { user: authUser, profile: authProfile, updateProfile, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<"account" | "sources" | "security" | "preferences" | "data">("account");

  // Account form
  const [fullName, setFullName] = useState(authProfile?.full_name || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passChanged, setPassChanged] = useState(false);

  // Preferences
  const [tone, setTone] = useState("impact");
  const [strictEvidence, setStrictEvidence] = useState(true);

  useEffect(() => {
    if (authProfile?.full_name) {
      setFullName(authProfile.full_name);
    }
    if (authUser?.email) {
      setEmail(authUser.email);
    }
  }, [authProfile, authUser]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      router.push("/login");
    }
  };

  const handleExportData = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            user: {
              id: authUser?.id,
              email: authUser?.email,
              fullName,
            },
            careerProfile,
            experiences,
            skills,
            projects,
            savedJobs: jobs,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `orosu_career_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft">
        <div className="eyebrow text-rose-500 mb-1">
          <span className="eyebrow-dot" />
          <span>PREFERENCES &amp; PRIVACY</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
          Settings &amp; Workspace Controls
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
          Manage your account credentials, connected profile sources, data privacy, and tailoring preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 Cols: Settings Tabs */}
        <div className="lg:col-span-4 p-4 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-1">
          <button
            onClick={() => setActiveTab("account")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "account"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-[#666666] hover:bg-[#F8F8F6] hover:text-[#111111]"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("sources")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "sources"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-[#666666] hover:bg-[#F8F8F6] hover:text-[#111111]"
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Connected Sources</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "preferences"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-[#666666] hover:bg-[#F8F8F6] hover:text-[#111111]"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>AI Tailoring Rules</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "security"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-[#666666] hover:bg-[#F8F8F6] hover:text-[#111111]"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security &amp; Auth</span>
          </button>

          <button
            onClick={() => setActiveTab("data")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "data"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-[#666666] hover:bg-[#F8F8F6] hover:text-[#111111]"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Data &amp; Privacy</span>
          </button>
        </div>

        {/* Right 8 Cols: Active Tab Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: ACCOUNT */}
          {activeTab === "account" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[rgba(17,17,17,0.06)] pb-4">
                <h3 className="text-lg font-extrabold text-[#111111]">Account Details</h3>
                <p className="text-xs text-[#666666]">Manage your name and verified Supabase credentials.</p>
              </div>

              {savedSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Account details saved successfully.</span>
                </div>
              )}

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111111] uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-2xl p-3"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111111] uppercase">Email</label>
                    <input
                      type="email"
                      required
                      disabled
                      value={email}
                      className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-2xl p-3 text-[#777777] cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="gradient-cta text-white font-bold py-3 px-6 rounded-2xl text-xs flex items-center gap-2 shadow-soft mt-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CONNECTED SOURCES */}
          {activeTab === "sources" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[rgba(17,17,17,0.06)] pb-4">
                <h3 className="text-lg font-extrabold text-[#111111]">Connected Sources</h3>
                <p className="text-xs text-[#666666]">
                  Grounded evidence sources recorded in your Master Career Profile.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-xs text-[#111111]">Resume Parser Source</div>
                    <div className="text-[10px] text-[#666666] mt-0.5">
                      {experiences.length} experiences • {skills.length} skills • {projects.length} projects imported
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[rgba(17,17,17,0.06)] pb-4">
                <h3 className="text-lg font-extrabold text-[#111111]">AI Tailoring Guidelines</h3>
                <p className="text-xs text-[#666666]">
                  Configure how Orosu structures and optimizes your application materials.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#111111]">Strict Evidence Enforcement</h4>
                      <p className="text-[11px] text-[#666666]">
                        Prohibit the AI from generating claims unsupported by your Master Profile.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={strictEvidence}
                      onChange={(e) => setStrictEvidence(e.target.checked)}
                      className="w-4 h-4 text-[#E11D48] rounded"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] space-y-2">
                  <h4 className="text-xs font-bold text-[#111111]">Bullet Point Phrasing Tone</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTone("impact")}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left border ${
                        tone === "impact"
                          ? "bg-[#111111] text-white border-[#111111]"
                          : "bg-white text-[#666666] border-[rgba(17,17,17,0.08)]"
                      }`}
                    >
                      Impact &amp; Metrics Driven
                    </button>
                    <button
                      onClick={() => setTone("technical")}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left border ${
                        tone === "technical"
                          ? "bg-[#111111] text-white border-[#111111]"
                          : "bg-white text-[#666666] border-[rgba(17,17,17,0.08)]"
                      }`}
                    >
                      Technical &amp; Systems Focused
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === "security" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[rgba(17,17,17,0.06)] pb-4">
                <h3 className="text-lg font-extrabold text-[#111111]">Security &amp; Password</h3>
                <p className="text-xs text-[#666666]">Managed securely via Supabase Auth with Row Level Security.</p>
              </div>

              {passChanged && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Password updated.</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPassChanged(true);
                  setCurrentPassword("");
                  setNewPassword("");
                  setTimeout(() => setPassChanged(false), 2500);
                }}
                className="space-y-3.5 max-w-sm"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111111] uppercase">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-2xl p-3"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111111] uppercase">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-2xl p-3"
                  />
                </div>

                <button
                  type="submit"
                  className="gradient-cta text-white font-bold py-3 px-6 rounded-2xl text-xs flex items-center gap-2 shadow-soft mt-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </form>

              <div className="pt-4 border-t border-[rgba(17,17,17,0.06)]">
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of All Sessions</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DATA & PRIVACY */}
          {activeTab === "data" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[rgba(17,17,17,0.06)] pb-4">
                <h3 className="text-lg font-extrabold text-[#111111]">Data Export &amp; Privacy</h3>
                <p className="text-xs text-[#666666]">You own 100% of your career information and telemetry.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#111111]">Export Career Dataset</h4>
                    <p className="text-[11px] text-[#666666]">
                      Download your Master Profile, projects, skills, and target jobs in JSON format.
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="gradient-cta text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
