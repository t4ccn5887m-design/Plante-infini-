import { getCloudSession } from "@/lib/cloudSync";
import { isPermanentAuthUser } from "@/lib/authUser";
import { loadGardenAnalysisCache, saveGardenAnalysisCache } from "@/lib/gardenAnalysisCache";
import { hashGardenDossierPayloadAsync } from "@/lib/gardenAnalysisFingerprint";
import {
  buildGardenAnalysisFingerprintPayload,
  buildGardenAnalysisRequestBody,
} from "@/lib/gardenAnalysisPayload";

const ANALYSIS_TIMEOUT_MS = 25000;

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
  if (!profil.style) return null;
  return { profil, points };
}

async function fetchAnalysisFromApi(body, signal) {
  const session = await getCloudSession();
  if (!session?.access_token || !isPermanentAuthUser(session.user)) {
    return { ok: false, error: "auth_required" };
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

  if (res.status === 401) return { ok: false, error: "auth_required" };
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.message || "rate_limit" };
  }
  if (!res.ok) {
    console.error("[Sevya] garden-analysis:", res.status);
    return { ok: false, error: "api_error" };
  }

  const data = await res.json();
  const analysis = normalizeAnalysis(data);
  if (!analysis) return { ok: false, error: "invalid_response" };
  return { ok: true, analysis };
}

/**
 * Résout l'analyse (cache ou API). Ne bloque jamais plus de 25 s.
 * @returns {Promise<{ analysis: object | null, fromCache: boolean }>}
 */
export async function resolveGardenDossierAnalysis({ forceRefresh = false } = {}) {
  try {
    const fingerprintPayload = await buildGardenAnalysisFingerprintPayload();
    const hash = await hashGardenDossierPayloadAsync(fingerprintPayload);

    if (!forceRefresh) {
      const cached = loadGardenAnalysisCache();
      if (cached?.hash === hash && cached.analysis) {
        return { analysis: cached.analysis, fromCache: true };
      }
    }

    const session = await getCloudSession();
    if (!session?.access_token || !isPermanentAuthUser(session.user)) {
      return { analysis: null, fromCache: false };
    }

    const body = await buildGardenAnalysisRequestBody();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    const result = await fetchAnalysisFromApi(body, controller.signal);
    clearTimeout(timeout);

    if (!result.ok) {
      return { analysis: null, fromCache: false };
    }

    saveGardenAnalysisCache(hash, result.analysis);
    return { analysis: result.analysis, fromCache: false };
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error("[Sevya] garden analysis:", error);
    }
    return { analysis: null, fromCache: false };
  }
}

export function readCachedGardenAnalysisForDisplay() {
  const cached = loadGardenAnalysisCache();
  return cached?.analysis || null;
}
