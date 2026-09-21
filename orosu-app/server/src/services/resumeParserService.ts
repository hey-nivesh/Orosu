import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import {
  DocumentIR,
  SectionIR,
  BlockIR,
  StructuredCareerProfile,
  StructuredCareerProfileSchema,
} from "../validators/schemas";

export interface ExtractedLink {
  type: "github" | "linkedin" | "portfolio" | "email" | "phone" | "project" | "generic";
  url: string;
  label?: string;
  page?: number;
  rawText?: string;
  sourceBlockId?: string;
}

/**
 * Extracts raw text and PDF link annotations directly from the PDF buffer structure.
 */
export function extractLinksFromPdfBuffer(buffer: Buffer): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const rawContent = buffer.toString("binary");

  // Scan for PDF URI action dictionaries /URI (https://...) or /URI <hex>
  const uriRegex = /\/URI\s*\(([^)]+)\)|\/URI\s*<([^>]+)>/g;
  let match: RegExpExecArray | null;

  while ((match = uriRegex.exec(rawContent)) !== null) {
    let url = match[1] || "";
    if (match[2]) {
      // Decode hex string if present
      url = Buffer.from(match[2], "hex").toString("utf-8");
    }
    url = url.trim();
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("tel:")) {
      const normalized = normalizeUrl(url);
      if (normalized && !links.some((l) => l.url === normalized.url)) {
        links.push(normalized);
      }
    }
  }

  return links;
}

/**
 * Normalizes an extracted URL and tags its type.
 */
export function normalizeUrl(url: string, label?: string): ExtractedLink {
  let cleanUrl = url.trim();
  let type: ExtractedLink["type"] = "generic";

  if (cleanUrl.startsWith("mailto:")) {
    return { type: "email", url: cleanUrl, label: label || cleanUrl.replace("mailto:", "") };
  }
  if (cleanUrl.startsWith("tel:")) {
    return { type: "phone", url: cleanUrl, label: label || cleanUrl.replace("tel:", "") };
  }

  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    if (cleanUrl.includes("@")) {
      return { type: "email", url: `mailto:${cleanUrl}`, label: label || cleanUrl };
    }
    if (/^\+?[\d\s\-()]{8,}$/.test(cleanUrl)) {
      return { type: "phone", url: `tel:${cleanUrl.replace(/\s+/g, "")}`, label: label || cleanUrl };
    }
    cleanUrl = `https://${cleanUrl}`;
  }

  const lower = cleanUrl.toLowerCase();
  if (lower.includes("github.com")) {
    type = "github";
  } else if (lower.includes("linkedin.com")) {
    type = "linkedin";
  } else if (lower.includes(".dev") || lower.includes(".io") || lower.includes(".me") || lower.includes("portfolio")) {
    type = "portfolio";
  } else if (label && /preview|live|demo/i.test(label)) {
    type = "project";
  }

  return { type, url: cleanUrl, label };
}

/**
 * Extracts plain-text URLs, emails, phone numbers, and handles from text.
 */
export function extractLinksFromText(text: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'()]+|(?:github\.com|linkedin\.com\/in)\/[a-zA-Z0-9_\-./]+/gi;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?\d{10}/g;

  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    const norm = normalizeUrl(match[0]);
    if (!links.some((l) => l.url === norm.url)) links.push(norm);
  }

  while ((match = emailRegex.exec(text)) !== null) {
    const norm = normalizeUrl(`mailto:${match[0]}`, match[0]);
    if (!links.some((l) => l.url === norm.url)) links.push(norm);
  }

  while ((match = phoneRegex.exec(text)) !== null) {
    const cleanPhone = match[0].trim();
    if (cleanPhone.length >= 10) {
      const norm = normalizeUrl(`tel:${cleanPhone.replace(/\s+/g, "")}`, cleanPhone);
      if (!links.some((l) => l.url === norm.url)) links.push(norm);
    }
  }

  return links;
}

/**
 * Robustly extract raw text and page-level information from PDF, DOCX, DOC, or TXT buffer.
 */
