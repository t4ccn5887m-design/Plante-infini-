import { createT, detectLang } from "@/lib/i18n";
import {
  canShowSurpriseNotify,
  isMorningSurpriseWindow,
  markSurpriseNotifyShown,
} from "@/lib/espaceVertEngagement";
import { buildDailySurprise, getAllJardinPlants } from "@/lib/espaceVertSurprise";
import {
  isPotagerNotificationSupported,
  requestPotagerNotificationPermission,
  showPotagerNotification,
} from "@/lib/potagerNotifications";

const NOTIFY_TAG_SURPRISE = "jardin-surprise-du-jour";

export { isPotagerNotificationSupported, requestPotagerNotificationPermission };

/**
 * Notification matinale « La surprise du jour » (6h–12h, une fois par jour).
 */
export async function checkJardinMorningSurprise(albums, discoveries, lang) {
  if (!isPotagerNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }
  if (!isMorningSurpriseWindow() || !canShowSurpriseNotify()) {
    return false;
  }

  const plants = getAllJardinPlants(albums, discoveries);
  const t = createT(lang || detectLang());
  const { title, body } = buildDailySurprise(plants, t);

  const shown = await showPotagerNotification(NOTIFY_TAG_SURPRISE, title, body, {
    screen: "jardin",
  });
  if (shown) markSurpriseNotifyShown();
  return shown;
}
