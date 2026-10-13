import { getCloudSession } from "@/lib/cloudSync";
import { isPermanentAuthUser } from "@/lib/authUser";
import { loadGardenAnalysisCache, saveGardenAnalysisCache } from "@/lib/gardenAnalysisCache";
import { hashGardenDossierPayloadAsync } from "@/lib/gardenAnalysisFingerprint";
import {
  buildGardenAnalysisFingerprintPayload,
  buildGardenAnalysisRequestBody,
} from "@/lib/gardenAnalysisPayload";

export const GARDEN_ANALYSIS_TIMEOUT_MS = 55000;
export const GARDEN_ANALYSIS_USER_MESSAGE = "Analyse indisponible, réessayez.";

/** Données affichées / PDF client (sans pistes pro). */
export function stripAnalysisForClient(raw) {
  if (!raw?.profil?.style) return null;
  return {
    profil: raw.profil,
    points: Array.isArray(raw.points) ? raw.points : [],
  };
}

function normalizeAnalysis(raw) {
  if (!raw?.profil?.style) return null;
  const profil = {
    style: String(raw.profil.style || "").trim(),
    aime: String(raw.profil.aime || "").trim(),
    priorites: Array.isArray(raw.profil.priorites)
      ? raw.profil.priorites.map((p) => String(p).trim()).filter(Boolean).slice(0, 4)
      : [],
  };
  const points = Array.isArray(raw.points)
    ? raw.points
        .map((p) => ({
          titre: String(p.titre || "").trim(),
          texte: String(p.texte || "").trim(),
          ids: Array.isArray(p.ids) ? p.ids.map(String) : [],
        }))
        .filter((p) => p.titre && p.texte)
        .slice(0, 5)
    : [];
  const pistes = Array.isArray(raw.pistes)
    ? raw.pistes.map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
    : [];
  if (!profil.style) return null;
  return { profil, points, pistes };
}

async function fetchAnalysisFromApi(body, signal) {
  const session = await getCloudSession();
  if (!session?.access_token || !isPermanentAuthUser(session.user)) {
    return { ok: false, error: "auth_required", message: null };
  }

  const res = await fetch("/api/garden-analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) return { ok: false, error: "auth_required", message: data.message };
  if (res.status === 429) {
    return { ok: false, error: "rate_limit", message: data.message || GARDEN_ANALYSIS_USER_MESSAGE };
  }
  if (!res.ok) {
    console.error("[Sevya] garden-analysis:", res.status, data);
    return {
      ok: false,
      error: data.error || "api_error",
      message: data.message || GARDEN_ANALYSIS_USER_MESSAGE,
    };
  }

  const analysis = normalizeAnalysis(data);
  if (!analysis) {
    return { ok: false, error: "invalid_response", message: GARDEN_ANALYSIS_USER_MESSAGE };
  }
  return { ok: true, analysis };
}

async function fetchWithTimeout(body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GARDEN_ANALYSIS_TIMEOUT_MS);
  try {
    return await fetchAnalysisFromApi(body, controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Résout l'analyse (cache ou API).
 * @returns {Promise<{ analysis: object | null, fromCache: boolean, error: string | null, message: string | null }>}
 */
export async function resolveGardenDossierAnalysis({ forceRefresh = false } = {}) {
  try {
    const fingerprintPayload = await buildGardenAnalysisFingerprintPayload();
    const hash = await hashGardenDossierPayloadAsync(fingerprintPayload);

    if (!forceRefresh) {
      const cached = loadGardenAnalysisCache();
      if (cached?.hash === hash && cached.analysis) {
        return {
          analysis: stripAnalysisForClient(cached.analysis),
          fromCache: true,
          error: null,
          message: null,
        };
      }
    }

    const session = await getCloudSession();
    if (!session?.access_token || !isPermanentAuthUser(session.user)) {
      return { analysis: null, fromCache: false, error: "auth_required", message: null };
    }

    const body = await buildGardenAnalysisRequestBody();
    let result = await fetchWithTimeout(body);
    if (!result.ok && result.error !== "auth_required" && result.error !== "rate_limit") {
      result = await fetchWithTimeout(body);
    }

    if (!result.ok) {
      return {
        analysis: null,
        fromCache: false,
        error: result.error,
        message: result.message || GARDEN_ANALYSIS_USER_MESSAGE,
      };
    }

    saveGardenAnalysisCache(hash, result.analysis);
    return {
      analysis: stripAnalysisForClient(result.analysis),
      fromCache: false,
      error: null,
      message: null,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        analysis: null,
        fromCache: false,
        error: "timeout",
        message: GARDEN_ANALYSIS_USER_MESSAGE,
      };
    }
    console.error("[Sevya] garden analysis:", error);
    return {
      analysis: null,
      fromCache: false,
      error: "unknown",
      message: GARDEN_ANALYSIS_USER_MESSAGE,
    };
  }
}

export function readCachedGardenAnalysisForDisplay() {
  const cached = loadGardenAnalysisCache();
  return stripAnalysisForClient(cached?.analysis) || null;
}

/** Pistes paysagiste (hors PDF client). */
export function readCachedGardenAnalysisPistes() {
  const cached = loadGardenAnalysisCache();
  return Array.isArray(cached?.analysis?.pistes) ? cached.analysis.pistes : [];
}