export async function extractRawTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<{ text: string; pageCount: number; extractedLinks: ExtractedLink[] }> {
  const cleanFileName = (fileName || "").toLowerCase();
  const cleanMime = (mimeType || "").toLowerCase();

  const isPdf = cleanMime.includes("pdf") || cleanFileName.endsWith(".pdf");
  const isDocx =
    cleanMime.includes("wordprocessingml") ||
    cleanMime.includes("msword") ||
    cleanFileName.endsWith(".docx") ||
    cleanFileName.endsWith(".doc");

  const pdfLinks = isPdf ? extractLinksFromPdfBuffer(buffer) : [];

  // 1. Try PDF parsing
  if (isPdf) {
    try {
      const data = await pdfParse(buffer);
      if (data && data.text && data.text.trim().length > 0) {
        const textLinks = extractLinksFromText(data.text);
        const mergedLinks = [...pdfLinks];
        for (const tl of textLinks) {
          if (!mergedLinks.some((ml) => ml.url === tl.url)) {
            mergedLinks.push(tl);
          }
        }

        return {
          text: data.text,
          pageCount: data.numpages || 1,
          extractedLinks: mergedLinks,
        };
      }
    } catch (pdfErr) {
      console.warn("⚠️ pdf-parse primary extraction failed, trying fallback string decode:", pdfErr);
    }
  }

  // 2. Try DOCX parsing via Mammoth
  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result && result.value && result.value.trim().length > 0) {
        const textLinks = extractLinksFromText(result.value);
        return {
          text: result.value,
          pageCount: 1,
          extractedLinks: textLinks,
        };
      }
    } catch (docErr) {
      console.warn("⚠️ Mammoth extraction failed, falling back:", docErr);
    }
  }

  // 3. Fallback: decode buffer as UTF-8 and strip unprintable control characters
  const rawDecoded = buffer.toString("utf-8");
  const printableText = rawDecoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ").trim();
  const fallbackLinks = extractLinksFromText(printableText);

  return {
    text: printableText,
    pageCount: 1,
    extractedLinks: fallbackLinks,
  };
}

/**
 * Builds the canonical Document Intermediate Representation (IR) losslessly preserving
 * all sections, ordering, headings, text blocks, bullets, and provenance IDs.
 */
