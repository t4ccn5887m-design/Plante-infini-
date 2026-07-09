import { saveDiscoveries } from "./discoveriesStorage";
import { scheduleDiscoverySync } from "./cloudSync";

/** Sauvegarde locale pour tous ; sync cloud — comptes permanents uniquement. */
export function persistDiscoveries(items, discoveryToSync = null, { isPermanent = true } = {}) {
  const result = saveDiscoveries(items);
  if (result.ok && discoveryToSync && isPermanent) {
    scheduleDiscoverySync(discoveryToSync);
  }
  return result;
}
