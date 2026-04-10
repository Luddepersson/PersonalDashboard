-- Fix: Allow reading teams you just created (before membership exists)
-- The issue is .insert().select() triggers the SELECT policy before the member row exists

-- Option: Use a database function that creates team + member in one atomic operation
create or replace function public.create_team(p_name text, p_slug text, p_user_id uuid)
returns uuid as $$
declare
  v_team_id uuid;
begin
  insert into public.teams (name, slug)
  values (p_name, p_slug)
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (v_team_id, p_user_id, 'owner');

  return v_team_id;
end;
$$ language plpgsql security definer;
