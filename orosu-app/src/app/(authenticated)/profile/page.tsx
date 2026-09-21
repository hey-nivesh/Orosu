"use client";

import React, { useState } from "react";
import {
  User,
  Briefcase,
  FolderGit2,
  Cpu,
  GraduationCap,
  Award,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCareer } from "@/lib/store/career-store";
import { Modal } from "@/components/ui/Modal";
import { ExperienceItem, ProjectItem, SkillItem, EducationItem, CertificationItem } from "@/types";

export default function CareerProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const {
    careerProfile,
    experiences,
    projects,
    skills,
    education,
    certifications,
    saveCareerProfile,
    isLoading,
  } = useCareer();

  // Modals state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpIdx, setEditingExpIdx] = useState<number | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectIdx, setEditingProjectIdx] = useState<number | null>(null);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);

  // Forms
  const [summaryDraft, setSummaryDraft] = useState(careerProfile?.summary || "");

  const [expForm, setExpForm] = useState<ExperienceItem>({
    company: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    achievements: [],
  });
  const [expAchievementsInput, setExpAchievementsInput] = useState("");

  const [projectForm, setProjectForm] = useState<ProjectItem>({
    name: "",
    description: "",
    technologies: [],
    url: "",
    achievements: [],
  });
  const [projectTechInput, setProjectTechInput] = useState("");
  const [projectAchievementsInput, setProjectAchievementsInput] = useState("");

  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "General",
  });

  const handleOpenExpModal = (exp?: ExperienceItem, idx?: number) => {
    if (exp !== undefined && idx !== undefined) {
      setEditingExpIdx(idx);
      setExpForm({ ...exp });
      setExpAchievementsInput((exp.achievements || []).join("\n"));
    } else {
      setEditingExpIdx(null);
      setExpForm({
        company: "",
        role: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        achievements: [],
      });
      setExpAchievementsInput("");
    }
    setIsExpModalOpen(true);
  };

  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    const achievements = expAchievementsInput
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const updatedItem: ExperienceItem = {
      ...expForm,
      achievements,
    };

    let newExperiences = [...experiences];
    if (editingExpIdx !== null) {
      newExperiences[editingExpIdx] = updatedItem;
    } else {
      newExperiences = [updatedItem, ...newExperiences];
    }

    await saveCareerProfile({
      basics: {
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        headline: careerProfile?.professional_headline || "",
        linkedin: "",
        portfolio: "",
      },
      summary: careerProfile?.summary || "",
      experiences: newExperiences,
      projects,
      skills,
      education,
      certifications,
    });

    setIsExpModalOpen(false);
  };

  const handleDeleteExp = async (idx: number) => {
    const newExperiences = experiences.filter((_, i) => i !== idx);
    await saveCareerProfile({
      basics: {
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        headline: careerProfile?.professional_headline || "",
        linkedin: "",
        portfolio: "",
      },
      summary: careerProfile?.summary || "",
      experiences: newExperiences,
      projects,
      skills,
      education,
      certifications,
    });
  };

  const handleOpenProjectModal = (prj?: ProjectItem, idx?: number) => {
    if (prj !== undefined && idx !== undefined) {
      setEditingProjectIdx(idx);
      setProjectForm({ ...prj });
      setProjectTechInput((prj.technologies || []).join(", "));
      setProjectAchievementsInput((prj.achievements || []).join("\n"));
    } else {
      setEditingProjectIdx(null);
      setProjectForm({
        name: "",
        description: "",
        technologies: [],
        url: "",
        achievements: [],
      });
      setProjectTechInput("");
      setProjectAchievementsInput("");
    }
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const technologies = projectTechInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const achievements = projectAchievementsInput
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const updatedItem: ProjectItem = {
      ...projectForm,
      technologies,
      achievements,
    };

    let newProjects = [...projects];
    if (editingProjectIdx !== null) {
      newProjects[editingProjectIdx] = updatedItem;
    } else {
      newProjects = [updatedItem, ...newProjects];
    }

    await saveCareerProfile({
      basics: {
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        headline: careerProfile?.professional_headline || "",
        linkedin: "",
        portfolio: "",
      },
      summary: careerProfile?.summary || "",
      experiences,
      projects: newProjects,
      skills,
      education,
      certifications,
    });

    setIsProjectModalOpen(false);
  };

  const handleDeleteProject = async (idx: number) => {
    const newProjects = projects.filter((_, i) => i !== idx);
    await saveCareerProfile({
      basics: {
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        headline: careerProfile?.professional_headline || "",
        linkedin: "",
        portfolio: "",
      },
      summary: careerProfile?.summary || "",
      experiences,
      projects: newProjects,
      skills,
      education,
      certifications,
    });
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name.trim()) return;

    const newSkills = [
      ...skills,
      { name: skillForm.name.trim(), category: skillForm.category || "General" },
    ];

    await saveCareerProfile({
      basics: {
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        headline: careerProfile?.professional_headline || "",
        linkedin: "",
        portfolio: "",
      },
      summary: careerProfile?.summary || "",
      experiences,
      projects,
      skills: newSkills,
      education,
      certifications,
    });

    setSkillForm({ name: "", category: "General" });
    setIsAddSkillOpen(false);
  };

  const handleDeleteSkill = async (idx: number) => {
    const newSkills = skills.filter((_, i) => i !== idx);
    await saveCareerProfile({
      basics: {
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        headline: careerProfile?.professional_headline || "",
        linkedin: "",
        portfolio: "",
      },
      summary: careerProfile?.summary || "",
      experiences,
      projects,
      skills: newSkills,
      education,
      certifications,
    });
  };

  const handleSaveSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCareerProfile({
      basics: {
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        headline: careerProfile?.professional_headline || "",
        linkedin: "",
        portfolio: "",
      },
      summary: summaryDraft,
      experiences,
      projects,
      skills,
      education,
      certifications,
    });
    setIsSummaryModalOpen(false);
  };

  const completionScore = profile?.profile_completion || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="eyebrow text-rose-500">
            <span className="eyebrow-dot" />
            <span>CANONICAL DATASET</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Master Career Profile
          </h2>
          <p className="text-xs sm:text-sm text-[#666666]">
            Your structured source of truth stored in Supabase PostgreSQL.
          </p>
        </div>

        <div className="p-4 px-6 rounded-2xl bg-[#111111] text-white flex items-center gap-5 shrink-0 shadow-lg">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Profile Completeness
            </div>
            <div className="text-2xl font-extrabold">{completionScore}%</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-white/20 flex items-center justify-center relative">
            <Sparkles className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Grid: Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Summary, Experience, Projects */}
        <div className="lg:col-span-8 space-y-8">
          {/* Summary Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(17,17,17,0.06)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#111111]">Professional Summary</h3>
                <p className="text-xs text-[#666666]">Core career narrative</p>
              </div>
              <button
                onClick={() => {
                  setSummaryDraft(careerProfile?.summary || "");
                  setIsSummaryModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-[rgba(17,17,17,0.12)] text-xs font-bold text-[#111111] hover:bg-[#F8F8F6] flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#666666]" />
                <span>Edit</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
              {careerProfile?.summary || "No professional summary added yet. Click edit to write one."}
            </p>
          </div>

          {/* Experience Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(17,17,17,0.06)] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#111111]">Work Experience</h3>
                  <p className="text-xs text-[#666666]">{experiences.length} positions recorded</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenExpModal()}
                className="px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Position</span>
              </button>
            </div>

            <div className="space-y-4">
              {experiences.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className="p-5 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#111111]">{exp.role}</h4>
                      <div className="text-xs text-[#666666] font-semibold mt-0.5">
                        {exp.company} {exp.location ? `• ${exp.location}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenExpModal(exp, idx)}
                        className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExp(idx)}
                        className="p-1.5 text-[#888888] hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="space-y-1 text-xs text-[#444444] list-disc list-inside">
                      {exp.achievements.map((bullet, bIdx) => (
                        <li key={bIdx}>{typeof bullet === "string" ? bullet : bullet.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {experiences.length === 0 && (
                <div className="text-center py-6 text-xs text-[#888888]">
                  No experiences recorded yet. Click &ldquo;Add Position&rdquo; above.
                </div>
              )}
            </div>
          </div>

          {/* Projects Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(17,17,17,0.06)] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#111111]">Featured Projects</h3>
                  <p className="text-xs text-[#666666]">{projects.length} portfolio items</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenProjectModal()}
                className="px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {projects.map((prj, idx) => (
                <div
                  key={prj.id || idx}
                  className="p-5 rounded-2xl bg-[#F8F8F6] border border-[rgba(17,17,17,0.06)] space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#111111]">{prj.name}</h4>
                      {prj.description && (
                        <p className="text-xs text-[#666666] mt-0.5">{prj.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenProjectModal(prj, idx)}
                        className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(idx)}
                        className="p-1.5 text-[#888888] hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {prj.technologies && prj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {prj.technologies.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md bg-white border border-[rgba(17,17,17,0.08)] text-[10px] font-bold text-[#666666]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center py-6 text-xs text-[#888888]">
                  No projects recorded yet. Click &ldquo;Add Project&rdquo; above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Skills, Education, Certifications */}
        <div className="lg:col-span-4 space-y-8">
          {/* Skills Card */}
          <div className="p-6 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(17,17,17,0.06)] pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-extrabold text-[#111111]">
                  Technical Skills ({skills.length})
                </h3>
              </div>
              <button
                onClick={() => setIsAddSkillOpen(true)}
                className="text-xs font-bold text-[#E11D48] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={skill.id || idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.08)] text-xs font-semibold text-[#111111]"
                >
                  <span>{skill.name}</span>
                  <button
                    onClick={() => handleDeleteSkill(idx)}
                    className="text-[#AAAAAA] hover:text-rose-600 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {skills.length === 0 && (
                <p className="text-xs text-[#888888]">No skills recorded.</p>
              )}
            </div>
          </div>

          {/* Education Card */}
          <div className="p-6 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-[rgba(17,17,17,0.06)] pb-3">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-[#111111]">
                Education ({education.length})
              </h3>
            </div>

            <div className="space-y-2">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="text-xs space-y-0.5">
                  <div className="font-bold text-[#111111]">{edu.institution}</div>
                  <div className="text-[#666666]">{edu.degree || edu.field}</div>
                </div>
              ))}
              {education.length === 0 && (
                <p className="text-xs text-[#888888]">No education recorded.</p>
              )}
            </div>
          </div>

          {/* Certifications Card */}
          <div className="p-6 rounded-3xl bg-white border border-[rgba(17,17,17,0.08)] shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-[rgba(17,17,17,0.06)] pb-3">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-extrabold text-[#111111]">
                Certifications ({certifications.length})
              </h3>
            </div>

            <div className="space-y-2">
              {certifications.map((cert, idx) => (
                <div key={cert.id || idx} className="text-xs space-y-0.5">
                  <div className="font-bold text-[#111111]">{cert.name}</div>
                  <div className="text-[#666666]">{cert.issuer}</div>
                </div>
              ))}
              {certifications.length === 0 && (
                <p className="text-xs text-[#888888]">No certifications recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Edit Summary */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Edit Professional Summary"
      >
        <form onSubmit={handleSaveSummary} className="space-y-4">
          <textarea
            required
            value={summaryDraft}
            onChange={(e) => setSummaryDraft(e.target.value)}
            className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-xl p-4 min-h-[160px] text-[#111111]"
          />
          <button
            type="submit"
            className="w-full gradient-cta text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Summary</span>
          </button>
        </form>
      </Modal>

      {/* MODAL: Experience */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title={editingExpIdx !== null ? "Edit Position" : "Add Position"}
      >
        <form onSubmit={handleSaveExp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111111] uppercase">Company *</label>
            <input
              type="text"
              required
              value={expForm.company}
              onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
              className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-xl p-3"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111111] uppercase">Role *</label>
            <input
              type="text"
              required
              value={expForm.role}
              onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
              className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-xl p-3"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111111] uppercase">Achievements (1 per line)</label>
            <textarea
              rows={4}
              value={expAchievementsInput}
              onChange={(e) => setExpAchievementsInput(e.target.value)}
              className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-xl p-3"
            />
          </div>

          <button
            type="submit"
            className="w-full gradient-cta text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-4 h-4" />
            <span>Save Position</span>
          </button>
        </form>
      </Modal>

      {/* MODAL: Project */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={editingProjectIdx !== null ? "Edit Project" : "Add Project"}
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111111] uppercase">Project Name *</label>
            <input
              type="text"
              required
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-xl p-3"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111111] uppercase">Description</label>
            <input
              type="text"
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-xl p-3"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111111] uppercase">Technologies (comma-separated)</label>
            <input
              type="text"
              value={projectTechInput}
              onChange={(e) => setProjectTechInput(e.target.value)}
              className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-xl p-3"
            />
          </div>

          <button
            type="submit"
            className="w-full gradient-cta text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-4 h-4" />
            <span>Save Project</span>
          </button>
        </form>
      </Modal>

      {/* MODAL: Add Skill */}
      <Modal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        title="Add Technical Skill"
      >
        <form onSubmit={handleSaveSkill} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111111] uppercase">Skill Name *</label>
            <input
              type="text"
              required
              value={skillForm.name}
              onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              placeholder="e.g. Next.js"
              className="w-full bg-[#F8F8F6] border border-[rgba(17,17,17,0.1)] text-xs rounded-xl p-3"
            />
          </div>

          <button
            type="submit"
            className="w-full gradient-cta text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 mt-4"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </form>
      </Modal>
    </div>
  );
}
