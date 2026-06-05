import { useEffect, useState, useCallback } from "react";
import { recordPotagerVisit } from "@/lib/potagerEngagement";
import { checkPotagerReminders } from "@/lib/potagerNotifications";
import { loadDailyCare, toggleDailyCareTask } from "@/lib/potagerDailyCare";
import PotagerWeatherLine from "@/components/PotagerWeatherLine";
import PotagerCareJournal from "@/components/PotagerCareJournal";
import PotagerDailyCareTasks from "@/components/PotagerDailyCareTasks";
import PotagerIdeasCard from "@/components/PotagerIdeasCard";
import NurseriesNearbyCard from "@/components/NurseriesNearbyCard";

export default function PotagerView({ onStartScan, onStartDailyCare, children, t, lang }) {
  const [dailyCare, setDailyCare] = useState(null);
  const [journalRefreshKey, setJournalRefreshKey] = useState(0);

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

  const handleToggleTask = useCallback((taskId) => {
    const updated = toggleDailyCareTask(taskId);
    if (updated) {
      setDailyCare(updated);
      setJournalRefreshKey((k) => k + 1);
    }
  }, []);

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

      <PotagerCareJournal t={t} lang={lang} refreshKey={journalRefreshKey} />

      <button type="button" className="potager-scan-cta potager-scan-cta--secondary" onClick={() => onStartScan?.()}>
        <span className="potager-scan-cta-emoji" aria-hidden="true">
          🔍
        </span>
        <span className="potager-scan-cta-label">{t("themes.potager.scan_cta")}</span>
      </button>

      {children}

      <PotagerIdeasCard t={t} lang={lang} />
      <NurseriesNearbyCard t={t} i18nPrefix="themes.potager" />

      <PotagerWeatherLine t={t} />
    </div>
  );
}
