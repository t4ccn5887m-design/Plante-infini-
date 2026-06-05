import { useRef } from "react";
import {
  ThemeInterior,
  ThemeHeroCard,
  ThemeGrid,
  ThemeGridCard,
  ThemeSection,
} from "@/components/ThemeInterior";
import { IconCamera, IconFootprints, IconAlbums, IconAnimaux } from "@/components/ThemeIcons";

function scrollToRef(ref) {
  ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function AnimauxView({ onStartScan, children, t }) {
  const albumsRef = useRef(null);

  return (
    <ThemeInterior themeId="juniors">
      <ThemeHeroCard
        title={t("themes.juniors.discovery_title")}
        subtitle={t("themes.juniors.discovery_sub")}
        label={t("themes.juniors.mode_animal_cta")}
        icon={IconCamera}
        onClick={() => onStartScan?.("animal")}
        variant="primary"
        delay={0}
      />

      <ThemeGrid>
        <ThemeGridCard
          label={t("themes.juniors.mode_traces_cta")}
          hint={t("themes.juniors.mode_traces_hint")}
          icon={IconFootprints}
          onClick={() => onStartScan?.("traces")}
          variant="terracotta"
          delay={1}
        />
        <ThemeGridCard
          label={t("themes.juniors.mode_sound_cta")}
          hint={t("themes.juniors.mode_sound_hint")}
          icon={IconAnimaux}
          onClick={() => onStartScan?.("sound")}
          variant="sage"
          delay={2}
        />
        <ThemeGridCard
          label={t("albums.title")}
          hint={t("themes.juniors.empty_examples")}
          icon={IconAlbums}
          onClick={() => scrollToRef(albumsRef)}
          variant="beige"
          delay={3}
        />
        <ThemeGridCard
          label={t("themes.juniors.mode_animal_cta")}
          hint={t("themes.juniors.mode_animal_hint")}
          icon={IconCamera}
          onClick={() => onStartScan?.("animal")}
          variant="sage"
          delay={4}
        />
      </ThemeGrid>

      <ThemeSection title={t("albums.title")}>
        <div ref={albumsRef}>{children}</div>
      </ThemeSection>
    </ThemeInterior>
  );
}
