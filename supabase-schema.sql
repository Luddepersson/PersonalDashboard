-- ============================================
-- Personal Dashboard — Komplett Supabase Schema
-- Kör detta i: Supabase Dashboard > SQL Editor > New Query
-- OBS: Om du redan kört det gamla schemat, droppa alla tabeller först
-- ============================================

-- Helper functions FIRST (used by RLS policies, prevents recursion)
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

-- ============================================
-- 1. Profiles
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  github_username text,
  theme text default 'emerald-chrome',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. Teams
-- ============================================
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.teams enable row level security;
drop policy if exists "Team members can view team" on public.teams;
drop policy if exists "Anyone can create teams" on public.teams;
drop policy if exists "Owners can update teams" on public.teams;
drop policy if exists "Owners can delete teams" on public.teams;
create policy "Team members can view team" on public.teams for select using (public.is_team_member(id, auth.uid()));
create policy "Anyone can create teams" on public.teams for insert with check (true);
create policy "Owners can update teams" on public.teams for update using (public.is_team_owner(id, auth.uid()));
create policy "Owners can delete teams" on public.teams for delete using (public.is_team_owner(id, auth.uid()));

-- ============================================
-- 3. Team members
-- ============================================
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member',
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

alter table public.team_members enable row level security;
drop policy if exists "Team members can view members" on public.team_members;
drop policy if exists "Anyone can insert members" on public.team_members;
drop policy if exists "Owners can delete members" on public.team_members;
create policy "Team members can view members" on public.team_members for select using (public.is_team_member(team_id, auth.uid()));
create policy "Anyone can insert members" on public.team_members for insert with check (true);
create policy "Owners can delete members" on public.team_members for delete using (public.is_team_owner(team_id, auth.uid()));

-- ============================================
-- 4. Team invites
-- ============================================
create table if not exists public.team_invites (
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
drop policy if exists "Team members can view invites" on public.team_invites;
drop policy if exists "Team members can create invites" on public.team_invites;
drop policy if exists "Anyone can read invite by token" on public.team_invites;
drop policy if exists "Invited user can update invite" on public.team_invites;
create policy "Team members can view invites" on public.team_invites for select using (public.is_team_member(team_id, auth.uid()));
create policy "Team members can create invites" on public.team_invites for insert with check (public.is_team_member(team_id, auth.uid()));
create policy "Anyone can read invite by token" on public.team_invites for select using (true);
create policy "Invited user can update invite" on public.team_invites for update using (true);

-- ============================================
-- 5. Todos
-- ============================================
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  team_id uuid references public.teams on delete cascade,
  text text not null,
  done boolean default false,
  "order" int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.todos enable row level security;
drop policy if exists "Users can manage own todos" on public.todos;
drop policy if exists "Team members can manage team todos" on public.todos;
create policy "Users can manage own todos" on public.todos for all using (auth.uid() = user_id);
create policy "Team members can manage team todos" on public.todos for all using (
  team_id is not null and public.is_team_member(team_id, auth.uid())
);

-- ============================================
-- 6. Habits
-- ============================================
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

alter table public.habits enable row level security;
drop policy if exists "Users can manage own habits" on public.habits;
create policy "Users can manage own habits" on public.habits for all using (auth.uid() = user_id);

-- ============================================
-- 7. Habit completions
-- ============================================
create table if not exists public.habit_completions (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references public.habits on delete cascade not null,
  date text not null,
  unique(habit_id, date)
);

alter table public.habit_completions enable row level security;
drop policy if exists "Users can manage own completions" on public.habit_completions;
create policy "Users can manage own completions" on public.habit_completions for all using (
  exists (select 1 from public.habits where id = habit_completions.habit_id and user_id = auth.uid())
);

-- ============================================
-- 8. Reminders
-- ============================================
create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  team_id uuid references public.teams on delete cascade,
  title text not null,
  date text not null,
  time text not null,
  color text not null,
  created_at timestamptz default now()
);

alter table public.reminders enable row level security;
drop policy if exists "Users can manage own reminders" on public.reminders;
create policy "Users can manage own reminders" on public.reminders for all using (auth.uid() = user_id);

-- ============================================
-- 9. Notes (markdown)
-- ============================================
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  team_id uuid references public.teams on delete cascade,
  title text not null,
  content text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;
drop policy if exists "Users can manage own notes" on public.notes;
drop policy if exists "Team members can manage team notes" on public.notes;
create policy "Users can manage own notes" on public.notes for all using (auth.uid() = user_id);
create policy "Team members can manage team notes" on public.notes for all using (
  team_id is not null and public.is_team_member(team_id, auth.uid())
);

-- ============================================
-- 10. Quick links
-- ============================================
create table if not exists public.quick_links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  url text not null,
  icon text not null,
  color text not null,
  "order" int default 0
);

alter table public.quick_links enable row level security;
drop policy if exists "Users can manage own links" on public.quick_links;
create policy "Users can manage own links" on public.quick_links for all using (auth.uid() = user_id);

-- ============================================
-- 11. Pomodoro sessions
-- ============================================
create table if not exists public.pomodoro_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  mode text not null,
  duration_min int not null,
  completed_at timestamptz default now()
);

alter table public.pomodoro_sessions enable row level security;
drop policy if exists "Users can manage own pomodoros" on public.pomodoro_sessions;
create policy "Users can manage own pomodoros" on public.pomodoro_sessions for all using (auth.uid() = user_id);

-- ============================================
-- 12. Spotify tracks
-- ============================================
create table if not exists public.spotify_tracks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  artist text not null,
  "order" int default 0
);

alter table public.spotify_tracks enable row level security;
drop policy if exists "Users can manage own tracks" on public.spotify_tracks;
create policy "Users can manage own tracks" on public.spotify_tracks for all using (auth.uid() = user_id);

-- ============================================
-- 13. Chat messages
-- ============================================
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;
drop policy if exists "Team members can view messages" on public.chat_messages;
drop policy if exists "Team members can send messages" on public.chat_messages;
create policy "Team members can view messages" on public.chat_messages for select using (public.is_team_member(team_id, auth.uid()));
create policy "Team members can send messages" on public.chat_messages for insert with check (
  auth.uid() = user_id and public.is_team_member(team_id, auth.uid())
);

-- ============================================
-- Realtime for chat
-- ============================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- ============================================
-- Indexes
-- ============================================
create index if not exists idx_todos_user on public.todos(user_id);
create index if not exists idx_habits_user on public.habits(user_id);
create index if not exists idx_reminders_user on public.reminders(user_id);
create index if not exists idx_notes_user on public.notes(user_id);
create index if not exists idx_chat_messages_team on public.chat_messages(team_id, created_at);
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_team_invites_token on public.team_invites(token);
create index if not exists idx_team_invites_email on public.team_invites(email);
