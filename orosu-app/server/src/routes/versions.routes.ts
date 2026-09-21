import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { pdfMemoryCache } from "./tailor.routes";
import { renderResumeHTML, renderResumePDF } from "../services/resumeRendererService";

const router = Router();

/**
 * Helper to sanitize filename for Content-Disposition
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
}

/**
 * GET /api/resumes/versions
 * List user's tailored resume versions
 */
router.get("/versions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;

    const { data, error } = await client
      .from("resume_versions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "FETCH_VERSIONS_ERROR", message: err.message },
    });
  }
});

/**
 * GET /api/resumes/versions/:id
 * Get single tailored resume version details
 */
router.get("/versions/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const versionId = req.params.id;

    const { data, error } = await client
      .from("resume_versions")
      .select("*")
      .eq("id", versionId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: { code: "VERSION_NOT_FOUND", message: "Resume version not found." },
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "FETCH_VERSION_ERROR", message: err.message },
    });
  }
});

/**
 * GET /api/resumes/versions/:id/download
 * Authenticated endpoint that forces file download with Content-Disposition attachment
 */
router.get("/versions/:id/download", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const versionId = String(req.params.id);

    // Fetch resume version to verify ownership
    const { data, error } = await client
      .from("resume_versions")
      .select("*")
      .eq("id", versionId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Resume version not found." },
      });
    }

    const candidateName = data.tailored_resume_json?.basics?.name || "Candidate";
    const targetRole = data.target_role || "Resume";
    const targetCompany = data.target_company || "";
    const baseFilename = targetCompany
      ? `${candidateName}_${targetCompany}_${targetRole}`
      : `${candidateName}_${targetRole}`;
    const filename = `${sanitizeFilename(baseFilename)}.pdf`;

    // Check memory cache first
    const cached = pdfMemoryCache.get(versionId);
    if (cached && cached.userId === userId) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(cached.buffer);
    }

    // If Cloudinary URL exists and is accessible, fetch or redirect
    if (data.pdf_url && data.pdf_url.startsWith("http")) {
      try {
        const cloudRes = await fetch(data.pdf_url);
        if (cloudRes.ok) {
          const buffer = Buffer.from(await cloudRes.arrayBuffer());
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          return res.send(buffer);
        }
      } catch (cloudErr) {
        console.warn("Cloudinary fetch error, fallback to dynamic rendering:", cloudErr);
      }
    }

    // Render on the fly from stored tailored_resume_json
    const html = renderResumeHTML(data.tailored_resume_json);
    const buffer = await renderResumePDF(html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err: any) {
    console.error("PDF download error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "DOWNLOAD_ERROR", message: err.message },
    });
  }
});

/**
 * GET /api/resumes/versions/:id/pdf
 * Inline stream for preview or browser viewer
 */
router.get("/versions/:id/pdf", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const versionId = String(req.params.id);

    // Check memory cache first
    const cached = pdfMemoryCache.get(versionId);
    if (cached && cached.userId === userId) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${cached.fileName}"`);
      return res.send(cached.buffer);
    }

    // Fetch from database
    const { data, error } = await client
      .from("resume_versions")
      .select("*")
      .eq("id", versionId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return res.status(404).send("Resume version not found");
    }

    // If Cloudinary URL is active external URL, redirect
    if (data.pdf_url && data.pdf_url.startsWith("http")) {
      return res.redirect(data.pdf_url);
    }

    // Otherwise render on the fly from stored tailored_resume_json
    const html = renderResumeHTML(data.tailored_resume_json);
    const buffer = await renderResumePDF(html);
    const candidateName = data.tailored_resume_json?.basics?.name || "Candidate";
    const fileName = `${sanitizeFilename(candidateName)}_Resume.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.send(buffer);
  } catch (err: any) {
    console.error("PDF stream error:", err);
    return res.status(500).send("Error streaming PDF");
  }
});

/**
 * DELETE /api/resumes/versions/:id
 * Delete a resume version
 */
router.delete("/versions/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const versionId = String(req.params.id);

    const { error } = await client
      .from("resume_versions")
      .delete()
      .eq("id", versionId)
      .eq("user_id", userId);

    if (error) throw error;
    pdfMemoryCache.delete(versionId);

    return res.json({
      success: true,
      data: { message: "Resume version deleted." },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "DELETE_VERSION_ERROR", message: err.message },
    });
  }
});

export default router;
