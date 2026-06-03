import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "No image" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
      { type: "text", text: "Identifie cette plante avec précision. Réponds en français avec : nom commun, nom latin, famille botanique, état de santé détaillé, guide d'entretien complet (arrosage, lumière, température, sol), et conseils d'expert. Sois très détaillé." }
    ]}]
  });

  const result = response.content[0].text;
  await supabase.from("analyses").insert([{ result, created_at: new Date() }]);
  res.status(200).json({ result });
}
