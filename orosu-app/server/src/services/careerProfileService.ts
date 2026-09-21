import { SupabaseClient } from "@supabase/supabase-js";
import { StructuredCareerProfile } from "../validators/schemas";
import { calculateProfileCompletion } from "./profileCompletionService";

export async function getCareerProfile(supabase: SupabaseClient, userId: string) {
  // 1. Fetch latest career profile
  const { data: careerProfile, error: cpError } = await supabase
    .from("career_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cpError) throw cpError;

  // 2. Fetch related items
  const [expRes, prjRes, skillRes, eduRes, certRes] = await Promise.all([
    supabase.from("experiences").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("skills").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("education").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("certifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  return {
    careerProfile: careerProfile || null,
    experiences: expRes.data || [],
    projects: prjRes.data || [],
    skills: skillRes.data || [],
    education: eduRes.data || [],
    certifications: certRes.data || [],
  };
}

export async function saveStructuredCareerProfile(
  supabase: SupabaseClient,
  userId: string,
  profileData: StructuredCareerProfile,
  rawResumeText?: string
) {
  // 1. Create or update career_profiles row
  const { data: existingCp } = await supabase
    .from("career_profiles")
    .select("id, version")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = existingCp ? (existingCp.version || 1) + 1 : 1;

  const { data: newCp, error: cpError } = await supabase
    .from("career_profiles")
    .insert({
      user_id: userId,
      professional_headline: profileData.basics.headline || "",
      summary: profileData.summary || "",
      raw_resume_text: rawResumeText || "",
      profile_json: profileData,
      version: nextVersion,
    })
    .select()
    .single();

  if (cpError) throw cpError;

  const careerProfileId = newCp.id;

  // 2. Clear old children or insert new records
  // For initial version replace with confirmed items
  await Promise.all([
    supabase.from("experiences").delete().eq("user_id", userId),
    supabase.from("projects").delete().eq("user_id", userId),
    supabase.from("skills").delete().eq("user_id", userId),
    supabase.from("education").delete().eq("user_id", userId),
    supabase.from("certifications").delete().eq("user_id", userId),
  ]);

  // 3. Batch insert new records
  const insertPromises = [];

  if (profileData.experiences.length > 0) {
    const expRows = profileData.experiences.map((exp) => ({
      user_id: userId,
      career_profile_id: careerProfileId,
      company: exp.company,
      role: exp.role,
      location: exp.location || "",
      start_date: exp.startDate || "",
      end_date: exp.endDate || "",
      description: exp.description || "",
      achievements: exp.achievements || [],
      source: exp.source || "resume",
    }));
    insertPromises.push(supabase.from("experiences").insert(expRows));
  }

  if (profileData.projects.length > 0) {
    const prjRows = profileData.projects.map((prj) => ({
      user_id: userId,
      career_profile_id: careerProfileId,
      name: prj.name,
      description: prj.description || "",
      technologies: prj.technologies || [],
      url: prj.url || "",
      achievements: prj.achievements || [],
      source: prj.source || "resume",
    }));
    insertPromises.push(supabase.from("projects").insert(prjRows));
  }

  if (profileData.skills.length > 0) {
    const skillRows = profileData.skills.map((s) => ({
      user_id: userId,
      career_profile_id: careerProfileId,
      name: s.name,
      category: s.category || "General",
      source: s.source || "resume",
    }));
    insertPromises.push(supabase.from("skills").insert(skillRows));
  }

  if (profileData.education.length > 0) {
    const eduRows = profileData.education.map((edu) => ({
      user_id: userId,
      career_profile_id: careerProfileId,
      institution: edu.institution,
      degree: edu.degree || "",
      field: edu.field || "",
      start_date: edu.startDate || "",
      end_date: edu.endDate || "",
      description: edu.description || "",
    }));
    insertPromises.push(supabase.from("education").insert(eduRows));
  }

  if (profileData.certifications.length > 0) {
    const certRows = profileData.certifications.map((cert) => ({
      user_id: userId,
      career_profile_id: careerProfileId,
      name: cert.name,
      issuer: cert.issuer || "",
      date: cert.date || "",
      description: cert.description || "",
    }));
    insertPromises.push(supabase.from("certifications").insert(certRows));
  }

  await Promise.all(insertPromises);

  // 4. Recalculate and update profile completion score
  const completionScore = calculateProfileCompletion(profileData);

  await supabase
    .from("profiles")
    .update({
      full_name: profileData.basics.name || undefined,
      profile_completion: completionScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return {
    careerProfile: newCp,
    completionScore,
  };
}
