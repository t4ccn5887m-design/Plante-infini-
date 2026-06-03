import { parseClaudeJson } from "@/lib/parseAnalysis";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ erreur: "Image manquante" });
    }

    const system =
      "Tu es un expert naturaliste et patrimonial (botanique, zoologie, entomologie, ornithologie, mycologie, herpetologie, " +
      "géologie, paysages, histoire, architecture). " +
      "MISSION : identifier le sujet principal visible sur la photo, même si la qualité est moyenne (flou, contre-jour, angle difficile, partiellement caché). " +
      "Fais toujours ta MEILLEURE hypothèse plausible (espèce, genre ou famille) plutôt que de refuser : précise le niveau d'incertitude dans la description. " +
      "Accepte aussi : mousse, lichen, algue, champignon immature, jeune pousse, trace/animal partiel, coquille, plume, nid, " +
      "insecte petit ou lointain, arbre/feuille/bark, rocher remarquable, cascade, rivière, lac, falaise, prairie, " +
      "monument, église, château, pont, statue, ruine, site naturel. " +
      "Observe couleurs, textures, formes, nombre de pattes/ailes, bec, écailles, chapeau de champignon, feuilles, etc. " +
      "Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte avant/après. " +
      'Format strict : {"type":"plante|animal|champignon|fleur|insecte|oiseau|arbre|fruit|legume|reptile|papillon|monument|architecture|site_naturel|curiosite",' +
      '"nom":"Nom en français",' +
      '"nom_latin":"Nom scientifique latin si nature ; null si patrimoine",' +
      '"description":"4-6 phrases accessibles ; mentionne si identification approximative",' +
      '"habitat":"Habitat ou contexte géographique typique",' +
      '"rarete":"commun|peu_commun|rare|tres_rare",' +
      '"etat_sante":"Si plante/arbre visible ; sinon null",' +
      '"histoire":"Si patrimoine ; sinon null",' +
      '"date_construction":"Si patrimoine ; sinon null",' +
      '"style_architectural":"Si monument/architecture ; sinon null",' +
      '"anecdotes":"Si patrimoine ; sinon null",' +
      '"fun_fact":"Fait amusant si animal|oiseau|insecte|papillon|reptile ; sinon null"}. ' +
      'Refuse SEULEMENT si la photo est totalement noire, vide ou sans aucun sujet (pas de ciel seul) : {"erreur":"Aucune decouverte identifiable"}';

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ erreur: "Clé API non configurée" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1200,
        system,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
              {
                type: "text",
                text:
                  "Analyse cette photo prise en extérieur. Identifie le sujet principal (nature vivante ou patrimoine/site). " +
                  "Même photo floue, zoomée, de loin ou en angle : propose l'identification la plus probable. " +
                  "Remplis tous les champs JSON du format demandé. " +
                  "Nature : nom commun, nom latin si possible, description, habitat, rareté, état de santé si végétal. " +
                  "Patrimoine : histoire, date, style, anecdotes. " +
                  "Animaux/oiseaux/insectes/reptiles/papillons : ajoute fun_fact. " +
                  "JSON uniquement, pas de markdown.",
              },
            ],
          },
        ],
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("[Wilder] Réponse Anthropic non-JSON:", responseText.slice(0, 300));
      return res.status(502).json({ erreur: "Réponse API invalide — réessayez" });
    }

    if (!response.ok) {
      const msg = data.error?.message || data.erreur || "Erreur API Anthropic";
      return res.status(response.status >= 500 ? 502 : 400).json({ erreur: msg });
    }

    if (!data.content || data.content.length === 0) {
      return res.status(500).json({ erreur: "Réponse vide du modèle" });
    }

    const text = data.content.map((i) => i.text || "").join("");
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
