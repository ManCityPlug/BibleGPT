import { createClient } from "@supabase/supabase-js";

// Client-side Supabase (anon key) — safe to use in browser & server components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
