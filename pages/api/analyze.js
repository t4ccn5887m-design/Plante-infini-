export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { image } = req.body;

    const system =
      "Tu es un expert en nature ET en patrimoine (botanique, zoologie, entomologie, ornithologie, mycologie, herpetologie, " +
      "histoire, architecture, sites naturels remarquables). " +
      "Identifie ce qui est visible sur la photo : soit un etre vivant (plante, animal, insecte, etc.), " +
      "soit un site ou monument (chateau, eglise, cathedrale, ruine, tour, pont, phare, moulin, abbaye, " +
      "cascade, grotte, falaise, lac, riviere, fontaine, statue, fresque, calvaire). " +
      "Pour la nature : observe forme des feuilles, couleur, texture, nombre de pattes/ailes, bec, ecailles, chapeau de champignon, etc. " +
      "Pour le patrimoine : identifie le monument ou site, son style, son epoque et son contexte historique. " +
      "Si plusieurs possibilites, choisis la plus probable et mentionne l'incertitude dans la description. " +
      "Reponds UNIQUEMENT en JSON valide sans markdown : " +
      '{"type":"plante|animal|champignon|fleur|insecte|oiseau|arbre|fruit|legume|reptile|papillon|monument|architecture|site_naturel|curiosite",' +
      '"nom":"Nom en francais (espece ou monument/site)",' +
      '"nom_latin":"Nom scientifique latin si nature ; null si patrimoine",' +
      '"description":"Description complete et accessible (4-6 phrases)",' +
      '"habitat":"Habitat naturel si nature ; contexte geographique si site",' +
      '"rarete":"commun|peu_commun|rare|tres_rare",' +
      '"etat_sante":"Etat de sante visible si plante/fleur/arbre/fruit/legume ; sinon null",' +
      '"histoire":"Histoire du monument ou site (obligatoire si patrimoine ; null si nature)",' +
      '"date_construction":"Date ou epoque de construction (ex. XIIe siecle, 1892 ; null si nature)",' +
      '"style_architectural":"Style architectural ou type de site (obligatoire si monument/architecture ; null si nature)",' +
      '"anecdotes":"Anecdotes ou faits interessants (obligatoire si patrimoine ; null si nature)",' +
      '"fun_fact":"Un fait amusant et surprenant sur l\'espece (1-2 phrases, ton ludique pour enfants et adultes ; obligatoire si animal|oiseau|insecte|papillon|reptile ; null sinon)"}. ' +
      'Types patrimoine : monument (chateaux, eglises, cathedrales, ruines, tours), ' +
      'architecture (ponts, phares, moulins, abbayes), site_naturel (cascades, grottes, falaises, lacs, rivieres), ' +
      'curiosite (fontaines, statues, fresques, calvaires). ' +
      'Si rien de reconnaissable ou photo floue/vide : {"erreur":"Aucune decouverte identifiable"}';

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
                  "Identifie ce qui est visible sur cette photo : etre vivant (nature) ou monument/site (patrimoine). " +
                  "Fournis obligatoirement : la categorie, le nom, la description, l'habitat ou contexte, le niveau de rarete. " +
                  "Si nature : nom scientifique et etat de sante si plante. " +
                  "Si patrimoine : histoire, date de construction, style architectural et anecdotes. " +
                  "Si animal, oiseau, insecte, papillon ou reptile : ajoute un fun_fact surprenant et amusant.",
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
