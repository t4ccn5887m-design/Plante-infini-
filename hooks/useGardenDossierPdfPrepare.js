import { useCallback, useEffect, useRef, useState } from "react";
import { createBriefPdfBlob } from "@/lib/briefPdf";
import { buildGardenDossierPdfParamsFromStorage } from "@/lib/gardenDossierPdf";
import {
  deliverPreparedGardenPdf,
  GARDEN_PDF_USER_ERROR,
  prepareGardenPdfFile,
  revokePreparedGardenPdf,
} from "@/lib/gardenBriefPdfDelivery";

/**
 * Prépare le PDF dossier en arrière-plan (tap iOS = share immédiat).
 * @param {boolean} enabled
 * @param {number|string} refreshKey
 */
export function useGardenDossierPdfPrepare(enabled, refreshKey = 0) {
  const [status, setStatus] = useState("idle");
  const preparedRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      revokePreparedGardenPdf(preparedRef.current);
      preparedRef.current = null;
      setStatus("idle");
      return undefined;
    }

    let cancelled = false;
    setStatus("loading");
    revokePreparedGardenPdf(preparedRef.current);
    preparedRef.current = null;

    (async () => {
      try {
        const params = await buildGardenDossierPdfParamsFromStorage();
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
  }, [enabled, refreshKey]);

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

  return {
    status,
    pdfPreparing: status === "loading",
    pdfReady: status === "ready",
    pdfError: status === "error",
    shareFromPrepared,
    exportFromPrepared,
  };
}
