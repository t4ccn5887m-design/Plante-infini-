/**
 * Actions fiche brief pro : impression PDF (window.print).
 */

/**
 * Ouvre la boîte d’impression navigateur. Titre document = Brief - {name}.
 * No-op silencieux si print indisponible.
 */
export function printBriefPdf(clientName) {
  if (typeof window === "undefined" || typeof window.print !== "function") {
    return;
  }
  const prevTitle = document.title;
  const name = String(clientName || "Client").trim() || "Client";
  document.title = `Brief - ${name}`;
  try {
    window.print();
  } finally {
    window.setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  }
}
