export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  onboarding_completed: boolean;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface AchievementItem {
  text: string;
  sourceBlockId?: string;
  sourceText?: string;
}

export interface ExperienceItem {
  id?: string;
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  isCurrent?: boolean;
  is_current?: boolean;
  description?: string;
  achievements?: (string | AchievementItem)[];
  bullets?: string[];
  sourceBlockIds?: string[];
  source?: string;
}

export interface ProjectItem {
  id?: string;
  name: string;
  title?: string;
  description?: string;
  technologies: string[];
  url?: string;
  achievements?: (string | AchievementItem)[];
  bullets?: string[];
  sourceBlockIds?: string[];
  source?: string;
}

export interface SkillItem {
  id?: string;
  name: string;
  category?: string;
  proficiency?: "Expert" | "Proficient" | "Familiar";
  level?: string;
  sourceBlockId?: string;
  source?: string;
}

export interface EducationItem {
  id?: string;
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  description?: string;
  sourceBlockIds?: string[];
}

export interface CertificationItem {
  id?: string;
  name: string;
  issuer?: string;
  date?: string;
  description?: string;
  sourceBlockIds?: string[];
}

export interface BlockIR {
  id: string;
  type: "heading" | "subheading" | "paragraph" | "bullet" | "metadata" | "contact" | "table_row";
  text: string;
  sourceIndex: number;
  pageNumber?: number;
}

export interface SectionIR {
  id: string;
  heading: {
    original: string;
    normalized: string;
  };
  order: number;
  pageStart?: number;
  pageEnd?: number;
  blocks: BlockIR[];
  rawText: string;
}

export interface DocumentIR {
  document: {
    fileName: string;
    fileType: "pdf" | "docx" | "doc" | "txt" | "unknown";
    pageCount: number;
    charCount: number;
    uploadedAt: string;
  };
  rawText: string;
  sections: SectionIR[];
  extractionConfidence: number;
  extractionMethod: "deterministic" | "hybrid" | "llm";
}

export interface StructuredCareerProfile {
  basics: {
    name: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
    linkedin: string;
    portfolio: string;
  };
  summary: string;
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  documentIR?: DocumentIR;
}

export interface CareerProfileRecord {
  id: string;
  user_id: string;
  professional_headline?: string | null;
  target_role?: string | null;
  summary?: string | null;
  raw_resume_text?: string | null;
  profile_json?: StructuredCareerProfile | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface JobDescriptionRecord {
  id: string;
  user_id: string;
  company?: string | null;
  role?: string | null;
  raw_text: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceRequirement {
  requirement: string;
  type: "skill" | "technology" | "experience" | "education" | "domain" | "responsibility";
  importance: "high" | "medium" | "low";
  description?: string;
}

export interface JDAnalysis {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  technologies: string[];
  responsibilities: string[];
  experienceRequirements: string[];
  educationRequirements: string[];
  keywords: string[];
  domainTerms: string[];
  softSkills: string[];
  location?: string;
  employmentType?: string;
  seniority: string;
  evidenceRequirements: EvidenceRequirement[];
}

export interface EvidenceItem {
  sourceType: "experience" | "project" | "skill" | "education" | "certification" | "summary";
  sourceId: string;
  sourceText: string;
  relevanceScore: number;
}

export interface RequirementMatch {
  requirement: string;
  category: "skill" | "technology" | "experience" | "responsibility" | "education" | "domain";
  status: "matched" | "partially_matched" | "not_found";
  confidence: number;
  evidence: EvidenceItem[];
  notes?: string;
}

export interface MatchRadar {
  overallScore: number;
  skillsMatchPercent: number;
  experienceMatchPercent: number;
  matchedCount: number;
  partialCount: number;
  missingCount: number;
  totalRequirements: number;
}

export interface CompleteJobAnalysisRecord {
  id: string;
  user_id: string;
  job_description_id: string;
  job_title?: string;
  company?: string;
  analysis: JDAnalysis;
  match_radar: MatchRadar;
  evidence_map: RequirementMatch[];
  created_at: string;
}

export interface TailoredBullet {
  text: string;
  evidence: EvidenceItem[];
  reason?: string;
  isHighlighted?: boolean;
}

export interface TailoredExperience {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: TailoredBullet[];
  technologies?: string[];
  relevanceScore?: number;
}

export interface TailoredProject {
  name: string;
  description?: string;
  technologies: string[];
  url?: string;
  previewUrl?: string;
  startDate?: string;
  endDate?: string;
  bullets: TailoredBullet[];
}

export interface TailoredSkill {
  name: string;
  category: string;
  relevance: "high" | "medium" | "low";
  isHighlighted: boolean;
  matchedRequirement?: string;
}

export interface TailoredResumeJSON {
  title: string;
  targetRole: string;
  targetCompany: string;
  templateId: string;
  basics: {
    name: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
    linkedin: string;
    portfolio: string;
  };
  summary: string;
  relevantToRole?: string[];
  skills: TailoredSkill[];
  experiences: TailoredExperience[];
  projects: TailoredProject[];
  education: EducationItem[];
  certifications: CertificationItem[];
  evidenceValidation: {
    isGrounded: boolean;
    verifiedStatementsCount: number;
    rejectedStatementsCount: number;
    evidenceCoveragePercent: number;
  };
}

export interface ResumeVersionRecord {
  id: string;
  user_id: string;
  job_description_id?: string | null;
  career_profile_id: string;
  template_id: string;
  version_number: number;
  title: string;
  target_role?: string | null;
  target_company?: string | null;
  tailored_resume_json: TailoredResumeJSON;
  evidence_provenance_json?: any[];
  pdf_url?: string | null;
  cloudinary_public_id?: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineProgressStage {
  id: string;
  name: string;
  status: "waiting" | "in_progress" | "completed" | "failed";
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
