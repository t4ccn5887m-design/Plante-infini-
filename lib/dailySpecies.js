/** Espèces du jour — rotation automatique (jour de l'année % liste). */

export const DAILY_SPECIES = [
  {
    id: "paquerette",
    nom: "La Pâquerette",
    latin: "Bellis perennis",
    fact: "Elle se cache souvent dans la pelouse — regardez bien sous vos pieds !",
    emoji: "🌼",
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

/** Illustrations locales — une SVG par espèce dans public/images/species/. */
export function getDailySpeciesIllustration(species) {
  if (!species?.id) return null;
  return `/images/species/${species.id}.svg`;
}

const DAILY_SPECIES_DETAILS = {
  paquerette: {
    famille: "Astéracées (Compositées)",
    habitat: "Pelouses, prairies, bords de chemins et jardins partout en Europe.",
    description:
      "Petite fleur blanche au cœur jaune, la pâquerette forme souvent des tapis dans les pelouses. Ses feuilles ovales en rosette restent au ras du sol toute l'année.",
    histoire:
      "Son nom vient du latin bellis (« beau »). Longtemps considérée comme une « petite marguerite », elle est l'une des premières fleurs que les enfants apprennent à reconnaître.",
    conseils_expert:
      "Observe la différence avec la marguerite : la pâquerette est plus petite, ses feuilles sont en rosette et son calice est plus plat.",
    guide_entretien:
      "Tolère les pelouses fréquentées. Pas besoin d'arroser — elle préfère les sols ordinaires et un peu secs.",
  },
  pissenlit: {
    famille: "Astéracées (Compositées)",
    habitat: "Prairies, friches, jardins et bords de routes en Europe.",
    description:
      "Plante aux feuilles dentelées en couronne, le pissenlit produit des fleurs jaunes puis des têtes de graines duveteuses que le vent disperse.",
    histoire:
      "Son nom populaire évoque ses propriétés diurétiques. Les jeunes feuilles sont comestibles et les fleurs servent à faire du vin de pissenlit.",
    conseils_expert:
      "La sève laiteuse confirme l'identification. Ne confonds pas avec le laiteron : le pissenlit n'a qu'une fleur par tige.",
    guide_entretien:
      "Récolte les jeunes feuilles au printemps pour la salade. Laisse quelques plants pour les pollinisateurs.",
  },
  trefle: {
    famille: "Fabacées (Légumineuses)",
    habitat: "Pelouses, prairies, jardins et talus humides.",
    description:
      "Petite plante au port couché, le trèfle blanc porte des têtes de fleurs blanches ou rosées et des feuilles trifoliées souvent marquées d'une tache claire.",
    histoire:
      "Symbole de chance avec ses quatre feuilles rares, le trèfle enrichit le sol en fixant l'azote grâce à ses racines.",
    conseils_expert:
      "Compte les folioles : trois est la norme. Les inflorescences blanches se distinguent du trèfle des prés (rose-violet).",
    guide_entretien:
      "Excellent couvre-sol naturel. Tolère le piétinement léger et attire les abeilles.",
  },
  chene: {
    famille: "Fagacées",
    habitat: "Forêts tempérées, haies et parcs d'Europe occidentale.",
    description:
      "Arbre majestueux aux feuilles lobées, le chêne peut atteindre 40 m et vivre plusieurs siècles. Son bois dense est très recherché.",
    histoire:
      "Arbre sacré des druides et symbole de force, le chêne a nourri des civilisations entières avec ses fruits et son bois.",
    conseils_expert:
      "Feuilles lobées sans pointes aiguës (chêne pédonculé) ou avec (chêne rouvre). L'écorce craquelée est typique des vieux sujets.",
    guide_entretien:
      "Ne scarifie pas l'écorce. Les jeunes plants ont besoin d'eau la première année, puis l'arbre est autonome.",
  },
  pin: {
    famille: "Pinacées",
    habitat: "Forêts montagneuses et landes sableuses d'Europe.",
    description:
      "Conifère à aiguilles longues réunies par deux, le pin sylvestre porte des cônes ovoïdes et une écorce orangée en haut du tronc.",
    histoire:
      "Son bois résineux a construit des navires et ses cônes servent de décorations naturelles depuis des siècles.",
    conseils_expert:
      "Les aiguilles par paire et les cônes asymétriques le distinguent du pin maritime. L'odeur de résine est caractéristique.",
    guide_entretien:
      "Préfère les sols drainés. Évite les sols calcaires trop riches.",
  },
  bouleau: {
    famille: "Betulacées",
    habitat: "Lisières de forêts, friches et zones humides d'Europe.",
    description:
      "Arbre élancé à l'écorce blanche éclatante, le bouleau porte des feuilles triangulaires dentées qui tremblent au vent.",
    histoire:
      "Premier arbre colonisateur après une perturbation, le bouleau prépare le terrain pour d'autres espèces forestières.",
    conseils_expert:
      "L'écorce blanche qui se détache en bandes est unique. Les feuilles triangulaires à long pédoncule confirment l'identification.",
    guide_entretien:
      "Pousse vite mais vit relativement peu (60–80 ans). Tolère les sols pauvres.",
  },
  hetre: {
    famille: "Fagacées",
    habitat: "Forêts tempérées humides d'Europe occidentale.",
    description:
      "Grand arbre aux feuilles ovales dentelées, le hêtre forme des futaies dense. Ses fruits triangulaires (faînes) tombent en automne.",
    histoire:
      "Le hêtre pourpre est une variété horticole du hêtre commun, très plantée dans les parcs.",
    conseils_expert:
      "Feuilles lisses à bord ondulé. L'écorce grise lisse rappelle celle d'un éléphant sur les vieux arbres.",
    guide_entretien:
      "Tolère la taille mais préfère les sols profonds et frais. Les faînes attirent les sangliers.",
  },
  saule: {
    famille: "Salicacées",
    habitat: "Bords de rivières, marais et zones humides.",
    description:
      "Arbre ou arbrisseau aux feuilles allongées, le saule blanc a une écorce grise fissurée et des chatons au printemps.",
    histoire:
      "Le saule pleureur est une forme horticole du saule blanc aux branches retombantes.",
    conseils_expert:
      "Feuilles lancéolées, blanches et duveteuses côté inférieur. Les chatons mâles sont jaunes, les femelles vertes.",
    guide_entretien:
      "Aime l'humidité. Idéal en bord de bassin ou de ruisseau.",
  },
  eglantier: {
    famille: "Rosacées",
    habitat: "Lisières de bois, haies et friches en Europe.",
    description:
      "Rosier sauvage aux fleurs roses simples et aux baies rouges (cynorrhodons) en automne. Tiges couvertes d'aiguillons.",
    histoire:
      "Les cynorrhodons riches en vitamine C ont été utilisés en confiture et en tisane pendant les guerres.",
    conseils_expert:
      "Fleurs roses à cinq pétales, baies ovoïdes rouge-orangé. Ne confonds pas avec le rosier des chiens (baies noires).",
    guide_entretien:
      "Plante rustique. Les baies sont comestibles en confiture après cuisson.",
  },
  lavande: {
    famille: "Lamiacées",
    habitat: "Collines calcaires du Midi de France et Méditerranée.",
    description:
      "Plante aromatique aux feuilles grises et aux épis de fleurs violettes, la lavande embaume les champs en juin-juillet.",
    histoire:
      "Cultivée depuis l'Égypte ancienne pour son parfum et ses propriétés calmantes.",
    conseils_expert:
      "Frotte les feuilles : le parfum est immédiat. Feuilles opposées, gris-vert, très aromatiques.",
    guide_entretien:
      "Préfère les sols drainés et le soleil. Tailler après floraison pour garder un port compact.",
  },
  tournesol: {
    famille: "Astéracées (Compositées)",
    habitat: "Champs cultivés, jardins et friches ensoleillées.",
    description:
      "Plante annuelle à grande fleur jaune, le tournesol peut dépasser 2 m. Ses graines sont riches en huile.",
    histoire:
      "Domestiqué en Amérique, le tournesol a conquis les jardins européens au XVIe siècle.",
    conseils_expert:
      "Grande capitule jaune à centre brun. Tige robuste et feuilles cordiformes dentées.",
    guide_entretien:
      "Besoin de soleil et d'eau en période de croissance. Tuteur si le vent est fort.",
  },
  lilas: {
    famille: "Oléacées",
    habitat: "Jardins, parcs et lisières en Europe tempérée.",
    description:
      "Arbuste aux grappes de fleurs violettes ou blanches très parfumées, le lilas fleurit au printemps.",
    histoire:
      "Introduit en Europe depuis les jardins persans, le lilas symbolise le retour du beau temps.",
    conseils_expert:
      "Fleurs en panicules, parfum sucré intense en mai. Feuilles simples, ovales, opposées.",
    guide_entretien:
      "Tailler après floraison. Tolère la taille sévère pour rajeunir la plante.",
  },
  ortie: {
    famille: "Urticacées",
    habitat: "Friches, bords de chemins, jardins et zones riches en nitrate.",
    description:
      "Plante aux feuilles dentées couvertes de poils urticants, l'ortie est paradoxalement comestible et riche en nutriments.",
    histoire:
      "Utilisée en tissage (fibre de ramie) et en cuisine (soupe d'orties), elle est une plante multifonction.",
    conseils_expert:
      "Poils urticants sur tige et feuilles. Feuilles opposées, dentées, à base cordée.",
    guide_entretien:
      "Récolte avec des gants. Cuisiner neutralise les poils urticants.",
  },
  muguet: {
    famille: "Asparagacées",
    habitat: "Sous-bois humides et ombragés d'Europe.",
    description:
      "Petite plante aux fleurs blanches en clochettes parfumées, le muguet pousse en colonies au printemps.",
    histoire:
      "Tradition du 1er mai en France depuis le XIXe siècle. Toutes les parties sont toxiques.",
    conseils_expert:
      "Deux feuilles larges basales, fleurs blanches en grappe unilatérale. Parfum doux et caractéristique.",
    guide_entretien:
      "Plante toxique — ne pas consommer. Préfère l'ombre et l'humidité.",
  },
  coquelicot: {
    famille: "Pavot (Papavéracées)",
    habitat: "Champs cultivés, bords de chemins, talus et friches calcaires.",
    description:
      "Fleur rouge écarlate aux quatre pétales fragiles, le coquelicot colonise les sols perturbés. Sa tige velue porte une capsule de graines noires.",
    histoire:
      "Symbole du souvenir depuis la Première Guerre mondiale, le coquelicot peut rester en dormance des dizaines d'années avant de germer.",
    conseils_expert:
      "Quatre pétales rouges, centre noir, tige velue. Ne confonds pas avec le pavot des champs (pétales plus pâles, capsule plus longue).",
    guide_entretien:
      "Plante annuelle : laisse les graines tomber pour une floraison l'année suivante.",
  },
  marguerite: {
    famille: "Astéracées (Compositées)",
    habitat: "Prairies, talus, bords de chemins et jardins.",
    description:
      "Fleur blanche au centre jaune plus grande que la pâquerette, la marguerite est l'emblème des prairies d'été.",
    histoire:
      "Le jeu « il m'aime, un peu, beaucoup… » est connu dans toute l'Europe depuis des générations.",
    conseils_expert:
      "Plus grande que la pâquerette, feuilles alternes sur la tige. Capitule blanc et jaune bien visible.",
    guide_entretien:
      "Fleurit longtemps de mai à octobre. Coupe les fleurs fanées pour prolonger la floraison.",
  },
  chataignier: {
    famille: "Fagacées",
    habitat: "Collines et montagnes d'Europe méditerranéenne et tempérée.",
    description:
      "Grand arbre aux feuilles oblongues dentées, le châtaignier produit des fruits comestibles en automne.",
    histoire:
      "Le châtaignier a nourri des populations entières en montagne quand les céréales ne poussaient pas.",
    conseils_expert:
      "Feuilles oblongues dentées, fruits dans une bogue épineuse. Écorce profondément fissurée en vieillissant.",
    guide_entretien:
      "Préfère les sols acides et profonds. Récolte les châtaignes quand elles tombent.",
  },
  if: {
    famille: "Taxacées",
    habitat: "Forêts humides et calcaires d'Europe occidentale.",
    description:
      "Arbre conifère à feuilles plates sombres, l'if est très toxique mais remarquable par sa longévité exceptionnelle.",
    histoire:
      "Certains ifs en Europe ont plus de 1 000 ans. Son bois était utilisé pour les arcs et les outils.",
    conseils_expert:
      "Feuilles plates en deux rangs, baies rouges (toxiques). Écorce rouge-brun qui s'écaille.",
    guide_entretien:
      "Toutes les parties sont toxiques. Tolère la taille et forme de magnifiques haies.",
  },
  merisier: {
    famille: "Rosacées",
    habitat: "Lisières de forêts, haies et bois clairs d'Europe.",
    description:
      "Arbre aux fleurs blanches en grappes au printemps, le merisier produit des cerises rouges comestibles en été.",
    histoire:
      "Le merisier sauvage est l'ancêtre de nombreuses variétés de cerisiers cultivés.",
    conseils_expert:
      "Fleurs blanches en grappes, écorce lisse avec bandes horizontales ( lentilles ). Fruits rouges en grappe.",
    guide_entretien:
      "Les oiseaux adorent les cerises. Récolte tôt si tu veux en garder pour toi.",
  },
  pommier: {
    famille: "Rosacées",
    habitat: "Jardins, vergers et lisières en Europe.",
    description:
      "Arbre fruitier aux fleurs roses-blanches au printemps, le pommier produit des pommes de formes et couleurs variées.",
    histoire:
      "Plus de 7 000 variétés de pommes existent dans le monde, issues de milliers d'années de sélection.",
    conseils_expert:
      "Fleurs blanches rosées, feuilles ovales dentées. Fruits à pépins caractéristiques.",
    guide_entretien:
      "Taille en hiver pour aérer la ramure. Surveille les taches sur les feuilles (tavelure).",
  },
  vigne: {
    famille: "Vitacées",
    habitat: "Lisières de forêts, haies et friches ensoleillées.",
    description:
      "Plante grimpante aux feuilles lobées et aux grappes de baies noires ou violettes, la vigne sauvage est l'ancêtre de la vigne cultivée.",
    histoire:
      "La viticulture remonte à 6 000 ans en Méditerranée. La vigne sauvage nourrit les merles en automne.",
    conseils_expert:
      "Feuilles lobées, tiges liantes, baies en grappes. Sève aqueuse, pas laiteuse.",
    guide_entretien:
      "Les merles dévorent les raisins — écoute-les en fin d'été pour repérer les grappes.",
  },
  fougere: {
    famille: "Dryoptéridacées",
    habitat: "Sous-bois humides et ombragés d'Europe.",
    description:
      "Plante sans fleurs ni graines, la fougère se reproduit par spores portées sous les feuilles (sores).",
    histoire:
      "Les fougères ont existé avant les dinosaures. Leurs spores étaient utilisées comme antiparasitaire.",
    conseils_expert:
      "Frondes (feuilles) divisées en lobes arrondis. Sores bruns sur le dessous des frondes.",
    guide_entretien:
      "Indicateur de sol humide. Ne cueille pas : certaines fougères sont toxiques.",
  },
  houx: {
    famille: "Aquifoliacées",
    habitat: "Sous-bois et haies d'Europe occidentale.",
    description:
      "Arbuste persistant aux feuilles coriaces piquantes sur les branches basses, le houx porte des baies rouges en hiver.",
    histoire:
      "Symbole de Noël et de persévérance, le houx était planté près des maisons pour protéger des esprits.",
    conseils_expert:
      "Feuilles piquantes en bas, lisses en haut. Baies rouges (toxiques). Bois très dur et blanc.",
    guide_entretien:
      "Baies toxiques — attention aux enfants. Tolère la taille pour former des haies.",
  },
  bleuet: {
    famille: "Astéracées (Compositées)",
    habitat: "Champs de céréales, prairies et bords de chemins.",
    description:
      "Fleur sauvage bleue aux pétales frangés, le bleuet était commun dans les champs de blé avant l'usage intensif des herbicides.",
    histoire:
      "Symbole de la France et des anciens combattants, le bleuet a presque disparu des champs cultivés.",
    conseils_expert:
      "Fleurs bleues en capitule, tige ramifiée. Feuilles lancéolées alternes.",
    guide_entretien:
      "Plante annuelle : laisse quelques plants pour qu'elles resemencent naturellement.",
  },
  digitale: {
    famille: "Plantaginacées",
    habitat: "Lisières de bois, talus et sous-bois clairs.",
    description:
      "Plante aux grandes fleurs tubulaires pourpres, la digitale attire les bourdons au fond des bois.",
    histoire:
      "Utilisée en médecine pour le cœur (digitale), mais toutes les parties sont très toxiques.",
    conseils_expert:
      "Grandes fleurs en grappe unilatérale, tubulaires, pourpres. Feuilles velues, ovales.",
    guide_entretien:
      "Plante toxique — ne pas consommer. Belle en lisière de bois ombragée.",
  },
  thym: {
    famille: "Lamiacées",
    habitat: "Rocailles, garrigues et sols calcaires ensoleillés.",
    description:
      "Aromatique aux feuilles minuscules et aux fleurs roses ou blanches, le thym embaume les collines méditerranéennes.",
    histoire:
      "Symbole de courage chez les Grecs, le thym est un condiment et un antiseptique naturel.",
    conseils_expert:
      "Feuilles opposées, très petites, très aromatiques. Tige ligneuse à la base.",
    guide_entretien:
      "Préfère le soleil et les sols drainés. Tailler après floraison pour garder un port compact.",
  },
  romarin: {
    famille: "Lamiacées",
    habitat: "Garrigues, rocailles et jardins ensoleillés de la Méditerranée.",
    description:
      "Aromatique persistant aux feuilles étroites et aux fleurs bleues, le romarin parfume les plats et les balades.",
    histoire:
      "Plante de l'amour et de la mémoire dans la tradition méditerranéenne.",
    conseils_expert:
      "Feuilles étroites, ligneuses, très aromatiques. Fleurs bleues en petites grappes.",
    guide_entretien:
      "Protège du gel en région froide. Préfère les sols drainés et le soleil.",
  },
  noyer: {
    famille: "Juglandacées",
    habitat: "Vallées, jardins et lisières en Europe tempérée.",
    description:
      "Grand arbre aux feuilles composées de folioles ovales, le noyer produit des noix en coque dure.",
    histoire:
      "Le noyer commun est cultivé depuis l'Antiquité pour ses fruits et son bois précieux.",
    conseils_expert:
      "Feuilles composées de 5–9 folioles. Fruits en drupe à coque verte puis brune.",
    guide_entretien:
      "Les feuilles et la coque des noix inhibent la croissance d'autres plantes — ne les composte pas.",
  },
  peuplier: {
    famille: "Salicacées",
    habitat: "Bords de rivières, zones humides et friches.",
    description:
      "Grand arbre aux feuilles triangulaires ou cordées, le peuplier pousse très vite et ses feuilles tremblent au vent.",
    histoire:
      "Appelé « arbre qui tremble », le peuplier noir est souvent planté pour le bois d'emballage.",
    conseils_expert:
      "Feuilles triangulaires à long pédoncule, qui tremblent. Écorce blanche sur les jeunes sujets.",
    guide_entretien:
      "Pousse très vite. Tolère les sols humides et les inondations temporaires.",
  },
  platane: {
    famille: "Platanacées",
    habitat: "Places de village, parcs et bords de routes en Europe.",
    description:
      "Grand arbre urbain à l'écorce qui se détache en plaques, le platane est l'arbre emblématique des places de village.",
    histoire:
      "Hybride entre le platane d'Orient et le platane d'Amérique, planté dans les villes depuis le XVIIIe siècle.",
    conseils_expert:
      "Écorce qui se détache en plaques vert-blanc-gris. Feuilles palmées à lobes profonds.",
    guide_entretien:
      "Très tolérant à la pollution urbaine. Écorce distinctive toute l'année.",
  },
};

function enrichDailySpeciesContent(species) {
  const nom = stripLeadingArticle(species.nom);
  const nomLower = nom.charAt(0).toLowerCase() + nom.slice(1);
  const details = DAILY_SPECIES_DETAILS[species.id] || {};

  return {
    famille: details.famille || species.famille || null,
    habitat: details.habitat || species.habitat || null,
    description:
      details.description ||
      species.description ||
      `${nom} (${species.latin}) est une espèce familière des paysages naturels d'Europe. ${species.fact}`,
    histoire:
      details.histoire ||
      species.histoire ||
      `Connue sous le nom scientifique ${species.latin}, ${nomLower} fait partie du patrimoine naturel que l'on croise régulièrement en balade.`,
    conseils_expert:
      details.conseils_expert ||
      species.conseils_expert ||
      `Pour observer ${nomLower} : approche-toi calmement, examine les détails (feuilles, fleurs, tige, écorce) et prends une photo nette pour confirmer l'identification.`,
    guide_entretien:
      details.guide_entretien ||
      species.guide_entretien ||
      `En balade, prends le temps d'observer ${nomLower} sans cueillir — la nature se régénère mieux quand on la respecte.`,
    identification_note:
      details.identification_note ||
      species.identification_note ||
      `Nom scientifique : ${species.latin}. Compare avec les photos de la fiche pour confirmer l'identification.`,
  };
}

/** Objet de fiche en lecture seule — jamais persisté ni comptabilisé comme scan. */
export function buildDailySpeciesViewModel(species) {
  if (!species) return null;
  const nom = stripLeadingArticle(species.nom);
  const content = enrichDailySpeciesContent(species);
  const illustration = getDailySpeciesIllustration(species);

  return {
    id: `daily-preview-${species.id}`,
    speciesId: species.id,
    isDailyPreview: true,
    nom,
    nom_latin: species.latin,
    type: species.type || inferDailySpeciesType(species.id),
    rarete: "commun",
    photo: illustration,
    emoji: species.emoji,
    fun_fact: species.fact,
    ...content,
  };
}
