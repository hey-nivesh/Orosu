import { z } from "zod";

// ============================================================================
// 1. Lossless Document Intermediate Representation (IR) Schemas
// ============================================================================

export const BlockTypeSchema = z.enum([
  "heading",
  "subheading",
  "paragraph",
  "bullet",
  "metadata",
  "contact",
  "table_row",
]);

export const BlockIRSchema = z.object({
  id: z.string(),
  type: BlockTypeSchema,
  text: z.string(),
  sourceIndex: z.number().default(0),
  pageNumber: z.number().optional(),
  formatting: z
    .object({
      isBold: z.boolean().optional(),
      isItalic: z.boolean().optional(),
      fontSize: z.number().optional(),
    })
    .optional(),
});

export const SectionHeadingSchema = z.object({
  original: z.string(),
  normalized: z.enum([
    "summary",
    "experience",
    "projects",
    "skills",
    "education",
    "certifications",
    "leadership",
    "achievements",
    "publications",
    "volunteer",
    "awards",
    "contact",
    "other",
  ]),
});

export const SectionIRSchema = z.object({
  id: z.string(),
  heading: SectionHeadingSchema,
  order: z.number(),
  pageStart: z.number().optional(),
  pageEnd: z.number().optional(),
  blocks: z.array(BlockIRSchema).default([]),
  rawText: z.string(),
});

export const DocumentMetadataSchema = z.object({
  fileName: z.string(),
  fileType: z.enum(["pdf", "docx", "doc", "txt", "unknown"]),
  fileSize: z.number().optional(),
  pageCount: z.number().default(1),
  charCount: z.number().default(0),
  uploadedAt: z.string().default(() => new Date().toISOString()),
});

export const DocumentIRSchema = z.object({
  document: DocumentMetadataSchema,
  rawText: z.string(),
  sections: z.array(SectionIRSchema).default([]),
  extractionConfidence: z.number().min(0).max(1).default(1),
  extractionMethod: z.enum(["deterministic", "hybrid", "llm"]).default("deterministic"),
});

export type BlockIR = z.infer<typeof BlockIRSchema>;
export type SectionIR = z.infer<typeof SectionIRSchema>;
export type DocumentIR = z.infer<typeof DocumentIRSchema>;

// ============================================================================
// 2. Provenance-Aware Structured Career Profile Schemas
// ============================================================================

export const SourceProvenanceSchema = z.object({
  section: z.string().optional(),
  sourceBlockId: z.string().optional(),
  sourceText: z.string().optional(),
  confidence: z.number().default(1),
});

export const AchievementItemSchema = z.object({
  text: z.string(),
  sourceBlockId: z.string().optional(),
  sourceText: z.string().optional(),
});

export const BasicsSchema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  headline: z.string().default(""),
  linkedin: z.string().default(""),
  portfolio: z.string().default(""),
});

export const ExperienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  isCurrent: z.boolean().optional().default(false),
  description: z.string().optional().default(""),
  achievements: z.array(z.union([z.string(), AchievementItemSchema])).default([]),
  bullets: z.array(z.string()).optional(),
  sourceBlockIds: z.array(z.string()).optional().default([]),
  source: z.string().default("resume"),
});

export const ProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().default(""),
  technologies: z.array(z.string()).default([]),
  url: z.string().optional().default(""),
  achievements: z.array(z.union([z.string(), AchievementItemSchema])).default([]),
  bullets: z.array(z.string()).optional(),
  sourceBlockIds: z.array(z.string()).optional().default([]),
  source: z.string().default("resume"),
});

export const SkillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Skill name is required"),
  category: z.string().optional().default("General"),
  proficiency: z.enum(["Expert", "Proficient", "Familiar"]).optional(),
  sourceBlockId: z.string().optional(),
  source: z.string().default("resume"),
});

export const EducationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().optional().default(""),
  field: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  description: z.string().optional().default(""),
  sourceBlockIds: z.array(z.string()).optional().default([]),
});

export const CertificationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().optional().default(""),
  date: z.string().optional().default(""),
  description: z.string().optional().default(""),
  sourceBlockIds: z.array(z.string()).optional().default([]),
});

export const StructuredCareerProfileSchema = z.object({
  basics: BasicsSchema.default({}),
  summary: z.string().default(""),
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  documentIR: DocumentIRSchema.optional(),
});

export type StructuredCareerProfile = z.infer<typeof StructuredCareerProfileSchema>;

// ============================================================================
// 3. Job Description Analysis & Evidence Match Radar Schemas
// ============================================================================

export const EvidenceRequirementSchema = z.object({
  requirement: z.string(),
  type: z.enum(["skill", "technology", "experience", "education", "domain", "responsibility"]),
  importance: z.enum(["high", "medium", "low"]).default("high"),
  description: z.string().optional(),
});

export const JDAnalysisSchema = z.object({
  jobTitle: z.string().default("Target Role"),
  company: z.string().default("Target Company"),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  experienceRequirements: z.array(z.string()).default([]),
  educationRequirements: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  domainTerms: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  location: z.string().optional().default(""),
  employmentType: z.string().optional().default("Full-time"),
  seniority: z.string().default("Mid-Senior"),
  evidenceRequirements: z.array(EvidenceRequirementSchema).default([]),
});

