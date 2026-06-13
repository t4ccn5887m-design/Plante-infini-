/** Espèces du jour — rotation automatique (jour de l'année % liste). */

export const DAILY_SPECIES = [
  {
    id: "paquerette",
    nom: "La Pâquerette",
    latin: "Bellis perennis",
    fact: "Elle se cache souvent dans la pelouse — regardez bien sous vos pieds !",
    emoji: "🌼",
    image: "/images/paquerette.svg",
  },
  {
    id: "pissenlit",
    nom: "Le Pissenlit",
    latin: "Taraxacum officinale",
    fact: "Ses graines volent comme de minuscules parachutes au moindre souffle.",
    emoji: "🌼",
  },
  {
    id: "trefle",
    nom: "Le Trèfle blanc",
    latin: "Trifolium repens",
    fact: "Trouver un quatre feuilles porte bonheur… ou demande juste un peu de patience.",
    emoji: "☘️",
  },
  {
    id: "chene",
    nom: "Le Chêne",
    latin: "Quercus robur",
    fact: "Un seul chêne peut nourrir plus de 500 espèces d'insectes. Un vrai hôtel !",
    emoji: "🌳",
  },
  {
    id: "pin",
    nom: "Le Pin sylvestre",
    latin: "Pinus sylvestris",
    fact: "Sentez son écorce : elle sent bon la résine, surtout par temps chaud.",
    emoji: "🌲",
  },
  {
    id: "bouleau",
    nom: "Le Bouleau",
    latin: "Betula pendula",
    fact: "Son écorce blanche se détache en fine couche, comme du papier.",
    emoji: "🌳",
  },
  {
    id: "hetre",
    nom: "Le Hêtre",
    latin: "Fagus sylvatica",
    fact: "Ses feuilles restent marron tout l'hiver sur les jeunes branches.",
    emoji: "🍂",
  },
  {
    id: "saule",
    nom: "Le Saule",
    latin: "Salix alba",
    fact: "Il adore l'eau : on le trouve souvent près des rivières et des étangs.",
    emoji: "🌿",
  },
  {
    id: "eglantier",
    nom: "L'Églantier",
    latin: "Rosa canina",
    fact: "Ses baies rouges nourrissent les oiseaux en automne.",
    emoji: "🌹",
  },
  {
    id: "lavande",
    nom: "La Lavande",
    latin: "Lavandula angustifolia",
    fact: "Frottez ses feuilles entre vos doigts : le parfum est instantané.",
    emoji: "💜",
  },
  {
    id: "tournesol",
    nom: "Le Tournesol",
    latin: "Helianthus annuus",
    fact: "Il suit le soleil quand il est jeune — un vrai GPS végétal.",
    emoji: "🌻",
  },
  {
    id: "lilas",
    nom: "Le Lilas",
    latin: "Syringa vulgaris",
    fact: "En mai, son parfum se sent parfois avant même de voir l'arbre.",
    emoji: "🪻",
  },
  {
    id: "ortie",
    nom: "L'Ortie",
    latin: "Urtica dioica",
    fact: "Elle pique, oui — mais les papillons l'adorent. Touchez avec des gants !",
    emoji: "🌿",
  },
  {
    id: "muguet",
    nom: "Le Muguet",
    latin: "Convallaria majalis",
    fact: "Il fleurit au printemps dans les sous-bois ombragés.",
    emoji: "🤍",
  },
  {
    id: "coquelicot",
    nom: "Le Coquelicot",
    latin: "Papaver rhoeas",
    fact: "Une graines peut dormir des dizaines d'années avant de germer.",
    emoji: "🌺",
  },
  {
    id: "marguerite",
    nom: "La Marguerite",
    latin: "Leucanthemum vulgare",
    fact: "« Il m'aime, un peu, beaucoup… » — le jeu le plus célèbre des prairies.",
    emoji: "🌼",
  },
  {
    id: "chataignier",
    nom: "Le Châtaignier",
    latin: "Castanea sativa",
    fact: "Ses marrons grillés sont une tradition d'automne depuis des siècles.",
    emoji: "🌰",
  },
  {
    id: "if",
    nom: "L'If",
    latin: "Taxus baccata",
    fact: "Arbre très longévif : certains ont plus de 1 000 ans en Europe.",
    emoji: "🌲",
  },
  {
    id: "merisier",
    nom: "Le Merisier",
    latin: "Prunus avium",
    fact: "Au printemps, il se couvre de fleurs blanches avant même les feuilles.",
    emoji: "🌸",
  },
  {
    id: "pommier",
    nom: "Le Pommier",
    latin: "Malus domestica",
    fact: "Il existe plus de 7 000 variétés de pommes dans le monde.",
    emoji: "🍎",
  },
  {
    id: "vigne",
    nom: "La Vigne sauvage",
    latin: "Vitis vinifera",
    fact: "Ses grappes attirent les merles — écoutez-les en fin d'été.",
    emoji: "🍇",
  },
  {
    id: "fougere",
    nom: "La Fougère",
    latin: "Dryopteris filix-mas",
    fact: "Elle n'a ni fleurs ni graines : elle se reproduit par spores.",
    emoji: "🌿",
  },
  {
    id: "houx",
    nom: "Le Houx",
    latin: "Ilex aquifolium",
    fact: "Ses feuilles piquantes protègent les baies rouges des mangeurs.",
    emoji: "🎄",
  },
  {
    id: "bleuet",
    nom: "Le Bleuet",
    latin: "Centaurea cyanus",
    fact: "Autrefois très commun dans les champs de blé — aujourd'hui plus rare.",
    emoji: "💙",
  },
  {
    id: "digitale",
    nom: "La Digitale pourpre",
    latin: "Digitalis purpurea",
    fact: "Ses clochettes pourpres attirent les abeilles au fond des bois.",
    emoji: "🌺",
  },
  {
    id: "thym",
    nom: "Le Thym",
    latin: "Thymus vulgaris",
    fact: "Plus il est arrosé par le soleil, plus son parfum est fort.",
    emoji: "🌿",
  },
  {
    id: "romarin",
    nom: "Le Romarin",
    latin: "Salvia rosmarinus",
    fact: "Une branche dans la poche suffit à parfumer une balade entière.",
    emoji: "🌿",
  },
  {
    id: "noyer",
    nom: "Le Noyer",
    latin: "Juglans regia",
    fact: "Ses feuilles sentent la noix quand on les froisse.",
    emoji: "🌰",
  },
  {
    id: "peuplier",
    nom: "Le Peuplier",
    latin: "Populus nigra",
    fact: "Ses feuilles tremblent au moindre vent — d'où son surnom d'arbre qui tremble.",
    emoji: "🌳",
  },
  {
    id: "platane",
    nom: "Le Platane",
    latin: "Platanus × acerifolia",
    fact: "Son écorche se détache en plaques, révélant des tons vert, blanc et gris.",
    emoji: "🌳",
  },
];

