import { useEffect, useState, useCallback, useRef } from "react";
import { recordPotagerVisit } from "@/lib/potagerEngagement";
import { checkPotagerReminders } from "@/lib/potagerNotifications";
import { loadDailyCare, toggleDailyCareTask } from "@/lib/potagerDailyCare";
import { loadPotagerPlants } from "@/lib/potagerStorage";
import PotagerWeatherLine from "@/components/PotagerWeatherLine";
import PotagerWeatherCard from "@/components/PotagerWeatherCard";
import PotagerCareJournal from "@/components/PotagerCareJournal";
import PotagerDailyCareTasks from "@/components/PotagerDailyCareTasks";
import PotagerIdeasCard from "@/components/PotagerIdeasCard";
import PotagerRecipesCard from "@/components/PotagerRecipesCard";
import PotagerCommunityCard from "@/components/PotagerCommunityCard";
import PotagerHarvestList from "@/components/PotagerHarvestList";
import NurseriesNearbyCard from "@/components/NurseriesNearbyCard";
import {
  ThemeInterior,
  ThemeHeroCard,
  ThemeGrid,
  ThemeGridCard,
  ThemeSection,
} from "@/components/ThemeInterior";
import { IconCamera, IconScan, IconJournal, IconLightbulb, IconSprout } from "@/components/ThemeIcons";

function scrollToRef(ref) {
  ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function PotagerView({ onStartScan, onStartDailyCare, children, t, lang }) {
  const [dailyCare, setDailyCare] = useState(null);
  const [journalRefreshKey, setJournalRefreshKey] = useState(0);
  const [potagerPlants, setPotagerPlants] = useState([]);
  const harvestPlants = potagerPlants.filter((p) => p.readyToHarvest);

  const journalRef = useRef(null);
  const ideasRef = useRef(null);
  const nurseriesRef = useRef(null);
  const recipesRef = useRef(null);
  const communityRef = useRef(null);
  const weatherRef = useRef(null);
  const albumsRef = useRef(null);

  const refreshPotagerPlants = useCallback(() => {
    setPotagerPlants(loadPotagerPlants());
  }, []);

  const refreshDailyCare = useCallback(() => {
    setDailyCare(loadDailyCare());
  }, []);

  useEffect(() => {
    recordPotagerVisit();
    refreshDailyCare();
    refreshPotagerPlants();
  }, [refreshDailyCare, refreshPotagerPlants]);

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

  const gridLabel = useCallback(
    (key) => t(key).replace(/^[^\w\s]+\s*/, ""),
    [t]
  );

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
          label={gridLabel("themes.potager.care_journal_title")}
          hint={t("themes.potager.daily_care_subtitle")}
          icon={IconJournal}
          onClick={() => scrollToRef(journalRef)}
          variant="beige"
          delay={2}
        />
        <ThemeGridCard
          label={gridLabel("themes.potager.ideas_title")}
          hint={t("themes.potager.ideas_subtitle")}
          icon={IconLightbulb}
          onClick={() => scrollToRef(ideasRef)}
          variant="terracotta"
          delay={3}
        />
        <ThemeGridCard
          label={gridLabel("themes.potager.nurseries_title")}
          hint={t("themes.potager.nurseries_subtitle")}
          icon={IconSprout}
          onClick={() => scrollToRef(nurseriesRef)}
          variant="sage"
          delay={4}
        />
      </ThemeGrid>

      <div ref={journalRef}>
        <PotagerCareJournal t={t} lang={lang} refreshKey={journalRefreshKey} />
      </div>

      {potagerPlants.length > 0 && (
        <PotagerHarvestList
          plants={potagerPlants}
          t={t}
          onChanged={(plants) => setPotagerPlants(plants)}
        />
      )}

      <ThemeSection title={t("albums.title")}>
        <div ref={albumsRef}>{children}</div>
      </ThemeSection>

      <div ref={ideasRef}>
        <PotagerIdeasCard t={t} lang={lang} />
      </div>
      <div ref={recipesRef}>
        <PotagerRecipesCard harvestPlants={harvestPlants} t={t} lang={lang} />
      </div>
      <div ref={communityRef}>
        <PotagerCommunityCard harvestPlants={harvestPlants} t={t} />
      </div>
      <div ref={nurseriesRef}>
        <NurseriesNearbyCard t={t} i18nPrefix="themes.potager" />
      </div>
      <div ref={weatherRef}>
        <PotagerWeatherCard t={t} />
        <PotagerWeatherLine t={t} />
      </div>
    </ThemeInterior>
  );
}
