import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";
import { getPotagerActionNow } from "@/lib/potagerAction";

export function getJardinActionFallback(health, t) {
  if (health === HEALTH.critical) return t("themes.jardin.action_critical");
  if (health === HEALTH.warning) return t("themes.jardin.action_warning");
  return t("themes.jardin.action_good");
}

export function getJardinActionLabel(data, t) {
  const fromApi = getPotagerActionNow(data);
  if (fromApi) return fromApi;
  const health = inferHealthFromEtatSante(data?.etat_sante);
  return getJardinActionFallback(health, t);
}
