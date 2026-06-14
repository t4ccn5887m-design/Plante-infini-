import { supabase } from "./supabase";
import { CGU_VERSION, CGV_VERSION } from "./legal";

function logProfileError(operation, error, context = {}) {
  console.error("[Wilder] user_profiles", operation, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    ...context,
  });
}

async function upsertProfileFields(userId, fields) {
  if (!supabase || !userId) return { ok: false, error: "cloud_unavailable" };

  const updatedAt = new Date().toISOString();
  const row = {
    user_id: userId,
    ...fields,
    updated_at: updatedAt,
  };

  const { data: existing, error: selectError } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    logProfileError("select", selectError, { userId });
    return { ok: false, error: selectError.message, code: selectError.code };
  }

  if (existing?.user_id) {
    const { error } = await supabase
      .from("user_profiles")
      .update({ ...fields, updated_at: updatedAt })
      .eq("user_id", userId);

    if (error) {
      logProfileError("update", error, { userId, fields });
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: true };
  }

  const { error: insertError } = await supabase.from("user_profiles").insert(row);
  if (insertError) {
    logProfileError("insert", insertError, { userId, fields });
    return { ok: false, error: insertError.message, code: insertError.code };
  }

  return { ok: true };
}

/** Enregistre l'acceptation des CGU + politique de confidentialité. */
export async function recordCguConsent(version = CGU_VERSION) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) return { ok: false, error: "not_authenticated" };

  const at = new Date().toISOString();
  const meta = {
    cgu_consent_at: at,
    cgu_consent_version: version,
    privacy_consent_at: at,
    privacy_consent_version: version,
  };

  const { error: metaError } = await supabase.auth.updateUser({ data: meta });
  if (metaError) {
    console.error("[Wilder] auth.updateUser (CGU consent meta):", {
      message: metaError.message,
      code: metaError.code,
      status: metaError.status,
    });
  }

  return upsertProfileFields(user.id, {
    cgu_consent_at: at,
    cgu_consent_version: version,
    privacy_consent_at: at,
    privacy_consent_version: version,
  });
}

/** Enregistre l'acceptation des CGV avant paiement. */
export async function recordCgvConsent(version = CGV_VERSION) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) return { ok: false, error: "not_authenticated" };

  const at = new Date().toISOString();
  const meta = {
    cgv_consent_at: at,
    cgv_consent_version: version,
  };

  const { error: metaError } = await supabase.auth.updateUser({ data: meta });
  if (metaError) {
    console.error("[Wilder] auth.updateUser (CGV consent meta):", {
      message: metaError.message,
      code: metaError.code,
      status: metaError.status,
    });
  }

  return upsertProfileFields(user.id, {
    cgv_consent_at: at,
    cgv_consent_version: version,
  });
}
