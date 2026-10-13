import { getCloudSession } from "@/lib/cloudSync";
import { isPermanentAuthUser } from "@/lib/authUser";
import { GARDEN_ANALYSIS_TIMEOUT_MS } from "@/lib/gardenAnalysisClient";
import {
  buildProBriefAnalysisBody,
  buildProBriefAnalysisFingerprint,
} from "@/lib/pro/briefAnalysisPayload";

const CACHE_PREFIX = "wilder-pro-brief-analysis-v1";

function cacheKey(briefId) {
  return `${CACHE_PREFIX}-${briefId || "unknown"}`;
}

function loadCache(briefId) {
  try {
    const raw = localStorage.getItem(cacheKey(briefId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCache(briefId, entry) {
  try {
    localStorage.setItem(cacheKey(briefId), JSON.stringify(entry));
  } catch {
    /* quota */
  }
}

function normalizeAnalysis(raw) {
  if (!raw?.profil?.style) return null;
  return {
    profil: {
      style: String(raw.profil.style || "").trim(),
      aime: String(raw.profil.aime || "").trim(),
      priorites: Array.isArray(raw.profil.priorites)
        ? raw.profil.priorites.map((p) => String(p).trim()).filter(Boolean).slice(0, 4)
        : [],
    },
    points: Array.isArray(raw.points)
      ? raw.points
          .map((p) => ({
            titre: String(p.titre || "").trim(),
            texte: String(p.texte || "").trim(),
            ids: Array.isArray(p.ids) ? p.ids.map(String) : [],
          }))
          .filter((p) => p.titre && p.texte)
          .slice(0, 5)
      : [],
    pistes: Array.isArray(raw.pistes)
      ? raw.pistes.map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
      : [],
  };
}

async function fetchApi(body, signal) {
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || "api_error" };

  const analysis = normalizeAnalysis(data);
  if (!analysis) return { ok: false, error: "invalid_response" };
  return { ok: true, analysis };
}

/**
 * Analyse IA pour fiche brief pro (avec cache local par brief).
 */
export async function resolveProBriefAnalysis({
  brief,
  briefId,
  client,
  photoSignedUrls,
  forceRefresh = false,
}) {
  if (!brief || !briefId) {
    return { analysis: null, error: "missing_brief" };
  }

  const body = await buildProBriefAnalysisBody(brief, client, photoSignedUrls);
  const fingerprint = JSON.stringify(buildProBriefAnalysisFingerprint(body));

  if (!forceRefresh) {
    const cached = loadCache(briefId);
    if (cached?.fingerprint === fingerprint && cached?.analysis) {
      return { analysis: normalizeAnalysis(cached.analysis), fromCache: true, error: null };
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GARDEN_ANALYSIS_TIMEOUT_MS);
  try {
    const result = await fetchApi(body, controller.signal);
    if (!result.ok) {
      return { analysis: null, error: result.error };
    }
    saveCache(briefId, { fingerprint, analysis: result.analysis, at: Date.now() });
    return { analysis: result.analysis, fromCache: false, error: null };
  } catch {
    return { analysis: null, error: "timeout" };
  } finally {
    clearTimeout(timeout);
  }
}
