import { createServerSupabase } from "./supabase-server";

export async function auth() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
