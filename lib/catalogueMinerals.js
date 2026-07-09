/**
 * Catalogue minéral & déco — données mock (Option C).
 * Structure = modèle de la future table Supabase `catalogue_minerals`.
 */

export const MINERAL_FAMILLES = [
  "paillage_sols",
  "pierres_rochers",
  "bordures",
  "pas_allees",
  "deco_mobilier",
  "clotures_bois",
];

export const MINERAL_AMBIANCE_TAGS = ["zen", "contemporain", "naturel", "sans_entretien"];

/** Préfixe client_id analyses — distinct du végétal et des scans. */
export function catalogueMineralClientId(articleId) {
  return `catalogue-mineral:${articleId}`;
}

/** Payload JSON stocké dans analyses.result pour un article minéral. */
export function mineralToAnalysisResult(article) {
  return {
    id: catalogueMineralClientId(article.id),
    catalogue_mineral_id: article.id,
    source: "catalogue_mineral",
    kind: "mineral",
    type: "mineral",
    nom: article.nom,
    famille: article.famille,
    materiau: article.materiau,
    finition: article.finition,
    tags_ambiance: article.tags_ambiance || [],
    resume: article.resume,
  };
}

export const CATALOGUE_MINERALS = [
  {
    id: "ardoise-concassee",
    nom: "Ardoise concassée",
    kind: "mineral",
    type: "mineral",
    famille: "paillage_sols",
    photo_url: null,
    materiau: "Ardoise",
    finition: "Gris anthracite",
    tags_ambiance: ["zen", "naturel"],
    resume: "Paillage minéral · gris anthracite",
    populaire: true,
    ordre: 1,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "bordure-acier-corten",
    nom: "Bordure acier corten",
    kind: "mineral",
    type: "mineral",
    famille: "bordures",
    photo_url: null,
    materiau: "Acier corten",
    finition: "Rouille stable",
    tags_ambiance: ["contemporain"],
    resume: "Contemporain · rouille",
    populaire: true,
    ordre: 2,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "pas-japonais-gres",
    nom: "Pas japonais grès",
    kind: "mineral",
    type: "mineral",
    famille: "pas_allees",
    photo_url: null,
    materiau: "Grès",
    finition: "Beige naturel",
    tags_ambiance: ["zen", "naturel"],
    resume: "Naturel · beige",
    populaire: true,
    ordre: 3,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "gravier-blanc",
    nom: "Gravier blanc",
    kind: "mineral",
    type: "mineral",
    famille: "paillage_sols",
    photo_url: null,
    materiau: "Calcaire",
    finition: "Blanc éclatant",
    tags_ambiance: ["contemporain", "sans_entretien"],
    resume: "Paillage · lumineux",
    populaire: false,
    ordre: 4,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "ecorce-pin",
    nom: "Écorce de pin",
    kind: "mineral",
    type: "mineral",
    famille: "paillage_sols",
    photo_url: null,
    materiau: "Écorce de pin",
    finition: "Brun naturel",
    tags_ambiance: ["naturel", "sans_entretien"],
    resume: "Paillage végétal · naturel",
    populaire: false,
    ordre: 5,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "galet-riviere",
    nom: "Galet de rivière",
    kind: "mineral",
    type: "mineral",
    famille: "pierres_rochers",
    photo_url: null,
    materiau: "Galet",
    finition: "Gris-beige poli",
    tags_ambiance: ["zen", "naturel"],
    resume: "Bord de bassin · zen",
    populaire: false,
    ordre: 6,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "rocher-ardoise",
    nom: "Rocher décoratif ardoise",
    kind: "mineral",
    type: "mineral",
    famille: "pierres_rochers",
    photo_url: null,
    materiau: "Ardoise",
    finition: "Plaque brute",
    tags_ambiance: ["zen"],
    resume: "Mise en scène · minéral",
    populaire: false,
    ordre: 7,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "bordure-beton-bois",
    nom: "Bordure béton aspect bois",
    kind: "mineral",
    type: "mineral",
    famille: "bordures",
    photo_url: null,
    materiau: "Béton",
    finition: "Aspect bois",
    tags_ambiance: ["contemporain", "sans_entretien"],
    resume: "Bordure · imitation bois",
    populaire: false,
    ordre: 8,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "dalles-travertin",
    nom: "Dalles travertin",
    kind: "mineral",
    type: "mineral",
    famille: "pas_allees",
    photo_url: null,
    materiau: "Travertin",
    finition: "Ivoire",
    tags_ambiance: ["contemporain", "naturel"],
    resume: "Terrasse · élégant",
    populaire: false,
    ordre: 9,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "poterie-emaillee",
    nom: "Poterie émaillée bleue",
    kind: "mineral",
    type: "mineral",
    famille: "deco_mobilier",
    photo_url: null,
    materiau: "Céramique",
    finition: "Bleu méditerranée",
    tags_ambiance: ["contemporain"],
    resume: "Déco · accent couleur",
    populaire: false,
    ordre: 10,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "lanterne-pierre",
    nom: "Lanterne pierre",
    kind: "mineral",
    type: "mineral",
    famille: "deco_mobilier",
    photo_url: null,
    materiau: "Granit",
    finition: "Gris patiné",
    tags_ambiance: ["zen"],
    resume: "Éclairage · jardin zen",
    populaire: false,
    ordre: 11,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "claustra-bois",
    nom: "Claustra bois ajouré",
    kind: "mineral",
    type: "mineral",
    famille: "clotures_bois",
    photo_url: null,
    materiau: "Douglas",
    finition: "Grisé autoclave",
    tags_ambiance: ["naturel", "sans_entretien"],
    resume: "Occultation légère · bois",
    populaire: false,
    ordre: 12,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "piquet-chataignier",
    nom: "Piquet bois châtaignier",
    kind: "mineral",
    type: "mineral",
    famille: "clotures_bois",
    photo_url: null,
    materiau: "Châtaignier",
    finition: "Écorcé",
    tags_ambiance: ["naturel"],
    resume: "Séparation · rustique",
    populaire: false,
    ordre: 13,
    actif: true,
    source: "catalogue_mineral",
  },
  {
    id: "schiste-violet",
    nom: "Schiste violet",
    kind: "mineral",
    type: "mineral",
    famille: "pierres_rochers",
    photo_url: null,
    materiau: "Schiste",
    finition: "Violet ardoise",
    tags_ambiance: ["contemporain", "naturel"],
    resume: "Mur · couleur minérale",
    populaire: false,
    ordre: 14,
    actif: true,
    source: "catalogue_mineral",
  },
];

export function getActiveCatalogueMinerals() {
  return CATALOGUE_MINERALS.filter((a) => a.actif !== false).sort((a, b) => a.ordre - b.ordre);
}

export function countMineralsByFamille(articles = getActiveCatalogueMinerals()) {
  const counts = Object.fromEntries(MINERAL_FAMILLES.map((f) => [f, 0]));
  for (const article of articles) {
    if (counts[article.famille] != null) counts[article.famille] += 1;
  }
  return counts;
}

export function filterCatalogueMinerals({
  articles = getActiveCatalogueMinerals(),
  ambianceTag = null,
  famille = null,
  populaireOnly = false,
} = {}) {
  let list = articles;

  if (populaireOnly) {
    list = list.filter((a) => a.populaire);
  }
  if (ambianceTag) {
    list = list.filter((a) => a.tags_ambiance?.includes(ambianceTag));
  }
  if (famille) {
    list = list.filter((a) => a.famille === famille);
  }

  return list;
}