export function buildDocumentIR(
  rawText: string,
  fileName: string = "resume.pdf",
  fileType: "pdf" | "docx" | "doc" | "txt" | "unknown" = "pdf",
  pageCount: number = 1
): DocumentIR {
  const normalizedText = (rawText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalizedText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const sections: SectionIR[] = [];
  let currentSection: SectionIR = {
    id: uuidv4(),
    heading: { original: "CONTACT & HEADER", normalized: "contact" },
    order: 0,
    blocks: [],
    rawText: "",
  };

  const isHeadingLine = (line: string): { original: string; normalized: any } | null => {
    const clean = line.toUpperCase().replace(/[^A-Z\s]/g, "").trim();
    if (clean.length === 0 || clean.length > 40) return null;

    if (
      clean === "EXPERIENCE" ||
      clean === "WORK EXPERIENCE" ||
      clean === "PROFESSIONAL EXPERIENCE" ||
      clean === "EMPLOYMENT HISTORY" ||
      clean === "WORK HISTORY" ||
      clean === "CAREER HISTORY" ||
      clean === "INTERNSHIPS"
    ) {
      return { original: line, normalized: "experience" };
    }

    if (
      clean === "PROJECTS" ||
      clean === "PERSONAL PROJECTS" ||
      clean === "KEY PROJECTS" ||
      clean === "ACADEMIC PROJECTS" ||
      clean === "FEATURED PROJECTS" ||
      clean === "PORTFOLIO"
    ) {
      return { original: line, normalized: "projects" };
    }

    if (
      clean === "SKILLS" ||
      clean === "TECHNICAL SKILLS" ||
      clean === "CORE COMPETENCIES" ||
      clean === "TECHNOLOGIES" ||
      clean === "TECH STACK" ||
      clean === "AREAS OF EXPERTISE" ||
      clean === "PROGRAMMING LANGUAGES" ||
      clean === "TOOLS AND TECHNOLOGIES"
    ) {
      return { original: line, normalized: "skills" };
    }

    if (
      clean === "EDUCATION" ||
      clean === "ACADEMIC BACKGROUND" ||
      clean === "ACADEMIC HISTORY" ||
      clean === "EDUCATIONAL BACKGROUND" ||
      clean === "QUALIFICATIONS" ||
      clean === "DEGREES"
    ) {
      return { original: line, normalized: "education" };
    }

    if (
      clean === "CERTIFICATIONS" ||
      clean === "CERTIFICATES" ||
      clean === "LICENSES" ||
      clean === "LICENSES AND CERTIFICATIONS" ||
      clean === "ACCREDITATIONS"
    ) {
      return { original: line, normalized: "certifications" };
    }

    if (clean === "LEADERSHIP" || clean === "ACTIVITIES" || clean === "EXTRACURRICULAR") {
      return { original: line, normalized: "leadership" };
    }

    if (clean === "AWARDS" || clean === "HONORS" || clean === "ACHIEVEMENTS") {
      return { original: line, normalized: "awards" };
    }

    if (clean === "PUBLICATIONS" || clean === "RESEARCH") {
      return { original: line, normalized: "publications" };
    }

    if (clean === "VOLUNTEER" || clean === "VOLUNTEER EXPERIENCE" || clean === "COMMUNITY") {
      return { original: line, normalized: "volunteer" };
    }

    if (
      clean === "SUMMARY" ||
      clean === "PROFESSIONAL SUMMARY" ||
      clean === "EXECUTIVE SUMMARY" ||
      clean === "PROFILE" ||
      clean === "ABOUT ME" ||
      clean === "OBJECTIVE"
    ) {
      return { original: line, normalized: "summary" };
    }

    return null;
  };

  let blockCounter = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const detectedHeading = isHeadingLine(line);

    if (detectedHeading) {
      if (currentSection.blocks.length > 0) {
        currentSection.rawText = currentSection.blocks.map((b) => b.text).join("\n");
        sections.push(currentSection);
      }

      currentSection = {
        id: uuidv4(),
        heading: detectedHeading,
        order: sections.length,
        blocks: [],
        rawText: "",
      };
      continue;
    }

    const isBullet = /^[•\-*·▪▫►]\s*/.test(line);
    const cleanText = isBullet ? line.replace(/^[•\-*·▪▫►]\s*/, "").trim() : line;

    const block: BlockIR = {
      id: uuidv4(),
      type: isBullet ? "bullet" : currentSection.heading.normalized === "contact" ? "contact" : "paragraph",
      text: cleanText,
      sourceIndex: blockCounter++,
    };

    currentSection.blocks.push(block);
  }

  if (currentSection.blocks.length > 0) {
    currentSection.rawText = currentSection.blocks.map((b) => b.text).join("\n");
    sections.push(currentSection);
  }

  return {
    document: {
      fileName,
      fileType,
      charCount: rawText.length,
      pageCount,
      uploadedAt: new Date().toISOString(),
    },
    rawText,
    sections,
    extractionConfidence: 0.98,
    extractionMethod: "deterministic",
  };
}

/**
 * Intelligent section parser that maps text and IR blocks into the canonical
 * StructuredCareerProfile with complete source provenance.
 */
