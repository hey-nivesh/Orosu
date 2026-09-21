import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { runHermesJDAnalysis, runHermesCandidateMatching, runHermesResumeTailoring, runHermesResumeValidation } from "../services/hermesAgentService";
import { renderResumeHTML, renderResumePDF } from "../services/resumeRendererService";
import { uploadResumePDF } from "../services/cloudinaryService";
import { StructuredCareerProfile } from "../validators/schemas";

const router = Router();

// In-memory cache for temporary local PDF streaming when Cloudinary is not configured
export const pdfMemoryCache = new Map<string, { buffer: Buffer; fileName: string; userId: string }>();

/**
 * POST /api/jobs/:id/analyze
 * Analyzes target job and matches against candidate profile
 */
router.post("/jobs/:id/analyze", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const jobId = req.params.id;

    // 1. Fetch Job Description
    const { data: job, error: jobErr } = await client
      .from("job_descriptions")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobErr || !job) {
      return res.status(404).json({
        success: false,
        error: { code: "JOB_NOT_FOUND", message: "Job description not found." },
      });
    }

    // 2. Fetch User Career Profile
    const { data: careerProfile, error: profileErr } = await client
      .from("career_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const profileData: StructuredCareerProfile = careerProfile?.profile_json || {
      basics: { name: "Candidate", email: req.user!.email, phone: "", location: "", headline: "", linkedin: "", portfolio: "" },
      summary: "",
      experiences: [],
      projects: [],
      skills: [],
      education: [],
      certifications: [],
    };

    // 3. Run Analysis & Evidence Matching
    const analysis = await runHermesJDAnalysis(job.raw_text, job.company || undefined, job.role || undefined);
    const { evidenceMap, matchRadar } = await runHermesCandidateMatching(profileData, analysis);

    // 4. Save/Upsert in job_analyses table
    const { data: savedAnalysis, error: saveErr } = await client
      .from("job_analyses")
      .upsert(
        {
          user_id: userId,
          job_description_id: jobId,
          job_title: analysis.jobTitle,
          company: analysis.company,
          required_skills: analysis.requiredSkills,
          preferred_skills: analysis.preferredSkills,
          technologies: analysis.technologies,
          responsibilities: analysis.responsibilities,
          experience_requirements: analysis.experienceRequirements,
          education_requirements: analysis.educationRequirements,
          keywords: analysis.keywords,
          domain_terms: analysis.domainTerms,
          soft_skills: analysis.softSkills,
          seniority: analysis.seniority,
          evidence_requirements: analysis.evidenceRequirements,
          match_radar: matchRadar,
          evidence_map: evidenceMap,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    return res.json({
      success: true,
      data: {
        analysisId: savedAnalysis?.id,
        analysis,
        matchRadar,
        evidenceMap,
      },
    });
  } catch (err: any) {
    console.error("Job analysis error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "ANALYSIS_ERROR", message: err.message || "Failed to analyze job description." },
    });
  }
});

/**
 * GET /api/jobs/:id/analysis
 * Retrieves saved analysis for a job description
 */
router.get("/jobs/:id/analysis", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const jobId = req.params.id;

    const { data, error } = await client
      .from("job_analyses")
      .select("*")
      .eq("job_description_id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Analysis not yet generated for this job." },
      });
    }

    return res.json({
      success: true,
      data: {
        id: data.id,
        analysis: {
          jobTitle: data.job_title,
          company: data.company,
          requiredSkills: data.required_skills || [],
          preferredSkills: data.preferred_skills || [],
          technologies: data.technologies || [],
          responsibilities: data.responsibilities || [],
          experienceRequirements: data.experience_requirements || [],
          educationRequirements: data.education_requirements || [],
          keywords: data.keywords || [],
          domainTerms: data.domain_terms || [],
          softSkills: data.soft_skills || [],
          seniority: data.seniority || "Mid-Senior",
          evidenceRequirements: data.evidence_requirements || [],
        },
        matchRadar: data.match_radar || {},
        evidenceMap: data.evidence_map || [],
        created_at: data.created_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "FETCH_ANALYSIS_ERROR", message: err.message },
    });
  }
});

/**
 * POST /api/tailor/generate
 * Full Orchestration: Analyze → Match → Tailor → Validate → HTML → PDF → Cloudinary → Save Version
 */
