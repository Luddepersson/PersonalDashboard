-- Fix infinite recursion in team_members policies
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
drop policy if exists "Team members can view members" on public.team_members;
drop policy if exists "Owners can delete members" on public.team_members;

-- Recreate without self-referencing subquery
-- Use a security definer function to bypass RLS during the check
create or replace function public.is_team_member(p_team_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_user_id
  );
$$ language sql security definer stable;

create or replace function public.is_team_owner(p_team_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_user_id and role = 'owner'
  );
$$ language sql security definer stable;

-- Now recreate policies using the functions (no recursion)
create policy "Team members can view members" on public.team_members
  for select using (public.is_team_member(team_id, auth.uid()));

create policy "Owners can delete members" on public.team_members
  for delete using (public.is_team_owner(team_id, auth.uid()));

-- Also fix the teams policies that reference team_members
drop policy if exists "Team members can view team" on public.teams;
drop policy if exists "Owners can update teams" on public.teams;
drop policy if exists "Owners can delete teams" on public.teams;

create policy "Team members can view team" on public.teams
  for select using (public.is_team_member(id, auth.uid()));

create policy "Owners can update teams" on public.teams
  for update using (public.is_team_owner(id, auth.uid()));

create policy "Owners can delete teams" on public.teams
  for delete using (public.is_team_owner(id, auth.uid()));

-- Fix todos/notes/reminders team policies that also reference team_members
drop policy if exists "Team members can manage team todos" on public.todos;
create policy "Team members can manage team todos" on public.todos
  for all using (
    team_id is not null and public.is_team_member(team_id, auth.uid())
  );

drop policy if exists "Team members can manage team notes" on public.notes;
create policy "Team members can manage team notes" on public.notes
  for all using (
    team_id is not null and public.is_team_member(team_id, auth.uid())
  );

-- Fix chat policies
drop policy if exists "Team members can view messages" on public.chat_messages;
drop policy if exists "Team members can send messages" on public.chat_messages;

create policy "Team members can view messages" on public.chat_messages
  for select using (public.is_team_member(team_id, auth.uid()));

create policy "Team members can send messages" on public.chat_messages
  for insert with check (
    auth.uid() = user_id and public.is_team_member(team_id, auth.uid())
  );

-- Fix invite policies if they exist
drop policy if exists "Team members can view invites" on public.team_invites;
drop policy if exists "Team members can create invites" on public.team_invites;

create policy "Team members can view invites" on public.team_invites
  for select using (public.is_team_member(team_id, auth.uid()));

create policy "Team members can create invites" on public.team_invites
  for insert with check (public.is_team_member(team_id, auth.uid()));
