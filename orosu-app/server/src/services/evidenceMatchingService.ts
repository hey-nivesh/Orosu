import {
  StructuredCareerProfile,
  JDAnalysis,
  RequirementMatch,
  MatchRadar,
  EvidenceItem,
} from "../validators/schemas";

/**
 * Strict evidence-based matcher comparing JD requirements against the candidate's
 * Canonical Career Profile. Zero fabricated claims.
 */
export function matchCandidateEvidence(
  profile: StructuredCareerProfile,
  analysis: JDAnalysis
): { evidenceMap: RequirementMatch[]; matchRadar: MatchRadar } {
  const evidenceMap: RequirementMatch[] = [];

  // Index all candidate source items for fast, deterministic search
  const candidateSkills = profile.skills.map((s) => ({
    name: s.name.toLowerCase().trim(),
    original: s.name,
    category: s.category || "General",
    sourceId: s.id || s.sourceBlockId || `skill-${s.name}`,
  }));

  const candidateExperiences = profile.experiences.map((exp) => {
    const rawBullets = exp.achievements || exp.bullets || [];
    const formattedBullets = rawBullets.map((b) => {
      if (typeof b === "string") {
        return { text: b, sourceId: exp.id || "exp" };
      }
      return { text: b.text, sourceId: b.sourceBlockId || exp.id || "exp" };
    });

    return {
      company: exp.company,
      role: exp.role,
      id: exp.id || `exp-${exp.company}`,
      bullets: formattedBullets,
      fullText: `${exp.role} ${exp.company} ${exp.description || ""} ${formattedBullets.map((b) => b.text).join(" ")}`.toLowerCase(),
    };
  });

  const candidateProjects = profile.projects.map((proj) => {
    const rawBullets = proj.achievements || proj.bullets || [];
    const formattedBullets = rawBullets.map((b) => {
      if (typeof b === "string") {
        return { text: b, sourceId: proj.id || "proj" };
      }
      return { text: b.text, sourceId: b.sourceBlockId || proj.id || "proj" };
    });

    return {
      name: proj.name,
      id: proj.id || `proj-${proj.name}`,
      technologies: proj.technologies.map((t) => t.toLowerCase()),
      bullets: formattedBullets,
      fullText: `${proj.name} ${proj.description || ""} ${proj.technologies.join(" ")} ${formattedBullets.map((b) => b.text).join(" ")}`.toLowerCase(),
    };
  });

  // Helper to find exact or partial matches
  const evaluateRequirement = (
    requirement: string,
    category: "skill" | "technology" | "experience" | "responsibility" | "education" | "domain"
  ): RequirementMatch => {
    const reqLower = requirement.toLowerCase().trim();
    const evidence: EvidenceItem[] = [];

    // 1. Direct Skill Match
    for (const skill of candidateSkills) {
      if (skill.name === reqLower || reqLower.includes(skill.name) || skill.name.includes(reqLower)) {
        evidence.push({
          sourceType: "skill",
          sourceId: skill.sourceId,
          sourceText: `Skill: ${skill.original} (${skill.category})`,
          relevanceScore: skill.name === reqLower ? 1.0 : 0.85,
        });
      }
    }

    // 2. Project Technology & Description Match
    for (const proj of candidateProjects) {
      if (proj.technologies.some((t) => t === reqLower || reqLower.includes(t))) {
        evidence.push({
          sourceType: "project",
          sourceId: proj.id,
          sourceText: `Project: ${proj.name} — Tech: ${proj.technologies.join(", ")}`,
          relevanceScore: 0.95,
        });
      }

      for (const bullet of proj.bullets) {
        if (bullet.text.toLowerCase().includes(reqLower)) {
          evidence.push({
            sourceType: "project",
            sourceId: bullet.sourceId,
            sourceText: `Project ${proj.name}: ${bullet.text}`,
            relevanceScore: 0.9,
          });
        }
      }
    }

    // 3. Work Experience Bullets Match
    for (const exp of candidateExperiences) {
      for (const bullet of exp.bullets) {
        if (bullet.text.toLowerCase().includes(reqLower)) {
          evidence.push({
            sourceType: "experience",
            sourceId: bullet.sourceId,
            sourceText: `${exp.role} at ${exp.company}: ${bullet.text}`,
            relevanceScore: 0.95,
          });
        }
      }
    }

    // Determine status based strictly on evidence
    if (evidence.length >= 2 || (evidence.length === 1 && evidence[0].relevanceScore >= 0.9)) {
      return {
        requirement,
        category,
        status: "matched",
        confidence: 0.95,
        evidence: evidence.slice(0, 4),
        notes: `Verified across ${evidence.length} source record(s).`,
      };
    } else if (evidence.length > 0) {
      return {
        requirement,
        category,
        status: "partially_matched",
        confidence: 0.75,
        evidence: evidence.slice(0, 3),
        notes: "Partial mention found in candidate profile.",
      };
    } else {
      return {
        requirement,
        category,
        status: "not_found",
        confidence: 0.95,
        evidence: [],
        notes: "No direct evidence found in candidate profile. Will not be fabricated.",
      };
    }
  };

  // Match all required skills and technologies
  const allReqs = Array.from(
    new Set([...analysis.requiredSkills, ...analysis.technologies, ...analysis.preferredSkills])
  );

  for (const req of allReqs) {
    const isTech = analysis.technologies.includes(req);
    evidenceMap.push(evaluateRequirement(req, isTech ? "technology" : "skill"));
  }

  // Calculate Match Radar Metrics
  const total = evidenceMap.length || 1;
  const matchedCount = evidenceMap.filter((m) => m.status === "matched").length;
  const partialCount = evidenceMap.filter((m) => m.status === "partially_matched").length;
  const missingCount = evidenceMap.filter((m) => m.status === "not_found").length;

  const score = Math.round(((matchedCount * 1.0 + partialCount * 0.5) / total) * 100);

  const skillsMatch = Math.round(
    ((evidenceMap.filter((m) => m.category === "skill" && m.status !== "not_found").length) /
      Math.max(1, evidenceMap.filter((m) => m.category === "skill").length)) *
      100
  );

  const expMatch = Math.round(
    ((evidenceMap.filter((m) => m.category === "technology" && m.status !== "not_found").length) /
      Math.max(1, evidenceMap.filter((m) => m.category === "technology").length)) *
      100
  );

  const matchRadar: MatchRadar = {
    overallScore: Math.min(100, Math.max(0, score)),
    skillsMatchPercent: Math.min(100, Math.max(0, skillsMatch)),
    experienceMatchPercent: Math.min(100, Math.max(0, expMatch)),
    matchedCount,
    partialCount,
    missingCount,
    totalRequirements: total,
  };

  return { evidenceMap, matchRadar };
}
