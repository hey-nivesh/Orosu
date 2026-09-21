import { StructuredCareerProfile } from "../validators/schemas";

export function calculateProfileCompletion(profile: {
  basics?: { name?: string; email?: string; location?: string; headline?: string };
  summary?: string;
  experiences?: any[];
  projects?: any[];
  skills?: any[];
  education?: any[];
  certifications?: any[];
}): number {
  let score = 0;

  // Basic contact info (up to 20 pts)
  if (profile.basics?.name || profile.basics?.email) score += 10;
  if (profile.basics?.location || profile.basics?.headline) score += 10;

  // Summary (up to 15 pts)
  if (profile.summary && profile.summary.trim().length > 20) {
    score += 15;
  }

  // Work Experiences (up to 25 pts)
  if (profile.experiences && profile.experiences.length > 0) {
    score += 15;
    if (profile.experiences.length >= 2) score += 10;
  }

  // Skills (up to 15 pts)
  if (profile.skills && profile.skills.length > 0) {
    score += 10;
    if (profile.skills.length >= 4) score += 5;
  }

  // Projects (up to 15 pts)
  if (profile.projects && profile.projects.length > 0) {
    score += 15;
  }

  // Education & Certifications (up to 10 pts)
  if (
    (profile.education && profile.education.length > 0) ||
    (profile.certifications && profile.certifications.length > 0)
  ) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}
