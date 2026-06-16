import { saveDiscoveries } from "./discoveriesStorage";
import { scheduleDiscoverySync } from "./cloudSync";

/** Sauvegarde locale + sync cloud — comptes permanents uniquement. */
export function persistDiscoveries(items, discoveryToSync = null, { isPermanent = true } = {}) {
  if (!isPermanent) {
    return { ok: true, skipped: true, guest: true };
  }

  const result = saveDiscoveries(items);
  if (result.ok && discoveryToSync) {
    scheduleDiscoverySync(discoveryToSync);
  }
  return result;
}
