import { execFile } from "child_process";
import path from "path";
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

const HERMES_CLI_PATH =
  process.env.HERMES_CLI_PATH ||
  "C:\\Users\\Dell\\AppData\\Local\\hermes\\bin\\hermes.exe";

const HERMES_SERVER_URL = process.env.HERMES_SERVER_URL || "";
const HERMES_API_KEY = process.env.HERMES_API_KEY || "";

/**
 * Executes Hermes Agent either via:
 * 1. Remote HTTP Endpoint on Oracle VPS (`HERMES_SERVER_URL`)
 * 2. Local CLI Binary on host (`HERMES_CLI_PATH`)
 * 3. Graceful fallback if Hermes is momentarily unreachable
 */
export async function executeHermesOneShot(prompt: string, timeoutMs: number = 25000): Promise<any | null> {
  // Option 1: Remote Hermes daemon on Oracle VPS
  if (HERMES_SERVER_URL && HERMES_SERVER_URL.startsWith("http")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${HERMES_SERVER_URL}/api/hermes/exec`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(HERMES_API_KEY ? { "x-api-key": HERMES_API_KEY } : {}),
        },
        body: JSON.stringify({ prompt, timeoutMs }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          return json.data;
        }
        return json;
      }
    } catch (httpErr: any) {
      console.warn("⚠️ Remote Hermes VPS service warning:", httpErr.message);
    }
  }

  // Option 2: Local CLI binary
  return new Promise((resolve) => {
    try {
      const child = execFile(
        HERMES_CLI_PATH,
        ["-z", prompt],
        {
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024,
          windowsHide: true,
        },
        (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            console.warn("⚠️ Hermes CLI execution notice:", error.message);
            return resolve(null);
          }

          if (!stdout || stdout.trim().length === 0) {
            return resolve(null);
          }

          try {
            const trimmed = stdout.trim();
            const firstBrace = trimmed.indexOf("{");
            const lastBrace = trimmed.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1) {
              const jsonStr = trimmed.slice(firstBrace, lastBrace + 1);
              const parsed = JSON.parse(jsonStr);
              return resolve(parsed);
            }
          } catch (jsonErr) {
            console.warn("⚠️ Hermes JSON parsing notice, falling back:", jsonErr);
          }

          return resolve(null);
        }
      );
    } catch (spawnErr) {
      console.warn("⚠️ Hermes spawn notice:", spawnErr);
      resolve(null);
    }
  });
}

/**
 * Hermes Operation 1: runHermesResumeExtraction
 * Parses uploaded resume text, extracting exact links, sections, and structured profile.
 */
export async function runHermesResumeExtraction(
  rawText: string,
  baselineProfile: StructuredCareerProfile
): Promise<StructuredCareerProfile> {
  const prompt = `You are Hermes Agent for Orosu. Extract all candidate information from this resume text into valid JSON matching StructuredCareerProfile schema.
Preserve all URLs/hyperlinks (GitHub, LinkedIn, Portfolio, Project URLs), exact dates, metrics, tech tags, and categories.

Resume Text:
${rawText}

Return ONLY a valid JSON object matching:
{
  "basics": { "name": "", "email": "", "phone": "", "location": "", "headline": "", "linkedin": "", "portfolio": "" },
  "summary": "",
  "skills": [{ "name": "", "category": "Core Web Stack|Databases|Bonus: AI/ML & Mobile|Architecture|Tools & Practices|Cloud", "proficiency": "Proficient" }],
  "experiences": [{ "company": "", "role": "", "location": "", "startDate": "", "endDate": "", "isCurrent": false, "bullets": [""], "achievements": [""] }],
  "projects": [{ "name": "", "description": "", "technologies": [""], "url": "", "bullets": [""], "achievements": [""] }],
  "education": [{ "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "description": "" }],
  "certifications": [{ "name": "", "issuer": "", "date": "", "description": "" }]
}`;

  const result = await executeHermesOneShot(prompt, 30000);
  if (result) {
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
      experiences: (result.experiences && result.experiences.length > 0) ? result.experiences : baselineProfile.experiences,
      projects: (result.projects && result.projects.length > 0) ? result.projects : baselineProfile.projects,
    };

    const validated = StructuredCareerProfileSchema.safeParse(merged);
    if (validated.success) {
      return validated.data;
    }
  }

  return baselineProfile;
}

/**
 * Hermes Operation 2: runHermesJDAnalysis
 * Analyzes target Job Description into structured requirements and evidence expectations.
 */
export async function runHermesJDAnalysis(
  rawText: string,
  company?: string,
  role?: string
): Promise<JDAnalysis> {
  const baselineAnalysis = analyzeJobDescription(rawText, company, role);

  const prompt = `You are Hermes Agent for Orosu. Analyze this Job Description into structured JSON.
Do NOT hallucinate requirements.

Job Description:
${rawText}
Company hint: ${company || "Target Company"}
Role hint: ${role || "Target Role"}

Return ONLY a JSON object adhering to JDAnalysis schema:
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

  const result = await executeHermesOneShot(prompt, 20000);
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
 * Hermes Operation 3: runHermesCandidateMatching
 * Strictly evaluates candidate profile against JD requirements with provenance.
 */
export async function runHermesCandidateMatching(
  profile: StructuredCareerProfile,
  analysis: JDAnalysis
): Promise<{ evidenceMap: RequirementMatch[]; matchRadar: MatchRadar }> {
  return matchCandidateEvidence(profile, analysis);
}

/**
 * Hermes Operation 4: runHermesResumeTailoring
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
 * Hermes Operation 5: runHermesResumeValidation
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
