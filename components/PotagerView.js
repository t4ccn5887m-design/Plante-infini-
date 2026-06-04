import { useState, useEffect, useCallback } from "react";
import { HEALTH } from "@/lib/potagerHealth";
import { recordPotagerVisit } from "@/lib/potagerEngagement";
import { checkPotagerReminders } from "@/lib/potagerNotifications";
import { loadPotagerPlants } from "@/lib/potagerStorage";
import PotagerWeatherLine from "@/components/PotagerWeatherLine";

function HealthIndicator({ health, t }) {
  const label = t(`themes.potager.health_status_${health}`);
  return (
    <span
      className={`potager-list-health potager-list-health--${health}`}
      aria-label={label}
      title={label}
    />
  );
}

export default function PotagerView({ onStartScan, t, lang }) {
  const [plants, setPlants] = useState([]);

  const refresh = useCallback(() => {
    setPlants(loadPotagerPlants());
  }, []);

  useEffect(() => {
    refresh();
    recordPotagerVisit();
  }, [refresh]);

  useEffect(() => {
    if (lang) checkPotagerReminders(lang);
  }, [lang]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "wilder-potager-plants") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return (
    <div className="potager-simple">
      <button type="button" className="potager-scan-cta" onClick={() => onStartScan?.()}>
        <span className="potager-scan-cta-emoji" aria-hidden="true">
          📸
        </span>
        <span className="potager-scan-cta-label">{t("themes.potager.scan_cta")}</span>
      </button>

      <section className="potager-plant-list" aria-label={t("themes.potager.my_plants")}>
        {plants.length === 0 ? (
          <p className="potager-plant-list-empty">{t("themes.potager.empty_plants")}</p>
        ) : (
          <ul>
            {plants.map((plant) => (
              <li key={plant.id} className="potager-plant-row">
                <span className="potager-plant-row-name">{plant.name}</span>
                <HealthIndicator health={plant.health || HEALTH.good} t={t} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <PotagerWeatherLine t={t} />
    </div>
  );
}
