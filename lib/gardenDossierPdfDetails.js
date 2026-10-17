/** Sections PDF « details » (quotidien, éviter, existant, entretien). */

import { normalizeBriefDetails } from "@/lib/brief/briefDetails";

const INK = "#16201A";
const MUTED = "#5B6359";
const LINE = "#D8D0C4";

function sectionHeading(num, title) {
  return {
    columns: [
      { text: num, width: 28, fontSize: 11, color: "#9A8F7E", margin: [0, 4, 0, 0] },
      { text: title, width: "*", fontSize: 20, bold: true, color: INK },
    ],
    margin: [0, 18, 0, 8],
  };
}

function rule() {
  return {
    canvas: [{ type: "line", x1: 0, y1: 0, x2: 483, y2: 0, lineWidth: 0.8, lineColor: LINE }],
    margin: [0, 0, 0, 10],
  };
}

function bodyLines(lines) {
  const items = (lines || []).filter(Boolean);
  if (!items.length) return null;
  return {
    stack: items.map((t) => ({ text: t, fontSize: 11, lineHeight: 1.45, color: INK })),
    margin: [0, 0, 0, 4],
  };
}

export function buildBriefDetailsPdfBlocks(rawDetails) {
  const d = normalizeBriefDetails(rawDetails);
  const blocks = [];

  const h = d.household;
  if (h.children || h.pets.length || h.uses.length) {
    blocks.push(sectionHeading("02", "Votre quotidien"));
    blocks.push(
      bodyLines([
        h.children ? `Enfants : ${h.children}` : null,
        h.pets.length ? `Animaux : ${h.pets.join(", ")}` : null,
        h.uses.length ? `Usages : ${h.uses.join(" · ")}` : null,
      ])
    );
    blocks.push(rule());
  }

  if (d.avoid.items.length || d.avoid.other?.trim()) {
    blocks.push(sectionHeading("03", "Ce que vous ne voulez pas"));
    blocks.push(
      bodyLines([
        d.avoid.items.length ? d.avoid.items.join(" · ") : null,
        d.avoid.other?.trim() ? d.avoid.other.trim() : null,
      ])
    );
    blocks.push(rule());
  }

  const u = d.upkeep;
  if (u.who || u.time || u.contract || u.when || u.date_note?.trim() || u.availability.length) {
    blocks.push(sectionHeading("04", "Entretien et calendrier"));
    blocks.push(
      bodyLines([
        u.who ? `Qui entretient : ${u.who}` : null,
        u.time ? `Temps : ${u.time}` : null,
        u.contract ? `Contrat d'entretien : ${u.contract}` : null,
        u.when ? `Échéance : ${u.when}` : null,
        u.date_note?.trim() ? u.date_note.trim() : null,
        u.availability.length ? `Disponibilités RDV : ${u.availability.join(", ")}` : null,
      ])
    );
    blocks.push(rule());
  }

  return blocks.filter(Boolean);
}
