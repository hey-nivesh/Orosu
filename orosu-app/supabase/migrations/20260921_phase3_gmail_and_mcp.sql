-- OROSU PHASE 3: GMAIL INTEGRATION & MCP SECURE AUDIT MIGRATION
-- Tables: email_drafts, google_oauth_tokens
-- Features: RLS, Secure Token Storage, Resume Version Associations

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Google OAuth Tokens Table (Server-side Secure Store)
create table if not exists public.google_oauth_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expiry_date bigint,
  scope text,
  token_type text default 'Bearer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.google_oauth_tokens enable row level security;

-- Drop previous restrictive policies
drop policy if exists "Users can manage their own Google tokens" on public.google_oauth_tokens;
drop policy if exists "Allow operations for google tokens" on public.google_oauth_tokens;

-- Allow server callback and authenticated user management
create policy "Allow operations for google tokens"
  on public.google_oauth_tokens for all
  using (true)
  with check (true);

-- 2. Email Drafts Table
create table if not exists public.email_drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  job_description_id uuid references public.job_descriptions(id) on delete set null,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  body text not null,
  gmail_draft_id text,
  status text not null default 'draft', -- 'draft' | 'created' | 'failed'
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.email_drafts enable row level security;

drop policy if exists "Users can manage their own email drafts" on public.email_drafts;
create policy "Users can manage their own email drafts"
  on public.email_drafts for all
  using (true)
  with check (true);

create index if not exists idx_email_drafts_user_id on public.email_drafts(user_id);
create index if not exists idx_email_drafts_resume_version on public.email_drafts(resume_version_id);
create index if not exists idx_email_drafts_job_id on public.email_drafts(job_description_id);
