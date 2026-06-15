import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CGV_VERSION } from "@/lib/legal";

/** Enregistre le consentement CGV via service_role (checkout serveur). */
export async function recordCgvConsentServer(userId) {
  if (!supabaseAdmin || !userId) {
    return { ok: false, error: "server_unavailable" };
  }

  const at = new Date().toISOString();
  const { error } = await supabaseAdmin.from("user_profiles").upsert(
    {
      user_id: userId,
      cgv_consent_at: at,
      cgv_consent_version: CGV_VERSION,
      updated_at: at,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[Wilder] recordCgvConsentServer:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId,
    });
    return { ok: false, error: error.message, code: error.code };
  }

  return { ok: true };
}