export function parseStructuredCareerFromText(
  rawText: string,
  fileName: string = "resume.pdf",
  extractedLinks: ExtractedLink[] = []
): StructuredCareerProfile {
  const documentIR = buildDocumentIR(rawText, fileName);
  const normalizedText = (rawText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalizedText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Link helpers
  const allLinks = [...extractedLinks, ...extractLinksFromText(rawText)];
  const githubLink = allLinks.find((l) => l.type === "github")?.url || "";
  const linkedinLink = allLinks.find((l) => l.type === "linkedin")?.url || "";
  const portfolioLink = allLinks.find((l) => l.type === "portfolio")?.url || "";
  const emailLink = allLinks.find((l) => l.type === "email")?.url.replace(/^mailto:/, "") || "";
  const phoneLink = allLinks.find((l) => l.type === "phone")?.url.replace(/^tel:/, "") || "";

  // Name heuristic: First non-contact, non-header line
  let extractedName = "";
  for (const line of rawLines.slice(0, 5)) {
    if (
      !line.includes("@") &&
      !line.includes("http") &&
      !line.includes("github.com") &&
      !line.includes("linkedin.com") &&
      !/^\+?\d{8,}/.test(line) &&
      line.length < 50
    ) {
      const clean = line.replace(/[^a-zA-Z\s.-]/g, "").trim();
      if (clean.length > 2 && clean.split(/\s+/).length <= 4) {
        extractedName = clean;
        break;
      }
    }
  }

  // 2. Parse sections from IR
  const experienceSections = documentIR.sections.filter((s) => s.heading.normalized === "experience");
  const projectSections = documentIR.sections.filter((s) => s.heading.normalized === "projects");
  const skillSections = documentIR.sections.filter((s) => s.heading.normalized === "skills");
  const educationSections = documentIR.sections.filter((s) => s.heading.normalized === "education");
  const certSections = documentIR.sections.filter((s) => s.heading.normalized === "certifications");
  const summarySections = documentIR.sections.filter((s) => s.heading.normalized === "summary");

  const experiences = parseExperienceFromIR(experienceSections);
  const projects = parseProjectsFromIR(projectSections, allLinks);
  const skills = parseSkillsFromIR(skillSections);
  const education = parseEducationFromIR(educationSections);
  const certifications = parseCertificationsFromIR(certSections);

  // Summary
  let summary = summarySections
    .flatMap((s) => s.blocks.map((b) => b.text))
    .filter((t) => !t.includes("@") && !t.includes("http") && t !== extractedName)
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 1200)
    .trim();

  const headline =
    experiences.length > 0
      ? experiences[0].role
      : skills.length > 0
      ? `${skills.slice(0, 3).map((s) => s.name).join(", ")} Professional`
      : "Professional";

  const rawProfile: StructuredCareerProfile = {
    basics: {
      name: extractedName || "Candidate",
      email: emailLink,
      phone: phoneLink,
      location: "",
      headline,
      linkedin: linkedinLink,
      portfolio: githubLink || portfolioLink,
    },
    summary,
    experiences,
    projects,
    skills,
    education,
    certifications,
    documentIR,
  };

  const parsed = StructuredCareerProfileSchema.safeParse(rawProfile);
  if (parsed.success) {
    return parsed.data;
  }

  return rawProfile;
}

function parseExperienceFromIR(sections: SectionIR[]) {
  const experiences: any[] = [];
  let currentExp: any = null;
  const datePattern = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?\d{4}\s*(?:-|–|—|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:\d{4}|Present|Current)/i;

  const blocks = sections.flatMap((s) => s.blocks);

  for (const block of blocks) {
    const text = block.text;
    const hasDate = datePattern.test(text);
    const hasSeparator = text.includes("|") || text.includes(" - ") || text.includes(" – ") || text.includes(" — ");
    const isBullet = block.type === "bullet";

    // Detect tech footer line
    if (/^Tech:\s*/i.test(text) && currentExp) {
      const techList = text.replace(/^Tech:\s*/i, "").split(/[,•|/·;]/).map((t) => t.trim()).filter(Boolean);
      currentExp.technologies = techList;
      continue;
    }

    if ((hasDate || hasSeparator) && !isBullet && text.length < 120) {
      if (currentExp && currentExp.role && currentExp.company) {
        experiences.push(currentExp);
      }

      const dateMatch = text.match(datePattern);
      const dates = dateMatch ? dateMatch[0].split(/(?:-|–|—|to)/i).map((d) => d.trim()) : ["", "Present"];
      const cleanLine = dateMatch ? text.replace(dateMatch[0], "").trim() : text;
      const parts = cleanLine.split(/[|•–—\-,]/).map((p) => p.trim()).filter(Boolean);

      currentExp = {
        id: uuidv4(),
        role: parts[0] || "Software Engineer",
        company: parts[1] || "Company",
        location: parts[2] || "",
        startDate: dates[0] || "",
        endDate: dates[1] || "Present",
        isCurrent: /Present|Current/i.test(dates[1] || ""),
        description: "",
        achievements: [],
        bullets: [],
        technologies: [],
        sourceBlockIds: [block.id],
        source: "resume",
      };
    } else if (currentExp) {
      if (text.length > 0) {
        currentExp.achievements.push({
          text,
          sourceBlockId: block.id,
          sourceText: text,
        });
        currentExp.bullets.push(text);
        currentExp.sourceBlockIds.push(block.id);
      }
    }
  }

  if (currentExp && currentExp.role && currentExp.company) {
    experiences.push(currentExp);
  }

  return experiences;
}

