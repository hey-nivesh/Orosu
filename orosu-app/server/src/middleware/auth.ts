import { Request, Response, NextFunction } from "express";
import { supabase, getAuthenticatedClient } from "../config/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  token?: string;
  supabaseClient?: SupabaseClient;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header",
        },
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Bearer token required",
        },
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: error?.message || "Invalid or expired session token",
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email || "",
    };
    req.token = token;
    req.supabaseClient = getAuthenticatedClient(token);

    next();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_VALIDATION_ERROR",
        message: "Failed to validate authentication token",
      },
    });
  }
}
