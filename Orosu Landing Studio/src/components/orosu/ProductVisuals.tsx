import { useState, type CSSProperties, type MouseEvent } from "react";
import { Check, FileText, Sparkles } from "lucide-react";

const skills = ["React", "Next.js", "TypeScript", "REST APIs"];

export function HeroCareerEngine() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const move = (event: MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 900) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({ x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 });
  };
  return (
    <div className="hero-engine" onMouseMove={move} onMouseLeave={() => setTilt({ x: 0, y: 0 })} aria-label="Career profile transformed into a tailored resume">
      <div className="engine-grid" />
      <div className="float-chip chip-one">JD MATCH <strong>92%</strong></div>
      <div className="float-chip chip-two"><Sparkles /> Strong evidence</div>
      <div className="float-chip chip-three">ATS READY <Check /></div>
      <div className="document document-back" />
      <article className="document document-main" style={{ transform: `rotateX(${tilt.y * -5}deg) rotateY(${tilt.x * 7}deg) rotateZ(-2deg)` }}>
        <div className="document-top"><span className="doc-logo">o</span><span>TAILORED RESUME</span><span>01</span></div>
        <div className="doc-rule" />
        <p className="doc-kicker">PROFILE MATCH</p>
        <h3>Frontend<br />Engineer</h3>
        <p className="doc-summary">Product-focused engineer building fast, accessible web experiences.</p>
        <div className="skill-row">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
        <div className="doc-columns"><div><small>EXPERIENCE</small><b>4 selected</b></div><div><small>PROJECTS</small><b>3 relevant</b></div></div>
        <div className="match-line"><span /><span /><span /></div>
      </article>
      <div className="engine-caption"><span>Career profile</span><i>+</i><span>Job description</span><i>→</i><strong>Tailored resume</strong></div>
    </div>
  );
}

export function ProfileFlow() {
  return (
    <div className="profile-flow">
      <article className="profile-panel">
        <div className="panel-head"><span>MASTER CAREER PROFILE</span><span className="live-dot">Structured</span></div>
        {["Experience", "Projects", "Skills", "Education", "Achievements"].map((item, index) => (
          <div className="profile-row" key={item}><span>0{index + 1}</span><strong>{item}</strong><i>{["4 roles", "7 projects", "18 skills", "2 entries", "6 highlights"][index]}</i></div>
        ))}
      </article>
      <div className="flow-core"><span>+</span><div className="orosu-core">o</div><i>Tailoring</i><span>↓</span></div>
      <article className="job-panel"><small>NEW JOB DESCRIPTION</small><h3>Senior Frontend Engineer</h3><p>Design systems · React · TypeScript · APIs</p><div className="scan-line" /></article>
      <article className="output-panel"><Check /><div><small>TAILORED APPLICATION</small><strong>Ready to review</strong></div><span>92%</span></article>
    </div>
  );
}

export function ResumeAssembly() {
  return (
    <div className="resume-stage">
      <div className="resume-shadow-card" />
      <article className="resume-paper">
        <header><span className="doc-logo">o</span><div><strong>JORDAN LEE</strong><small>FRONTEND ENGINEER</small></div><b>92%</b></header>
        <div className="resume-section"><small>SUMMARY</small><p>Frontend engineer focused on scalable interfaces, design systems and performance.</p></div>
        <div className="resume-section"><small>EXPERIENCE</small><h4>Senior Product Engineer</h4><p>Built and shipped responsive dashboards with React and TypeScript.</p><p>Designed reusable systems that reduced delivery time across product teams.</p></div>
        <div className="resume-section"><small>SELECTED SKILLS</small><div className="skill-row">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
      </article>
      <span className="meta-tag meta-one">92% Role Match</span><span className="meta-tag meta-two">React</span><span className="meta-tag meta-three">Next.js</span><span className="meta-tag meta-four">Strong Evidence</span><span className="meta-tag meta-five">ATS Ready <Check /></span>
    </div>
  );
}

export function ApplicationTable() {
  const rows = [
    ["Acme", "Frontend Engineer", "92%", "Applied"],
    ["Nova", "React Developer", "87%", "Interview"],
    ["Vertex", "Full Stack Developer", "81%", "Offer"],
    ["Orbit", "Product Engineer", "76%", "Rejected"],
  ];
  return <div className="app-table"><div className="table-title"><div><FileText /><span><strong>Applications</strong><small>All tailored resumes, in one place</small></span></div><button aria-label="Filter applications">Filter <span>⌄</span></button></div><div className="table-head"><span>Company</span><span>Role</span><span>Match</span><span>Status</span></div>{rows.map((row, i) => <div className="table-row" style={{ "--delay": `${i * 90}ms` } as CSSProperties} key={row[0]}>{row.map((cell, index) => <span key={cell} data-label={["Company", "Role", "Match", "Status"][index]} className={index === 3 ? `status status-${cell.toLowerCase()}` : index === 2 ? "match" : ""}>{cell}</span>)}</div>)}</div>;
}