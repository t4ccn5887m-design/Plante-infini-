import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJsonLoose } from "@/lib/parseAnalysis";

function imageMediaType(base64) {
  const head = base64.replace(/\s/g, "").slice(0, 12);
  if (head.startsWith("iVBOR")) return "image/png";
  if (head.startsWith("/9j/")) return "image/jpeg";
  if (head.startsWith("R0lGOD")) return "image/gif";
  if (head.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

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
  return `Tu es un jardinier expert en potagers familiaux. Tu analyses une photo LARGE d'un potager, jardinière ou parcelle entière.

LANGUE : réponds entièrement en ${tone}.

MISSION : identifie TOUTES les plantes de potager visibles (légumes, fruits, herbes aromatiques). Pour chaque plante, donne une action concrète à faire AUJOURD'HUI uniquement — pas demain, pas cette semaine.

RÈGLES STRICTES :
• Ne JAMAIS inventer une plante non visible. En cas de doute, ne l'inclus pas.
• Photo floue, trop sombre ou illisible : {"erreur":"Photo trop floue — prenez une photo plus nette de tout votre potager, en lumière naturelle."}
• Aucune plante identifiable : {"erreur":"Aucune plante de potager visible — cadrez tout votre potager ou jardinière."}
• Chaque action doit être courte (max 8 mots), impérative, faisable aujourd'hui.
• Si une plante est en bonne santé sans action : action_aujourdhui = "RAS, tout va bien"
• sante : "bon" (sain), "attention" (à surveiller, léger problème), "urgent" (soins immédiats)

JSON uniquement, sans markdown :
{
  "plantes": [
    {
      "nom": "Nom commun exact",
      "etat_sante": "État visible en une phrase courte",
      "sante": "bon|attention|urgent",
      "action_aujourdhui": "Action concrète pour aujourd'hui"
    }
  ]
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { image, lang = "fr" } = req.body || {};

    if (!image || typeof image !== "string") {
      return res.status(400).json({ erreur: "Image manquante" });
    }

    const imageData = image.replace(/\s/g, "");
    const mediaType = imageMediaType(imageData);

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ erreur: "Clé API non configurée" });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: buildSystem(lang),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageData },
            },
            {
              type: "text",
              text:
                "Voici une photo large de mon potager. Identifie chaque plante visible et dis-moi exactement quoi faire AUJOURD'HUI pour chacune. JSON seul.",
            },
          ],
        },
      ],
    });

    if (!response.content?.length) {
      return res.status(500).json({ erreur: "Réponse vide du modèle" });
    }

    const text = response.content.map((i) => i.text || "").join("");
    const parsed = parseClaudeJsonLoose(text);

    if (!parsed) {
      console.error("[Wilder] potager-daily-care non parsable:", text.slice(0, 500));
      return res.status(500).json({ erreur: "Réponse illisible — réessayez" });
    }

    if (parsed.erreur) {
      return res.status(422).json(parsed);
    }

    const plantes = Array.isArray(parsed.plantes) ? parsed.plantes : [];
    if (!plantes.length) {
      return res.status(422).json({
        erreur: "Aucune plante identifiée — cadrez tout votre potager en une seule photo.",
      });
    }

    res.status(200).json({ plantes });
  } catch (error) {
    console.error("[Wilder] potager-daily-care error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
