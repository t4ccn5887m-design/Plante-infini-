import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson } from "@/lib/parseAnalysis";

function imageMediaType(base64) {
  const head = base64.replace(/\s/g, "").slice(0, 12);
  if (head.startsWith("iVBOR")) return "image/png";
  if (head.startsWith("/9j/")) return "image/jpeg";
  if (head.startsWith("R0lGOD")) return "image/gif";
  if (head.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const SYSTEM = `Tu es un expert naturaliste (botanique, zoologie, entomologie, ornithologie, mycologie).

RÈGLES STRICTES :
• Réponds UNIQUEMENT en français, ton pédagogique et accessible à tous (comme à un curieux de 12 ans, sans jargon inutile).
• Ne JAMAIS inventer une information si tu n'es pas sûr à au moins 90 %. En cas de doute : mets null, ou explique l'incertitude dans identification_note.
• Photo floue, trop sombre, trop éloignée ou ne permettant pas d'identifier le sujet : {"erreur":"Photo trop floue ou illisible — prenez une nouvelle photo plus nette, de préférence en lumière naturelle et plus proche du sujet."}
• Photo vide/noire ou sans sujet naturel identifiable : {"erreur":"Aucune decouverte identifiable"}
• Refuse monuments, bâtiments et patrimoine bâti sans sujet naturel : {"erreur":"Aucune decouverte identifiable"}

MISSION : identifier avec la plus grande précision possible le sujet naturel principal (plante, arbre, arbuste, animal, insecte, champignon, fleur, fruit, légume, oiseau, reptile, papillon…).

CONTENU OBLIGATOIRE SELON LE TYPE :

Plantes, arbres, arbustes, fleurs, fruits, légumes :
1. nom : nom commun exact (le plus précis possible, pas un terme générique si tu peux être plus fin)
2. nom_latin : binôme latin exact, ou null si incertain à 90 %
3. famille : famille botanique, ou null si incertain
4. description : 4 à 8 phrases — description précise de l'espèce (port, feuilles, fleurs, fruits visibles sur la photo, traits distinctifs observables)
5. age_approximatif : pour arbre/arbuste uniquement — estimation d'âge (jeune, adulte, vieux, fourchette en années) basée sur la taille, l'écorce, le diamètre du tronc visible ; null si non visible ou non arbre
6. habitat : où le trouver — régions, pays, altitude, milieux naturels (forêt, prairie, littoral, montagne…)
7. etat_sante : diagnostic détaillé visible sur la photo (symptômes, stress, maladies probables) ; null si non applicable
8. soins_traitement : causes probables des problèmes ET solutions concrètes et réalisables ; null si plante saine ou non visible
9. guide_entretien : entretien adapté à cette espèce ; null si non pertinent
10. conseils_expert : conseils pratiques liés à ce que montre la photo ; null si rien de spécifique
11. fun_fact : une anecdote ou un fait surprenant sur cette espèce ; null si tu n'en es pas sûr à 90 %

Animaux, oiseaux, reptiles, papillons :
1. nom et nom_latin (mêmes règles de certitude)
2. habitat : habitat naturel et répartition géographique (régions, pays, milieux)
3. alimentation : régime et mode d'alimentation
4. comportement : comportements typiques observables ou connus pour l'espèce
5. espece_protegee : true si espèce protégée ou menacée (France/UE/monde selon ce que tu connais avec certitude), false si clairement non protégée, null si incertain
6. region_saison : meilleure saison ET meilleures régions pour l'observer en nature
7. dangerosite : risques pour l'humain si pertinents ; null sinon
8. fun_fact : anecdote ou fait surprenant ; null si incertain

Insectes et champignons :
• Identification aussi précise que possible + infos_utiles (écologie, précautions, toxicité ou comestibilité si champignon)
• fun_fact si fait fiable à 90 %

JSON uniquement, sans markdown ni texte autour :
{
  "type":"plante|animal|champignon|fleur|insecte|oiseau|arbre|fruit|legume|reptile|papillon",
  "nom":"Nom commun exact",
  "nom_latin":"Binôme latin ou null",
  "famille":"Famille botanique ou null",
  "description":"Description précise de l'espèce et de ce qui est visible",
  "identification_note":"Limites de l'identification ou incertitude ; null si identification très confiante",
  "age_approximatif":"Âge estimé arbre/arbuste ; null sinon",
  "habitat":"Où le trouver : régions, pays, altitude, environnement naturel",
  "etat_sante":"État de santé détaillé (plantes) ; null sinon",
  "soins_traitement":"Causes probables + solutions concrètes ; null sinon",
  "guide_entretien":"Entretien de l'espèce ; null sinon",
  "conseils_expert":"Conseils liés à la photo ; null sinon",
  "alimentation":"Régime alimentaire ; null sinon",
  "comportement":"Comportement ; null sinon",
  "dangerosite":"Risques ; null sinon",
  "espece_protegee":true|false|null,
  "region_saison":"Meilleure saison et régions pour observer ; null sinon",
  "infos_utiles":"Insecte/champignon ; null sinon",
  "rarete":"commun|peu_commun|rare|tres_rare",
  "fun_fact":"Anecdote ou fait surprenant ; null si incertain"
}`;

const USER_PROMPT =
  "Analyse cette photo et identifie le sujet naturel principal avec la plus grande précision possible. " +
  "Respecte toutes les règles du système : français pédagogique, ne rien inventer sous 90 % de certitude, " +
  "refuser si la photo est trop floue. " +
  "Plante/arbre/arbuste : nom exact, latin, famille, description, âge si arbre visible, où le trouver, " +
  "santé détaillée avec causes et solutions, anecdote surprenante. " +
  "Animal : nom, latin, habitat et répartition, comportement, alimentation, protection, meilleure saison/région pour l'observer. " +
  "Remplis le JSON (null si non applicable). JSON seul, sans markdown.";

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
      max_tokens: 1400,
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

    res.status(200).json(parsed);
  } catch (error) {
    console.error("[Wilder] analyze error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
