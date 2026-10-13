import { normalizeBriefDetails } from "@/lib/brief/briefDetails";

/** Créneaux proposés (maquette 29). */
export const PLAN_TIME_SLOTS = [
  "08:30",
  "09:00",
  "10:30",
  "14:00",
  "15:30",
  "17:00",
];

const RDV_DURATION_MIN = 60;

export { RDV_DURATION_MIN };

/** @returns {{ key: string, date: string, chipLabel: string, weekdayLabel: string }[]} */
export function nextPlanDayOptions(count = 6) {
  const out = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${day}`;
    const weekdayLabel = d.toLocaleDateString("fr-FR", { weekday: "long" });
    const chipLabel = d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    out.push({ key: date, date, chipLabel, weekdayLabel });
  }
  return out;
}

export function clientAvailabilityFromBrief(briefRow) {
  const raw = briefRow?.details ?? briefRow?.brief?.details;
  const details = normalizeBriefDetails(raw);
  const slots = details.upkeep?.availability || [];
  const note = details.upkeep?.date_note?.trim() || "";
  return { slots, note };
}

export function isoToPlanDateTime(iso) {
  if (!iso) return { date: "", time: "" };
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: "", time: "" };
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
  } catch {
    return { date: "", time: "" };
  }
}
