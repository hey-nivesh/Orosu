import { ArrowDown, ArrowRight, Check, CircleCheck, FileSearch, History, Layers3, ScanSearch, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import logoAsset from "@/assets/orosu-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { ApplicationTable, HeroCareerEngine, ProfileFlow, ResumeAssembly } from "./ProductVisuals";
import { ArrowButton, Eyebrow, Reveal, SectionHeading } from "./Shared";

export function Hero() {
  return <section id="top" className="hero-section"><div className="hero-glow" /><div className="page-shell hero-inner"><Reveal className="hero-copy"><Eyebrow>AI-POWERED JOB APPLICATIONS</Eyebrow><h1>Your job search<br />without the<br /><span>busywork.</span></h1><p>Orosu turns your career profile and any job description into a tailored, application-ready resume in seconds.</p><div className="hero-actions"><ArrowButton href="https://orosu-72g3.vercel.app">Build my profile</ArrowButton><Button asChild variant="soft" size="pill"><a href="#how-it-works">See how it works <ArrowDown /></a></Button></div><small className="trust-line"><CircleCheck /> One profile. Tailored for every role.</small></Reveal><Reveal className="hero-visual-wrap"><HeroCareerEngine /></Reveal></div></section>;
}

const problems = [
  ["01", "Copy / Paste", "Copying the job description into notes and manually hunting for keywords."],
  ["02", "Rewrite", "Rewriting the same resume bullets for every application."],
  ["03", "Repeat", "Repeating the process for every single role."],
];

export function ProblemSection() {
  return <section className="section white-section"><div className="page-shell"><Reveal><Eyebrow>01 — THE OLD WAY</Eyebrow><SectionHeading>Every job shouldn’t mean<br />starting over.</SectionHeading></Reveal><div className="problem-grid">{problems.map(([number, title, text], index) => <Reveal className="problem-card" key={title}><div className="problem-icon">{index === 0 ? <FileSearch /> : index === 1 ? <Sparkles /> : <History />}</div><span>{number}</span><h3>{title}</h3><p>{text}</p><div className="strike-lines"><i /><i /><i /></div></Reveal>)}</div></div></section>;
}

export function ProductSection() {
  return <section id="product" className="section warm-section"><div className="page-shell"><div className="split-heading"><Reveal><Eyebrow>02 — MEET OROSU</Eyebrow><SectionHeading>One career profile.<br /><span className="gradient-text">Every application.</span></SectionHeading></Reveal><Reveal><p>Build your profile once. Orosu keeps your experience, skills, projects and achievements organized — ready for every role.</p></Reveal></div><Reveal><ProfileFlow /></Reveal></div></section>;
}

const steps = [
  ["01", "Build your profile", "Upload your resume. Orosu structures your experience, skills, projects and achievements."],
  ["02", "Paste the job", "Drop in a job description. Orosu finds the requirements that matter."],
  ["03", "Tailor automatically", "Your actual experience is matched and rewritten without inventing qualifications."],
  ["04", "Apply", "Review changes, download your resume and save the application."],
];

export function WorkflowSection() {
  return <section id="how-it-works" className="section dark-section"><div className="page-shell"><Reveal><Eyebrow dark>03 — HOW IT WORKS</Eyebrow><SectionHeading dark>From job description<br />to ready-to-apply.</SectionHeading></Reveal><div className="workflow"><div className="workflow-line"><span /></div>{steps.map(([number, title, text]) => <Reveal className="step" key={number}><span>{number}</span><div className="step-node"><Check /></div><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>;
}

export function IntelligenceSection() {
  return <section className="section white-section"><div className="page-shell"><Reveal><Eyebrow>04 — INTELLIGENCE</Eyebrow><SectionHeading>Not keyword stuffing.<br /><span className="gradient-text">Context matching.</span></SectionHeading></Reveal><Reveal className="matching-board"><article><small>JOB DESCRIPTION</small><p>“Looking for experience with <mark>React</mark>, <mark>Next.js</mark>, <mark>TypeScript</mark> and <mark>REST APIs</mark>.”</p></article><div className="match-map"><span>React<i /><b>Experience</b></span><span>Next.js<i /><b>Project</b></span><span>TypeScript<i /><b>Experience</b></span><span>REST APIs<i /><b>Project</b></span></div><article><small>CANDIDATE EXPERIENCE</small><p>“Built scalable dashboards using <mark>React</mark> and <mark>Next.js</mark> with typed service integrations.”</p></article></Reveal><Reveal className="intelligence-note"><span className="mini-mark">o</span><p>Orosu finds the strongest evidence in your existing experience and brings the most relevant information forward.</p></Reveal></div></section>;
}

const features: Array<[string, string, string, LucideIcon]> = [
  ["01", "Career Profile", "Your experience, projects, skills and achievements in one structured profile.", Layers3],
  ["02", "JD Intelligence", "Break down job descriptions into requirements, skills and responsibilities.", ScanSearch],
  ["03", "Smart Matching", "See where your experience matches the role and where gaps exist.", Sparkles],
  ["04", "Resume Tailoring", "Generate a job-specific resume without rebuilding it from scratch.", FileSearch],
  ["05", "ATS Compatibility", "Check formatting, structure and keyword coverage before you apply.", ShieldCheck],
  ["06", "Application History", "Keep every job description and resume version organized in one place.", History],
];

export function FeaturesSection() {
  return <section id="features" className="section warm-section"><div className="page-shell"><Reveal><Eyebrow>05 — FEATURES</Eyebrow><SectionHeading>Everything repetitive,<br /><span className="gradient-text">handled.</span></SectionHeading></Reveal><div className="bento-grid">{features.map(([number, title, text, Icon], index) => <Reveal className={`feature-card feature-${index + 1}`} key={String(title)}><div className="feature-top"><span>{String(number)}</span><Icon /></div><div className="feature-art"><i /><i /><i /></div><h3>{String(title)}</h3><p>{String(text)}</p></Reveal>)}</div></div></section>;
}

export function ResumeSection() {
  return <section className="section resume-section"><div className="page-shell"><Reveal className="center-heading"><Eyebrow>ASSEMBLED AROUND YOU</Eyebrow><SectionHeading centered>Relevant experience.<br /><span className="gradient-text">Brought forward.</span></SectionHeading></Reveal><Reveal><ResumeAssembly /></Reveal></div></section>;
}

export function TrustSection() {
  return <section className="section dark-section trust-section"><div className="page-shell"><div className="split-heading"><Reveal><Eyebrow dark>BUILT FOR TRUST</Eyebrow><SectionHeading dark>AI should optimize<br />your story.<br /><span className="gradient-text">Not invent it.</span></SectionHeading></Reveal><Reveal><p>Orosu is built around your actual experience. It can rewrite, reorganize and prioritize what you already know — not fabricate it.</p></Reveal></div><div className="principles">{[["01", "Truth first"], ["02", "Relevant evidence"], ["03", "Human review"]].map(([n, title]) => <Reveal className="principle" key={n}><span>{n}</span><h3>{title}</h3><Check /></Reveal>)}</div></div></section>;
}

export function ApplicationsSection() {
  return <section className="section white-section"><div className="page-shell"><Reveal><Eyebrow>APPLICATION HISTORY</Eyebrow><SectionHeading>Never lose track<br />of an application again.</SectionHeading></Reveal><Reveal><ApplicationTable /></Reveal></div></section>;
}

const plans = [
  { name: "FREE", price: "$0", note: "For a focused search", features: ["3 job analyses / month", "3 tailored resumes", "Career profile", "Application history"], cta: "Start Free" },
  { name: "PRO", price: "$9", note: "/ month", features: ["Unlimited job analyses", "Unlimited tailored resumes", "Advanced matching", "Resume history", "ATS compatibility checks", "Priority AI processing"], cta: "Get Orosu Pro", popular: true },
  { name: "BUSINESS", price: "Coming later", note: "For teams, career coaches and universities.", features: [], cta: "Join the waitlist" },
];

export function PricingSection() {
  return <section id="pricing" className="section dark-section pricing-section"><div className="page-shell"><Reveal className="center-heading"><Eyebrow dark>PRICING</Eyebrow><SectionHeading dark centered>Simple.<br />Transparent. <span className="gradient-text">Useful.</span></SectionHeading></Reveal><div className="pricing-grid">{plans.map((plan) => <Reveal className={`price-card ${plan.popular ? "featured" : ""}`} key={plan.name}>{plan.popular && <span className="popular">MOST POPULAR</span>}<small>{plan.name}</small><h3>{plan.price}</h3><p>{plan.note}</p>{plan.features.length > 0 && <ul>{plan.features.map((item) => <li key={item}><Check />{item}</li>)}</ul>}<Button asChild variant={plan.popular ? "soft" : "brand"} size="pill"><a href="#final-cta">{plan.cta}<ArrowRight /></a></Button></Reveal>)}</div></div></section>;
}

export function FinalCta() {
  return <section id="final-cta" className="final-cta"><img src={logoAsset.url} alt="" className="cta-logo" /><div className="page-shell"><Reveal className="center-heading"><Eyebrow>READY WHEN YOU ARE</Eyebrow><h2>Stop doing the<br />same work twice.<br /><span className="gradient-text">Start with Orosu.</span></h2><p>Build your profile once. Tailor every application from there.</p><ArrowButton href="https://orosu-72g3.vercel.app">Build my profile</ArrowButton><small>No credit card required.</small></Reveal></div></section>;
}

export function Footer() {
  return <footer id="footer"><div className="page-shell"><div className="footer-top"><div className="footer-brand"><img src={logoAsset.url} alt="Orosu" /><p>Your job search,<br />without the busywork.</p></div><div className="footer-links"><div><small>EXPLORE</small><a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div><div><small>COMPANY</small><a href="#footer">About</a><a href="mailto:hello@orosu.ai">Contact</a><a href="#footer">Privacy</a><a href="#footer">Terms</a></div><div><small>SOCIAL</small><a href="#footer">GitHub</a><a href="#footer">LinkedIn</a></div></div></div><div className="footer-bottom"><span>© 2026 Orosu. All rights reserved.</span><span>Less rewriting. More applying.</span></div></div></footer>;
}