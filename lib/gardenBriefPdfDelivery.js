/** Livraison PDF dossier jardin — partage iOS sans await avant navigator.share. */

export const GARDEN_PDF_USER_ERROR =
  "Impossible de préparer le PDF. Réessayez dans un instant.";

export function prepareGardenPdfFile(blob, filename) {
  if (!blob || !filename) return null;
  const objectUrl = URL.createObjectURL(blob);
  const file = new File([blob], filename, { type: "application/pdf" });
  let canShareFiles = false;
  try {
    canShareFiles =
      typeof navigator.share === "function" &&
      (navigator.canShare?.({ files: [file] }) ?? false);
  } catch {
    canShareFiles = false;
  }
  return { blob, filename, file, objectUrl, canShareFiles };
}

export function revokePreparedGardenPdf(prepared) {
  if (!prepared?.objectUrl) return;
  try {
    URL.revokeObjectURL(prepared.objectUrl);
  } catch {
    /* ignore */
  }
}

/**
 * @param {ReturnType<typeof prepareGardenPdfFile>} prepared
 * @param {{ intent?: 'share' | 'export' }} options
 * @returns {{ ok: boolean, method?: string, cancelled?: boolean, error?: string }}
 */
export function deliverPreparedGardenPdf(prepared, options = {}) {
  const intent = options.intent || "share";
  if (!prepared?.blob || !prepared.filename) {
    return { ok: false, error: GARDEN_PDF_USER_ERROR };
  }

  if (prepared.canShareFiles && prepared.file) {
    try {
      const sharePromise = navigator.share({
        files: [prepared.file],
        title: prepared.filename,
      });
      sharePromise
        .then(() => {})
        .catch((error) => {
          if (error?.name !== "AbortError") {
            console.error("[Sevya] pdf: share failed after tap", error);
          }
        });
      return { ok: true, method: "share" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { ok: false, cancelled: true };
      }
      console.error("[Sevya] pdf:", error);
    }
  }

  try {
    const opened = window.open(prepared.objectUrl, "_blank");
    if (!opened) {
      window.location.assign(prepared.objectUrl);
    }
    return { ok: true, method: intent === "export" ? "open_tab" : "open_tab" };
  } catch (error) {
    console.error("[Sevya] pdf:", error);
    return { ok: false, error: GARDEN_PDF_USER_ERROR };
  }
}
