import { useEffect, useState, useCallback } from "react";
import { recordPotagerVisit } from "@/lib/potagerEngagement";
import { checkPotagerReminders } from "@/lib/potagerNotifications";
import { loadDailyCare, toggleDailyCareTask } from "@/lib/potagerDailyCare";
import PotagerWeatherLine from "@/components/PotagerWeatherLine";
import PotagerDailyCareTasks from "@/components/PotagerDailyCareTasks";

export default function PotagerView({ onStartScan, onStartDailyCare, children, t, lang }) {
  const [dailyCare, setDailyCare] = useState(null);

  const refreshDailyCare = useCallback(() => {
    setDailyCare(loadDailyCare());
  }, []);

  useEffect(() => {
    recordPotagerVisit();
    refreshDailyCare();
  }, [refreshDailyCare]);

  useEffect(() => {
    if (lang) checkPotagerReminders(lang);
  }, [lang]);

  const handleToggleTask = useCallback(
    (taskId) => {
      const updated = toggleDailyCareTask(taskId);
      if (updated) setDailyCare(updated);
    },
    []
  );

  return (
    <div className="potager-simple">
      <section className="potager-daily-care-hero" aria-labelledby="potager-daily-care-heading">
        <h2 id="potager-daily-care-heading" className="potager-daily-care-hero-title">
          {t("themes.potager.daily_care_title")}
        </h2>
        <p className="potager-daily-care-hero-sub">{t("themes.potager.daily_care_hook")}</p>

        <button
          type="button"
          className="potager-daily-care-cta"
          onClick={() => onStartDailyCare?.()}
        >
          <span className="potager-daily-care-cta-emoji" aria-hidden="true">
            📸
          </span>
          <span className="potager-daily-care-cta-label">{t("themes.potager.daily_care_cta")}</span>
        </button>
      </section>

      {dailyCare?.tasks?.length > 0 && (
        <PotagerDailyCareTasks
          session={dailyCare}
          t={t}
          onToggleTask={handleToggleTask}
          compact
        />
      )}

      <button type="button" className="potager-scan-cta potager-scan-cta--secondary" onClick={() => onStartScan?.()}>
        <span className="potager-scan-cta-emoji" aria-hidden="true">
          🔍
        </span>
        <span className="potager-scan-cta-label">{t("themes.potager.scan_cta")}</span>
      </button>

      {children}

      <PotagerWeatherLine t={t} />
    </div>
  );
}