/** Jour de l'année (1–365/366), stable quel que soit le fuseau local. */
export function dayOfYear(date = new Date()) {
  const y = date.getFullYear();
  const start = new Date(y, 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Espèce du jour — même index pour tous les utilisateurs à la même date locale. */
export function getDailySpecies(date = new Date()) {
  const index = dayOfYear(date) % DAILY_SPECIES.length;
  return DAILY_SPECIES[index];
}

const DAILY_TREE_IDS = new Set([
  "chene",
  "pin",
  "bouleau",
  "hetre",
  "saule",
  "chataignier",
  "if",
  "merisier",
  "pommier",
  "noyer",
  "peuplier",
  "platane",
]);

const DAILY_FLOWER_IDS = new Set([
  "paquerette",
  "pissenlit",
  "trefle",
  "lavande",
  "tournesol",
  "lilas",
  "muguet",
  "coquelicot",
  "marguerite",
  "bleuet",
  "digitale",
  "eglantier",
]);

function inferDailySpeciesType(id) {
  if (DAILY_TREE_IDS.has(id)) return "arbre";
  if (DAILY_FLOWER_IDS.has(id)) return "fleur";
  if (id === "vigne") return "fruit";
  return "plante";
}

function stripLeadingArticle(nom) {
  return String(nom || "")
    .replace(/^(La |Le |L'|Les )/i, "")
    .trim();
}

/** Objet de fiche en lecture seule — jamais persisté ni comptabilisé comme scan. */
export function buildDailySpeciesViewModel(species) {
  if (!species) return null;
  const nom = stripLeadingArticle(species.nom);
  return {
    id: `daily-preview-${species.id}`,
    isDailyPreview: true,
    nom,
    nom_latin: species.latin,
    type: species.type || inferDailySpeciesType(species.id),
    rarete: "commun",
    photo: species.image || null,
    emoji: species.emoji,
    fun_fact: species.fact,
    description: species.description || null,
    histoire: species.histoire || null,
    conseils_expert: species.conseils_expert || null,
    habitat: species.habitat || null,
  };
}
