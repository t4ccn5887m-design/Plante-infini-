/**
 * Actions fiche brief pro : impression PDF (window.print) + téléchargement .ics.
 */

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Format ICS local flottant (sans Z) : YYYYMMDDTHHMMSS */
function formatIcsLocal(date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

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
    // Restaure après un court délai (certains navigateurs lisent le titre au print)
    window.setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  }
}

/**
 * Télécharge un .ics RDV 1h. Date de départ = demain 10h locale (modifiable dans l’agenda).
 */
export function downloadBriefRdvIcs({ clientName, phone, address } = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const name = String(clientName || "Client").trim() || "Client";
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const descLines = [];
  const tel = String(phone || "").trim();
  const addr = String(address || "").trim();
  if (tel) descLines.push(`Téléphone : ${tel}`);
  if (addr) descLines.push(`Adresse : ${addr}`);
  descLines.push("Préparer le brief Amont");

  const uid = `wilder-rdv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@wilder.app`;
  const stamp = formatIcsLocal(new Date());

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wilder Pro//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsLocal(start)}`,
    `DTEND:${formatIcsLocal(end)}`,
    `SUMMARY:${escapeIcsText(`RDV jardin — ${name}`)}`,
    `DESCRIPTION:${escapeIcsText(descLines.join("\n"))}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `RDV-jardin-${name.replace(/[^\w\-àâäéèêëïîôùûüç]+/gi, "_").slice(0, 40)}.ics`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
