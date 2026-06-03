import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson } from "@/lib/parseAnalysis";
import { supabase } from "@/lib/supabase";

function imageMediaType(base64) {
  const head = base64.replace(/\s/g, "").slice(0, 12);
  if (head.startsWith("iVBOR")) return "image/png";
  if (head.startsWith("/9j/")) return "image/jpeg";
  if (head.startsWith("R0lGOD")) return "image/gif";
  if (head.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const SYSTEM = `Tu es un expert naturaliste, botaniste et patrimonial (botanique, zoologie, entomologie, ornithologie, mycologie, herpetologie, géologie, paysages, histoire, architecture).

TON : français, pédagogique, bienveillant et encourageant — comme un guide de terrain passionné qui explique sans jargon inutile.

MISSION : identifier le sujet principal visible sur la photo, même si la qualité est moyenne (flou, contre-jour, angle difficile, partiellement caché). Fais toujours ta MEILLEURE hypothèse plausible (espèce, genre ou famille) plutôt que de refuser ; indique clairement le niveau d'incertitude dans identification_note si besoin.

Accepte aussi : mousse, lichen, algue, champignon immature, jeune pousse, trace/animal partiel, coquille, plume, nid, insecte petit ou lointain, arbre/feuille/écorce, rocher, cascade, monument, église, château, site naturel, etc.

ANALYSE DÉTAILLÉE SELON LE TYPE :

• Identification (tous sujets nature) : nom commun précis, nom latin (genre + espèce si possible), famille taxonomique.
• Plante, arbre, fleur, fruit, légume : état de santé détaillé (symptômes visibles sur la photo : feuilles, tiges, racines visibles, couleur, flétrissement, taches, déformations) ; maladies probables, carences nutritives, parasites ou nuisibles visibles ; solutions concrètes et réalisables si la plante semble malade ou stressée ; guide d'entretien complet (arrosage, lumière, type de sol/substrat, température, humidité, taille/élagage, saisonnalité) ; conseils_expert personnalisés en t'appuyant sur ce que tu vois réellement sur l'image (pas de conseils génériques déconnectés de la photo).
• Animal, oiseau, reptile, papillon : espèce ou groupe le plus probable ; habitat naturel ; comportement typique ; dangerosité pour l'humain (morsure, venin, allergie, distance de sécurité) si pertinent.
• Insecte, champignon : identification la plus fine possible ; infos_utiles (rôle écologique, saison, comestibilité/toxicité pour champignons, précautions, ne pas cueillir sans certitude, etc.).
• Patrimoine (monument, architecture, site_naturel, curiosite) : histoire, date, style, anecdotes.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte avant/après.

Format strict :
{
  "type":"plante|animal|champignon|fleur|insecte|oiseau|arbre|fruit|legume|reptile|papillon|monument|architecture|site_naturel|curiosite",
  "nom":"Nom commun en français",
  "nom_latin":"Nom scientifique latin (binôme si possible) ; null si patrimoine ou inconnu",
  "famille":"Famille taxonomique ou groupe (ex. Rosaceae, Cervidae) ; null si patrimoine ou imprécis",
  "description":"4 à 8 phrases : présentation claire, traits visibles observés sur la photo, intérêt écologique ou culturel",
  "identification_note":"Phrase sur le degré de certitude si identification partielle ; sinon null",
  "etat_sante":"Pour plante/arbre/fleur/fruit/légume : diagnostic santé détaillé (symptômes, maladies, carences, parasites visibles) ; null sinon",
  "soins_traitement":"Pour plante malade ou en mauvaise santé : solutions concrètes (actions immédiates, traitements doux, prévention) ; null si plante saine ou non végétal",
  "guide_entretien":"Pour plante/arbre/fleur/fruit/légume : guide complet arrosage, lumière, sol, température, taille ; null sinon",
  "conseils_expert":"2 à 5 phrases de conseils personnalisés selon la photo ; null si non pertinent",
  "habitat":"Habitat naturel, contexte géographique ou lieu typique",
  "comportement":"Pour animal|oiseau|reptile|insecte|papillon : comportement observé ou typique ; null sinon",
  "dangerosite":"Pour animal|oiseau|reptile|insecte si pertinent : risques et précautions ; null sinon",
  "infos_utiles":"Pour champignon|insecte : informations pratiques (comestibilité, toxicité, saison, précautions) ; null sinon",
  "rarete":"commun|peu_commun|rare|tres_rare",
  "histoire":"Si patrimoine ; sinon null",
  "date_construction":"Si patrimoine ; sinon null",
  "style_architectural":"Si monument/architecture ; sinon null",
  "anecdotes":"Si patrimoine ; sinon null",
  "fun_fact":"Fait amusant ou surprenant si animal|oiseau|insecte|papillon|reptile|champignon ; sinon null"
}

Refuse SEULEMENT si la photo est totalement noire, vide ou sans aucun sujet identifiable : {"erreur":"Aucune decouverte identifiable"}`;

const USER_PROMPT =
  "Analyse cette photo prise en extérieur avec le maximum de précision et de détails utiles.\n\n" +
  "1) Identifie le sujet principal : nom commun, nom latin, famille.\n" +
  "2) Si c'est une plante (plante, arbre, fleur, fruit, légume) : décris l'état de santé en détail (maladies visibles, carences, parasites), propose des solutions concrètes si elle est malade, et rédige un guide d'entretien complet (arrosage, lumière, sol, température, taille). Ajoute des conseils d'expert personnalisés basés sur ce que tu vois sur la photo.\n" +
  "3) Si c'est un animal (animal, oiseau, reptile, papillon) : précise l'espèce, l'habitat, le comportement et la dangerosité éventuelle.\n" +
  "4) Si c'est un insecte ou un champignon : identification fine et informations utiles (écologie, précautions, comestibilité/toxicité pour les champignons).\n" +
  "5) Si c'est du patrimoine : histoire, dates, style, anecdotes.\n\n" +
  "Ton pédagogique et bienveillant, en français. Même photo floue ou de loin : propose l'hypothèse la plus probable et note l'incertitude.\n" +
  "Remplis tous les champs JSON du format demandé (null pour les champs non applicables). JSON uniquement, pas de markdown.";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { image } = req.body;

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
      max_tokens: 3000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
            { type: "text", text: USER_PROMPT },
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
      console.error("[Wilder] Texte brut non parsable:", text.slice(0, 500));
      return res.status(500).json({
        erreur: "Réponse illisible — réessayez (la photo a peut-être été identifiée mais mal formatée)",
      });
    }

    if (parsed.erreur) {
      return res.status(422).json(parsed);
    }

    const { error: logError } = await supabase
      .from("analyses")
      .insert([{ result: text, created_at: new Date().toISOString() }]);
    if (logError) console.warn("[Wilder] Supabase log:", logError.message);

    res.status(200).json(parsed);
  } catch (error) {
    console.error("[Wilder] analyze error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
