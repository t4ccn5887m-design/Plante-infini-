export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { image, mode = "single" } = req.body;

    const isPotager = mode === "potager";

    const system = isPotager
      ? 'Tu es un botaniste expert. Identifie TOUTES les plantes visibles dans cette photo (potager, jardin, balcon, etc.). Reponds UNIQUEMENT en JSON valide sans markdown : {"plantes":[{"nom":"Nom commun","nom_latin":"Nom scientifique","description":"Courte description de la plante"}]}. Si aucune plante detectee : {"erreur":"Aucune plante detectee"}'
      : 'Tu es un botaniste expert. Reponds UNIQUEMENT en JSON valide sans markdown : {"nom":"Nom commun","nom_latin":"Nom scientifique","famille":"Famille","description":"Description","caracteristiques":["c1","c2"],"entretien":{"arrosage":"...","lumiere":"...","sol":"...","temperature":"..."},"sante":{"etat":"bon","commentaire":"..."},"conseils":"Conseil","utilisation":["u1"]}. Si pas une plante : {"erreur":"Ce n est pas une plante"}';

    const userText = isPotager
      ? "Liste toutes les plantes visibles dans cette photo avec leur nom et une courte description pour chacune."
      : "Analyse cette plante.";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: isPotager ? 2000 : 1000,
        system,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
            { type: "text", text: userText }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!data.content || data.content.length === 0) {
      return res.status(500).json({ erreur: "Reponse vide: " + JSON.stringify(data) });
    }
    const text = data.content.map(i => i.text || "").join("");
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur: " + error.message });
  }
}
