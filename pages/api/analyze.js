export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { image } = req.body;

    const system =
      "Tu es un naturaliste expert (botanique, zoologie, entomologie, ornithologie, mycologie, herpetologie). " +
      "Identifie l'organisme vivant visible sur la photo avec la plus grande precision possible. " +
      "Observe attentivement : forme des feuilles, couleur, texture, nombre de pattes/ailes, bec, écailles, chapeau de champignon, etc. " +
      "Si plusieurs especes sont possibles, choisis la plus probable et mentionne l'incertitude dans la description. " +
      "Tu DOIS toujours fournir : la categorie de l'etre vivant, le nom commun en francais, le nom scientifique (binome latin correct), " +
      "une description detaillee et accessible, l'habitat naturel typique, et le niveau de rarete dans la region concernee. " +
      "Si c'est une plante (plante, fleur, arbre, fruit ou legume), ajoute aussi son etat de sante visible sur la photo. " +
      "Reponds UNIQUEMENT en JSON valide sans markdown : " +
      '{"type":"plante|animal|champignon|fleur|insecte|oiseau|arbre|fruit|legume|reptile|papillon",' +
      '"nom":"Nom commun en francais",' +
      '"nom_latin":"Nom scientifique (binome latin)",' +
      '"description":"Description complete et accessible (4-6 phrases)",' +
      '"habitat":"Habitat naturel typique",' +
      '"rarete":"commun|peu_commun|rare|tres_rare",' +
      '"etat_sante":"Etat de sante visible (obligatoire si type plante/fleur/arbre/fruit/legume ; sinon null)"}. ' +
      'Si rien de reconnaissable ou photo floue/vide : {"erreur":"Aucun organisme identifiable"}';

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
                  "Identifie cet etre vivant avec precision. Fournis obligatoirement : " +
                  "la categorie, le nom commun, le nom scientifique, la description, l'habitat, " +
                  "le niveau de rarete, et si c'est une plante son etat de sante.",
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || data.erreur || "Erreur API Anthropic";
      return res.status(response.status >= 500 ? 502 : 400).json({ erreur: msg });
    }

    if (!data.content || data.content.length === 0) {
      return res.status(500).json({ erreur: "Réponse vide du modèle" });
    }

    const text = data.content.map((i) => i.text || "").join("");
    const cleaned = text.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ erreur: "Réponse illisible — réessayez avec une photo plus nette" });
    }

    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
