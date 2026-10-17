import { createClient } from "@supabase/supabase-js";
import { supabaseAuthStorage } from "./authStorage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "wilder-auth-token",
          storage: supabaseAuthStorage,
        },
      })
    : null;

export function getOAuthRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = fromEnv
    ? String(fromEnv).replace(/\/$/, "")
    : window.location.origin;
  return `${origin}${window.location.pathname}${window.location.search || ""}`;
}
