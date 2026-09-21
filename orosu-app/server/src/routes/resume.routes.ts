import { Router, Response } from "express";
import multer from "multer";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import {
  extractRawTextFromBuffer,
  parseStructuredCareerFromText,
} from "../services/resumeParserService";
import { runHermesResumeExtraction } from "../services/hermesAgentService";

const router = Router();

// Multer memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    const originalLower = (file.originalname || "").toLowerCase();
    const mimeLower = (file.mimetype || "").toLowerCase();

    const isPdf = originalLower.endsWith(".pdf") || mimeLower.includes("pdf");
    const isDocx =
      originalLower.endsWith(".docx") ||
      originalLower.endsWith(".doc") ||
      mimeLower.includes("word") ||
      mimeLower.includes("document") ||
      mimeLower.includes("zip") ||
      mimeLower.includes("octet-stream");
    const isTxt = originalLower.endsWith(".txt") || mimeLower.includes("text/plain");

    if (isPdf || isDocx || isTxt) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT document under 10MB."));
    }
  },
});

// POST /api/resumes/upload
router.post(
  "/upload",
  requireAuth,
  upload.single("resume"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: "NO_FILE_UPLOADED", message: "Please select a PDF or DOCX resume to upload." },
        });
      }

      const { text: rawText, pageCount } = await extractRawTextFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      if (!rawText || rawText.trim().length === 0) {
        return res.status(422).json({
          success: false,
          error: {
            code: "PARSING_FAILED",
            message: "Unable to extract text from the uploaded document. Please check the file formatting.",
          },
        });
      }

      // Step 1: Deterministic extraction
      const baselineProfile = parseStructuredCareerFromText(rawText, req.file.originalname);

      // Step 2: Hermes Agent Semantic Extraction with Link Preservation
      const structuredProfile = await runHermesResumeExtraction(rawText, baselineProfile);

      return res.json({
        success: true,
        data: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          rawText,
          parsedProfile: structuredProfile,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "UPLOAD_PARSE_ERROR", message: err.message || "Failed to process resume upload." },
      });
    }
  }
);

// POST /api/resumes/parse
router.post("/parse", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_TEXT", message: "rawText string is required" },
      });
    }

    const baselineProfile = parseStructuredCareerFromText(rawText);
    const structuredProfile = await runHermesResumeExtraction(rawText, baselineProfile);

    return res.json({
      success: true,
      data: {
        rawText,
        parsedProfile: structuredProfile,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "PARSE_ERROR", message: err.message },
    });
  }
});

// GET /api/resumes
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const client = req.supabaseClient!;

    const { data: careerProfiles, error } = await client
      .from("career_profiles")
      .select("id, version, professional_headline, created_at, updated_at")
      .eq("user_id", userId)
      .order("version", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: careerProfiles || [],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "FETCH_RESUMES_ERROR", message: err.message },
    });
  }
});

export default router;
