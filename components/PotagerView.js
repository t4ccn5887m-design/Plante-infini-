import { useState, useCallback, useMemo } from "react";
import { loadPotagerPlants } from "@/lib/potagerStorage";
import { getPotagerDiscoveries } from "@/lib/themes";
import PotagerIdeasCard from "@/components/PotagerIdeasCard";
import PotagerRecipesCard from "@/components/PotagerRecipesCard";
import DiscoveryGallery from "@/components/DiscoveryGallery";
import { ThemeInterior } from "@/components/ThemeInterior";
import { ThemeHubNavCard, ThemeHubHeader, ThemeHubBack } from "@/components/ThemeHubNav";

export default function PotagerView({
  onStartScan,
  albums,
  discoveries,
  locale,
  t,
  lang,
  onOpenDiscovery,
}) {
  const [subView, setSubView] = useState(null);

  const potagerPlants = useMemo(() => loadPotagerPlants(), [subView, discoveries]);
  const harvestPlants = potagerPlants.filter((p) => p.readyToHarvest);
  const potagerDiscoveries = useMemo(
    () => getPotagerDiscoveries(albums, discoveries, potagerPlants),
    [albums, discoveries, potagerPlants]
  );

  const goHub = useCallback(() => setSubView(null), []);

  if (subView === "album") {
    return (
      <ThemeInterior themeId="potager">
        <ThemeHubBack label={t("themes.potager.back_to_hub")} onClick={goHub} />
        <ThemeHubHeader title={t("themes.potager.hub_album")} />
        <DiscoveryGallery
          items={potagerDiscoveries}
          locale={locale}
          t={t}
          emptyMessage={t("themes.potager.empty_plants")}
          onOpenDiscovery={onOpenDiscovery}
        />
      </ThemeInterior>
    );
  }

  if (subView === "ideas") {
    return (
      <ThemeInterior themeId="potager">
        <ThemeHubBack label={t("themes.potager.back_to_hub")} onClick={goHub} />
        <ThemeHubHeader title={t("themes.potager.hub_ideas")} />
        <PotagerIdeasCard t={t} lang={lang} />
      </ThemeInterior>
    );
  }

  if (subView === "recipes") {
    return (
      <ThemeInterior themeId="potager">
        <ThemeHubBack label={t("themes.potager.back_to_hub")} onClick={goHub} />
        <ThemeHubHeader title={t("themes.potager.hub_recipes")} />
        <PotagerRecipesCard harvestPlants={harvestPlants} t={t} lang={lang} />
      </ThemeInterior>
    );
  }

  return (
    <ThemeInterior themeId="potager">
      <ThemeHubHeader title={t("themes.potager.title")} subtitle={t("themes.potager.subtitle")} />

      <div className="theme-hub-nav-list">
        <ThemeHubNavCard
          emoji="📸"
          title={t("themes.potager.hub_scan")}
          hint={t("themes.potager.hub_scan_hint")}
          onClick={() => onStartScan?.()}
          variant="primary"
          delay={0}
        />
        <ThemeHubNavCard
          emoji="📁"
          title={t("themes.potager.hub_album")}
          hint={t("themes.potager.hub_album_hint")}
          onClick={() => setSubView("album")}
          variant="sage"
          delay={1}
        />
        <ThemeHubNavCard
          emoji="💡"
          title={t("themes.potager.hub_ideas")}
          hint={t("themes.potager.hub_ideas_hint")}
          onClick={() => setSubView("ideas")}
          variant="terracotta"
          delay={2}
        />
        <ThemeHubNavCard
          emoji="🍳"
          title={t("themes.potager.hub_recipes")}
          hint={t("themes.potager.hub_recipes_hint")}
          onClick={() => setSubView("recipes")}
          variant="beige"
          delay={3}
        />
      </div>
    </ThemeInterior>
  );
}
