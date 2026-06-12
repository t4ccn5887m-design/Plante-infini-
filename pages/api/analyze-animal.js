import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson } from "@/lib/parseAnalysis";
import {
  enforceScanQuotaForAnalyze,
  recordSuccessfulScanServer,
} from "@/lib/scanQuotaServer";

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

const EXPERT_ROLE =
  "Tu es un expert botaniste et animalier de niveau mondial avec 30 ans d'expérience. Tu identifies avec une précision absolue toutes les espèces végétales et animales : plantes, arbres, fleurs, champignons, insectes, oiseaux, mammifères, reptiles, poissons et amphibiens. Tu ne te trompes jamais sur une espèce que tu connais. Si tu as le moindre doute en dessous de 90% de certitude, tu le dis honnêtement plutôt que de donner une mauvaise réponse.";

const SHARED_FIELDS = `
JSON uniquement, sans markdown ni texte autour :
{
  "type":"animal|oiseau|insecte|reptile|papillon",
  "nom":"Nom commun exact de l'animal",
  "nom_latin":"Binôme latin ou null",
  "histoire":"Récit narratif et émotionnel de 3 à 5 phrases, comme si tu racontais une vraie histoire à un enfant curieux. Utilise le présent ou le passé récent pour le rendre vivant.",
  "activite_probable":"Ce que l'animal faisait probablement ici (chasse, repos, passage, nidification…)",
  "heure_probable":"À quelle heure ou période il est probablement passé (ex. « entre 2h et 4h du matin », « à l'aube », « en fin d'après-midi »)",
  "habitudes_saison":"Ses habitudes selon la saison actuelle (migration, reproduction, hibernation, activité nocturne…)",
  "comment_observer":"Quand et comment avoir une chance de le voir (lieu, moment, attitude, discrétion)",
  "chances_observer":"Estimation des chances de l'observer (ex. « 60 % si tu reviens demain à l'aube ») ; null si non applicable",
  "fait_surprenant":"Un fait surprenant et émouvant sur cet animal",
  "description":"Description courte de l'espèce",
  "habitat":"Habitat naturel",
  "comportement":"Comportements typiques",
  "alimentation":"Régime alimentaire ou null",
  "espece_protegee":true|false|null,
  "region_saison":"Meilleure saison et régions pour l'observer",
  "rarete":"commun|peu_commun|rare|tres_rare",
  "fun_fact":"Fait amusant complémentaire ou null",
  "identification_note":"Limites de l'identification ou incertitude ; null si très confiant"
}`;

function buildSystem(mode, lang) {
  const tone = LANG_LABEL[lang] || LANG_LABEL.fr;

  const base = `${EXPERT_ROLE}

Tu es aussi un naturaliste passionné et conteur. Tu crées une connexion émotionnelle — pas juste identifier, mais raconter une histoire vraie et touchante. Réponds entièrement en ${tone}.

RÈGLES STRICTES :
• Ne JAMAIS inventer. En cas de doute : propose la meilleure identification possible et explique dans identification_note.
• TOUJOURS renvoyer une identification si un animal, indice ou chant est plausible, même partiel ou incertain.
• Réserve {"erreur":"Aucune decouverte identifiable"} UNIQUEMENT si la photo/enregistrement ne contient aucun animal, indice ou chant identifiable (mur, visage, voiture, bruit sans oiseau, photo vide…).
`;

  if (mode === "animal") {
    return `${base}
MODE : SCAN DIRECT DE L'ANIMAL
Tu analyses une photo DIRECTE d'un animal, oiseau, insecte ou reptile visible.
Raconte son histoire dans son environnement actuel visible sur la photo : ce qu'il fait, pourquoi il est là, ce qu'il ressent peut-être.
${SHARED_FIELDS}`;
  }

  if (mode === "traces") {
    return `${base}
MODE : SCAN D'INDICES
Tu analyses une photo d'INDICES laissés par un animal : empreintes, plumes, crottes, terrier, nid, toile d'araignée, traces de griffes, poils, plumes au sol, os, galeries, etc.
Déduis quel animal est passé. Raconte son passage comme une histoire vivante, par exemple : « Un renard roux est passé ici probablement cette nuit entre 2h et 4h du matin. Il cherchait de la nourriture. Si tu reviens demain matin à l'aube tu as 60 % de chances de le voir. »
Ajoute "indice_type" : type d'indice photographié (empreinte, plume, crottes, terrier, nid, toile…).
${SHARED_FIELDS.replace(
  '"identification_note"',
  '"indice_type":"Type d\'indice visible",\n  "identification_note"'
)}`;
  }

  if (mode === "sound") {
    return `${base}
MODE : RECONNAISSANCE DU CHANT
Tu analyses un SPECTROGRAMME d'un enregistrement audio de chant ou cri d'animal/oiseau.
Le spectrogramme représente les fréquences du son dans le temps (axe horizontal = temps, vertical = fréquence, couleur = intensité).
Identifie l'oiseau ou l'animal qui produit ce son. Décris le chant et donne des conseils concrets pour l'observer.
Ajoute "description_chant" : description du chant ou cri entendu.
${SHARED_FIELDS.replace(
  '"description"',
  '"description_chant":"Description du chant ou cri",\n  "description"'
)}`;
  }

  return base;
}

