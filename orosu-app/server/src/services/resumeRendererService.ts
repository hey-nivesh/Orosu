import puppeteer from "puppeteer";
import { TailoredResumeJSON } from "../validators/schemas";

/**
 * Deterministic HTML & CSS Resume Template Renderer.
 * Implements the exact professional ATS single-column styling matching the candidate's reference format:
 * - Centered bold header with subtitle & contact links
 * - Full-width section divider lines with blue uppercase titles (#1e3a8a)
 * - "RELEVANT TO THIS ROLE" tailored highlights with bold prefixes
 * - Categorized technical skills (Core Web Stack, Databases, Bonus: AI/ML & Mobile, Architecture, Tools & Practices, Cloud)
 * - Work experience with "Role | Company", "Dates • Mode/Location", bullets, and "Tech: ..." tags
 * - Projects with "Project Name — Subtitle", "Dates  GitHub / Preview" links, bullets, and "Tech: ..." tags
 * - Education & Certifications
 * - Zero broken bullets, zero duplicate markers, selectable text, and clean A4 pagination.
 */
export function renderResumeHTML(resume: TailoredResumeJSON): string {
  const { basics, summary, skills, experiences, projects, education, certifications } = resume;
  const anyResume = resume as any;
  const relevantToRole: string[] = anyResume.relevantToRole || anyResume.relevant_to_role || [];

  // Header contact items with clean clickable links
  const contactItems: string[] = [];
  if (basics.phone && basics.phone.trim()) {
    const phoneClean = basics.phone.trim();
    const phoneHref = phoneClean.startsWith("tel:") ? phoneClean : `tel:${phoneClean.replace(/\s+/g, "")}`;
    contactItems.push(`<a class="contact-link" href="${escapeHTML(phoneHref)}">${escapeHTML(phoneClean)}</a>`);
  }
  if (basics.email && basics.email.trim()) {
    const emailClean = basics.email.trim();
    contactItems.push(`<a class="contact-link" href="mailto:${escapeHTML(emailClean)}">${escapeHTML(emailClean)}</a>`);
  }
  if (basics.portfolio && basics.portfolio.trim()) {
    const portfolioHref = basics.portfolio.startsWith("http") ? basics.portfolio : `https://${basics.portfolio}`;
    const cleanDisplay = basics.portfolio.replace(/^https?:\/\/(www\.)?/, "");
    contactItems.push(`<a class="contact-link" href="${escapeHTML(portfolioHref)}" target="_blank" rel="noopener">${escapeHTML(cleanDisplay)}</a>`);
  }
  if (basics.linkedin && basics.linkedin.trim()) {
    const linkedinHref = basics.linkedin.startsWith("http") ? basics.linkedin : `https://${basics.linkedin}`;
    const cleanDisplay = basics.linkedin.replace(/^https?:\/\/(www\.)?/, "");
    contactItems.push(`<a class="contact-link" href="${escapeHTML(linkedinHref)}" target="_blank" rel="noopener">${escapeHTML(cleanDisplay)}</a>`);
  }
  if (basics.location && basics.location.trim()) {
    contactItems.push(`<span>${escapeHTML(basics.location)}</span>`);
  }

  // Skills Grouping by Category
  const skillsByCategory: Record<string, string[]> = {};
  if (skills && skills.length > 0) {
    for (const s of skills) {
      if (!s.name || !s.name.trim()) continue;
      const cat = s.category && s.category.trim() ? s.category.trim() : "Technical Skills";
      if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
      skillsByCategory[cat].push(s.name.trim());
    }
  }

  const skillsHTML = Object.entries(skillsByCategory)
    .map(
      ([category, items]) => `
      <div class="skill-row">
        <span class="skill-category">${escapeHTML(category)}:</span>
        <span class="skill-items">${items.map((i) => escapeHTML(i)).join(", ")}</span>
      </div>`
    )
    .join("\n");

  // Helper to sanitize bullet text removing any leading bullet symbols
  const cleanBulletText = (text: string): string => {
    return text.replace(/^[•\-*·▪▫►\d.]+\s*/, "").trim();
  };

  // Experiences rendering
  const validExperiences = (experiences || []).filter(
    (exp) => exp.company && exp.company.trim() && exp.role && exp.role.trim() && exp.company !== "Company"
  );

  const experiencesHTML = validExperiences
    .map((exp) => {
      const dates = exp.startDate
        ? `${escapeHTML(exp.startDate)} – ${escapeHTML(exp.endDate || "Present")}`
        : exp.endDate
        ? escapeHTML(exp.endDate)
        : "";

      const bullets = (exp.bullets || [])
        .map((b) => cleanBulletText(b.text))
        .filter((t) => t.length > 0);

      const techTags: string[] = (exp as any).technologies || [];

      return `
      <div class="entry-block">
        <div class="entry-header-line">
          <div class="entry-title-wrap">
            <span class="entry-role">${escapeHTML(exp.role)}</span>
            <span class="entry-pipe">|</span>
            <span class="entry-company">${escapeHTML(exp.company)}</span>
          </div>
        </div>
        <div class="entry-meta-line">
          ${dates ? `<span class="entry-dates">${dates}</span>` : ""}
          ${exp.location && exp.location.trim() ? `<span class="meta-sep">•</span><span class="entry-location">${escapeHTML(exp.location)}</span>` : ""}
        </div>
        ${
          bullets.length > 0
            ? `<ul class="bullet-list">
            ${bullets.map((b) => `<li>${formatBulletWithBoldPrefix(b)}</li>`).join("\n")}
          </ul>`
            : ""
        }
        ${
          techTags.length > 0
            ? `<div class="entry-tech-line"><em>Tech: ${escapeHTML(techTags.join(", "))}</em></div>`
            : ""
        }
      </div>`;
    })
    .join("\n");

  // Projects rendering
  const validProjects = (projects || []).filter((proj) => proj.name && proj.name.trim() && proj.name !== "Project");

  const projectsHTML = validProjects
    .map((proj) => {
      const anyProj = proj as any;
      const dates = anyProj.startDate || anyProj.dates
        ? `${escapeHTML(anyProj.startDate || anyProj.dates)}${anyProj.endDate ? ` – ${escapeHTML(anyProj.endDate)}` : ""}`
        : "";

      const bullets = (proj.bullets || [])
        .map((b) => cleanBulletText(b.text))
        .filter((t) => t.length > 0);

      const techString = proj.technologies && proj.technologies.length > 0 ? proj.technologies.join(", ") : "";

      const links: string[] = [];
      if (proj.url && proj.url.trim()) {
        const urlHref = proj.url.startsWith("http") ? proj.url : `https://${proj.url}`;
        const isGithub = proj.url.includes("github.com");
        links.push(`<a class="project-link" href="${escapeHTML(urlHref)}" target="_blank" rel="noopener">${isGithub ? "GitHub" : "Preview"}</a>`);
      }
      if (anyProj.previewUrl && anyProj.previewUrl.trim() && anyProj.previewUrl !== proj.url) {
        const previewHref = anyProj.previewUrl.startsWith("http") ? anyProj.previewUrl : `https://${anyProj.previewUrl}`;
        links.push(`<a class="project-link" href="${escapeHTML(previewHref)}" target="_blank" rel="noopener">Preview</a>`);
      }

      return `
      <div class="entry-block">
        <div class="entry-header-line">
          <div class="entry-title-wrap">
            <span class="entry-role">${escapeHTML(proj.name)}</span>
            ${proj.description ? `<span class="entry-sub-dash">— ${escapeHTML(proj.description)}</span>` : ""}
          </div>
        </div>
        <div class="entry-meta-line">
          ${dates ? `<span class="entry-dates">${dates}</span>` : ""}
          ${links.length > 0 ? `<span class="entry-links">${links.join(" / ")}</span>` : ""}
        </div>
        ${
          bullets.length > 0
            ? `<ul class="bullet-list">
            ${bullets.map((b) => `<li>${formatBulletWithBoldPrefix(b)}</li>`).join("\n")}
          </ul>`
            : ""
        }
        ${
          techString
            ? `<div class="entry-tech-line"><em>Tech: ${escapeHTML(techString)}</em></div>`
            : ""
        }
      </div>`;
    })
    .join("\n");

  // Education rendering
  const validEducation = (education || []).filter(
    (ed) => ed.institution && ed.institution.trim() && ed.institution !== "Institution"
  );

  const educationHTML = validEducation
    .map((ed) => {
      const anyEd = ed as any;
      const start = ed.startDate || anyEd.start_date || "";
      const end = ed.endDate || anyEd.end_date || "";
      const dates = start && end ? `${escapeHTML(start)}–${escapeHTML(end)}` : start || end ? escapeHTML(start || end) : "";

      const degreeText = ed.degree && ed.degree !== "Degree" ? escapeHTML(ed.degree) : "";
      const fieldText = ed.field && ed.field !== "Field of Study" ? `in ${escapeHTML(ed.field)}` : "";
      const fullDegree = [degreeText, fieldText].filter(Boolean).join(" ");
      const grade = anyEd.cgpa || anyEd.grade ? ` — CGPA ${escapeHTML(anyEd.cgpa || anyEd.grade)}` : "";

      return `
      <div class="education-block">
        <ul class="bullet-list">
          <li>
            ${fullDegree ? `<strong>${fullDegree}</strong> — ` : ""}<strong>${escapeHTML(ed.institution)}</strong>${grade}${dates ? ` — ${dates}` : ""}
          </li>
          ${ed.description && ed.description.trim() ? `<li>Relevant coursework: ${escapeHTML(ed.description)}</li>` : ""}
        </ul>
      </div>`;
    })
    .join("\n");

  // Certifications rendering
  const validCerts = (certifications || []).filter(
    (c) => c.name && c.name.trim() && c.name !== "Certification"
  );

  const certsHTML = validCerts
    .map((c) => {
      const anyC = c as any;
      const issuer = c.issuer && c.issuer !== "Accredited Provider" ? ` — ${escapeHTML(c.issuer)}` : "";
      const date = c.date ? ` — ${escapeHTML(c.date)}` : "";
      const topics = anyC.topics || anyC.description ? ` (${escapeHTML(anyC.topics || anyC.description)})` : "";

      return `
      <li>
        <strong>${escapeHTML(c.name)}</strong>${issuer}${date}${topics}
      </li>`;
    })
    .join("\n");

  // Relevant to Role HTML
  const relevantToRoleHTML = relevantToRole.length > 0
    ? `<section>
        <div class="section-title">RELEVANT TO THIS ROLE</div>
        <ul class="bullet-list">
          ${relevantToRole.map((item) => `<li>${formatBulletWithBoldPrefix(item)}</li>`).join("\n")}
        </ul>
      </section>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(basics.name || "Candidate")} — Resume</title>
  <style>
    @page {
      size: A4;
      margin: 10mm 12mm 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 8.8pt;
      line-height: 1.38;
      color: #111827;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a {
      color: #0369a1;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .contact-link {
      color: #0369a1;
      text-decoration: underline;
    }
    .resume-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
    }
    header {
      text-align: center;
      margin-bottom: 9px;
      padding-bottom: 2px;
      break-inside: avoid;
    }
    .header-name {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: 0.6px;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .header-headline {
      font-size: 9.2pt;
      font-weight: 600;
      color: #334155;
      margin-bottom: 4px;
    }
    .contact-bar {
      font-size: 8.5pt;
      color: #334155;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 6px;
    }
    section {
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 9.3pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #1e3a8a;
      border-bottom: 1.5px solid #1e3a8a;
      padding-bottom: 1.5px;
      margin-bottom: 4px;
      break-after: avoid;
      page-break-after: avoid;
    }
    .summary-text {
      font-size: 8.7pt;
      color: #1f2937;
      line-height: 1.4;
      text-align: justify;
    }
    .skill-row {
      font-size: 8.6pt;
      margin-bottom: 2px;
      line-height: 1.35;
      break-inside: avoid;
    }
    .skill-category {
      color: #0f172a;
      font-weight: 700;
    }
    .skill-items {
      color: #334155;
    }
    .entry-block {
      margin-bottom: 6.5px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .entry-header-line {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      break-after: avoid;
    }
    .entry-title-wrap {
      font-size: 9.2pt;
      font-weight: 700;
      color: #0f172a;
    }
    .entry-role {
      font-weight: 800;
      color: #0f172a;
    }
    .entry-pipe {
      color: #94a3b8;
      margin: 0 3px;
    }
    .entry-company {
      font-weight: 600;
      color: #475569;
    }
    .entry-sub-dash {
      font-weight: 600;
      color: #475569;
    }
    .entry-meta-line {
      font-size: 8pt;
      font-style: italic;
      color: #64748b;
      margin-top: 0.5px;
      margin-bottom: 1px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .entry-dates {
      font-weight: 500;
    }
    .entry-location {
      font-weight: 500;
    }
    .entry-links {
      font-style: normal;
      margin-left: 4px;
    }
    .meta-sep {
      color: #94a3b8;
      font-style: normal;
    }
    .project-link {
      font-size: 8pt;
      font-weight: 600;
      color: #0369a1;
      text-decoration: underline;
    }
    .bullet-list {
      list-style-type: disc;
      padding-left: 14px;
      margin-top: 1.5px;
    }
    .bullet-list li {
      font-size: 8.5pt;
      color: #1f2937;
      margin-bottom: 1.5px;
      line-height: 1.35;
      break-inside: avoid;
    }
    .entry-tech-line {
      font-size: 8pt;
      color: #475569;
      margin-top: 1.5px;
      padding-left: 14px;
      break-inside: avoid;
    }
    .education-block {
      margin-bottom: 3px;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <header>
      <div class="header-name">${escapeHTML(basics.name || "Candidate")}</div>
      ${basics.headline && basics.headline.trim() ? `<div class="header-headline">${escapeHTML(basics.headline)}</div>` : ""}
      ${contactItems.length > 0 ? `<div class="contact-bar">${contactItems.join(" • ")}</div>` : ""}
    </header>

    ${
      summary && summary.trim()
        ? `<section>
      <div class="section-title">SUMMARY</div>
      <div class="summary-text">${escapeHTML(summary)}</div>
    </section>`
        : ""
    }

    ${relevantToRoleHTML}

    ${
      skillsHTML
        ? `<section>
      <div class="section-title">TECHNICAL SKILLS</div>
      ${skillsHTML}
    </section>`
        : ""
    }

    ${
      experiencesHTML
        ? `<section>
      <div class="section-title">WORK EXPERIENCE</div>
      ${experiencesHTML}
    </section>`
        : ""
    }

    ${
      projectsHTML
        ? `<section>
      <div class="section-title">PROJECTS</div>
      ${projectsHTML}
    </section>`
        : ""
    }

    ${
      educationHTML
        ? `<section>
      <div class="section-title">EDUCATION</div>
      ${educationHTML}
    </section>`
        : ""
    }

    ${
      certsHTML
        ? `<section>
      <div class="section-title">CERTIFICATIONS</div>
      <ul class="bullet-list">
        ${certsHTML}
      </ul>
    </section>`
        : ""
    }
  </div>
</body>
</html>`;
}

/**
 * Helper to bold topic prefixes like "Core stack overlap:" or "Cross-functional collaboration:"
 */
function formatBulletWithBoldPrefix(bullet: string): string {
  const match = bullet.match(/^([^:]+:)(.+)$/);
  if (match && match[1].length < 45) {
    return `<strong>${escapeHTML(match[1])}</strong>${escapeHTML(match[2])}`;
  }
  return escapeHTML(bullet);
}

/**
 * Renders an HTML string into a high-quality PDF Buffer using Puppeteer headless Chromium.
 */
export async function renderResumePDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "12mm",
        bottom: "10mm",
        left: "12mm",
      },
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}

function escapeHTML(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
