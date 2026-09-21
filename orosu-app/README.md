# Orosu Authenticated Application

> "Your job search, without the busywork."

Orosu is an AI-powered job application automation platform. It allows users to structure their Master Career Profile once and tailor their application materials for each target job description.

## Architecture

```
OROSU
│
├── Marketing / Landing Website (Existing Vite application in "Orosu Landing Studio" - Untouched)
│
└── Product Application (This Next.js Application in "orosu-app")
    ├── Authentication (Login, Signup, Forgot/Reset Password via Supabase Auth)
    ├── Onboarding (5-step progressive wizard with file parsing simulation)
    ├── Dashboard (Command center with quick analyzer, metrics, timeline, and 3D preview)
    ├── Career Profile (Canonical source of truth with live completeness score)
    ├── Job Analyzer (Extraction, match radar, strong/partial/missing breakdown)
    ├── Tailored Resumes (Document preview, diff comparison, evidence traceability system)
    ├── Applications Tracker (Status pipeline, logs, notes)
    └── Settings (Account, connected sources, tailoring preferences, JSON export)
```

## Tech Stack

- **Framework**: Next.js 14+ App Router, TypeScript, React 18
- **Styling**: Tailwind CSS with Orosu signature design tokens (`#F8F8F6`, `#111111`, brand gradient)
- **Icons**: Lucide React
- **Auth & Database**: Supabase Auth & PostgreSQL with Row Level Security (RLS)
- **Backend API**: Express.js with JWT validation

## Getting Started

1. Copy `.env.example` to `.env.local`
2. Run development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## Evidence System & Integrity Guarantee

Orosu never fabricates skills, employment, achievements, or years of experience. Every rewritten claim in a tailored resume is associated with verifiable items in the user's Master Career Profile.