function buildUserPrompt(mode, meta = {}) {
  const now = new Date();
  const season = meta.season || "inconnue";
  const timeOfDay = meta.timeOfDay || now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const context = `Contexte : enregistré le ${now.toLocaleDateString("fr-FR")} à ${timeOfDay}, saison : ${season}.`;

  if (mode === "animal") {
    return `Analyse cette photo d'animal. ${context} Identifie l'animal et raconte son histoire dans cet environnement. JSON seul.`;
  }
  if (mode === "traces") {
    return `Analyse ces indices laissés par un animal. ${context} Déduis quel animal est passé et raconte son passage. JSON seul.`;
  }
  if (mode === "sound") {
    const duration = meta.durationSec ? ` Durée de l'enregistrement : ${meta.durationSec} secondes.` : "";
    return `Analyse ce spectrogramme d'un chant ou cri d'animal.${duration} ${context} Identifie l'espèce et raconte son histoire. JSON seul.`;
  }
  return "Analyse et réponds en JSON.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { image, mode = "animal", lang = "fr", durationSec, season } = req.body || {};

    if (!image || typeof image !== "string") {
      return res.status(400).json({ erreur: "Image manquante" });
    }

    const validModes = ["animal", "traces", "sound"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ erreur: "Mode invalide" });
    }

    const imageData = image.replace(/\s/g, "");
    const mediaType = imageMediaType(imageData);

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ erreur: "Clé API non configurée" });
    }

    const gate = await enforceScanQuotaForAnalyze(req, res);
    if (!gate) return;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: buildSystem(mode, lang),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
            { type: "text", text: buildUserPrompt(mode, { durationSec, season }) },
          ],
        },
      ],
    });

    if (!response.content?.length) {
      return res.status(500).json({ erreur: "Réponse vide du modèle" });
    }

    const text = response.content.map((i) => i.text || "").join("");
    const parsed = parseClaudeJson(text);

    if (!parsed) {
      console.error("[Wilder] analyze-animal non parsable:", text.slice(0, 500));
      return res.status(500).json({
        erreur: "Réponse illisible — réessayez",
      });
    }

    if (parsed.erreur) {
      return res.status(422).json(parsed);
    }

    let scanQuota = null;
    if (!gate.skipped) {
      const inc = await recordSuccessfulScanServer(gate.identity, parsed.nom || null);
      if (inc?.ok) {
        scanQuota = {
          count: inc.count,
          limit: inc.limit,
          isPremium: inc.isPremium,
          canScan: inc.canScan,
        };
      }
    }

    res.status(200).json(
      scanQuota ? { ...parsed, discovery_mode: mode, scanQuota } : { ...parsed, discovery_mode: mode }
    );
  } catch (error) {
    console.error("[Wilder] analyze-animal error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
