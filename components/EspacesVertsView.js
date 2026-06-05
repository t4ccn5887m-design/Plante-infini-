import { useRef } from "react";
import NurseriesNearbyCard from "@/components/NurseriesNearbyCard";
import {
  ThemeInterior,
  ThemeHeroCard,
  ThemeGrid,
  ThemeGridCard,
  ThemeSection,
} from "@/components/ThemeInterior";
import { IconScan, IconSprout, IconAlbums, IconJardin } from "@/components/ThemeIcons";

function scrollToRef(ref) {
  ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function EspacesVertsView({ onStartScan, children, t }) {
  const nurseriesRef = useRef(null);
  const albumsRef = useRef(null);

  return (
    <ThemeInterior themeId="jardin">
      <ThemeHeroCard
        title={t("themes.jardin.title")}
        subtitle={t("themes.jardin.subtitle")}
        label={t("themes.jardin.scan_cta")}
        icon={IconScan}
        onClick={() => onStartScan?.()}
        variant="primary"
        delay={0}
      />

      <ThemeGrid>
        <ThemeGridCard
          label={t("themes.jardin.nurseries_title").replace(/^[^\w\s]+\s*/, "")}
          hint={t("themes.jardin.nurseries_subtitle")}
          icon={IconSprout}
          onClick={() => scrollToRef(nurseriesRef)}
          variant="sage"
          delay={1}
        />
        <ThemeGridCard
          label={t("albums.title")}
          hint={t("themes.jardin.subtitle")}
          icon={IconAlbums}
          onClick={() => scrollToRef(albumsRef)}
          variant="beige"
          delay={2}
        />
        <ThemeGridCard
          label={t("themes.jardin.scan_cta")}
          hint={t("themes.jardin.empty_examples")}
          icon={IconJardin}
          onClick={() => onStartScan?.()}
          variant="terracotta"
          delay={3}
        />
        <ThemeGridCard
          label={t("themes.jardin.herbarium")}
          hint={t("themes.jardin.herbarium_subtitle")}
          icon={IconJardin}
          onClick={() => scrollToRef(albumsRef)}
          variant="sage"
          delay={4}
        />
      </ThemeGrid>

      <ThemeSection title={t("albums.title")}>
        <div ref={albumsRef}>{children}</div>
      </ThemeSection>

      <div ref={nurseriesRef}>
        <NurseriesNearbyCard t={t} i18nPrefix="themes.jardin" />
      </div>
    </ThemeInterior>
  );
}
