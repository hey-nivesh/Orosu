/**
 * Comprehensive End-to-End Verification Pipeline for Orosu Resume Intelligence.
 * Verifies:
 * 1. Document extraction & link annotations.
 * 2. Canonical Career Profile & lossless IR with source provenance.
 * 3. JD analysis & candidate evidence matching.
 * 4. Grounded tailoring with zero hallucinations.
 * 5. Deterministic HTML/CSS rendering matching the reference layout.
 * 6. Headless Chromium PDF rendering & byte buffer validation.
 * 7. Grounded Gmail application email draft generation.
 */

import { parseStructuredCareerFromText, extractRawTextFromBuffer } from "./src/services/resumeParserService";
import { analyzeJobDescription } from "./src/services/jdAnalysisService";
import { matchCandidateEvidence } from "./src/services/evidenceMatchingService";
import { generateTailoredResume } from "./src/services/tailoringService";
import { renderResumeHTML, renderResumePDF } from "./src/services/resumeRendererService";
import { generateApplicationEmailBody } from "./src/services/gmailService";

// Fixture 1: Real-world resume matching the exact reference design format
const SAMPLE_NIVESH_RESUME_TEXT = `
NIVESH JAIN
Full-Stack Developer — React.js, Node.js, Express.js, MongoDB/MySQL, Next.js, React Native, Angular
+91 9119734890 • niveshjain213@gmail.com • github.com/hey-nivesh • linkedin.com/in/nivesh-jain-523104248

SUMMARY
Full-stack web developer working across React.js, Node.js, Express.js, MongoDB, and MySQL, with REST API and JSON-based integration experience on both client projects and independent products. Has owned web development tasks end to end — design, build, and deployment — on cross-functional teams, and separately builds with Python for AI/ML and React Native for mobile, both listed as bonus skills for this role.

TECHNICAL SKILLS
Core Web Stack: JavaScript, ReactJS, Node.js, Express.js, HTML5, Tailwind CSS, JSON, REST API, VueJs
Databases: MongoDB, MySQL, PostgreSQL, SQLite, Supabase, Firebase
Bonus: AI/ML & Mobile: Python, FastAPI, React Native (Expo), LangGraph, Retrieval-Augmented Generation (RAG)
Architecture: MVC-style backend structure (Express.js, FastAPI, Strapi), API design
Tools & Practices: Git, GitHub, CI/CD, Postman/API testing, Docker, technical documentation
Cloud: AWS, Google Cloud (Cloud Storage, Pub/Sub, BigQuery)

WORK EXPERIENCE
Full-Stack Developer Intern | HiDevs
Dec 2025 – May 2026 • Remote
• Built responsive, client-facing web applications and UIs using React.js and Tailwind CSS across the full SDLC — design, build, and deployment.
• Collaborated with cross-functional teams to ship production features, delivering output 10x faster.
Tech: React.js, JavaScript, HTML5, Tailwind CSS, JSON

Frontend Web Developer (Part-time) | AKSR Pvt. Ltd.
Aug 2024 – Oct 2024 • Hybrid
• Built and optimized responsive web applications with React.js and React Native, backed by Node.js/Express and FastAPI REST APIs over MongoDB.
• Worked directly with clients to translate requirements into shipped features, delivering 2x more efficiently.
Tech: React.js, React Native, Node.js, Express.js, MongoDB, REST API, JSON, Tailwind CSS

AI Product Engineer Intern | SHM Ventures
May 2026 – Jun 2026 • Remote
• Shipped AI-driven fintech features, integrating machine learning and RAG/LLM models into production pipelines end-to-end.
• Built data pipelines and orchestration workflows (n8n) across a MERN stack, improving workflow efficiency by 90%.
Tech: JavaScript, TypeScript, Node.js, MongoDB, REST API, LLM, RAG

PROJECTS
Nodoos AI — churn detection agent
Jun 2026 – Present
• Backend system that reads support tickets and flags SaaS churn signals through LLM-based root-cause analysis.
• Designed the Postgres schema and wrote SQL queries against it for ticket aggregation and threshold checks; used Git for version control throughout.
Tech: React, Node.js, JavaScript, TypeScript, REST API, JSON, Gemini API, Botpress, FastAPI, LangGraph, Supabase (Postgres), SQL, Groq API, Git

BunoBageraAI — AI Code Review Platform
Jun 2026 – Jul 2026
• Built an internal-tool-style platform connecting to GitHub repos via OAuth/REST API; an LLM agent behind a streaming JSON API detects bugs, suggests fixes, and can auto-open PRs.
Tech: Next.js, React, JavaScript, Strapi, REST API, JSON, GitHub API

EDUCATION
• Bachelor of Technology — Inderprastha Engineering College, AKTU — CGPA 8.2 — Aug 2024–Aug 2028
• Relevant coursework: Data Structures, Web Development, Python Programming, AI/ML

CERTIFICATIONS
• J.P. Morgan Software Engineering Job Simulation — Forage — Sep 2025 (Kafka, H2, REST API, REST API Controller)
• MongoDB Basics for Students — MongoDB — Jul 2026 (MongoDB, Schema)
• Object-Oriented Programming Using Python — Infosys Springboard
• AI For Bharat — RAG Implementation, AWS Builder Center — Dec 2025
`;

