import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { JobDescriptionCreateSchema } from "../validators/schemas";

const router = Router();

// GET /api/jobs
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;

    const { data: jobs, error } = await client
      .from("job_descriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: jobs || [],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "FETCH_JOBS_ERROR", message: err.message },
    });
  }
});

// POST /api/jobs
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const validated = JobDescriptionCreateSchema.parse(req.body);

    const { data: job, error } = await client
      .from("job_descriptions")
      .insert({
        user_id: userId,
        company: validated.company || null,
        role: validated.role || null,
        raw_text: validated.raw_text,
        source: validated.source || "manual",
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: job,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: "CREATE_JOB_ERROR", message: err.message },
    });
  }
});

// GET /api/jobs/:id
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const { id } = req.params;

    const { data: job, error } = await client
      .from("job_descriptions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !job) {
      return res.status(404).json({
        success: false,
        error: { code: "JOB_NOT_FOUND", message: "Job description not found" },
      });
    }

    return res.json({
      success: true,
      data: job,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "FETCH_JOB_ERROR", message: err.message },
    });
  }
});

// PATCH /api/jobs/:id
router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const { id } = req.params;
    const { company, role, raw_text } = req.body;

    const { data: updated, error } = await client
      .from("job_descriptions")
      .update({
        company: company !== undefined ? company : undefined,
        role: role !== undefined ? role : undefined,
        raw_text: raw_text !== undefined ? raw_text : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
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
      error: { code: "UPDATE_JOB_ERROR", message: err.message },
    });
  }
});

// DELETE /api/jobs/:id
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;
    const { id } = req.params;

    const { error } = await client
      .from("job_descriptions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return res.json({
      success: true,
      data: { message: "Job description deleted successfully" },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "DELETE_JOB_ERROR", message: err.message },
    });
  }
});

export default router;
