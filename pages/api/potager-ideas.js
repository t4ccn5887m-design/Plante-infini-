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
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

function currentSeason(month) {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function buildSystem(lang) {
  const tone = LANG_LABEL[lang] || LANG_LABEL.fr;
  return `Tu es un jardinier expert en potagers familiaux en Europe.

LANGUE : réponds entièrement en ${tone}.

MISSION : propose 4 à 6 idées de légumes, herbes aromatiques ou fleurs comestibles à planter ou semer MAINTENANT, adaptées à la saison et à la région de l'utilisateur.

Pour chaque plante :
- nom courant et emoji
- quand planter (période précise)
- comment (semis direct, plants, godets, conseils courts)
- où trouver les plants : choisis UNIQUEMENT parmi les pépinières/jardineries listées par l'utilisateur (nom exact). Si la liste est vide, indique "Marché local ou jardinerie".

JSON uniquement, sans markdown :
{
  "idees": [
    {
      "nom": "Nom de la plante",
      "emoji": "un seul emoji",
      "type": "legume|herbe|fleur",
      "quand": "ex. Mi-mai à fin juin",
      "comment": "2-3 phrases concrètes",
      "pepiniere": "Nom exact d'une pépinière listée ou alternative locale"
    }
  ]
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { region, lang = "fr", nurseries = [] } = req.body || {};
    const regionName = String(region || "").trim() || "France";

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ erreur: "Clé API non configurée" });
    }

    const now = new Date();
    const month = now.getMonth();
    const season = currentSeason(month);
    const monthLabels = MONTH_LABEL[lang] || MONTH_LABEL.fr;
    const monthName = monthLabels[month] || monthLabels[0];

    const nurseryLines = (Array.isArray(nurseries) ? nurseries : [])
      .map((n) => {
        const name = String(n?.name || "").trim();
        const dist = n?.distanceKm != null ? ` (${n.distanceKm} km)` : "";
        return name ? `- ${name}${dist}` : null;
      })
      .filter(Boolean)
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
            `Région : ${regionName}\n` +
            `Saison : ${season}\n` +
            `Mois actuel : ${monthName}\n\n` +
            `Pépinières et jardineries à proximité :\n` +
            (nurseryLines || "(aucune trouvée — suggère marché local ou jardinerie)\n") +
            `\nPropose 4 à 6 idées de potager pour planter ou semer maintenant. JSON seul.`,
        },
      ],
    });

    const text = (response.content || []).map((i) => i.text || "").join("");
    const parsed = parseClaudeJsonLoose(text);

    if (!parsed) {
      console.error("[Wilder] potager-ideas parse failed:", text.slice(0, 500));
      return res.status(500).json({ erreur: "Réponse illisible" });
    }

    if (parsed.erreur) {
      return res.status(422).json(parsed);
    }

    const raw = parsed.idees || parsed.ideas;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(500).json({ erreur: "Aucune idée générée" });
    }

    const idees = raw.slice(0, 6).map((item) => ({
      nom: String(item.nom || item.name || "Plante").trim(),
      emoji: String(item.emoji || "🌱").trim().slice(0, 4) || "🌱",
      type: String(item.type || "legume").trim(),
      quand: String(item.quand || item.when || "").trim(),
      comment: String(item.comment || item.how || "").trim(),
      pepiniere: String(item.pepiniere || item.nursery || "").trim() || null,
    }));

    res.status(200).json({ idees });
  } catch (error) {
    console.error("[Wilder] potager-ideas error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
