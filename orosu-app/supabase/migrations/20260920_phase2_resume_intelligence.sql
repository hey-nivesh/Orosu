-- OROSU PHASE 2 RESUME INTELLIGENCE & TAILORING MIGRATION (Fully Idempotent & Alter-Safe)
-- Tables: job_analyses, resume_versions
-- Features: RLS, Evidence Provenance, Immutable Versions, Indexes

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Job Analyses Table
create table if not exists public.job_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_description_id uuid not null references public.job_descriptions(id) on delete cascade,
  job_title text,
  company text,
  required_skills jsonb default '[]'::jsonb,
  preferred_skills jsonb default '[]'::jsonb,
  technologies jsonb default '[]'::jsonb,
  responsibilities jsonb default '[]'::jsonb,
  experience_requirements jsonb default '[]'::jsonb,
  education_requirements jsonb default '[]'::jsonb,
  keywords jsonb default '[]'::jsonb,
  domain_terms jsonb default '[]'::jsonb,
  soft_skills jsonb default '[]'::jsonb,
  seniority text,
  evidence_requirements jsonb default '[]'::jsonb,
  match_radar jsonb default '{}'::jsonb,
  evidence_map jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all columns exist if table was created in an earlier migration
alter table public.job_analyses add column if not exists job_description_id uuid references public.job_descriptions(id) on delete cascade;
alter table public.job_analyses add column if not exists job_title text;
alter table public.job_analyses add column if not exists company text;
alter table public.job_analyses add column if not exists required_skills jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists preferred_skills jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists technologies jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists responsibilities jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists experience_requirements jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists education_requirements jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists keywords jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists domain_terms jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists soft_skills jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists seniority text;
alter table public.job_analyses add column if not exists evidence_requirements jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists match_radar jsonb default '{}'::jsonb;
alter table public.job_analyses add column if not exists evidence_map jsonb default '[]'::jsonb;
alter table public.job_analyses add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.job_analyses add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

alter table public.job_analyses enable row level security;

drop policy if exists "Users can manage their own job analyses" on public.job_analyses;
create policy "Users can manage their own job analyses"
  on public.job_analyses for all
  using (auth.uid() = user_id);

create index if not exists idx_job_analyses_user_id on public.job_analyses(user_id);
create index if not exists idx_job_analyses_job_id on public.job_analyses(job_description_id);

-- 2. Resume Versions Table (Immutable Tailored Snapshots)
create table if not exists public.resume_versions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_description_id uuid references public.job_descriptions(id) on delete set null,
  career_profile_id uuid references public.career_profiles(id) on delete cascade,
  template_id text default 'modern_clean',
  version_number integer default 1,
  title text not null,
  target_role text,
  target_company text,
  tailored_resume_json jsonb not null default '{}'::jsonb,
  evidence_provenance_json jsonb default '[]'::jsonb,
  pdf_url text,
  cloudinary_public_id text,
  status text default 'completed',
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all columns exist if table was created in an earlier migration
alter table public.resume_versions add column if not exists job_description_id uuid references public.job_descriptions(id) on delete set null;
alter table public.resume_versions add column if not exists career_profile_id uuid references public.career_profiles(id) on delete cascade;
alter table public.resume_versions add column if not exists template_id text default 'modern_clean';
alter table public.resume_versions add column if not exists version_number integer default 1;
alter table public.resume_versions add column if not exists title text default 'Tailored Resume';
alter table public.resume_versions add column if not exists target_role text;
alter table public.resume_versions add column if not exists target_company text;
alter table public.resume_versions add column if not exists tailored_resume_json jsonb default '{}'::jsonb;
alter table public.resume_versions add column if not exists evidence_provenance_json jsonb default '[]'::jsonb;
alter table public.resume_versions add column if not exists pdf_url text;
alter table public.resume_versions add column if not exists cloudinary_public_id text;
alter table public.resume_versions add column if not exists status text default 'completed';
alter table public.resume_versions add column if not exists error_message text;
alter table public.resume_versions add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.resume_versions add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

alter table public.resume_versions enable row level security;

drop policy if exists "Users can manage their own resume versions" on public.resume_versions;
create policy "Users can manage their own resume versions"
  on public.resume_versions for all
  using (auth.uid() = user_id);

create index if not exists idx_resume_versions_user_id on public.resume_versions(user_id);
create index if not exists idx_resume_versions_job_id on public.resume_versions(job_description_id);
create index if not exists idx_resume_versions_profile_id on public.resume_versions(career_profile_id);
