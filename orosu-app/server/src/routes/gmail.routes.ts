import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { supabase } from "../config/supabase";
import {
  getGoogleOAuthUrl,
  handleGoogleCallback,
  getGoogleStatus,
  generateApplicationEmailBody,
  createGmailDraftWithAttachment,
} from "../services/gmailService";

const router = Router();

/**
 * GET /api/integrations/google/auth-url
 * Returns Google OAuth 2.0 authorization URL
 */
router.get("/google/auth-url", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const returnTo = String(req.query.returnTo || "/resumes");
  const state = JSON.stringify({ userId, returnTo });
  const authUrl = getGoogleOAuthUrl(state);

  return res.json({
    success: true,
    data: { authUrl },
  });
});

/**
 * GET /api/integrations/google/callback
 * Handles Google OAuth redirect and stores refresh/access tokens
 */
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send("Authorization code missing.");
    }

    let userId = "";
    let returnTo = "/resumes";
    if (state) {
      try {
        const parsed = JSON.parse(String(state));
        userId = parsed.userId;
        returnTo = parsed.returnTo || returnTo;
      } catch (e) {
        // state wasn't JSON
      }
    }

    if (userId) {
      await handleGoogleCallback(String(code), userId, supabase);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const separator = returnTo.includes("?") ? "&" : "?";
    return res.redirect(`${appUrl}${returnTo}${separator}gmail_connected=true`);
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return res.status(500).send("Error handling Google OAuth callback: " + err.message);
  }
});

/**
 * GET /api/integrations/google/status
 * Check if current user has connected their Gmail account
 */
router.get("/google/status", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const status = await getGoogleStatus(userId, client);

    return res.json({
      success: true,
      data: status,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "STATUS_ERROR", message: err.message },
    });
  }
});

/**
 * POST /api/integrations/gmail/ai-draft-body
 * Generates professional, grounded email body for the target role
 */
router.post("/gmail/ai-draft-body", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { candidateName, recipientName, company, role, topSkills } = req.body;

    const emailContent = generateApplicationEmailBody(
      candidateName || "Candidate",
      recipientName || "Hiring Team",
      company || "Target Company",
      role || "Target Role",
      topSkills || []
    );

    return res.json({
      success: true,
      data: emailContent,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "EMAIL_DRAFT_GEN_ERROR", message: err.message },
    });
  }
});

/**
 * POST /api/integrations/gmail/draft
 * Creates a Gmail draft with the tailored PDF resume attached
 */
router.post("/gmail/draft", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const { resumeVersionId, recipientEmail, recipientName, subject, body } = req.body;

    if (!resumeVersionId || !recipientEmail || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REQUEST", message: "Missing required fields for draft creation." },
      });
    }

    const result = await createGmailDraftWithAttachment(
      {
        userId,
        resumeVersionId,
        recipientEmail,
        recipientName,
        subject,
        body,
      },
      client
    );

    return res.json({
      success: true,
      data: {
        draftId: result.draftId,
        gmailWebUrl: result.gmailWebUrl,
        message: "Gmail draft created successfully with tailored resume attached.",
      },
    });
  } catch (err: any) {
    console.error("Create Gmail draft error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "CREATE_DRAFT_ERROR", message: err.message },
    });
  }
});

export default router;
