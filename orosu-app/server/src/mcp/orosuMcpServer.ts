import { SupabaseClient } from "@supabase/supabase-js";
import { StructuredCareerProfile } from "../validators/schemas";

/**
 * Dedicated Orosu Model Context Protocol (MCP) Server: `orosu-mcp`
 * Provides tightly-scoped, READ-ONLY candidate context tools for Hermes Agent.
 * Hermes receives candidate data strictly through these controlled functions.
 * Direct unrestricted database write/delete operations are not exposed.
 */

export interface McpToolResponse<T = any> {
  tool: string;
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export class OrosuMcpServer {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Tool: get_candidate_profile
   * Retrieves the user's canonical StructuredCareerProfile
   */
  async getCandidateProfile(userId: string): Promise<McpToolResponse<StructuredCareerProfile | null>> {
    try {
      const { data, error } = await this.client
        .from("career_profiles")
        .select("*")
        .eq("user_id", userId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return {
        tool: "get_candidate_profile",
        success: true,
        data: data?.profile_json || null,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        tool: "get_candidate_profile",
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Tool: get_experiences
   * Retrieves candidate work experiences with source provenance IDs
   */
  async getExperiences(userId: string): Promise<McpToolResponse> {
    const profileRes = await this.getCandidateProfile(userId);
    if (!profileRes.success || !profileRes.data) {
      return {
        tool: "get_experiences",
        success: false,
        error: profileRes.error || "Profile not found",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      tool: "get_experiences",
      success: true,
      data: profileRes.data.experiences || [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Tool: get_projects
   * Retrieves candidate projects with technologies and achievement blocks
   */
  async getProjects(userId: string): Promise<McpToolResponse> {
    const profileRes = await this.getCandidateProfile(userId);
    if (!profileRes.success || !profileRes.data) {
      return {
        tool: "get_projects",
        success: false,
        error: profileRes.error || "Profile not found",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      tool: "get_projects",
      success: true,
      data: profileRes.data.projects || [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Tool: get_skills
   * Retrieves verified candidate skills categorized by area
   */
  async getSkills(userId: string): Promise<McpToolResponse> {
    const profileRes = await this.getCandidateProfile(userId);
    if (!profileRes.success || !profileRes.data) {
      return {
        tool: "get_skills",
        success: false,
        error: profileRes.error || "Profile not found",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      tool: "get_skills",
      success: true,
      data: profileRes.data.skills || [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Tool: get_education
   * Retrieves candidate academic background and degrees
   */
  async getEducation(userId: string): Promise<McpToolResponse> {
    const profileRes = await this.getCandidateProfile(userId);
    if (!profileRes.success || !profileRes.data) {
      return {
        tool: "get_education",
        success: false,
        error: profileRes.error || "Profile not found",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      tool: "get_education",
      success: true,
      data: profileRes.data.education || [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Tool: get_certifications
   * Retrieves candidate certifications and licenses
   */
  async getCertifications(userId: string): Promise<McpToolResponse> {
    const profileRes = await this.getCandidateProfile(userId);
    if (!profileRes.success || !profileRes.data) {
      return {
        tool: "get_certifications",
        success: false,
        error: profileRes.error || "Profile not found",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      tool: "get_certifications",
      success: true,
      data: profileRes.data.certifications || [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Tool: get_job_description
   * Retrieves target job description details
   */
  async getJobDescription(jobId: string, userId: string): Promise<McpToolResponse> {
    try {
      const { data, error } = await this.client
        .from("job_descriptions")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        return {
          tool: "get_job_description",
          success: false,
          error: error?.message || "Job description not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        tool: "get_job_description",
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        tool: "get_job_description",
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Tool: get_resume_source
   * Retrieves the raw document IR and text extracted from the user's original uploaded resume
   */
  async getResumeSource(userId: string): Promise<McpToolResponse> {
    try {
      const { data, error } = await this.client
        .from("career_profiles")
        .select("raw_resume_text, profile_json")
        .eq("user_id", userId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return {
          tool: "get_resume_source",
          success: false,
          error: error?.message || "No resume source document found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        tool: "get_resume_source",
        success: true,
        data: {
          rawText: data.raw_resume_text || "",
          documentIR: data.profile_json?.documentIR || null,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        tool: "get_resume_source",
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Dispatcher for MCP tool calls
   */
  async callTool(name: string, params: { userId: string; jobId?: string }): Promise<McpToolResponse> {
    switch (name) {
      case "get_candidate_profile":
        return this.getCandidateProfile(params.userId);
      case "get_experiences":
        return this.getExperiences(params.userId);
      case "get_projects":
        return this.getProjects(params.userId);
      case "get_skills":
        return this.getSkills(params.userId);
      case "get_education":
        return this.getEducation(params.userId);
      case "get_certifications":
        return this.getCertifications(params.userId);
      case "get_job_description":
        return this.getJobDescription(params.jobId || "", params.userId);
      case "get_resume_source":
        return this.getResumeSource(params.userId);
      default:
        return {
          tool: name,
          success: false,
          error: `Tool '${name}' not recognized by Orosu MCP Server.`,
          timestamp: new Date().toISOString(),
        };
    }
  }
}
