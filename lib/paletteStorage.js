import { supabase } from "./supabase";

const PALETTE_COLUMNS = "id, nom, style, created_at, updated_at";

async function getSessionUserId() {
  if (!supabase) return { userId: null, error: "cloud_unavailable" };
  const { data, error } = await supabase.auth.getSession();
  if (error) return { userId: null, error: error.message };
  const userId = data?.session?.user?.id;
  if (!userId) return { userId: null, error: "not_authenticated" };
  return { userId: String(userId), error: null };
}

export async function fetchPalettes() {
  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError, data: [] };

  const { data, error } = await supabase
    .from("palettes")
    .select(PALETTE_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[Wilder] fetchPalettes:", error.message);
    return { ok: false, error: error.message, data: [] };
  }

  return { ok: true, data: data || [] };
}

export async function createPalette(nom) {
  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("palettes")
    .insert({ user_id: userId, nom: nom || "Nouvelle palette" })
    .select(PALETTE_COLUMNS)
    .single();

  if (error) {
    console.error("[Wilder] createPalette:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function renamePalette(paletteId, nom) {
  const trimmed = (nom || "").trim();
  if (!paletteId || !trimmed) return { ok: false, error: "invalid_input" };

  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("palettes")
    .update({ nom: trimmed })
    .eq("id", paletteId)
    .eq("user_id", userId)
    .select(PALETTE_COLUMNS)
    .single();

  if (error) {
    console.error("[Wilder] renamePalette:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function deletePalette(paletteId) {
  if (!paletteId) return { ok: false, error: "invalid_input" };

  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("palettes")
    .delete()
    .eq("id", paletteId)
    .eq("user_id", userId);

  if (error) {
    console.error("[Wilder] deletePalette:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
