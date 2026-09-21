-- OROSU POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Source of truth: Supabase Auth (auth.users)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  headline text,
  "current_role" text,
  location text,
  phone text,
  website text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  onboarding_completed boolean default false,
  completeness integer default 20,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Experiences Table
create table if not exists public.experiences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null,
  "role" text not null,
  location text,
  start_date text not null,
  end_date text,
  is_current boolean default false,
  summary text,
  bullets text[] default '{}',
  skills text[] default '{}',
  evidence_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.experiences enable row level security;
create policy "Users can manage their own experiences" on public.experiences for all using (auth.uid() = user_id);

-- 3. Projects Table
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  "role" text,
  url text,
  github_url text,
  description text,
  bullets text[] default '{}',
  technologies text[] default '{}',
  evidence_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;
create policy "Users can manage their own projects" on public.projects for all using (auth.uid() = user_id);

-- 4. Skills Table
create table if not exists public.skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  name text not null,
  level text default 'Proficient',
  years_of_experience integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.skills enable row level security;
create policy "Users can manage their own skills" on public.skills for all using (auth.uid() = user_id);

-- 5. Job Analyses Table
create table if not exists public.job_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null,
  "role" text not null,
  location text,
  job_type text,
  seniority text,
  salary_range text,
  raw_job_description text not null,
  extracted_requirements jsonb not null default '{}',
  match_analysis jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.job_analyses enable row level security;
create policy "Users can manage their own job analyses" on public.job_analyses for all using (auth.uid() = user_id);

-- 6. Tailored Resumes Table
create table if not exists public.tailored_resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_analysis_id uuid references public.job_analyses(id) on delete set null,
  target_company text not null,
  target_role text not null,
  version text not null default 'v1.0',
  is_master boolean default false,
  role_alignment integer not null default 85,
  keyword_coverage integer not null default 80,
  ats_compatibility integer not null default 98,
  evidence_coverage integer not null default 100,
  changes_made jsonb not null default '[]',
  claims jsonb not null default '[]',
  sections jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tailored_resumes enable row level security;
create policy "Users can manage their own tailored resumes" on public.tailored_resumes for all using (auth.uid() = user_id);

-- 7. Applications Table
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null,
  "role" text not null,
  location text,
  job_type text default 'Full-time',
  status text not null default 'Ready',
  match_score integer default 85,
  applied_date text,
  resume_version text default 'v1.0',
  tailored_resume_id uuid references public.tailored_resumes(id) on delete set null,
  salary text,
  notes text,
  timeline jsonb not null default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.applications enable row level security;
create policy "Users can manage their own applications" on public.applications for all using (auth.uid() = user_id);
