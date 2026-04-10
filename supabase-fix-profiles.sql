-- Fix: Allow team members to see each other's profiles
-- Currently only "Users can view own profile" exists

create policy "Team members can view teammate profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.team_members tm1
      join public.team_members tm2 on tm1.team_id = tm2.team_id
      where tm1.user_id = auth.uid() and tm2.user_id = profiles.id
    )
  );
