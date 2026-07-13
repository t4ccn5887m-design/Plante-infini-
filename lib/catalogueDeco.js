/**
 * Catalogue déco — données mock (Option C).
 * Structure = modèle de la future table Supabase `catalogue_deco`.
 */

export const DECO_FAMILLES = ["mobilier", "poterie", "luminaire", "objets"];

export const DECO_STYLE_TAGS = ["zen", "contemporain", "naturel", "mediterraneen"];

/** Préfixe client_id analyses — distinct du végétal et du minéral. */
export function catalogueDecoClientId(articleId) {
  return `catalogue-deco:${articleId}`;
}

/** Payload JSON stocké dans analyses.result pour un article déco. */
export function decoToAnalysisResult(article) {
  return {
    id: catalogueDecoClientId(article.id),
    catalogue_deco_id: article.id,
    source: "catalogue_deco",
    kind: "deco",
    type: "deco",
    nom: article.nom,
    famille: article.famille,
    materiau: article.materiau,
    finition: article.finition,
    tags_style: article.tags_style || [],
    resume: article.resume,
  };
}

export const CATALOGUE_DECO = [
  {
    id: "poterie-emaillee",
    nom: "Poterie émaillée bleue",
    kind: "deco",
    type: "deco",
    famille: "poterie",
    photo_url: null,
    materiau: "Céramique",
    finition: "Bleu méditerranée",
    tags_style: ["contemporain", "mediterraneen"],
    resume: "Déco · accent couleur",
    populaire: true,
    ordre: 1,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "lanterne-pierre",
    nom: "Lanterne pierre",
    kind: "deco",
    type: "deco",
    famille: "luminaire",
    photo_url: null,
    materiau: "Granit",
    finition: "Gris patiné",
    tags_style: ["zen"],
    resume: "Éclairage · jardin zen",
    populaire: true,
    ordre: 2,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "banc-bois-exotique",
    nom: "Banc bois exotique",
    kind: "deco",
    type: "deco",
    famille: "mobilier",
    photo_url: null,
    materiau: "Ipé",
    finition: "Huilé naturel",
    tags_style: ["contemporain", "naturel"],
    resume: "Assise · terrasse",
    populaire: true,
    ordre: 3,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "claustra-bois",
    nom: "Claustra bois ajouré",
    kind: "deco",
    type: "deco",
    famille: "mobilier",
    photo_url: null,
    materiau: "Douglas",
    finition: "Grisé autoclave",
    tags_style: ["naturel", "contemporain"],
    resume: "Occultation légère · bois",
    populaire: false,
    ordre: 4,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "table-basse-pierre",
    nom: "Table basse pierre",
    kind: "deco",
    type: "deco",
    famille: "mobilier",
    photo_url: null,
    materiau: "Pierre reconstituée",
    finition: "Gris anthracite",
    tags_style: ["contemporain"],
    resume: "Salon de jardin · minéral",
    populaire: false,
    ordre: 5,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "pot-terre-cuite",
    nom: "Pot terre cuite",
    kind: "deco",
    type: "deco",
    famille: "poterie",
    photo_url: null,
    materiau: "Terre cuite",
    finition: "Naturel",
    tags_style: ["mediterraneen", "naturel"],
    resume: "Contenant · classique",
    populaire: false,
    ordre: 6,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "cache-pot-fibre",
    nom: "Cache-pot fibre tressée",
    kind: "deco",
    type: "deco",
    famille: "poterie",
    photo_url: null,
    materiau: "Fibre végétale",
    finition: "Beige naturel",
    tags_style: ["naturel", "zen"],
    resume: "Pot · esprit bohème",
    populaire: false,
    ordre: 7,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "borne-solaire",
    nom: "Borne solaire jardin",
    kind: "deco",
    type: "deco",
    famille: "luminaire",
    photo_url: null,
    materiau: "Acier",
    finition: "Noir mat",
    tags_style: ["contemporain"],
    resume: "Balisage · sans câble",
    populaire: false,
    ordre: 8,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "guirlande-guinguette",
    nom: "Guirlande guinguette",
    kind: "deco",
    type: "deco",
    famille: "luminaire",
    photo_url: null,
    materiau: "Câble + ampoules LED",
    finition: "Ambiance chaude",
    tags_style: ["mediterraneen", "contemporain"],
    resume: "Soirée · terrasse",
    populaire: false,
    ordre: 9,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "fontaine-decorative",
    nom: "Fontaine décorative",
    kind: "deco",
    type: "deco",
    famille: "objets",
    photo_url: null,
    materiau: "Résine pierre",
    finition: "Gris patiné",
    tags_style: ["zen", "naturel"],
    resume: "Point d'eau · apaisant",
    populaire: false,
    ordre: 10,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "miroir-jardin",
    nom: "Miroir de jardin",
    kind: "deco",
    type: "deco",
    famille: "objets",
    photo_url: null,
    materiau: "Métal",
    finition: "Rouille décorative",
    tags_style: ["contemporain"],
    resume: "Profondeur · perspective",
    populaire: false,
    ordre: 11,
    actif: true,
    source: "catalogue_deco",
  },
  {
    id: "piquet-chataignier",
    nom: "Piquet bois châtaignier",
    kind: "deco",
    type: "deco",
    famille: "objets",
    photo_url: null,
    materiau: "Châtaignier",
    finition: "Écorcé",
    tags_style: ["naturel"],
    resume: "Séparation · rustique",
    populaire: false,
    ordre: 12,
    actif: true,
    source: "catalogue_deco",
  },
];

export function getActiveCatalogueDeco() {
  return CATALOGUE_DECO.filter((a) => a.actif !== false).sort((a, b) => a.ordre - b.ordre);
}

export function countDecoByFamille(articles = getActiveCatalogueDeco()) {
  const counts = Object.fromEntries(DECO_FAMILLES.map((f) => [f, 0]));
  for (const article of articles) {
    if (counts[article.famille] != null) counts[article.famille] += 1;
  }
  return counts;
}

export function filterCatalogueDeco({
  articles = getActiveCatalogueDeco(),
  styleTag = null,
  famille = null,
  populaireOnly = false,
} = {}) {
  let list = articles;

  if (populaireOnly) {
    list = list.filter((a) => a.populaire);
  }
  if (styleTag) {
    list = list.filter((a) => a.tags_style?.includes(styleTag));
  }
  if (famille) {
    list = list.filter((a) => a.famille === famille);
  }

  return list;
}