router.post("/tailor/generate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const correlationId = uuidv4();
  console.info(`[${correlationId}] Starting tailored resume generation for user: ${req.user!.id}`);

  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const { jobId, templateId = "modern_clean" } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REQUEST", message: "jobId is required." },
      });
    }

    // 1. Fetch Job
    const { data: job, error: jobErr } = await client
      .from("job_descriptions")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobErr || !job) {
      return res.status(404).json({
        success: false,
        error: { code: "JOB_NOT_FOUND", message: "Job description not found." },
      });
    }

    // 2. Fetch Master Career Profile
    const { data: careerProfile, error: profileErr } = await client
      .from("career_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profileErr || !careerProfile) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PROFILE_REQUIRED",
          message: "Please complete your Master Career Profile before generating tailored resumes.",
        },
      });
    }

    const profileData: StructuredCareerProfile = careerProfile.profile_json;

    // 3. Stage 1: Analyze JD
    console.info(`[${correlationId}] Step 1: Analyzing Job Description`);
    const analysis = await runHermesJDAnalysis(job.raw_text, job.company || undefined, job.role || undefined);

    // 4. Stage 2: Evidence Matching
    console.info(`[${correlationId}] Step 2: Matching Candidate Evidence`);
    const { evidenceMap, matchRadar } = await runHermesCandidateMatching(profileData, analysis);

    // 5. Stage 3: Tailor Resume
    console.info(`[${correlationId}] Step 3: Generating Evidence-Grounded Tailored Content`);
    const tailoredResume = await runHermesResumeTailoring(profileData, analysis, evidenceMap, templateId);

    // 6. Stage 4: Validate against Source Ground Truth
    console.info(`[${correlationId}] Step 4: Validating Statements`);
    const validation = await runHermesResumeValidation(tailoredResume, profileData);
    if (!validation.isValid) {
      console.warn(`[${correlationId}] Validation warning: ${validation.rejectedCount} unverified statement(s) replaced.`);
    }

    // 7. Stage 5: Render HTML Template
    console.info(`[${correlationId}] Step 5: Rendering Deterministic HTML Template`);
    const resumeHTML = renderResumeHTML(tailoredResume);

    // 8. Stage 6: Generate PDF via Puppeteer
    console.info(`[${correlationId}] Step 6: Rendering PDF via Headless Chromium`);
    const pdfBuffer = await renderResumePDF(resumeHTML);

    const versionId = uuidv4();

    // 9. Stage 7: Upload to Cloudinary (or cache locally for streaming)
    console.info(`[${correlationId}] Step 7: Uploading PDF to Storage`);
    const uploadResult = await uploadResumePDF(pdfBuffer, userId, versionId);

    // Cache buffer in memory for instant local download if needed
    pdfMemoryCache.set(versionId, {
      buffer: pdfBuffer,
      fileName: `${(tailoredResume.basics.name || "Resume").replace(/\s+/g, "_")}_${(analysis.jobTitle || "Role").replace(/\s+/g, "_")}.pdf`,
      userId,
    });

    // 10. Stage 8: Save Immutable Resume Version in Supabase
    console.info(`[${correlationId}] Step 8: Saving Immutable Resume Version`);

    // Get current version count for this user
    const { count } = await client
      .from("resume_versions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const versionNumber = (count || 0) + 1;
    const title = `${analysis.jobTitle} @ ${analysis.company}`;

    const { data: savedVersion, error: saveVerErr } = await client
      .from("resume_versions")
      .insert({
        id: versionId,
        user_id: userId,
        job_description_id: jobId,
        career_profile_id: careerProfile.id,
        template_id: templateId,
        version_number: versionNumber,
        title,
        target_role: analysis.jobTitle,
        target_company: analysis.company,
        tailored_resume_json: tailoredResume,
        evidence_provenance_json: evidenceMap,
        pdf_url: uploadResult.secure_url,
        cloudinary_public_id: uploadResult.public_id,
        status: "completed",
      })
      .select()
      .single();

    if (saveVerErr) {
      console.error(`[${correlationId}] Error saving resume version:`, saveVerErr);
      throw saveVerErr;
    }

    console.info(`[${correlationId}] Tailored resume version ${versionId} generated successfully!`);

    return res.json({
      success: true,
      data: {
        versionId,
        versionNumber,
        title,
        pdfUrl: uploadResult.secure_url,
        tailoredResume,
        matchRadar,
        evidenceMap,
        correlationId,
      },
    });
  } catch (err: any) {
    console.error(`[${correlationId}] Tailoring orchestration failure:`, err);
    return res.status(500).json({
      success: false,
      error: {
        code: "TAILORING_FAILED",
        message: err.message || "Failed to generate tailored resume.",
      },
    });
  }
});

export default router;
