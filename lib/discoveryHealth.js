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
