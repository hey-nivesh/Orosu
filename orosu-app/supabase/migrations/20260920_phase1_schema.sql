-- OROSU PHASE 1 DATABASE MIGRATION (Fully Idempotent & Alter-Safe)
-- Tables: profiles, career_profiles, experiences, projects, skills, education, certifications, job_descriptions

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null,
  avatar_url text,
  onboarding_completed boolean default false,
  profile_completion integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all columns exist if table was previously created with different columns
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text default 'User';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists profile_completion integer default 0;
alter table public.profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.profiles add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Trigger to automatically create profile on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, onboarding_completed, profile_completion)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    false,
    0
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Career Profiles Table
create table if not exists public.career_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  professional_headline text,
  summary text,
  raw_resume_text text,
  profile_json jsonb default '{}'::jsonb,
  version integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.career_profiles add column if not exists professional_headline text;
alter table public.career_profiles add column if not exists summary text;
alter table public.career_profiles add column if not exists raw_resume_text text;
alter table public.career_profiles add column if not exists profile_json jsonb default '{}'::jsonb;
alter table public.career_profiles add column if not exists version integer default 1;

alter table public.career_profiles enable row level security;

drop policy if exists "Users can manage their own career profiles" on public.career_profiles;
create policy "Users can manage their own career profiles" 
  on public.career_profiles for all 
  using (auth.uid() = user_id);

create index if not exists idx_career_profiles_user_id on public.career_profiles(user_id);

-- 3. Experiences Table
create table if not exists public.experiences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  career_profile_id uuid references public.career_profiles(id) on delete cascade,
  company text not null,
  "role" text not null,
  location text,
  start_date text,
  end_date text,
  description text,
  achievements jsonb default '[]'::jsonb,
  source text default 'resume',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.experiences add column if not exists career_profile_id uuid references public.career_profiles(id) on delete cascade;
alter table public.experiences add column if not exists company text;
alter table public.experiences add column if not exists "role" text;
alter table public.experiences add column if not exists location text;
alter table public.experiences add column if not exists start_date text;
alter table public.experiences add column if not exists end_date text;
alter table public.experiences add column if not exists description text;
alter table public.experiences add column if not exists achievements jsonb default '[]'::jsonb;
alter table public.experiences add column if not exists source text default 'resume';

alter table public.experiences enable row level security;

drop policy if exists "Users can manage their own experiences" on public.experiences;
create policy "Users can manage their own experiences" 
  on public.experiences for all 
  using (auth.uid() = user_id);

create index if not exists idx_experiences_user_id on public.experiences(user_id);
create index if not exists idx_experiences_career_profile_id on public.experiences(career_profile_id);

-- 4. Projects Table
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  career_profile_id uuid references public.career_profiles(id) on delete cascade,
  name text not null,
  description text,
  technologies jsonb default '[]'::jsonb,
  url text,
  achievements jsonb default '[]'::jsonb,
  source text default 'resume',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects add column if not exists career_profile_id uuid references public.career_profiles(id) on delete cascade;
alter table public.projects add column if not exists name text;
alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists technologies jsonb default '[]'::jsonb;
alter table public.projects add column if not exists url text;
alter table public.projects add column if not exists achievements jsonb default '[]'::jsonb;
alter table public.projects add column if not exists source text default 'resume';

alter table public.projects enable row level security;

drop policy if exists "Users can manage their own projects" on public.projects;
create policy "Users can manage their own projects" 
  on public.projects for all 
  using (auth.uid() = user_id);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_career_profile_id on public.projects(career_profile_id);

-- 5. Skills Table
create table if not exists public.skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  career_profile_id uuid references public.career_profiles(id) on delete cascade,
  name text not null,
  category text,
  source text default 'resume',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.skills add column if not exists career_profile_id uuid references public.career_profiles(id) on delete cascade;
alter table public.skills add column if not exists name text;
alter table public.skills add column if not exists category text;
alter table public.skills add column if not exists source text default 'resume';

alter table public.skills enable row level security;

drop policy if exists "Users can manage their own skills" on public.skills;
create policy "Users can manage their own skills" 
  on public.skills for all 
  using (auth.uid() = user_id);

create index if not exists idx_skills_user_id on public.skills(user_id);
create index if not exists idx_skills_career_profile_id on public.skills(career_profile_id);

-- 6. Education Table
create table if not exists public.education (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  career_profile_id uuid references public.career_profiles(id) on delete cascade,
  institution text not null,
  degree text,
  field text,
  start_date text,
  end_date text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.education add column if not exists career_profile_id uuid references public.career_profiles(id) on delete cascade;
alter table public.education add column if not exists institution text;
alter table public.education add column if not exists degree text;
alter table public.education add column if not exists field text;
alter table public.education add column if not exists start_date text;
alter table public.education add column if not exists end_date text;
alter table public.education add column if not exists description text;

alter table public.education enable row level security;

drop policy if exists "Users can manage their own education" on public.education;
create policy "Users can manage their own education" 
  on public.education for all 
  using (auth.uid() = user_id);

create index if not exists idx_education_user_id on public.education(user_id);
create index if not exists idx_education_career_profile_id on public.education(career_profile_id);

-- 7. Certifications Table
create table if not exists public.certifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  career_profile_id uuid references public.career_profiles(id) on delete cascade,
  name text not null,
  issuer text,
  date text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.certifications add column if not exists career_profile_id uuid references public.career_profiles(id) on delete cascade;
alter table public.certifications add column if not exists name text;
alter table public.certifications add column if not exists issuer text;
alter table public.certifications add column if not exists date text;
alter table public.certifications add column if not exists description text;

alter table public.certifications enable row level security;

drop policy if exists "Users can manage their own certifications" on public.certifications;
create policy "Users can manage their own certifications" 
  on public.certifications for all 
  using (auth.uid() = user_id);

create index if not exists idx_certifications_user_id on public.certifications(user_id);
create index if not exists idx_certifications_career_profile_id on public.certifications(career_profile_id);

-- 8. Job Descriptions Table
create table if not exists public.job_descriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text,
  "role" text,
  raw_text text not null,
  source text default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.job_descriptions add column if not exists company text;
alter table public.job_descriptions add column if not exists "role" text;
alter table public.job_descriptions add column if not exists raw_text text;
alter table public.job_descriptions add column if not exists source text default 'manual';

alter table public.job_descriptions enable row level security;

drop policy if exists "Users can manage their own job descriptions" on public.job_descriptions;
create policy "Users can manage their own job descriptions" 
  on public.job_descriptions for all 
  using (auth.uid() = user_id);

create index if not exists idx_job_descriptions_user_id on public.job_descriptions(user_id);
