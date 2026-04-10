-- Run this in Supabase SQL Editor AFTER the main schema
-- Adds team invites with unique tokens

create table public.team_invites (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams on delete cascade not null,
  email text,
  token text unique not null,
  created_by uuid references auth.users on delete cascade not null,
  used_by uuid references auth.users on delete set null,
  used_at timestamptz,
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now()
);

alter table public.team_invites enable row level security;

create policy "Team members can view invites" on public.team_invites for select using (
  exists (select 1 from public.team_members where team_id = team_invites.team_id and user_id = auth.uid())
);
create policy "Team members can create invites" on public.team_invites for insert with check (
  exists (select 1 from public.team_members where team_id = team_invites.team_id and user_id = auth.uid())
);
create policy "Anyone can read invite by token" on public.team_invites for select using (true);
create policy "Invited user can update invite" on public.team_invites for update using (true);

create index idx_team_invites_token on public.team_invites(token);
create index idx_team_invites_email on public.team_invites(email);
