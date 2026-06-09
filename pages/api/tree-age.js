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
  return `Tu es un arboriste expert. On te donne une espèce d'arbre (nom commun, nom latin, famille) et le diamètre du tronc mesuré à hauteur de poitrine (DHP), en centimètres.

LANGUE : réponds entièrement en ${tone}.

MÉTHODE :
1. Détermine le coefficient espèce-spécifique (années par cm de diamètre au DHP) d'après tes connaissances dendrométriques et les tables de croissance pour cette espèce en conditions tempérées (Europe par défaut si non précisé).
2. Calcule : âge_ans = diamètre_cm × coefficient (arrondi à l'entier le plus proche).
3. Si l'espèce est incertaine, utilise le genre ou la famille et indique-le dans la note.

Ne jamais inventer un coefficient sans base botanique. Fourchette raisonnable : coefficient typiquement entre 0.5 et 4 selon l'espèce (essences à croissance lente = coefficient plus élevé).

JSON uniquement, sans markdown :
{
  "age_ans": 85,
  "coefficient": 1.9,
  "note": "Courte explication (1 phrase) sur le coefficient utilisé et sa fiabilité"
}

Si le diamètre est invalide ou l'espèce non arboricole : {"erreur":"message court"}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const {
      nom,
      nom_latin: nomLatin,
      famille,
      diametre_cm: diametreRaw,
      age_approximatif: ageApprox,
      lang = "fr",
    } = req.body || {};

    const diametre = Number(diametreRaw);
    if (!Number.isFinite(diametre) || diametre <= 0 || diametre > 2000) {
      return res.status(400).json({ erreur: "Diamètre invalide" });
    }

    const speciesName = String(nom || "").trim();
    if (!speciesName) {
      return res.status(400).json({ erreur: "Espèce manquante" });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ erreur: "Clé API non configurée" });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const userText =
      `Espèce : ${speciesName}\n` +
      (nomLatin ? `Nom latin : ${nomLatin}\n` : "") +
      (famille ? `Famille : ${famille}\n` : "") +
      (ageApprox ? `Estimation visuelle précédente : ${ageApprox}\n` : "") +
      `Diamètre du tronc (DHP) : ${diametre} cm\n\n` +
      "Calcule l'âge avec âge = diamètre × coefficient espèce. JSON seul.";

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 512,
      system: buildSystem(lang),
      messages: [{ role: "user", content: userText }],
    });

    const text = response.content?.map((i) => i.text || "").join("") || "";
    const parsed = parseClaudeJsonLoose(text);

    if (!parsed) {
      return res.status(500).json({ erreur: "Réponse illisible — réessayez" });
    }
    if (parsed.erreur) {
      return res.status(422).json({ erreur: parsed.erreur });
    }

    const ageAns = Math.round(Number(parsed.age_ans));
    const coefficient = Number(parsed.coefficient);

    if (!Number.isFinite(ageAns) || ageAns <= 0) {
      return res.status(500).json({ erreur: "Âge calculé invalide — réessayez" });
    }

    res.status(200).json({
      age_ans: ageAns,
      coefficient: Number.isFinite(coefficient) ? coefficient : null,
      note: parsed.note || null,
      diametre_cm: diametre,
    });
  } catch (error) {
    console.error("[Wilder] tree-age error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
