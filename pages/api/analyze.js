import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson } from "@/lib/parseAnalysis";
import { getScanCategoryHint, isValidScanCategory } from "@/lib/scanCategories";
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

const SYSTEM = `Tu es un botaniste et naturaliste expert de niveau mondial. Identifie avec une précision absolue ce que tu vois. Si tu n'es pas sûr à 90 %, dis-le clairement. Réponds en français.

RÈGLES STRICTES :
• Ne JAMAIS inventer. En cas de doute : mets null, ou explique l'incertitude dans identification_note.
• Photo floue, trop sombre, trop éloignée ou ne permettant pas d'identifier le sujet : {"erreur":"Photo trop floue ou illisible — prenez une nouvelle photo plus nette, de préférence en lumière naturelle et plus proche du sujet."}
• Photo vide/noire ou sans sujet naturel identifiable : {"erreur":"Aucune decouverte identifiable"}
• Refuse monuments, bâtiments et patrimoine bâti sans sujet naturel : {"erreur":"Aucune decouverte identifiable"}

MISSION : identifier le sujet naturel principal (plante, arbre, arbuste, animal, insecte, champignon, fleur, fruit, légume, oiseau, reptile, papillon, mauvaise herbe…).

MAUVAISES HERBES (potager, jardin, jardinière, parcelle cultivée) :
Si le sujet principal est une adventice / mauvaise herbe (pissenlit, ortie, mauvaise herbe, chiendent, bardane, morelle noire, plantain, rumex, etc.) :
• type = "mauvaise_herbe"
• nom = nom commun exact de la mauvaise herbe
• mauvaise_herbe = true
• mauvaise_herbe_nuisible : pourquoi elle est nuisible pour le potager (concurrence eau/nutriments, ombre, parasites, toxicité voisins, etc.)
• mauvaise_herbe_solution : meilleure solution naturelle pour s'en débarrasser (désherbage manuel, binette, paillage, couverture solaire…)
• mauvaise_herbe_astuces : astuces de grand-mère concrètes (vinaigre blanc dilué, sel en petite quantité ciblée, eau bouillante, purin d'ortie, bicarbonate, savon noir… — précise quand et comment)
• mauvaise_herbe_prevention : comment éviter qu'elle revienne (paillage, rotation, densité de plantation, arrosage ciblé, bordures…)
Sinon : mauvaise_herbe = false et tous les champs mauvaise_herbe_* = null.

CONTENU OBLIGATOIRE SELON LE TYPE :

Plantes, arbres, arbustes, fleurs, fruits, légumes :
🌿 Identification → nom (nom commun exact), nom_latin (binôme latin), famille (famille botanique)
📖 Description → caractéristiques précises de l'espèce et de ce qui est visible sur la photo
🕰️ Âge approximatif → age_approximatif : si c'est un arbre ou arbuste, estime l'âge selon le tronc et la taille visible ; null si non visible ou non arbre
📍 Où le trouver → habitat : régions, pays, altitude, environnement naturel
❤️ État de santé → etat_sante : diagnostic précis visible sur la photo ; soins_traitement : causes probables ET solutions concrètes ; null si plante saine
🌍 Le saviez-vous → fun_fact : un fait surprenant sur cette espèce ; null si incertain à 90 %
• guide_entretien et conseils_expert si pertinents pour cette espèce et cette photo ; null sinon

Animaux, oiseaux, reptiles, papillons :
• nom et nom_latin (nom exact, binôme latin)
• habitat : habitat naturel et répartition géographique
• comportement : comportements typiques
• alimentation : régime alimentaire
• espece_protegee : true/false/null (espèce protégée ou menacée)
• region_saison : meilleure saison pour l'observer en nature
• dangerosite si pertinente ; null sinon
• fun_fact : fait surprenant ; null si incertain

Insectes et champignons :
• Identification aussi précise que possible + infos_utiles (écologie, précautions, toxicité ou comestibilité si champignon)
• fun_fact si fait fiable à 90 %

JSON uniquement, sans markdown ni texte autour :
{
  "type":"plante|animal|champignon|fleur|insecte|oiseau|arbre|fruit|legume|reptile|papillon|mauvaise_herbe",
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
  "fun_fact":"Anecdote ou fait surprenant ; null si incertain",
  "mauvaise_herbe":true|false,
  "mauvaise_herbe_nuisible":"Pourquoi nuisible au potager ; null si pas une mauvaise herbe",
  "mauvaise_herbe_solution":"Meilleure solution naturelle ; null si pas une mauvaise herbe",
  "mauvaise_herbe_astuces":"Astuces de grand-mère (vinaigre, sel, eau bouillante, purin…) ; null si pas une mauvaise herbe",
  "mauvaise_herbe_prevention":"Comment éviter qu'elle revienne ; null si pas une mauvaise herbe"
}`;

const USER_PROMPT =
  "Analyse cette photo. Tu es botaniste et naturaliste expert de niveau mondial — identifie avec une précision absolue ce que tu vois. " +
  "Si tu n'es pas sûr à 90 %, dis-le clairement. Ne jamais inventer. " +
  "Plante ou arbre : identification (nom, latin, famille), description, âge approximatif si arbre visible, où le trouver, " +
  "état de santé avec causes et solutions, un fait surprenant. " +
  "Mauvaise herbe en potager : type mauvaise_herbe, nom, pourquoi nuisible, solution naturelle, astuces grand-mère, prévention. " +
  "Animal : nom, habitat, comportement, espèce protégée ou non, meilleure saison pour l'observer. " +
  "Si la photo est floue, renvoie l'erreur prévue. Remplis le JSON (null si non applicable). JSON seul, sans markdown.";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { image, category } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ erreur: "Image manquante" });
    }

    const categoryHint =
      category && isValidScanCategory(category) ? getScanCategoryHint(category) : null;
    const userPrompt = categoryHint
      ? `${USER_PROMPT}\n\nContexte utilisateur : ${categoryHint}`
      : USER_PROMPT;

    const imageData = image.replace(/\s/g, "");
    const mediaType = imageMediaType(imageData);

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ erreur: "Clé API non configurée" });
    }

    const gate = await enforceScanQuotaForAnalyze(req, res);
    if (!gate) return;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
            { type: "text", text: userPrompt },
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

    let scanQuota = null;
    if (!gate.skipped) {
      const inc = await recordSuccessfulScanServer(gate.identity);
      if (inc?.ok) {
        scanQuota = {
          count: inc.count,
          limit: inc.limit,
          isPremium: inc.isPremium,
          canScan: inc.canScan,
        };
      }
    }

    res.status(200).json(scanQuota ? { ...parsed, scanQuota } : parsed);
  } catch (error) {
    console.error("[Wilder] analyze error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
