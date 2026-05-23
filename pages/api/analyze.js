export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { image } = req.body;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Tu es un botaniste expert. Réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks) : {"nom":"Nom commun","nom_latin":"Nom scientifique","famille":"Famille botanique","description":"Description en 2-3 phrases","caracteristiques":["car1","car2","car3"],"entretien":{"arrosage":"...","lumiere":"...","sol":"...","temperature":"..."},"sante":{"etat":"bon","commentaire":"..."},"conseils":"Un conseil pratique","utilisation":["util1","util2"]} "etat" doit être exactement "bon", "attention", ou "mauvais". Si pas une plante : {"erreur": "Ce n'est pas une plante"}`,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: "Analyse cette plante." }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = data.content.map(i => i.text || "").join("");
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  res.status(200).json(parsed);
}
