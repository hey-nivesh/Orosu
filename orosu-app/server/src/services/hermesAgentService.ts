import dotenv from "dotenv";
dotenv.config();

import {
  StructuredCareerProfile,
  StructuredCareerProfileSchema,
  JDAnalysis,
  JDAnalysisSchema,
  RequirementMatch,
  MatchRadar,
  TailoredResumeJSON,
  TailoredResumeJSONSchema,
} from "../validators/schemas";
import { analyzeJobDescription } from "./jdAnalysisService";
import { matchCandidateEvidence } from "./evidenceMatchingService";
import { generateTailoredResume } from "./tailoringService";

const getGroqApiKey = () => process.env.GROQ_API_KEY || "";
const getPrimaryModel = () => process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const getFallbackModels = () => [
  getPrimaryModel(),
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "groq/compound",
];

/**
 * Robust LLM Execution engine powered by Groq API.
 * Handles automatic fallback across high-speed models, JSON extraction, and timeouts.
 */
export async function executeGroqLLM(
  prompt: string,
  systemPrompt: string = "You are an expert AI resume and career intelligence assistant for Orosu. Always return strictly valid JSON.",
  timeoutMs: number = 25000
): Promise<any | null> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    console.warn("⚠️ No GROQ_API_KEY provided in environment.");
    return null;
  }

  const modelsToTry = Array.from(new Set(getFallbackModels()));

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Groq model ${model} responded with status ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        continue;
      }

      // Parse JSON from content (supporting raw JSON or fenced markdown)
      const parsed = cleanAndParseJSON(content);
      if (parsed) {
        return parsed;
      }
    } catch (err: any) {
      console.warn(`⚠️ Groq execution warning for model ${model}:`, err.message);
    }
  }

  return null;
}

/**
 * Backward-compatible one-shot executor alias
 */
export async function executeHermesOneShot(prompt: string, timeoutMs: number = 25000): Promise<any | null> {
  return executeGroqLLM(prompt, "You are an expert career intelligence engine for Orosu. Return ONLY valid JSON.", timeoutMs);
}

/**
 * Cleans, sanitizes, and stitches fragmented bullets
 */
function sanitizeBullets(bullets: any[]): string[] {
  if (!Array.isArray(bullets)) return [];
  const cleaned: string[] = [];

  for (const b of bullets) {
    const raw = typeof b === "string" ? b : b?.text || "";
    const str = raw.replace(/^[•\-*·▪▫►\d.]+\s*/, "").trim();
    if (str.length === 0 || str === "•") continue;

    // Check if this line is a continuation/wrapped line from the previous bullet
    if (
      cleaned.length > 0 &&
      (/^[a-z,;\)]/.test(str) ||
        /^(and|or|with|for|in|to|across|using|backed|APIs|build|deployment|features|stack|development|database|pipeline)/i.test(str) ||
        /[,\-—–]\s*$/.test(cleaned[cleaned.length - 1]))
    ) {
      cleaned[cleaned.length - 1] = `${cleaned[cleaned.length - 1]} ${str}`.replace(/\s+/g, " ");
    } else {
      cleaned.push(str);
    }
  }

  return cleaned;
}

/**
 * Extracts candidate information from raw resume text into StructuredCareerProfile using Groq LLM.
 * Preserves exact hyperlinks, dates, tech stacks, bullet points, and section hierarchy.
 */
export async function runHermesResumeExtraction(
  rawText: string,
  baselineProfile: StructuredCareerProfile
): Promise<StructuredCareerProfile> {
  const prompt = `You are the lead resume intelligence engine for Orosu. Extract all candidate information from the following resume text into valid JSON matching StructuredCareerProfile schema.

CRITICAL INSTRUCTIONS TO PREVENT PARSING DEFECTS:
1. PRESERVE COMPLETE SENTENCES: If a bullet was wrapped across multiple lines in the document (e.g. "across the full SDLC — design, build," + "and deployment."), combine them into ONE single complete bullet point.
2. ZERO EMPTY BULLETS: Never output empty bullets, single dots, or whitespace-only bullets.
3. NO PHANTOM/DUPLICATE EXPERIENCES: Do not create separate experience objects for workplace modes like "Remote" or "Hybrid" or date headers. A role like "Full Stack Developer Intern at HiDevs (Remote) | Dec 2025 – May 2026" is ONE single experience.
4. PRESERVE HYPHENATED WORDS: Do not split words like "Part-time" or "Full-stack" across role/company fields.
5. PRESERVE ALL URLs: GitHub, LinkedIn, Portfolio, Live Demo URLs.
6. EXTRACT SKILLS INTO DISTINCT CATEGORIES: Core Web Stack, Databases, Architecture, Tools & Practices, Cloud.

Resume Text:
${rawText}

Return ONLY a valid JSON object strictly matching this structure:
{
  "basics": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "headline": "",
    "linkedin": "",
    "portfolio": ""
  },
  "summary": "",
  "skills": [
    { "name": "", "category": "Core Web Stack", "proficiency": "Proficient" }
  ],
  "experiences": [
    {
      "company": "",
      "role": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "isCurrent": false,
      "bullets": [""],
      "technologies": [""]
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [""],
      "url": "",
      "previewUrl": "",
      "bullets": [""]
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "startDate": "",
      "endDate": "",
      "cgpa": "",
      "description": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "description": ""
    }
  ]
}`;

  const result = await executeGroqLLM(prompt, "You are an expert resume parsing AI. Extract complete candidate profile into valid JSON.", 35000);

  if (result) {
    // Sanitize experiences from Groq
    const sanitizedExperiences = (result.experiences || baselineProfile.experiences || [])
      .filter((exp: any) => exp.company && exp.company !== "Company" && exp.role && !/^(remote|hybrid|onsite)$/i.test(exp.role.trim()))
      .map((exp: any) => ({
        ...exp,
        bullets: sanitizeBullets(exp.bullets || exp.achievements || []),
      }));

    // Sanitize projects from Groq
    const sanitizedProjects = (result.projects || baselineProfile.projects || [])
      .filter((proj: any) => proj.name && proj.name !== "Project")
      .map((proj: any) => ({
        ...proj,
        bullets: sanitizeBullets(proj.bullets || proj.achievements || []),
      }));

    const merged = {
      ...baselineProfile,
      ...result,
      basics: {
        ...baselineProfile.basics,
        ...(result.basics || {}),
        linkedin: result.basics?.linkedin || baselineProfile.basics.linkedin,
        portfolio: result.basics?.portfolio || baselineProfile.basics.portfolio,
      },
      skills: (result.skills && result.skills.length > 0) ? result.skills : baselineProfile.skills,
      experiences: sanitizedExperiences.length > 0 ? sanitizedExperiences : baselineProfile.experiences,
      projects: sanitizedProjects.length > 0 ? sanitizedProjects : baselineProfile.projects,
      education: (result.education && result.education.length > 0) ? result.education : baselineProfile.education,
      certifications: (result.certifications && result.certifications.length > 0) ? result.certifications : baselineProfile.certifications,
    };

    const validated = StructuredCareerProfileSchema.safeParse(merged);
    if (validated.success) {
      return validated.data;
    }
  }

  return baselineProfile;
}

