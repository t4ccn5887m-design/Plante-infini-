/** Fichier .ics pour un seul RDV (Calendrier iPhone). */

function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toIcsUtc(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function addMinutesIso(iso, minutes) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setMinutes(d.getMinutes() + (Number(minutes) || 60));
  return d.toISOString();
}

export function buildSingleAppointmentIcs({
  id,
  startsAt,
  durationMin = 60,
  clientName,
  studioName,
  address,
  notes,
}) {
  const start = toIcsUtc(startsAt);
  const end = toIcsUtc(addMinutesIso(startsAt, durationMin));
  if (!start || !end) return "";

  const uid = `${id || startsAt}@sevya.app`;
  const summary = escapeIcsText(
    `RDV jardin — ${clientName || "Client"}${studioName ? ` (${studioName})` : ""}`
  );
  const location = escapeIcsText(address || "");
  const descParts = [
    studioName ? `Studio : ${studioName}` : "",
    notes ? String(notes).trim() : "",
  ].filter(Boolean);
  const description = escapeIcsText(descParts.join("\\n"));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sevya//Pro//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : "",
    description ? `DESCRIPTION:${description}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadAppointmentIcs(filename, icsContent) {
  if (typeof window === "undefined" || !icsContent) return false;
  const blob = new Blob([icsContent], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "rdv-sevya.ics";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export function mapsItineraryUrl(address) {
  const q = String(address || "").trim();
  if (!q) return null;
  return `https://maps.apple.com/?daddr=${encodeURIComponent(q)}`;
}
