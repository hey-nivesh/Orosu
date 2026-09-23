import { createClient } from "@/lib/supabase/client";
import {
  ApiResponse,
  CareerProfileRecord,
  JobDescriptionRecord,
  StructuredCareerProfile,
  UserProfile,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const isFormData = options.body instanceof FormData;

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    const message = data.error?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data.data as T;
}

// 1. Profile API
export const profileApi = {
  getProfile: () => request<UserProfile>("/api/profile"),

  getCareer: () =>
    request<{
      careerProfile: CareerProfileRecord | null;
      experiences: any[];
      projects: any[];
      skills: any[];
      education: any[];
      certifications: any[];
    }>("/api/profile/career"),

  updateProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  saveCareer: (profile: StructuredCareerProfile, rawResumeText?: string) =>
    request<{ careerProfile: CareerProfileRecord; completionScore: number }>(
      "/api/profile/career",
      {
        method: "PUT",
        body: JSON.stringify({ profile, rawResumeText }),
      }
    ),
};

// 2. Resume API
export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    return request<{
      fileName: string;
      fileSize: number;
      mimeType: string;
      rawText: string;
      parsedProfile: StructuredCareerProfile;
    }>("/api/resumes/upload", {
      method: "POST",
      body: formData,
    });
  },

  parseText: (rawText: string) =>
    request<{
      rawText: string;
      parsedProfile: StructuredCareerProfile;
    }>("/api/resumes/parse", {
      method: "POST",
      body: JSON.stringify({ rawText }),
    }),

  getResumes: () => request<CareerProfileRecord[]>("/api/resumes"),
};

// 3. Jobs API
export const jobsApi = {
  getJobs: () => request<JobDescriptionRecord[]>("/api/jobs"),

  createJob: (payload: { company?: string; role?: string; raw_text: string }) =>
    request<JobDescriptionRecord>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getJob: (id: string) => request<JobDescriptionRecord>(`/api/jobs/${id}`),

  updateJob: (id: string, payload: Partial<JobDescriptionRecord>) =>
    request<JobDescriptionRecord>(`/api/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteJob: (id: string) =>
    request<{ message: string }>(`/api/jobs/${id}`, {
      method: "DELETE",
    }),

  analyzeJob: (id: string) =>
    request<{
      analysisId: string;
      analysis: any;
      matchRadar: any;
      evidenceMap: any[];
    }>(`/api/jobs/${id}/analyze`, {
      method: "POST",
    }),

  getAnalysis: (id: string) =>
    request<{
      id: string;
      analysis: any;
      matchRadar: any;
      evidenceMap: any[];
      created_at: string;
    }>(`/api/jobs/${id}/analysis`),
};

// 4. Tailor & Resume Versions API
export const tailorApi = {
  generateTailoredResume: (jobId: string, templateId: string = "modern_clean") =>
    request<{
      versionId: string;
      versionNumber: number;
      title: string;
      pdfUrl: string;
      tailoredResume: any;
      matchRadar: any;
      evidenceMap: any[];
      correlationId: string;
    }>("/api/tailor/generate", {
      method: "POST",
      body: JSON.stringify({ jobId, templateId }),
    }),

  getVersions: () => request<any[]>("/api/resumes/versions"),

  getVersion: (id: string) => request<any>(`/api/resumes/versions/${id}`),

  deleteVersion: (id: string) =>
    request<{ message: string }>(`/api/resumes/versions/${id}`, {
      method: "DELETE",
    }),

  saveEdits: (id: string, tailored_resume_json: any) =>
    request<any>(`/api/resumes/versions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ tailored_resume_json }),
    }),

  tailorWithJD: (id: string, jdText: string) =>
    request<{ tailoredResumeJson: any; matchRadar: any; evidenceMap: any[]; correlationId: string }>(
      `/api/resumes/versions/${id}/tailor-with-jd`,
      {
        method: "POST",
        body: JSON.stringify({ jdText }),
      }
    ),

  downloadPdf: async (versionId: string, customFilename?: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/resumes/versions/${versionId}/download`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = customFilename || "Tailored_Resume.pdf";

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Trigger direct browser file download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// 5. Gmail & Google Integrations API
export const gmailApi = {
  getGoogleAuthUrl: (returnTo?: string) =>
    request<{ authUrl: string }>(`/api/integrations/google/auth-url?returnTo=${encodeURIComponent(returnTo || "/resumes")}`),

  getGoogleStatus: () =>
    request<{ isConnected: boolean; email?: string; scope?: string; expiresAt?: string }>(
      "/api/integrations/google/status"
    ),

  generateDraftBody: (payload: {
    candidateName: string;
    recipientName?: string;
    company: string;
    role: string;
    topSkills?: string[];
  }) =>
    request<{ subject: string; body: string }>("/api/integrations/gmail/ai-draft-body", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createDraft: (payload: {
    resumeVersionId: string;
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    body: string;
  }) =>
    request<{ draftId: string; gmailWebUrl: string; message: string }>("/api/integrations/gmail/draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
