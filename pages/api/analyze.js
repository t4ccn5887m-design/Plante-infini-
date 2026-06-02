export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { image } = req.body;

    const system =
      'Tu es un naturaliste expert (botanique, zoologie, entomologie, ornithologie, mycologie). ' +
      "Identifie l'organisme visible sur la photo : plante, animal, insecte, oiseau ou champignon. " +
      "Reponds UNIQUEMENT en JSON valide sans markdown : " +
      '{"nom":"Nom commun en francais","nom_latin":"Nom scientifique","type":"plante|animal|insecte|oiseau|champignon",' +
      '"description":"Description complete et accessible (4-6 phrases)",' +
      '"habitat":"Habitat naturel typique",' +
      '"rarete":"commun|peu_commun|rare|tres_rare"}. ' +
      'Si rien de reconnaissable ou photo floue/vide : {"erreur":"Aucun organisme identifiable"}';

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
                text: "Identifie cet organisme vivant (plante, animal, insecte, oiseau ou champignon) avec precision.",
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!data.content || data.content.length === 0) {
      return res.status(500).json({ erreur: "Reponse vide: " + JSON.stringify(data) });
    }
    const text = data.content.map((i) => i.text || "").join("");
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
