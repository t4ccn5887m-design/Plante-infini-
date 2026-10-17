import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { ANTHROPIC_ANALYSIS_MODEL } from "@/lib/aiModel";
import { isPermanentAuthUser } from "@/lib/authUser";

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: "12mb" } },
};

const SYSTEM = `Tu aides un particulier à préparer son premier rendez-vous avec un paysagiste. Le client LIRA ce texte dans un PDF.

Tu renvoies UNIQUEMENT un objet JSON valide (sans markdown), avec cette forme exacte :
{
  "profil": { "style": "1 phrase", "aime": "1 phrase", "priorites": ["3 ou 4 items courts"] },
  "points": [ { "titre": "1 à 3 mots", "texte": "1 phrase", "ids": ["ids des coups de cœur concernés"] } ],
  "pistes": [ "2 ou 3 phrases courtes pour le paysagiste uniquement (orientations d'aménagement, jamais visibles par le client)" ]
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

Règles pistes (2 à 3 phrases, tableau "pistes") :
- Réservé au paysagiste : orientations d'aménagement (zones, ombre, ambiance, familles de végétaux).
- Ne jamais décrire un plan, des distances, un placement précis, ni chiffrer.

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

  const pistes = Array.isArray(data.pistes)
    ? data.pistes
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return { profil: { style, aime, priorites }, points, pistes };
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
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Sevya] garden-analysis: missing Supabase anon env");
    return null;
  }

  const db = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !isPermanentAuthUser(data?.user)) return null;
  return { user: data.user, db };
}

async function callAnthropic(client, userContent) {
  return client.messages.create({
    model: ANTHROPIC_ANALYSIS_MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });
}

function isRetryableAnthropicError(error) {
  const status = error?.status || error?.statusCode;
  if (status === 429 || status === 529 || status >= 500) return true;
  const msg = String(error?.message || "");
  return /timeout|overloaded|rate/i.test(msg);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const resolved = await resolveUser(req);
    if (!resolved) {
      return res.status(401).json({ error: "Connexion requise pour l'analyse du dossier." });
    }
    const { db } = resolved;

    const { data: allowed, error: quotaError } = await db.rpc("consume_ai_quota", {
      p_limit: 10,
    });
    if (quotaError) {
      console.error("[Sevya] garden-analysis quota:", quotaError);
      return res.status(503).json({
        error: "unavailable",
        message: "Analyse indisponible, réessayez.",
      });
    }
    if (allowed !== true) {
      return res.status(429).json({
        error: "rate_limit",
        message: "Limite atteinte : 10 analyses par jour. Réessayez demain.",
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: "unavailable",
        message: "Analyse indisponible (configuration serveur).",
      });
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

    const photos = Array.isArray(body.terrainPhotos) ? body.terrainPhotos.slice(0, 2) : [];
    for (const b64 of photos) {
      if (typeof b64 === "string" && b64.length > 100) {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: b64.replace(/\s/g, "") },
        });
      }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    let response;
    try {
      response = await callAnthropic(client, userContent);
    } catch (firstError) {
      if (!isRetryableAnthropicError(firstError)) throw firstError;
      console.warn("[Sevya] garden-analysis: retry after", firstError?.message || firstError);
      response = await callAnthropic(client, userContent);
    }

    const text = response.content?.map((i) => i.text || "").join("") || "";
    const parsed = validateOutput(extractJson(text));
    if (!parsed) {
      console.error("[Sevya] garden-analysis parse failed:", text.slice(0, 400));
      return res.status(502).json({
        error: "invalid_response",
        message: "Analyse indisponible, réessayez.",
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("[Sevya] garden-analysis:", error);
    return res.status(503).json({
      error: "server_error",
      message: "Analyse indisponible, réessayez.",
    });
  }
}
