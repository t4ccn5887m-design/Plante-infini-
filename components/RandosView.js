import { useRef } from "react";
import ThemeAlbumsList from "@/components/ThemeAlbumsList";
import RandosNearbyTrails from "@/components/RandosNearbyTrails";
import {
  ThemeInterior,
  ThemeHeroCard,
  ThemeGrid,
  ThemeGridCard,
  ThemeSection,
} from "@/components/ThemeInterior";
import { IconScan, IconHike, IconMapPin, IconAlbums } from "@/components/ThemeIcons";

function scrollToRef(ref) {
  ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function RandosView({
  albums,
  discoveries,
  locale,
  t,
  lang,
  themeEmoji,
  onStartScan,
  onStartRando,
  onStartRandoFromTrail,
  onOpenAlbum,
  onDeleteAlbum,
  activeRandoAlbumId,
  distanceKm,
  onResumeRando,
  onEndRando,
  onShowMap,
  creatingAlbum,
  setCreatingAlbum,
  newAlbumName,
  setNewAlbumName,
  onCreateAlbum,
  swipeLabels,
  defaultAlbumName,
}) {
  const trailsRef = useRef(null);
  const albumsRef = useRef(null);

  const formatDistance = (km) => {
    if (km == null) return null;
    if (km < 1) {
      return t("themes.randos.distance_m", { m: Math.max(1, Math.round(km * 1000)) });
    }
    return t("themes.randos.distance_km", { km });
  };

  return (
    <ThemeInterior themeId="randos">
      <ThemeHeroCard
        title={t("themes.randos.title")}
        subtitle={t("themes.randos.subtitle")}
        label={t("themes.randos.scan_cta")}
        icon={IconScan}
        onClick={() => onStartScan?.()}
        variant="primary"
        delay={0}
      />

      {activeRandoAlbumId && (
        <div className="theme-active-banner">
          <div className="theme-active-banner-info">
            <span className="theme-active-pulse" aria-hidden="true" />
            <div>
              <p className="theme-active-banner-label">{t("themes.randos.active")}</p>
              {distanceKm != null && (
                <p className="theme-active-banner-meta">{formatDistance(distanceKm)}</p>
              )}
            </div>
          </div>
          <div className="theme-active-banner-actions">
            {onShowMap && (
              <button type="button" className="theme-active-btn theme-active-btn--ghost" onClick={onShowMap}>
                <IconMapPin size={16} />
                {t("themes.randos.show_map")}
              </button>
            )}
            <button type="button" className="theme-active-btn theme-active-btn--primary" onClick={onResumeRando}>
              {t("themes.randos.resume")}
            </button>
            <button type="button" className="theme-active-btn theme-active-btn--soft" onClick={onEndRando}>
              {t("themes.randos.end")}
            </button>
          </div>
        </div>
      )}

      <ThemeGrid>
        <ThemeGridCard
          label={t("themes.randos.start")}
          hint={t("themes.randos.empty_hint")}
          icon={IconHike}
          onClick={onStartRando}
          variant="terracotta"
          delay={1}
          disabled={!!activeRandoAlbumId}
        />
        <ThemeGridCard
          label={t("themes.randos.nearby_title")}
          hint={t("themes.randos.nearby_subtitle")}
          icon={IconMapPin}
          onClick={() => scrollToRef(trailsRef)}
          variant="sage"
          delay={2}
        />
        <ThemeGridCard
          label={t("themes.randos.past_section")}
          hint={t("themes.randos.subtitle")}
          icon={IconAlbums}
          onClick={() => scrollToRef(albumsRef)}
          variant="beige"
          delay={3}
        />
        <ThemeGridCard
          label={t("themes.randos.journal_title")}
          hint={t("themes.randos.journal_discoveries_title")}
          icon={IconAlbums}
          onClick={() => scrollToRef(albumsRef)}
          variant="sage"
          delay={4}
        />
      </ThemeGrid>

      <div ref={trailsRef}>
        <RandosNearbyTrails
          t={t}
          lang={lang}
          onStartTrail={onStartRandoFromTrail}
          disabled={!!activeRandoAlbumId}
        />
      </div>

      <ThemeSection title={t("themes.randos.past_section")}>
        <div ref={albumsRef}>
          <ThemeAlbumsList
            themeId="randos"
            themeEmoji={themeEmoji}
            albums={albums}
            discoveries={discoveries}
            locale={locale}
            t={t}
            creatingAlbum={creatingAlbum}
            setCreatingAlbum={setCreatingAlbum}
            newAlbumName={newAlbumName}
            setNewAlbumName={setNewAlbumName}
            onCreateAlbum={onCreateAlbum}
            onOpenAlbum={onOpenAlbum}
            onDeleteAlbum={onDeleteAlbum}
            swipeLabels={swipeLabels}
            defaultAlbumName={defaultAlbumName}
            excludeAlbumIds={activeRandoAlbumId ? [activeRandoAlbumId] : []}
          />
        </div>
      </ThemeSection>

      {!activeRandoAlbumId && (
        <button type="button" className="theme-cta-gradient theme-cta-gradient--wide" onClick={onStartRando}>
          <IconHike size={22} />
          {t("themes.randos.start")}
        </button>
      )}
    </ThemeInterior>
  );
}
