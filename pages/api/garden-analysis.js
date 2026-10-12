import Anthropic from "@anthropic-ai/sdk";
import { isPermanentAuthUser } from "@/lib/authUser";
import {
  checkGardenAnalysisRateLimit,
  recordGardenAnalysisRateLimit,
} from "@/lib/gardenAnalysisRateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

const SYSTEM = `Tu aides un particulier à préparer son premier rendez-vous avec un paysagiste. Le client LIRA ce texte dans un PDF.

Tu renvoies UNIQUEMENT un objet JSON valide (sans markdown), avec cette forme exacte :
{
  "profil": { "style": "1 phrase", "aime": "1 phrase", "priorites": ["3 ou 4 items courts"] },
  "points": [ { "titre": "1 à 3 mots", "texte": "1 phrase", "ids": ["ids des coups de cœur concernés"] } ]
}

Règles profil :
- Vocabulaire paysagiste, positif, déduit des choix (pas un inventaire).
- style : une phrase de synthèse d'ambiance et de style de jardin.
- aime : ce que ses choix révèlent sur ses goûts (matières, végétaux, usages).
- priorites : 3 ou 4 puces courtes (max 8 mots chacune).

Règles points (0 à 5 entrées) :
- Uniquement vraies contradictions ou contraintes : budget vs envies, entretien vs envies, sécurité (eau + enfants), plante peu adaptée au climat local (rusticité vs commune), plante invasive ou qui se ressème, éléments visibles sur les photos qui changent le projet (piscine, pente, travaux…).
- Ton jamais culpabilisant, jamais « vous vous trompez ». Formulations ouvertes : « à voir ensemble », « votre paysagiste pourra vous proposer… ».
- Chaque point doit référencer les ids des coups de cœur concernés dans "ids" (tableau, peut être vide si point général).
- Si rien de pertinent : "points": [].

INTERDIT : plan, placement, distances, quantités, prix chiffrés précis, affirmer qu'une plante est sans danger. N'invente rien hors des données fournies.`;

function validateOutput(data) {
  if (!data || typeof data !== "object") return null;
  const style = String(data.profil?.style || "").trim();
  const aime = String(data.profil?.aime || "").trim();
  if (!style || !aime) return null;

  const priorites = Array.isArray(data.profil?.priorites)
    ? data.profil.priorites.map((p) => String(p).trim()).filter(Boolean).slice(0, 4)
    : [];
  if (priorites.length < 1) return null;

  const points = Array.isArray(data.points)
    ? data.points
        .slice(0, 5)
        .map((p) => ({
          titre: String(p.titre || "").trim().slice(0, 40),
          texte: String(p.texte || "").trim().slice(0, 400),
          ids: Array.isArray(p.ids) ? p.ids.map(String).slice(0, 12) : [],
        }))
        .filter((p) => p.titre && p.texte)
    : [];

  return { profil: { style, aime, priorites }, points };
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function resolveUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ") || !supabaseAdmin) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !isPermanentAuthUser(data?.user)) return null;
  return data.user;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ error: "Connexion requise pour l'analyse du dossier." });
    }

    const rate = checkGardenAnalysisRateLimit(user.id);
    if (!rate.ok) {
      return res.status(429).json({
        error: "rate_limit",
        message: "Limite atteinte : 10 analyses par jour. Réessayez demain.",
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Service indisponible." });
    }

    const body = req.body || {};
    const userContent = [
      {
        type: "text",
        text: `Analyse ce dossier jardin et produis le JSON demandé.\n\nDonnées :\n${JSON.stringify(
          {
            commune: body.commune,
            codePostal: body.codePostal,
            ambiance: body.ambiance,
            intention: body.intention,
            coupsDeCoeur: body.coupsDeCoeur,
            terrain: body.terrain,
            budget: body.budget,
          },
          null,
          2
        )}`,
      },
    ];

    const photos = Array.isArray(body.terrainPhotos) ? body.terrainPhotos.slice(0, 3) : [];
    for (const b64 of photos) {
      if (typeof b64 === "string" && b64.length > 100) {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: b64.replace(/\s/g, "") },
        });
      }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    const text = response.content?.map((i) => i.text || "").join("") || "";
    const parsed = validateOutput(extractJson(text));
    if (!parsed) {
      console.error("[Sevya] garden-analysis parse failed:", text.slice(0, 400));
      return res.status(500).json({ error: "Réponse IA invalide." });
    }

    recordGardenAnalysisRateLimit(user.id);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error("[Sevya] garden-analysis:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
