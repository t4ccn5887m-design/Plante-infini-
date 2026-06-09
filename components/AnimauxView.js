import { useState, useCallback } from "react";
import { ThemeInterior } from "@/components/ThemeInterior";
import { ThemeHubNavCard, ThemeHubHeader, ThemeHubBack } from "@/components/ThemeHubNav";

export default function AnimauxView({ onStartScan, t, children }) {
  const [subView, setSubView] = useState(null);

  const goHub = useCallback(() => setSubView(null), []);

  if (subView === "albums") {
    return (
      <ThemeInterior themeId="juniors">
        <ThemeHubBack label={t("themes.juniors.back_to_hub")} onClick={goHub} />
        <ThemeHubHeader title={t("themes.juniors.hub_albums")} />
        {children}
      </ThemeInterior>
    );
  }

  return (
    <ThemeInterior themeId="juniors">
      <ThemeHubHeader title={t("themes.juniors.title")} subtitle={t("themes.juniors.subtitle")} />

      <div className="theme-hub-nav-list">
        <ThemeHubNavCard
          emoji="🔍"
          title={t("themes.juniors.hub_traces")}
          hint={t("themes.juniors.hub_traces_hint")}
          onClick={() => onStartScan?.("traces")}
          variant="terracotta"
          delay={0}
        />
        <ThemeHubNavCard
          emoji="📸"
          title={t("themes.juniors.hub_animal")}
          hint={t("themes.juniors.hub_animal_hint")}
          onClick={() => onStartScan?.("animal")}
          variant="primary"
          delay={1}
        />
        <ThemeHubNavCard
          emoji="📁"
          title={t("themes.juniors.hub_albums")}
          hint={t("themes.juniors.hub_albums_hint")}
          onClick={() => setSubView("albums")}
          variant="sage"
          delay={2}
        />
      </div>
    </ThemeInterior>
  );
}
