import { useRef } from "react";
import {
  ThemeInterior,
  ThemeHeroCard,
  ThemeGrid,
  ThemeGridCard,
  ThemeSection,
} from "@/components/ThemeInterior";
import { IconScan, IconAlbums, IconJardin } from "@/components/ThemeIcons";

function scrollToRef(ref) {
  ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function EspacesVertsView({ onStartScan, children, t }) {
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
          label={t("albums.title")}
          hint={t("themes.jardin.subtitle")}
          icon={IconAlbums}
          onClick={() => scrollToRef(albumsRef)}
          variant="beige"
          delay={1}
        />
        <ThemeGridCard
          label={t("themes.jardin.scan_cta")}
          hint={t("themes.jardin.empty_examples")}
          icon={IconJardin}
          onClick={() => onStartScan?.()}
          variant="terracotta"
          delay={2}
        />
        <ThemeGridCard
          label={t("themes.jardin.herbarium")}
          hint={t("themes.jardin.herbarium_subtitle")}
          icon={IconJardin}
          onClick={() => scrollToRef(albumsRef)}
          variant="sage"
          delay={3}
        />
      </ThemeGrid>

      <ThemeSection title={t("albums.title")}>
        <div ref={albumsRef}>{children}</div>
      </ThemeSection>
    </ThemeInterior>
  );
}
