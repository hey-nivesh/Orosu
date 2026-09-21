import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profile.routes";
import resumeRoutes from "./routes/resume.routes";
import jobsRoutes from "./routes/jobs.routes";
import tailorRoutes from "./routes/tailor.routes";
import versionsRoutes from "./routes/versions.routes";
import gmailRoutes from "./routes/gmail.routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // Enable CORS
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.NEXT_PUBLIC_APP_URL || "",
      ].filter(Boolean),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      success: true,
      data: {
        service: "Orosu Backend API",
        status: "healthy",
        phase: "Phase 3 - Resume Intelligence, Tailoring & Gmail Automation",
        timestamp: new Date().toISOString(),
      },
    });
  });

  // API Routes
  app.use("/api/profile", profileRoutes);
  app.use("/api/resumes", resumeRoutes);
  app.use("/api/resumes", versionsRoutes);
  app.use("/api/jobs", jobsRoutes);
  app.use("/api/integrations", gmailRoutes);
  app.use("/api", tailorRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: `Route ${req.method} ${req.originalUrl} not found`,
      },
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
