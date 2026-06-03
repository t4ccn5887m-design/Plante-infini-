import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson } from "@/lib/parseAnalysis";
import { supabase } from "@/lib/supabase";

function extensionForMediaType(mediaType) {
  if (mediaType === "image/png") return "png";
  if (mediaType === "image/webp") return "webp";
  if (mediaType === "image/gif") return "gif";
  return "jpg";
}

async function uploadDiscoveryImage(base64Data, mediaType) {
  if (!supabase) throw new Error("Supabase non configuré");

  const ext = extensionForMediaType(mediaType);
  const path = `${Date.now()}-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(base64Data, "base64");

  const { error } = await supabase.storage.from("images").upload(path, buffer, {
    contentType: mediaType,
    upsert: false,
  });
  if (error) {
    console.error("[Wilder] Supabase upload failed:", {
      path,
      mediaType,
      bufferSize: buffer.length,
      message: error.message,
      error: error.error,
      statusCode: error.statusCode,
      name: error.name,
      cause: error.cause,
      full: error,
    });
    throw error;
  }

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

function imageMediaType(base64) {
  const head = base64.replace(/\s/g, "").slice(0, 12);
  if (head.startsWith("iVBOR")) return "image/png";
  if (head.startsWith("/9j/")) return "image/jpeg";
  if (head.startsWith("R0lGOD")) return "image/gif";
  if (head.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const SYSTEM = `Expert naturaliste (botanique, zoologie, entomologie, ornithologie, mycologie).

TON : français, pédagogique, bienveillant.

MISSION : identifier le sujet naturel principal (plantes, animaux, insectes, champignons, arbres, fleurs…). Même photo moyenne : meilleure hypothèse plausible ; précise l'incertitude dans identification_note si besoin.

Refuse monuments, bâtiments et patrimoine bâti sans sujet naturel : {"erreur":"Aucune decouverte identifiable"}.

Selon le type :
• Tous : nom commun, nom_latin, famille.
• Plante/arbre/fleur/fruit/légume : etat_sante (symptômes visibles), soins_traitement si malade, guide_entretien, conseils_expert basés sur la photo.
• Animal/oiseau/reptile/papillon : habitat, comportement, dangerosite si pertinent.
• Insecte/champignon : infos_utiles (écologie, précautions, toxicité/comestibilité).

JSON uniquement, sans markdown :
{
  "type":"plante|animal|champignon|fleur|insecte|oiseau|arbre|fruit|legume|reptile|papillon",
  "nom":"Nom commun",
  "nom_latin":"Binôme ou null",
  "famille":"Famille ou null",
  "description":"3 à 6 phrases : traits visibles, intérêt écologique",
  "identification_note":"Certitude si partielle ; sinon null",
  "etat_sante":"Diagnostic plante ; null sinon",
  "soins_traitement":"Solutions si plante malade ; null sinon",
  "guide_entretien":"Entretien plante ; null sinon",
  "conseils_expert":"Conseils photo ; null sinon",
  "habitat":"Habitat naturel",
  "comportement":"Animal ; null sinon",
  "dangerosite":"Risques ; null sinon",
  "infos_utiles":"Champignon/insecte ; null sinon",
  "rarete":"commun|peu_commun|rare|tres_rare",
  "fun_fact":"Fait amusant animal/champignon ; null sinon"
}

Refuse si photo vide/noire : {"erreur":"Aucune decouverte identifiable"}`;

const USER_PROMPT =
  "Identifie le sujet naturel principal. Remplis le JSON (null si non applicable). " +
  "Plante : santé, soins, entretien, conseils selon la photo. " +
  "Animal : espèce, habitat, comportement, danger. " +
  "Insecte/champignon : identification et infos utiles. " +
  "Français, ton bienveillant. JSON seul.";

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
      max_tokens: 800,
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

    let photo;
    try {
      photo = await uploadDiscoveryImage(imageData, mediaType);
    } catch (uploadError) {
      console.error("[Wilder] Storage upload catch — error object:", uploadError);
      console.error("[Wilder] Storage upload catch — details:", {
        message: uploadError?.message,
        error: uploadError?.error,
        statusCode: uploadError?.statusCode,
        name: uploadError?.name,
        stack: uploadError?.stack,
        cause: uploadError?.cause,
        keys: uploadError ? Object.getOwnPropertyNames(uploadError) : [],
        json: (() => {
          try {
            return JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError ?? {}));
          } catch {
            return String(uploadError);
          }
        })(),
      });
      return res.status(500).json({
        erreur: "Impossible d'enregistrer la photo — vérifiez le bucket Supabase « images »",
      });
    }

    res.status(200).json({ ...parsed, photo });
  } catch (error) {
    console.error("[Wilder] analyze error:", error);
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
