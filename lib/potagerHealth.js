export { HEALTH, inferHealthFromEtatSante } from "@/lib/discoveryHealth";

const NAME_EMOJI = [
  [/tomate/i, "🍅"],
  [/carotte/i, "🥕"],
  [/salade|laitue/i, "🥬"],
  [/courgette|zucchini/i, "🥒"],
  [/poivron|piment/i, "🌶️"],
  [/oignon|échalote|echalote/i, "🧅"],
  [/pomme de terre|patate/i, "🥔"],
  [/aubergine/i, "🍆"],
  [/maïs|mais/i, "🌽"],
  [/haricot|pois/i, "🫛"],
  [/brocoli|chou/i, "🥦"],
  [/fraise/i, "🍓"],
  [/basilic|herbe|menthe/i, "🌿"],
];

export function guessEmojiForPlant(name, type) {
  const n = name || "";
  for (const [re, emoji] of NAME_EMOJI) {
    if (re.test(n)) return emoji;
  }
  const typeMap = {
    legume: "🥕",
    fruit: "🍎",
    plante: "🌱",
    fleur: "🌸",
  };
  return typeMap[type] || "🌱";
}

export const POTAGER_EMOJI_PICKER = [
  "🥕",
  "🍅",
  "🥬",
  "🥒",
  "🌶️",
  "🧅",
  "🥔",
  "🫑",
  "🍆",
  "🌽",
  "🫛",
  "🥦",
  "🍓",
  "🌿",
  "🌱",
];
