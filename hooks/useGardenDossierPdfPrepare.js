import { useCallback, useEffect, useRef, useState } from "react";
import { createBriefPdfBlob } from "@/lib/briefPdf";
import {
  GARDEN_ANALYSIS_USER_MESSAGE,
  resolveGardenDossierAnalysis,
} from "@/lib/gardenAnalysisClient";
import { buildGardenDossierPdfParamsFromStorage } from "@/lib/gardenDossierPdf";
import {
  deliverPreparedGardenPdf,
  GARDEN_PDF_USER_ERROR,
  prepareGardenPdfFile,
  revokePreparedGardenPdf,
} from "@/lib/gardenBriefPdfDelivery";

/**
 * Prépare l'analyse (si dossier complet) puis le PDF en arrière-plan (tap iOS = share immédiat).
 * @param {boolean} enabled — coordonnées + au moins une étape dossier
 * @param {number|string} refreshKey
 * @param {boolean} runAnalysis — dossier à 100 % + coordonnées
 */
export function useGardenDossierPdfPrepare(enabled, refreshKey = 0, runAnalysis = false) {
  const [status, setStatus] = useState("idle");
  const [analyzing, setAnalyzing] = useState(false);
  const [gardenAnalysis, setGardenAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const preparedRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      revokePreparedGardenPdf(preparedRef.current);
      preparedRef.current = null;
      setStatus("idle");
      setAnalyzing(false);
      setGardenAnalysis(null);
      setAnalysisError(null);
      return undefined;
    }

    let cancelled = false;
    setStatus("loading");
    setAnalyzing(false);
    revokePreparedGardenPdf(preparedRef.current);
    preparedRef.current = null;

    (async () => {
      let analysisForPdf = null;

      if (runAnalysis) {
        if (!cancelled) setAnalyzing(true);
        const { analysis, message, error } = await resolveGardenDossierAnalysis();
        if (cancelled) return;
        setAnalyzing(false);
        analysisForPdf = analysis;
        setGardenAnalysis(analysis);
        if (!analysis && error && error !== "auth_required") {
          setAnalysisError(message || GARDEN_ANALYSIS_USER_MESSAGE);
        } else {
          setAnalysisError(null);
        }
      } else {
        setGardenAnalysis(null);
      }

      try {
        const params = await buildGardenDossierPdfParamsFromStorage({
          gardenAnalysis: analysisForPdf,
        });
        const created = await createBriefPdfBlob(params);
        if (cancelled) return;
        if (!created.ok) {
          console.error("[Sevya] pdf: create blob failed", created.error);
          setStatus("error");
          return;
        }
        preparedRef.current = prepareGardenPdfFile(created.blob, created.filename);
        setStatus("ready");
      } catch (error) {
        console.error("[Sevya] pdf:", error);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey, runAnalysis]);

  useEffect(
    () => () => {
      revokePreparedGardenPdf(preparedRef.current);
      preparedRef.current = null;
    },
    []
  );

  const shareFromPrepared = useCallback(() => {
    if (status !== "ready" || !preparedRef.current) {
      return { ok: false, error: GARDEN_PDF_USER_ERROR };
    }
    return deliverPreparedGardenPdf(preparedRef.current, { intent: "share" });
  }, [status]);

  const exportFromPrepared = useCallback(() => {
    if (status !== "ready" || !preparedRef.current) {
      return { ok: false, error: GARDEN_PDF_USER_ERROR };
    }
    return deliverPreparedGardenPdf(preparedRef.current, { intent: "export" });
  }, [status]);

  const pdfPreparing = status === "loading";

  return {
    status,
    analyzing,
    gardenAnalysis,
    analysisError,
    pdfPreparing,
    pdfReady: status === "ready",
    pdfError: status === "error",
    shareFromPrepared,
    exportFromPrepared,
  };
}
