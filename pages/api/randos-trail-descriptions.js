import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJsonLoose } from "@/lib/parseAnalysis";

const LANG_LABEL = {
  fr: "français",
  en: "English",
  es: "español",
  it: "italiano",
  de: "Deutsch",
  pt: "português",
};

const MONTH_LABEL = {
  fr: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  es: [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ],
  it: [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
  ],
  de: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  pt: [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ],
};

function buildSystem(lang) {
  const tone = LANG_LABEL[lang] || LANG_LABEL.fr;
  return `Tu es un guide naturaliste passionné. Tu décris ce qu'on peut découvrir en nature sur des sentiers de randonnée.

LANGUE : réponds entièrement en ${tone}.

MISSION : pour chaque sentier listé, écris une courte description (2 à 3 phrases) de ce qu'on peut observer sur ce parcours selon la région et la saison actuelle : flore, faune, paysages, points d'intérêt naturels. Ton chaleureux, accessible, sans exagération.

JSON uniquement, sans markdown :
{
  "sentiers": [
    {
      "id": "identifiant exact du sentier",
      "emoji": "un seul emoji nature",
      "description": "2 à 3 phrases sur les découvertes possibles",
      "conseil": "un conseil court et pratique (ex. meilleur moment, chaussures, respect de la faune)"
    }
  ]
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { trails, lang = "fr", placeName = null, month } = req.body || {};
    const list = Array.isArray(trails) ? trails : [];

    if (!list.length) {
      return res.status(400).json({ erreur: "Aucun sentier" });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ erreur: "Clé API non configurée" });
    }

    const monthIndex = Number.isFinite(month) ? month : new Date().getMonth();
    const monthNames = MONTH_LABEL[lang] || MONTH_LABEL.fr;
    const seasonLabel = monthNames[monthIndex] || monthNames[new Date().getMonth()];
    const region = placeName || "cette région";

    const trailLines = list
      .slice(0, 8)
      .map((t) => {
        const parts = [
          `id: ${t.id}`,
          `nom: ${t.name}`,
          t.lengthKm != null ? `longueur: ${t.lengthKm} km` : null,
          t.durationMin != null ? `durée estimée: ${t.durationMin} min` : null,
        ].filter(Boolean);
        return parts.join(" | ");
      })
      .join("\n");

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1400,
      system: buildSystem(lang),
      messages: [
        {
          role: "user",
          content:
            `Région : ${region}\nSaison / mois : ${seasonLabel}\n\n` +
            `Sentiers :\n${trailLines}\n\n` +
            "Génère une entrée par sentier (même id). JSON seul.",
        },
      ],
    });

    const text = (response.content || []).map((i) => i.text || "").join("");
    const parsed = parseClaudeJsonLoose(text);

    if (!parsed) {
      console.error("[Wilder] randos-trail-descriptions parse failed:", text.slice(0, 500));
      return res.status(500).json({ erreur: "Réponse illisible" });
    }

    const raw = parsed.sentiers || parsed.trails;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(500).json({ erreur: "Aucune description générée" });
    }

    const sentiers = raw.map((s) => ({
      id: String(s.id || "").trim(),
      emoji: String(s.emoji || "🥾").trim().slice(0, 4) || "🥾",
      description: String(s.description || s.desc || "").trim(),
      conseil: String(s.conseil || s.tip || "").trim() || null,
    }));

    res.status(200).json({ sentiers });
  } catch (error) {
    console.error("[Wilder] randos-trail-descriptions error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
