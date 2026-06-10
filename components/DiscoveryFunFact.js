function textValue(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  return s || null;
}

export function getFunFactText(data) {
  if (!data) return null;
  return textValue(data.fun_fact) || textValue(data.anecdotes);
}

export default function DiscoveryFunFact({ data, t }) {
  const text = getFunFactText(data);
  if (!text) return null;

  return (
    <aside className="discovery-fun-fact" aria-label={t("sound.fun_fact_title")}>
      <div className="discovery-fun-fact-badge">💡 {t("sound.fun_fact_title")}</div>
      <p className="discovery-fun-fact-text">{text}</p>
    </aside>
  );
}
