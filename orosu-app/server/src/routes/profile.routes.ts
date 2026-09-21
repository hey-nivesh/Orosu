import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { getCareerProfile, saveStructuredCareerProfile } from "../services/careerProfileService";
import { StructuredCareerProfileSchema, ProfileUpdateSchema } from "../validators/schemas";

const router = Router();

// GET /api/profile
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;

    const { data: profile, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: { code: "PROFILE_NOT_FOUND", message: "User profile not found." },
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "FETCH_PROFILE_ERROR", message: err.message },
    });
  }
});

// GET /api/profile/career
router.get("/career", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;

    const data = await getCareerProfile(client, userId);

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "FETCH_CAREER_ERROR", message: err.message },
    });
  }
});

// PATCH /api/profile
router.patch("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const validated = ProfileUpdateSchema.parse(req.body);

    const { data: updated, error } = await client
      .from("profiles")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: "UPDATE_PROFILE_ERROR", message: err.message },
    });
  }
});

// PUT /api/profile/career
router.put("/career", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const validated = StructuredCareerProfileSchema.parse(req.body.profile);
    const rawResumeText = req.body.rawResumeText || "";

    const result = await saveStructuredCareerProfile(client, userId, validated, rawResumeText);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: "SAVE_CAREER_ERROR", message: err.message },
    });
  }
});

export default router;
