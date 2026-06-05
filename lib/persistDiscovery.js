import { saveDiscoveries } from "./discoveriesStorage";
import { scheduleDiscoverySync } from "./cloudSync";

/** Sauvegarde locale + sync cloud automatique en arrière-plan. */
export function persistDiscoveries(items, discoveryToSync = null) {
  const result = saveDiscoveries(items);
  if (result.ok && discoveryToSync) {
    scheduleDiscoverySync(discoveryToSync);
  }
  return result;
}
