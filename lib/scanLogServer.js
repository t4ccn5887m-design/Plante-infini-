import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Enregistre un scan réussi — fire-and-forget, n'impacte jamais la réponse utilisateur. */
export function logScanEvent(identity, speciesName = null) {
  if (!supabaseAdmin || !identity?.visitorKey) return;

  supabaseAdmin
    .from("scan_logs")
    .insert({
      fingerprint: identity.visitorKey,
      species_name: speciesName || null,
      user_id: identity.userId || null,
    })
    .then(({ error }) => {
      if (error) {
        const hint =
          error.code === "42P01"
            ? " (table scan_logs absente — exécutez la migration Supabase)"
            : "";
        console.error("[Wilder] scan_logs insert:", error.message + hint);
      }
    })
    .catch((e) => console.error("[Wilder] scan_logs insert:", e.message));
}