export type EvidenceRequirement = z.infer<typeof EvidenceRequirementSchema>;
export type JDAnalysis = z.infer<typeof JDAnalysisSchema>;

export const EvidenceItemSchema = z.object({
  sourceType: z.enum(["experience", "project", "skill", "education", "certification", "summary"]),
  sourceId: z.string(),
  sourceText: z.string(),
  relevanceScore: z.number().min(0).max(1).default(1),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const RequirementMatchSchema = z.object({
  requirement: z.string(),
  category: z.enum(["skill", "technology", "experience", "responsibility", "education", "domain"]),
  status: z.enum(["matched", "partially_matched", "not_found"]),
  confidence: z.number().min(0).max(1).default(1),
  evidence: z.array(EvidenceItemSchema).default([]),
  notes: z.string().optional(),
});

export const MatchRadarSchema = z.object({
  overallScore: z.number().default(0),
  skillsMatchPercent: z.number().default(0),
  experienceMatchPercent: z.number().default(0),
  matchedCount: z.number().default(0),
  partialCount: z.number().default(0),
  missingCount: z.number().default(0),
  totalRequirements: z.number().default(0),
});

export const CompleteAnalysisRecordSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  job_description_id: z.string(),
  analysis: JDAnalysisSchema,
  matchRadar: MatchRadarSchema,
  evidenceMap: z.array(RequirementMatchSchema).default([]),
  created_at: z.string().optional(),
});

export type RequirementMatch = z.infer<typeof RequirementMatchSchema>;
export type MatchRadar = z.infer<typeof MatchRadarSchema>;

// ============================================================================
// 4. Tailored Resume & Version Schemas
// ============================================================================

export const TailoredBulletSchema = z.object({
  text: z.string(),
  evidence: z.array(EvidenceItemSchema).default([]),
  reason: z.string().optional(),
  isHighlighted: z.boolean().default(false),
});

export type TailoredBullet = z.infer<typeof TailoredBulletSchema>;

export const TailoredExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default("Present"),
  bullets: z.array(TailoredBulletSchema).default([]),
  technologies: z.array(z.string()).optional().default([]),
  relevanceScore: z.number().default(1),
});

export type TailoredExperience = z.infer<typeof TailoredExperienceSchema>;

export const TailoredProjectSchema = z.object({
  name: z.string(),
  description: z.string().default(""),
  technologies: z.array(z.string()).default([]),
  url: z.string().default(""),
  previewUrl: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  bullets: z.array(TailoredBulletSchema).default([]),
});

export type TailoredProject = z.infer<typeof TailoredProjectSchema>;

export const TailoredSkillSchema = z.object({
  name: z.string(),
  category: z.string().default("General"),
  relevance: z.enum(["high", "medium", "low"]).default("medium"),
  isHighlighted: z.boolean().default(false),
  matchedRequirement: z.string().optional(),
});

export type TailoredSkill = z.infer<typeof TailoredSkillSchema>;

export const TailoredResumeJSONSchema = z.object({
  title: z.string(),
  targetRole: z.string(),
  targetCompany: z.string(),
  templateId: z.string().default("modern_clean"),
  basics: BasicsSchema,
  summary: z.string(),
  relevantToRole: z.array(z.string()).optional().default([]),
  skills: z.array(TailoredSkillSchema).default([]),
  experiences: z.array(TailoredExperienceSchema).default([]),
  projects: z.array(TailoredProjectSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  evidenceValidation: z
    .object({
      isGrounded: z.boolean().default(true),
      verifiedStatementsCount: z.number().default(0),
      rejectedStatementsCount: z.number().default(0),
      evidenceCoveragePercent: z.number().default(100),
    })
    .default({
      isGrounded: true,
      verifiedStatementsCount: 0,
      rejectedStatementsCount: 0,
      evidenceCoveragePercent: 100,
    }),
}).passthrough();

export type TailoredResumeJSON = z.infer<typeof TailoredResumeJSONSchema>;

export const ResumeVersionRecordSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  job_description_id: z.string().nullable().optional(),
  career_profile_id: z.string(),
  template_id: z.string().default("modern_clean"),
  version_number: z.number().default(1),
  title: z.string(),
  target_role: z.string().nullable().optional(),
  target_company: z.string().nullable().optional(),
  tailored_resume_json: TailoredResumeJSONSchema,
  evidence_provenance_json: z.array(z.any()).default([]),
  pdf_url: z.string().nullable().optional(),
  cloudinary_public_id: z.string().nullable().optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).default("completed"),
  error_message: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ResumeVersionRecord = z.infer<typeof ResumeVersionRecordSchema>;

// ============================================================================
// 5. API Request / Response Utility Schemas
// ============================================================================

export const JobDescriptionCreateSchema = z.object({
  company: z.string().optional().default(""),
  role: z.string().optional().default(""),
  raw_text: z.string().min(5, "Job description text must be at least 5 characters"),
  source: z.string().optional().default("manual"),
});

export const ProfileUpdateSchema = z.object({
  full_name: z.string().optional(),
  avatar_url: z.string().optional(),
  onboarding_completed: z.boolean().optional(),
});