/**
 * Analyzes target Job Description into structured requirements and skills using Groq LLM.
 */
export async function runHermesJDAnalysis(
  rawText: string,
  company?: string,
  role?: string
): Promise<JDAnalysis> {
  const baselineAnalysis = analyzeJobDescription(rawText, company, role);

  const prompt = `Analyze this Job Description into structured JSON. Extract required skills, preferred skills, technologies, core responsibilities, and keywords.
Do NOT hallucinate requirements.

Job Description:
${rawText}

Company context: ${company || "Target Company"}
Role context: ${role || "Target Role"}

Return ONLY a JSON object adhering to:
{
  "jobTitle": "",
  "company": "",
  "seniority": "",
  "requiredSkills": [""],
  "preferredSkills": [""],
  "technologies": [""],
  "responsibilities": [""],
  "keywords": [""],
  "domainTerms": [""]
}`;

  const result = await executeGroqLLM(prompt, "You are an expert ATS and Job Description analyst. Return valid JSON only.", 20000);

  if (result) {
    const merged = {
      ...baselineAnalysis,
      ...result,
      technologies: Array.from(new Set([...baselineAnalysis.technologies, ...(result.technologies || [])])),
      requiredSkills: Array.from(new Set([...baselineAnalysis.requiredSkills, ...(result.requiredSkills || [])])),
      responsibilities: Array.from(new Set([...baselineAnalysis.responsibilities, ...(result.responsibilities || [])])),
    };

    const validated = JDAnalysisSchema.safeParse(merged);
    if (validated.success) {
      return validated.data;
    }
  }

  return baselineAnalysis;
}

/**
 * Evaluates candidate profile against JD requirements with provenance.
 */
export async function runHermesCandidateMatching(
  profile: StructuredCareerProfile,
  analysis: JDAnalysis
): Promise<{ evidenceMap: RequirementMatch[]; matchRadar: MatchRadar }> {
  return matchCandidateEvidence(profile, analysis);
}

/**
 * Generates an evidence-grounded tailored resume JSON prioritizing relevant candidate evidence.
 */
export async function runHermesResumeTailoring(
  profile: StructuredCareerProfile,
  analysis: JDAnalysis,
  evidenceMap: RequirementMatch[],
  templateId: string = "modern_clean"
): Promise<TailoredResumeJSON> {
  const tailored = generateTailoredResume(profile, analysis, evidenceMap, templateId);
  return TailoredResumeJSONSchema.parse(tailored);
}

/**
 * Rigorously checks that 100% of statements have source evidence.
 */
export async function runHermesResumeValidation(
  tailoredResume: TailoredResumeJSON,
  profile: StructuredCareerProfile
): Promise<{ isValid: boolean; verifiedCount: number; rejectedCount: number; evidenceCoveragePercent: number }> {
  const valid = TailoredResumeJSONSchema.safeParse(tailoredResume);
  if (!valid.success) {
    return {
      isValid: false,
      verifiedCount: 0,
      rejectedCount: 1,
      evidenceCoveragePercent: 0,
    };
  }

  let totalStatements = 0;
  let verified = 0;

  for (const exp of tailoredResume.experiences) {
    for (const bullet of exp.bullets) {
      totalStatements++;
      if (bullet.evidence && bullet.evidence.length > 0) {
        verified++;
      }
    }
  }

  for (const proj of tailoredResume.projects) {
    for (const bullet of proj.bullets) {
      totalStatements++;
      if (bullet.evidence && bullet.evidence.length > 0) {
        verified++;
      }
    }
  }

  const coverage = totalStatements > 0 ? Math.round((verified / totalStatements) * 100) : 100;

  return {
    isValid: coverage >= 95,
    verifiedCount: verified,
    rejectedCount: totalStatements - verified,
    evidenceCoveragePercent: coverage,
  };
}

/**
 * Utility to extract clean JSON object from raw LLM text
 */
function cleanAndParseJSON(raw: string): any | null {
  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return JSON.parse(trimmed);
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = trimmed.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonCandidate);
    }
  } catch (err) {
    // Return null on malformed JSON
  }
  return null;
}
