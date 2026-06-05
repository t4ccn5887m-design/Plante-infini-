import { useEffect, useState, useCallback } from "react";
import { recordPotagerVisit } from "@/lib/potagerEngagement";
import { checkPotagerReminders } from "@/lib/potagerNotifications";
import { loadDailyCare, toggleDailyCareTask } from "@/lib/potagerDailyCare";
import PotagerWeatherLine from "@/components/PotagerWeatherLine";
import PotagerCareJournal from "@/components/PotagerCareJournal";
import PotagerDailyCareTasks from "@/components/PotagerDailyCareTasks";
import PotagerIdeasCard from "@/components/PotagerIdeasCard";
import NurseriesNearbyCard from "@/components/NurseriesNearbyCard";
import {
  ThemeInterior,
  ThemeHeroCard,
  ThemeGrid,
  ThemeGridCard,
  ThemeSection,
} from "@/components/ThemeInterior";
import { IconCamera, IconScan, IconJournal, IconLightbulb, IconSprout } from "@/components/ThemeIcons";

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
    <ThemeInterior themeId="potager">
      <ThemeHeroCard
        title={t("themes.potager.daily_care_title")}
        subtitle={t("themes.potager.daily_care_hook")}
        label={t("themes.potager.daily_care_cta")}
        icon={IconCamera}
        onClick={() => onStartDailyCare?.()}
        variant="primary"
        delay={0}
      />

      {dailyCare?.tasks?.length > 0 && (
        <PotagerDailyCareTasks
          session={dailyCare}
          t={t}
          onToggleTask={handleToggleTask}
          compact
        />
      )}

      <ThemeGrid>
        <ThemeGridCard
          label={t("themes.potager.scan_cta")}
          hint={t("themes.potager.scan_plant")}
          icon={IconScan}
          onClick={() => onStartScan?.()}
          variant="sage"
          delay={1}
        />
        <ThemeGridCard
          label={t("themes.potager.care_journal_title").replace(/^[^\w\s]+\s*/, "")}
          hint={t("themes.potager.daily_care_subtitle")}
          icon={IconJournal}
          variant="beige"
          delay={2}
        />
        <ThemeGridCard
          label={t("themes.potager.ideas_title").replace(/^[^\w\s]+\s*/, "")}
          hint={t("themes.potager.ideas_subtitle")}
          icon={IconLightbulb}
          variant="terracotta"
          delay={3}
        />
        <ThemeGridCard
          label={t("themes.potager.nurseries_title").replace(/^[^\w\s]+\s*/, "")}
          hint={t("themes.potager.nurseries_subtitle")}
          icon={IconSprout}
          variant="sage"
          delay={4}
        />
      </ThemeGrid>

      <PotagerCareJournal t={t} lang={lang} refreshKey={journalRefreshKey} />

      <ThemeSection title={t("albums.title")}>{children}</ThemeSection>

      <PotagerIdeasCard t={t} lang={lang} />
      <NurseriesNearbyCard t={t} i18nPrefix="themes.potager" />
      <PotagerWeatherLine t={t} />
    </ThemeInterior>
  );
}
