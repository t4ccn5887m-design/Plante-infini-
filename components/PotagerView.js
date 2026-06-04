import { useEffect } from "react";
import { recordPotagerVisit } from "@/lib/potagerEngagement";
import { checkPotagerReminders } from "@/lib/potagerNotifications";
import PotagerWeatherLine from "@/components/PotagerWeatherLine";

export default function PotagerView({ onStartScan, children, t, lang }) {
  useEffect(() => {
    recordPotagerVisit();
  }, []);

  useEffect(() => {
    if (lang) checkPotagerReminders(lang);
  }, [lang]);

  return (
    <div className="potager-simple">
      <button type="button" className="potager-scan-cta" onClick={() => onStartScan?.()}>
        <span className="potager-scan-cta-emoji" aria-hidden="true">
          📸
        </span>
        <span className="potager-scan-cta-label">{t("themes.potager.scan_cta")}</span>
      </button>

      {children}

      <PotagerWeatherLine t={t} />
    </div>
  );
}