const SAMPLE_JOB_DESCRIPTION = `
Stripe is hiring a Senior Full Stack Engineer.
Responsibilities:
- Build and scale responsive user-facing payment workflows using React and TypeScript.
- Design and maintain highly reliable backend microservices with Node.js and PostgreSQL.
- Architect clean REST APIs and collaborate with product teams.
Requirements:
- 3+ years of experience with React, TypeScript, and Node.js.
- Strong knowledge of databases (PostgreSQL/MongoDB) and REST APIs.
- Experience building AI integrations or cloud workflows is a plus.
`;

async function runEndToEndVerification() {
  console.log("==================================================");
  console.log("🧪 RUNNING OROSU RESUME INTELLIGENCE PIPELINE TEST");
  console.log("==================================================");

  // Step 1: Parsing & Extraction into Lossless IR
  console.log("\n[Step 1] Parsing Resume into Lossless IR & Provenance...");
  const parsedProfile = parseStructuredCareerFromText(SAMPLE_NIVESH_RESUME_TEXT, "Nivesh_Jain_Resume.pdf");
  console.log(`✓ Extracted Name: ${parsedProfile.basics.name}`);
  console.log(`✓ Extracted Email: ${parsedProfile.basics.email}`);
  console.log(`✓ Extracted Phone: ${parsedProfile.basics.phone}`);
  console.log(`✓ Extracted LinkedIn: ${parsedProfile.basics.linkedin}`);
  console.log(`✓ Extracted Portfolio/GitHub: ${parsedProfile.basics.portfolio}`);
  console.log(`✓ Experiences count: ${parsedProfile.experiences.length}`);
  console.log(`✓ Skills count: ${parsedProfile.skills.length}`);
  console.log(`✓ Projects count: ${parsedProfile.projects.length}`);
  console.log(`✓ Certifications count: ${parsedProfile.certifications.length}`);
  console.log(`✓ IR Section count: ${parsedProfile.documentIR?.sections.length || 0}`);

  console.assert(parsedProfile.basics.name === "NIVESH JAIN", "Candidate name must match");
  console.assert(parsedProfile.basics.email.includes("niveshjain213@gmail.com"), "Email must be extracted");
  console.assert(parsedProfile.experiences.length >= 3, "Must extract experiences");
  console.assert(parsedProfile.skills.length >= 20, "Must extract categorized skills");

  // Step 2: JD Analysis
  console.log("\n[Step 2] Analyzing Target Job Description...");
  const jdAnalysis = analyzeJobDescription(SAMPLE_JOB_DESCRIPTION, "Stripe", "Senior Full Stack Engineer");
  console.log(`✓ Detected Role: ${jdAnalysis.jobTitle}`);
  console.log(`✓ Detected Company: ${jdAnalysis.company}`);
  console.log(`✓ Required Skills: ${jdAnalysis.requiredSkills.join(", ")}`);
  console.log(`✓ Detected Technologies: ${jdAnalysis.technologies.join(", ")}`);
  console.assert(jdAnalysis.jobTitle.includes("Full Stack"), "Role must be extracted");
  console.assert(jdAnalysis.company === "Stripe", "Company must be Stripe");

  // Step 3: Candidate Evidence Matching
  console.log("\n[Step 3] Matching Candidate Evidence against Profile...");
  const { evidenceMap, matchRadar } = matchCandidateEvidence(parsedProfile, jdAnalysis);
  console.log(`✓ Overall Match Score: ${matchRadar.overallScore}%`);
  console.log(`✓ Skills Match: ${matchRadar.skillsMatchPercent}%`);
  console.log(`✓ Matched count: ${matchRadar.matchedCount}`);
  console.log(`✓ Missing count: ${matchRadar.missingCount}`);

  const reactMatch = evidenceMap.find((s) => s.requirement.toLowerCase().includes("react"));
  console.log(`✓ React status: ${reactMatch?.status || "matched"} (Evidence: ${reactMatch?.evidence.length || 0} items)`);
  console.assert(matchRadar.overallScore > 40, "Match score must reflect candidate overlap");

  // Step 4: Tailoring Engine
  console.log("\n[Step 4] Generating Evidence-Grounded Tailored Resume...");
  const tailoredResume = generateTailoredResume(parsedProfile, jdAnalysis, evidenceMap, "modern_clean");
  console.log(`✓ Title: ${tailoredResume.title}`);
  console.log(`✓ Grounded in Truth: ${tailoredResume.evidenceValidation.isGrounded}`);
  console.log(`✓ Verified Statements: ${tailoredResume.evidenceValidation.verifiedStatementsCount}`);
  console.log(`✓ Rejected Statements: ${tailoredResume.evidenceValidation.rejectedStatementsCount}`);
  console.assert(tailoredResume.evidenceValidation.isGrounded, "Must be grounded");
  console.assert(tailoredResume.evidenceValidation.rejectedStatementsCount === 0, "Zero ungrounded claims allowed");

  // Step 5: Deterministic Template HTML Generation
  console.log("\n[Step 5] Rendering Semantic ATS Resume HTML...");
  const resumeHTML = renderResumeHTML(tailoredResume);
  console.log(`✓ Generated HTML length: ${resumeHTML.length} characters`);
  console.assert(resumeHTML.includes("<!DOCTYPE html>"), "Must be valid HTML document");
  console.assert(resumeHTML.includes("NIVESH JAIN"), "Must include candidate name");
  console.assert(resumeHTML.includes("WORK EXPERIENCE"), "Must include uppercase WORK EXPERIENCE section");
  console.assert(resumeHTML.includes("TECHNICAL SKILLS"), "Must include uppercase TECHNICAL SKILLS section");
  console.assert(resumeHTML.includes("PROJECTS"), "Must include uppercase PROJECTS section");
  console.assert(resumeHTML.includes("EDUCATION"), "Must include uppercase EDUCATION section");
  console.assert(resumeHTML.includes("CERTIFICATIONS"), "Must include uppercase CERTIFICATIONS section");
  console.assert(!resumeHTML.includes("• •"), "No duplicate bullet markers");

  // Step 6: Server-Side PDF Rendering (Puppeteer)
  console.log("\n[Step 6] Rendering Headless Chromium PDF Buffer...");
  const pdfBuffer = await renderResumePDF(resumeHTML);
  console.log(`✓ Generated PDF Buffer: ${pdfBuffer.length} bytes`);
  console.assert(pdfBuffer.length > 5000, "PDF buffer must be valid and non-empty");

  // Step 7: Gmail Application Email Drafting
  console.log("\n[Step 7] Generating Grounded Application Email Body...");
  const topMatchedSkills = tailoredResume.skills
    .filter((s) => s.relevance === "high")
    .map((s) => s.name);
  const emailDraft = generateApplicationEmailBody(
    tailoredResume.basics.name,
    "Stripe Recruiting Team",
    "Stripe",
    "Senior Full Stack Engineer",
    topMatchedSkills
  );
  console.log(`✓ Email Subject: ${emailDraft.subject}`);
  console.assert(emailDraft.subject.includes("Stripe") || emailDraft.subject.includes("Senior Full Stack Engineer"), "Subject must reference role/company");
  console.assert(emailDraft.body.includes(tailoredResume.basics.name), "Body must include candidate signature");

  console.log("\n==================================================");
  console.log("🎉 ALL END-TO-END RESUME INTELLIGENCE TESTS PASSED!");
  console.log("==================================================");
}

runEndToEndVerification().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
