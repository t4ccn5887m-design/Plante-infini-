export const HEALTH = {
  good: "good",
  warning: "warning",
  critical: "critical",
};

const CRITICAL_RE =
  /malade|pourri|mort|critique|grave|fongi|chancre|nécros|necros|pourriture|dépéris|deperis/i;
const WARNING_RE =
  /stress|jaun|fané|fane|attention|sec|moyen|faible|déshydrat|deshydrat|tache|maladie|souffr|affaib/i;
const GOOD_RE = /sain|bon|excellent|healthy|vigoureux|florissant|robuste|en forme/i;

export function inferHealthFromEtatSante(text) {
  if (!text || !String(text).trim()) return HEALTH.good;
  const s = String(text).toLowerCase();
  if (CRITICAL_RE.test(s)) return HEALTH.critical;
  if (WARNING_RE.test(s)) return HEALTH.warning;
  if (GOOD_RE.test(s)) return HEALTH.good;
  return HEALTH.warning;
}

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