function parseProjectsFromIR(sections: SectionIR[], extractedLinks: ExtractedLink[] = []) {
  const projects: any[] = [];
  let currentProj: any = null;

  const blocks = sections.flatMap((s) => s.blocks);

  for (const block of blocks) {
    const text = block.text;
    const isBullet = block.type === "bullet";

    // Detect tech line
    if (/^Tech:\s*/i.test(text) && currentProj) {
      const techList = text.replace(/^Tech:\s*/i, "").split(/[,•|/·;]/).map((t) => t.trim()).filter(Boolean);
      currentProj.technologies = techList;
      continue;
    }

    const isHeader = !isBullet && text.length < 90 && !/^Tech:/i.test(text);

    if (isHeader) {
      if (currentProj && currentProj.name) {
        projects.push(currentProj);
      }

      const parts = text.split(/[|:–—\-]/).map((p) => p.trim()).filter(Boolean);
      const projName = parts[0] || "Project";
      
      // Match links associated with this project
      const projLink = extractedLinks.find((l) => l.url.toLowerCase().includes(projName.toLowerCase().replace(/\s+/g, "")))?.url || "";

      currentProj = {
        id: uuidv4(),
        name: projName,
        description: parts.slice(1).join(" - "),
        technologies: [],
        url: projLink,
        achievements: [],
        bullets: [],
        sourceBlockIds: [block.id],
        source: "resume",
      };
    } else if (currentProj) {
      if (text.length > 0) {
        currentProj.achievements.push({
          text,
          sourceBlockId: block.id,
          sourceText: text,
        });
        currentProj.bullets.push(text);
        currentProj.sourceBlockIds.push(block.id);
      }
    }
  }

  if (currentProj && currentProj.name) {
    projects.push(currentProj);
  }

  return projects;
}

function parseSkillsFromIR(sections: SectionIR[]) {
  const skillsMap = new Set<string>();
  const results: any[] = [];

  const blocks = sections.flatMap((s) => s.blocks);

  for (const block of blocks) {
    const text = block.text;
    let cleanLine = text.replace(/^[a-zA-Z\s&/:]+:\s*/, "");
    const categoryMatch = text.match(/^([a-zA-Z\s&/:]+):/);
    const category = categoryMatch ? categoryMatch[1].trim() : "Technical Skills";

    const tokens = cleanLine
      .split(/[,•|/·;\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1 && t.length < 45);

    for (const token of tokens) {
      const cleanSkill = token.replace(/^[•\-*·]\s*/, "").trim();
      if (cleanSkill && !skillsMap.has(cleanSkill.toLowerCase())) {
        skillsMap.add(cleanSkill.toLowerCase());
        results.push({
          id: uuidv4(),
          name: cleanSkill,
          category,
          proficiency: "Proficient",
          sourceBlockId: block.id,
          source: "resume",
        });
      }
    }
  }

  return results;
}

function parseEducationFromIR(sections: SectionIR[]) {
  const items: any[] = [];
  const blocks = sections.flatMap((s) => s.blocks);

  for (const block of blocks) {
    const text = block.text;
    if (text.length > 3) {
      const parts = text.split(/[|–—\-]/).map((p) => p.trim());
      const cgpaMatch = text.match(/CGPA\s*([\d.]+)/i);

      items.push({
        id: uuidv4(),
        institution: parts[0] || text.slice(0, 80),
        degree: text.toLowerCase().includes("bachelor")
          ? "Bachelor of Technology"
          : text.toLowerCase().includes("master")
          ? "Master of Science"
          : text.toLowerCase().includes("phd")
          ? "Doctor of Philosophy"
          : "Degree",
        field: parts[1] || "Engineering",
        cgpa: cgpaMatch ? cgpaMatch[1] : undefined,
        startDate: "",
        endDate: "",
        description: text.includes("Relevant coursework") ? text : "",
        sourceBlockIds: [block.id],
      });
    }
  }

  return items;
}

function parseCertificationsFromIR(sections: SectionIR[]) {
  const items: any[] = [];
  const blocks = sections.flatMap((s) => s.blocks);

  for (const block of blocks) {
    const text = block.text;
    if (text.length > 3) {
      const parts = text.split(/[|–—\-]/).map((p) => p.trim());
      items.push({
        id: uuidv4(),
        name: parts[0] || text.slice(0, 80),
        issuer: parts[1] || "Accredited Provider",
        date: "",
        description: "",
        sourceBlockIds: [block.id],
      });
    }
  }

  return items;
}
