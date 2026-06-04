import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";

function firstSentence(text) {
  const s = String(text || "").trim();
  if (!s) return null;
  const match = s.match(/^[^.!?\n]+[.!?]?/);
  return (match ? match[0] : s.slice(0, 120)).trim();
}

/** One concrete action from analysis fields (French/English API text). */
export function getPotagerActionNow(data) {
  const sources = [
    data?.soins_traitement,
    data?.guide_entretien,
    data?.conseils_expert,
  ];
  for (const src of sources) {
    const line = firstSentence(src);
    if (line && line.length > 8) return line;
  }
  return null;
}

export function getPotagerActionFallback(health, t) {
  if (health === HEALTH.critical) return t("themes.potager.action_critical");
  if (health === HEALTH.warning) return t("themes.potager.action_warning");
  return t("themes.potager.action_good");
}

export function getPotagerActionLabel(data, t) {
  const fromApi = getPotagerActionNow(data);
  if (fromApi) return fromApi;
  const health = inferHealthFromEtatSante(data?.etat_sante);
  return getPotagerActionFallback(health, t);
}
