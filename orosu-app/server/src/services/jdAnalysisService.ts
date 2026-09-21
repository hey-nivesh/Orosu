import { JDAnalysis, JDAnalysisSchema, EvidenceRequirement } from "../validators/schemas";

/**
 * Deterministic and semantic analyzer for target Job Descriptions.
 * Extracts structured requirements, technical keywords, responsibilities,
 * and exact evidence expectations.
 */
export function analyzeJobDescription(
  rawText: string,
  fallbackCompany?: string,
  fallbackRole?: string
): JDAnalysis {
  const normalized = (rawText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Detect Company & Role
  let detectedRole = fallbackRole || "";
  let detectedCompany = fallbackCompany || "";

  if (!detectedRole) {
    const roleMatch = normalized.match(/(?:Title|Position|Role):\s*([^\n]+)/i);
    if (roleMatch) {
      detectedRole = roleMatch[1].trim();
    } else if (lines.length > 0 && lines[0].length < 60) {
      detectedRole = lines[0];
    } else {
      detectedRole = "Target Position";
    }
  }

  if (!detectedCompany) {
    const companyMatch = normalized.match(/(?:Company|Organization|At):\s*([^\n]+)/i);
    if (companyMatch) {
      detectedCompany = companyMatch[1].trim();
    } else {
      detectedCompany = "Target Organization";
    }
  }

  // 2. Classify Seniority
  let seniority = "Mid-Senior";
  if (/\b(?:Staff|Principal|Lead|Director|Head of|VP|Chief)\b/i.test(normalized)) {
    seniority = "Staff / Principal";
  } else if (/\b(?:Senior|Sr\.|Lead)\b/i.test(normalized)) {
    seniority = "Senior";
  } else if (/\b(?:Junior|Jr\.|Entry|Associate|Intern)\b/i.test(normalized)) {
    seniority = "Junior / Associate";
  }

  // 3. Technical & Domain Skill Taxonomy Dictionaries
  const knownTechDictionary = [
    "React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Express", "Python",
    "Go", "Golang", "Rust", "Java", "C++", "C#", ".NET", "Ruby", "Rails",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Supabase", "DynamoDB", "Prisma",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD",
    "GraphQL", "REST", "gRPC", "WebSockets", "Tailwind CSS", "Redux", "Zustand",
    "Kafka", "RabbitMQ", "Elasticsearch", "OpenAI", "LLM", "RAG", "Vector DB",
    "FastAPI", "Django", "Flask", "Spring Boot", "Git", "GitHub", "Linux",
    "Microservices", "Serverless", "Event-Driven", "Unit Testing", "Jest", "Playwright"
  ];

  const softSkillsDictionary = [
    "Cross-functional Collaboration", "Communication", "Problem Solving",
    "Mentorship", "System Design", "Agile / Scrum", "Code Review",
    "Architecture", "Ownership", "Product Sense", "Documentation"
  ];

  // 4. Match Technologies
  const detectedTech = new Set<string>();
  for (const tech of knownTechDictionary) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(normalized)) {
      detectedTech.add(tech);
    }
  }

  // 5. Match Soft Skills
  const detectedSoftSkills = new Set<string>();
  for (const soft of softSkillsDictionary) {
    const regex = new RegExp(`\\b${soft.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(normalized)) {
      detectedSoftSkills.add(soft);
    }
  }

  // 6. Partition sections: Requirements vs Responsibilities
  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];
  const responsibilities: string[] = [];
  const experienceRequirements: string[] = [];
  const educationRequirements: string[] = [];
  const evidenceRequirements: EvidenceRequirement[] = [];

  let currentZone: "general" | "required" | "preferred" | "responsibilities" | "education" = "general";

  for (const line of lines) {
    const upper = line.toUpperCase();

    if (
      upper.includes("REQUIREMENT") ||
      upper.includes("QUALIFICATION") ||
      upper.includes("WHAT WE'RE LOOKING FOR") ||
      upper.includes("WHAT YOU'LL NEED") ||
      upper.includes("MUST HAVE")
    ) {
      currentZone = "required";
      continue;
    } else if (
      upper.includes("NICE TO HAVE") ||
      upper.includes("BONUS") ||
      upper.includes("PREFERRED") ||
      upper.includes("PLUS")
    ) {
      currentZone = "preferred";
      continue;
    } else if (
      upper.includes("RESPONSIBILIT") ||
      upper.includes("WHAT YOU'LL DO") ||
      upper.includes("DUTIES") ||
      upper.includes("THE ROLE")
    ) {
      currentZone = "responsibilities";
      continue;
    } else if (upper.includes("EDUCATION") || upper.includes("DEGREE")) {
      currentZone = "education";
      continue;
    }

    const isBullet = /^[•\-*·▪▫►\d.]\s*/.test(line);
    const clean = line.replace(/^[•\-*·▪▫►\d.]\s*/, "").trim();

    if (clean.length > 5 && isBullet) {
      if (currentZone === "required") {
        requiredSkills.push(clean);
        // Check for year requirements
        const yearMatch = clean.match(/\b\d+\+?\s*(?:years|yrs)\b/i);
        if (yearMatch) {
          experienceRequirements.push(clean);
        }
      } else if (currentZone === "preferred") {
        preferredSkills.push(clean);
      } else if (currentZone === "responsibilities") {
        responsibilities.push(clean);
      } else if (currentZone === "education") {
        educationRequirements.push(clean);
      }
    }
  }

  // If no bullets partitioned, extract tech list as required
  const techList = Array.from(detectedTech);
  if (requiredSkills.length === 0) {
    requiredSkills.push(...techList.slice(0, 8));
  }

  // 7. Generate Evidence Expectations
  for (const tech of techList) {
    evidenceRequirements.push({
      requirement: tech,
      type: "technology",
      importance: requiredSkills.some((r) => r.toLowerCase().includes(tech.toLowerCase())) ? "high" : "medium",
      description: `Demonstrated hands-on experience using ${tech} in production or key projects.`,
    });
  }

  for (const expReq of experienceRequirements) {
    evidenceRequirements.push({
      requirement: expReq,
      type: "experience",
      importance: "high",
      description: expReq,
    });
  }

  const analysis: JDAnalysis = {
    jobTitle: detectedRole,
    company: detectedCompany,
    requiredSkills: requiredSkills.slice(0, 15),
    preferredSkills: preferredSkills.slice(0, 10),
    technologies: techList,
    responsibilities: responsibilities.slice(0, 10),
    experienceRequirements: experienceRequirements.slice(0, 5),
    educationRequirements: educationRequirements.slice(0, 3),
    keywords: [...techList, ...Array.from(detectedSoftSkills)],
    domainTerms: techList.slice(0, 10),
    softSkills: Array.from(detectedSoftSkills),
    location: "",
    employmentType: "Full-time",
    seniority,
    evidenceRequirements,
  };

  return JDAnalysisSchema.parse(analysis);
}
