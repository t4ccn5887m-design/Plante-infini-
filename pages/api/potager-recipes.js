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

function buildSystem(lang) {
  const tone = LANG_LABEL[lang] || LANG_LABEL.fr;
  return `Tu es un chef et jardinier passionné. Tu proposes des recettes maison simples, savoureuses et réalistes pour un potager familial.

LANGUE : réponds entièrement en ${tone}.

MISSION : à partir des légumes/fruits/herbes listés (récolte du potager), propose exactement 2 ou 3 recettes différentes qui utilisent au moins un de ces ingrédients. Les autres ingrédients courants (huile, sel, ail, oignon, œufs…) sont autorisés.

JSON uniquement, sans markdown :
{
  "recettes": [
    {
      "titre": "Nom court de la recette",
      "emoji": "un seul emoji cuisine",
      "duree": "ex. 20 min",
      "difficulte": "facile|moyen",
      "ingredients": ["3 à 6 ingrédients avec quantités approximatives"],
      "etapes": ["3 à 5 étapes courtes et claires"]
    }
  ]
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { plants, lang = "fr" } = req.body || {};
    const list = Array.isArray(plants) ? plants : [];

    if (!list.length) {
      return res.status(400).json({ erreur: "Aucune plante à récolter" });
    }

    const names = list
      .map((p) => String(p?.name || "").trim())
      .filter(Boolean);

    if (!names.length) {
      return res.status(400).json({ erreur: "Noms de plantes invalides" });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ erreur: "Clé API non configurée" });
    }

    const plantLines = list
      .map((p) => {
        const name = String(p?.name || "").trim();
        const emoji = String(p?.emoji || "🌱").trim();
        return name ? `${emoji} ${name}` : null;
      })
      .filter(Boolean)
      .join("\n");

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1200,
      system: buildSystem(lang),
      messages: [
        {
          role: "user",
          content:
            `Plantes prêtes à récolter dans mon potager :\n${plantLines}\n\n` +
            "Propose 2 ou 3 recettes du jour adaptées. JSON seul.",
        },
      ],
    });

    const text = (response.content || []).map((i) => i.text || "").join("");
    const parsed = parseClaudeJsonLoose(text);

    if (!parsed) {
      console.error("[Wilder] potager-recipes parse failed:", text.slice(0, 500));
      return res.status(500).json({ erreur: "Réponse illisible" });
    }

    if (parsed.erreur) {
      return res.status(422).json(parsed);
    }

    const raw = parsed.recettes || parsed.recipes;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(500).json({ erreur: "Aucune recette générée" });
    }

    const recettes = raw.slice(0, 3).map((r) => ({
      titre: String(r.titre || r.title || "Recette").trim(),
      emoji: String(r.emoji || "🍽️").trim().slice(0, 4) || "🍽️",
      duree: String(r.duree || r.duration || "").trim() || null,
      difficulte: String(r.difficulte || r.difficulty || "facile").trim(),
      ingredients: Array.isArray(r.ingredients)
        ? r.ingredients.map((x) => String(x).trim()).filter(Boolean)
        : [],
      etapes: Array.isArray(r.etapes || r.steps)
        ? (r.etapes || r.steps).map((x) => String(x).trim()).filter(Boolean)
        : [],
    }));

    res.status(200).json({ recettes });
  } catch (error) {
    console.error("[Wilder] potager-recipes error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
