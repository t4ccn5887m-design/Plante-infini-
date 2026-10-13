import { supabase } from "@/lib/supabase";

export function readPartnersNotify(user) {
  return Boolean(user?.user_metadata?.partners_notify);
}

/** Compte permanent uniquement — metadata Supabase, pas de table dédiée. */
export async function savePartnersNotifyPreference() {
  if (!supabase) {
    return { ok: false, error: "cloud_unavailable" };
  }
  const partners_notify_at = new Date().toISOString();
  const { error } = await supabase.auth.updateUser({
    data: {
      partners_notify: true,
      partners_notify_at,
    },
  });
  if (error) {
    return { ok: false, error: error.message || "update_failed" };
  }
  return { ok: true, partners_notify_at };
}
