/** Six ambiances catalogue — contenus éditoriaux (écran dossier particulier). */

export const GARDEN_AMBIANCE_IDS = [
  "Méditerranéen",
  "Contemporain",
  "Champêtre",
  "Zen",
  "Exotique",
  "Naturel",
];

export const GARDEN_AMBIANCE_META = {
  Méditerranéen: {
    subtitle: "Soleil, senteurs et pierre chaude",
    heroColor: "#A97F4E",
    traits: ["Entretien faible", "Peu d'arrosage", "Plein soleil"],
    defines:
      "Des plantes qui aiment le soleil et la sécheresse, des feuillages argentés, des parfums de lavande et de romarin. Côté sol : de la pierre claire, du gravier, un peu de terre cuite.",
    aSavoir:
      "Ces plantes détestent les sols lourds et humides. Votre paysagiste vérifiera si votre terrain s'y prête.",
  },
  Contemporain: {
    subtitle: "Lignes nettes, volumes structurés",
    heroColor: "#5B6359",
    traits: ["Graphique", "Entretien maîtrisé", "Matériaux lisses"],
    defines:
      "Des formes géométriques, des graminées au vent, des persistants taillés avec soin. Pierre grise, béton ciré, bois foncé et gravier uniforme pour un jardin actuel.",
    aSavoir:
      "L'entretien régulier des volumes (haies, topiaires) est souvent nécessaire pour garder le rendu « contemporain ».",
  },
  Champêtre: {
    subtitle: "Fleurs, mélanges et douceur",
    heroColor: "#B8866B",
    traits: ["Fleuri", "Biodiversité", "Saisonnalité"],
    defines:
      "Massifs généreux, rosiers, vivaces et arbustes à floraison étalée. Allées en gravier ou pierre patinée, clôtures en bois et potagers fleuris.",
    aSavoir:
      "Un jardin champêtre demande un peu plus de taille et de remplacement des vivaces — à cadrer avec votre rythme d'entretien.",
  },
  Zen: {
    subtitle: "Calme, eau et minéral",
    heroColor: "#6B7F6A",
    traits: ["Minimal", "Persistance", "Ombre partielle"],
    defines:
      "Épuré : mousses, bambous, érables du Japon, pierres sèches et eau lente. Bois naturel, gravier ratissé et végétation feuillue pour la fraîcheur.",
    aSavoir:
      "Les bambous et certains érables ont besoin de contenants ou de barrières anti-rhizomes — point à valider sur site.",
  },
  Exotique: {
    subtitle: "Feuillages larges, ambiance voyage",
    heroColor: "#3D7A5C",
    traits: ["Impact visuel", "Protection hiver", "Arrosage"],
    defines:
      "Palmes, bananiers, graminées XXL et floraisons tropicales. Terrasses en bois exotique ou pierre chaude, pots XXL et éclairages d'ambiance.",
    aSavoir:
      "Plusieurs plantes « exotiques » sont sensibles au gel : votre paysagiste adaptera les espèces à votre micro-climat.",
  },
  Naturel: {
    subtitle: "Libre, local et vivant",
    heroColor: "#4E7B52",
    traits: ["Faible entretien", "Faune & flore", "Rusticité"],
    defines:
      "Haies mixtes, prairies fleuries, arbres indigènes et strates végétales variées. Matériaux bruts : bois local, pierres du coin, paillage organique.",
    aSavoir:
      "Un jardin « naturel » n'est pas sans entretien : une taille légère annuelle évite que tout ne devienne sauvage.",
  },
};

export function getGardenAmbianceMeta(name) {
  return GARDEN_AMBIANCE_META[name] || null;
}
